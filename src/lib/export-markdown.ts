/**
 * 导出 Markdown 工具函数
 * 将 HTML 内容转换为 Markdown 格式并下载
 */

import TurndownService from 'turndown'
// @ts-ignore - turndown-plugin-gfm 没有类型定义
import { gfm } from 'turndown-plugin-gfm'

/**
 * 将编辑器内容转换为 Markdown（支持 Mermaid）
 */
export function editorToMarkdown(editor: any): string {
  const json = editor.getJSON()
  let html = editor.getHTML()
  
  // 从 JSON 中提取所有 Mermaid 内容（按顺序）
  const mermaidContents: string[] = []
  
  const extractMermaid = (node: any) => {
    if (node.type === 'mermaid' && node.attrs?.content) {
      mermaidContents.push(node.attrs.content)
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(extractMermaid)
    }
  }
  
  if (json.content && Array.isArray(json.content)) {
    json.content.forEach(extractMermaid)
  }
  
  // 如果有 Mermaid，在 HTML 中替换为 pre 标签（支持自闭合和非自闭合的 div）
  if (mermaidContents.length > 0) {
    let mermaidIndex = 0
    // 匹配自闭合和非自闭合的 mermaid div
    html = html.replace(
      /<div[^>]*data-type="mermaid"[^>]*(?:\/>|><\/div>)/g,
      () => {
        if (mermaidIndex < mermaidContents.length) {
          const content = mermaidContents[mermaidIndex]
          mermaidIndex++
          // 使用 pre 标签包裹内容，这样 turndown 会将其转换为代码块
          return `<pre><code class="language-mermaid">${content}</code></pre>`
        }
        return ''
      }
    )
  }
  
  // 转换为 Markdown（turndown 会自动将 <pre><code class="language-mermaid"> 转换为 ```mermaid 代码块）
  const markdown = htmlToMarkdown(html)
  
  return markdown
}

/**
 * 将 HTML 转换为 Markdown（基础版本，不处理 Mermaid）
 */
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  })

  turndownService.use(gfm)

  // 自定义规则：保留 details 和 summary 标签
  turndownService.addRule('details', {
    filter: 'details',
    replacement: function (content, node) {
      const summaryNode = (node as HTMLElement).querySelector('summary')
      const summary = summaryNode ? summaryNode.textContent : '详情'
      const detailsContent = content.replace(summary, '').trim()
      return `\n<details>\n<summary>${summary}</summary>\n\n${detailsContent}\n</details>\n`
    },
  })

  turndownService.addRule('summary', {
    filter: 'summary',
    replacement: function () {
      return ''
    },
  })

  return turndownService.turndown(html)
}

/**
 * 下载 Markdown 文件
 */
export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 导出编辑器内容为 Markdown
 */
export function exportEditorAsMarkdown(title: string, editor: any) {
  // 使用新方法从编辑器 JSON 中提取内容
  const markdown = editorToMarkdown(editor)
  
  // 添加标题
  const fullMarkdown = `# ${title}\n\n${markdown}`
  
  // 下载文件（文件名过滤特殊字符）
  const filename = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
  downloadMarkdown(fullMarkdown, filename)
}
