/**
 * Tiptap 粘贴上传扩展
 * 支持粘贴剪贴板中的图片
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { uploadFile } from '@/lib/storage/upload'

export interface PasteOptions {
  onUploadStart?: (file: File) => void
  onUploadProgress?: (progress: number) => void
  onUploadComplete?: (result: { url: string; type: string }) => void
  onUploadError?: (error: Error) => void
}

export const PasteExtension = Extension.create<PasteOptions>({
  name: 'pasteUpload',

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
        key: new PluginKey('pasteUpload'),
        props: {
          handlePaste(view, event, slice) {
            // 检查剪贴板中是否有文件
            const items = event.clipboardData?.items
            if (!items) {
              return false
            }

            // 查找图片文件
            let hasImage = false
            Array.from(items).forEach(async (item) => {
              if (item.type.startsWith('image/')) {
                hasImage = true
                event.preventDefault()

                const file = item.getAsFile()
                if (!file) {
                  return
                }

                try {
                  // 通知上传开始
                  options.onUploadStart?.(file)

                  // 上传文件
                  const result = await uploadFile(file, {
                    compress: true,
                    generateThumbnail: false,
                  })

                  // 通知上传完成
                  options.onUploadComplete?.({
                    url: result.url,
                    type: file.type,
                  })

                  // 插入可调整大小的图片到编辑器
                  const { schema, selection } = view.state
                  const node = schema.nodes.resizableImage?.create({
                    src: result.url,
                    alt: '粘贴的图片',
                    width: null,
                    align: 'left',
                  })

                  if (node) {
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                  }
                } catch (error) {
                  console.error('图片上传失败:', error)
                  options.onUploadError?.(
                    error instanceof Error ? error : new Error('上传失败')
                  )
                }
              }
            })

            return hasImage
          },
        },
      }),
    ]
  },
})
