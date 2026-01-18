/**
 * 文件上传工具
 * 支持图片、视频、音频上传到 Cloudflare R2
 */

export interface UploadResult {
  fileId: string
  url: string
  key: string
  thumbnailUrl?: string
  size: number
  mimeType: string
}

export interface UploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  compress?: boolean
  generateThumbnail?: boolean
}

// 默认配置
const DEFAULT_OPTIONS: UploadOptions = {
  maxSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: [
    // 图片
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // 视频
    'video/mp4',
    'video/webm',
    'video/quicktime', // MOV
    // 音频
    'audio/mpeg', // MP3
    'audio/wav',
    'audio/ogg',
  ],
  compress: true,
  generateThumbnail: true,
}

/**
 * 生成唯一文件ID
 */
function createFileId(): string {
  return crypto.randomUUID()
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

/**
 * 验证文件类型
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType)
}

/**
 * 验证文件大小
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize
}

/**
 * 压缩图片
 * 使用 Canvas API 进行客户端压缩
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 计算缩放比例
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          file.type,
          quality
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 生成视频缩略图
 * 使用 Video 元素捕获第一帧
 */
export async function generateVideoThumbnail(
  file: File
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(null)
      return
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      // 跳到视频的 1 秒处（或视频长度的 10%）
      video.currentTime = Math.min(1, video.duration * 0.1)
    }

    video.onseeked = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src)
          resolve(blob)
        },
        'image/jpeg',
        0.8
      )
    }

    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * 上传文件到服务器
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 验证文件类型
  if (opts.allowedTypes && !validateFileType(file.type, opts.allowedTypes)) {
    throw new Error(
      `不支持的文件格式: ${file.type}。支持的格式: ${opts.allowedTypes.join(', ')}`
    )
  }

  // 验证文件大小
  if (opts.maxSize && !validateFileSize(file.size, opts.maxSize)) {
    const maxSizeMB = (opts.maxSize / (1024 * 1024)).toFixed(0)
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    throw new Error(
      `文件大小超过限制: ${fileSizeMB}MB / ${maxSizeMB}MB`
    )
  }

  // 准备上传的文件
  let fileToUpload: File | Blob = file

  // 如果是图片且需要压缩
  if (
    opts.compress &&
    file.type.startsWith('image/') &&
    file.type !== 'image/svg+xml'
  ) {
    try {
      const compressed = await compressImage(file)
      // 只有压缩后更小才使用压缩版本
      if (compressed.size < file.size) {
        fileToUpload = compressed
      }
    } catch (err) {
      console.warn('图片压缩失败，使用原始文件:', err instanceof Error ? err.message : String(err))
    }
  }

  // 创建 FormData
  const formData = new FormData()
  formData.append('file', fileToUpload, file.name)
  formData.append('originalName', file.name)
  formData.append('mimeType', file.type)

  // 如果是视频且需要生成缩略图
  if (opts.generateThumbnail && file.type.startsWith('video/')) {
    try {
      const thumbnail = await generateVideoThumbnail(file)
      if (thumbnail) {
        formData.append('thumbnail', thumbnail, 'thumbnail.jpg')
      }
    } catch (err) {
      console.warn('视频缩略图生成失败:', err instanceof Error ? err.message : String(err))
    }
  }

  // 上传到服务器
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '上传失败' })) as { message?: string }
    throw new Error(error.message || '上传失败')
  }

  const result: UploadResult = await response.json()
  return result
}

/**
 * 删除文件
 */
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`/api/upload/${fileId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '删除失败' })) as { message?: string }
    throw new Error(error.message || '删除失败')
  }
}
