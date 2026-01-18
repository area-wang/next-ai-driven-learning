/**
 * Tiptap 拖拽上传扩展
 * 支持拖拽图片、视频、音频文件到编辑器
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { uploadFile } from '@/lib/storage/upload'

export interface DragDropOptions {
  onUploadStart?: (file: File) => void
  onUploadProgress?: (progress: number) => void
  onUploadComplete?: (result: { url: string; type: string }) => void
  onUploadError?: (error: Error) => void
}

export const DragDropExtension = Extension.create<DragDropOptions>({
  name: 'dragDrop',

  addOptions() {
    return {
      onUploadStart: undefined,
      onUploadProgress: undefined,
      onUploadComplete: undefined,
      onUploadError: undefined,
    }
  },

  addProseMirrorPlugins() {
    const options = this.options

    return [
      new Plugin({
        key: new PluginKey('dragDrop'),
        props: {
          handleDrop(view, event, slice, moved) {
            // 如果是编辑器内部移动，不处理
            if (moved) {
              return false
            }

            // 检查是否有文件
            const files = event.dataTransfer?.files
            if (!files || files.length === 0) {
              return false
            }

            // 阻止默认行为
            event.preventDefault()

            // 获取拖拽位置
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })

            if (!coordinates) {
              return false
            }

            // 处理每个文件
            Array.from(files).forEach(async (file) => {
              // 只处理图片、视频、音频
              if (
                !file.type.startsWith('image/') &&
                !file.type.startsWith('video/') &&
                !file.type.startsWith('audio/')
              ) {
                return
              }

              try {
                // 通知上传开始
                options.onUploadStart?.(file)

                // 上传文件
                const result = await uploadFile(file, {
                  compress: file.type.startsWith('image/'),
                  generateThumbnail: file.type.startsWith('video/'),
                })

                // 通知上传完成
                options.onUploadComplete?.({
                  url: result.url,
                  type: file.type,
                })

                // 插入到编辑器
                const { schema } = view.state
                const pos = coordinates.pos

                if (file.type.startsWith('image/')) {
                  // 插入可调整大小的图片
                  const node = schema.nodes.resizableImage?.create({
                    src: result.url,
                    alt: file.name,
                    width: null,
                    align: 'left',
                  })
                  if (node) {
                    const transaction = view.state.tr.insert(pos, node)
                    view.dispatch(transaction)
                  }
                } else if (file.type.startsWith('video/')) {
                  // 插入可调整大小的视频
                  const node = schema.nodes.resizableVideo?.create({
                    src: result.url,
                    width: null,
                    align: 'left',
                  })
                  if (node) {
                    const transaction = view.state.tr.insert(pos, node)
                    view.dispatch(transaction)
                  }
                } else if (file.type.startsWith('audio/')) {
                  // 插入音频
                  const html = `<audio src="${result.url}" controls class="w-full my-4"></audio>`
                  const node = schema.text(html)
                  const transaction = view.state.tr.insert(pos, node)
                  view.dispatch(transaction)
                }
              } catch (error) {
                console.error('文件上传失败:', error)
                options.onUploadError?.(
                  error instanceof Error ? error : new Error('上传失败')
                )
              }
            })

            return true
          },

          handleDOMEvents: {
            // 阻止默认的拖拽行为
            dragover: (view, event) => {
              event.preventDefault()
              return false
            },
            drop: (view, event) => {
              // 由 handleDrop 处理
              return false
            },
          },
        },
      }),
    ]
  },
})
