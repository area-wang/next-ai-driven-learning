/**
 * Tiptap 粘贴上传扩展
 * 支持粘贴剪贴板中的图片和 Markdown 文本
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { uploadFile } from '@/lib/storage/upload'
import MarkdownIt from 'markdown-it'

export interface PasteOptions {
  onUploadStart?: (file: File) => void
  onUploadProgress?: (progress: number) => void
  onUploadComplete?: (result: { url: string; type: string }) => void
  onUploadError?: (error: Error) => void
}

/**
 * 检测文本是否为 Markdown 格式
 * 使用更严格的检测逻辑，避免误判
 */
function isMarkdown(text: string): boolean {
  // 如果文本太短，不太可能是 Markdown
  if (text.length < 10) {
    return false
  }

  // 检测常见的 Markdown 语法特征
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m,           // 标题
    /\*\*.+\*\*/,               // 粗体
    /__.+__/,                   // 粗体
    /\[.+\]\(.+\)/,             // 链接
    /!\[.*\]\(.+\)/,            // 图片
    /```[\s\S]+```/,            // 代码块（至少有内容）
    /^[-*+]\s+.+$/m,            // 无序列表
    /^\d+\.\s+.+$/m,            // 有序列表
    /^>\s+.+$/m,                // 引用
    /^\|.+\|.+\|$/m,            // 表格
    /^---+$/m,                  // 分割线
    /^- \[[ x]\]/m,             // 任务列表
  ]

  // 至少匹配 2 个不同的模式才认为是 Markdown
  const matchCount = markdownPatterns.filter(pattern => pattern.test(text)).length
  
  // 或者包含代码块（包括 Mermaid）
  const hasCodeBlock = /```[\s\S]+```/.test(text)
  
  return matchCount >= 2 || hasCodeBlock
}

/**
 * 创建 markdown-it 实例
 */
const md = new MarkdownIt({
  html: true,        // 允许 HTML 标签
  linkify: true,     // 自动转换 URL 为链接
  typographer: true, // 启用智能引号和其他排版替换
  breaks: true,      // 将换行符转换为 <br>
})

/**
 * 将 Markdown 转换为 HTML
 * 特殊处理 Mermaid 代码块
 */
function markdownToHtml(markdown: string): string {
  try {
    // 先处理 Mermaid 代码块，转换为特殊标记
    const processedMarkdown = markdown.replace(
      /```mermaid\n([\s\S]*?)```/g,
      (_, code) => {
        // 使用特殊的 HTML 标记，稍后会被 Tiptap 识别
        return `<div data-type="mermaid" data-content="${encodeURIComponent(code.trim())}"></div>`
      }
    )
    
    const html = md.render(processedMarkdown)
    return html
  } catch (error) {
    console.error('Markdown 解析失败:', error)
    return markdown
  }
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
          handlePaste(view, event) {
            const items = event.clipboardData?.items
            if (!items) {
              return false
            }

            // 优先处理图片文件
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
                  options.onUploadStart?.(file)

                  const result = await uploadFile(file, {
                    compress: true,
                    generateThumbnail: false,
                  })

                  options.onUploadComplete?.({
                    url: result.url,
                    type: file.type,
                  })

                  const { schema } = view.state
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

            if (hasImage) {
              return true
            }

            // 处理文本内容，检测是否为 Markdown
            const text = event.clipboardData?.getData('text/plain')
            if (text && isMarkdown(text)) {
              event.preventDefault()

              // 转换 Markdown 为 HTML 并插入
              const html = markdownToHtml(text)
              
              // 使用事件通知编辑器插入 HTML
              const customEvent = new CustomEvent('pasteMarkdown', {
                detail: { html, text },
              })
              document.dispatchEvent(customEvent)

              return true
            }

            return false
          },
        },
      }),
    ]
  },
})
