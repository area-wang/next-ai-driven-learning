"use client"

import * as React from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import Youtube from "@tiptap/extension-youtube"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import TextAlign from "@tiptap/extension-text-align"
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table"
import { cn } from "@/lib/utils"
import { MathExtension, BlockMathExtension } from "./math-extension"
import { MermaidNode } from "./mermaid-extension"
import { DragDropExtension } from "./drag-drop-extension"
import { PasteExtension } from "./paste-extension"
import { UploadProgress } from "./upload-progress"
import { Vimeo } from "./vimeo-extension"
import { GenericVideo } from "./generic-video-extension"
import { SlashCommand, slashCommandSuggestion } from "./slash-command"
import { BubbleMenuToolbar } from "./bubble-menu-toolbar"
import { TableMenu } from "./table-menu"
import { Callout } from "./callout-extension"
import { ResizableImage, ResizableVideo } from "./resizable-media-extension"
import { CustomCodeBlock } from "./code-block-extension"
import { AIFloatingInput } from "./ai-floating-input"
import { FloatingInput } from "./floating-input"
import { Details, Summary } from "./details-extension"
import { SimilarQuestionButton } from "./similar-question-button-extension"

interface UploadState {
  fileName: string
  status: 'uploading' | 'success' | 'error'
  error?: string
}

export interface TiptapEditorProps {
  title?: string
  content?: string
  contentId?: string // 文档内容 ID，用于生成和获取摘要
  placeholder?: string
  editable?: boolean
  className?: string
  onTitleChange?: (title: string) => void
  onChange?: (content: string) => void
  onBlur?: () => void
  showBubbleMenu?: boolean // 是否显示浮动工具栏
  onEditorReady?: (editor: Editor) => void // 编辑器准备好的回调
  onSimilarQuestionClick?: (questionIndex: number) => void // 举一反三按钮点击回调
}

export function TiptapEditor({
  title = "",
  content = "",
  contentId,
  placeholder = "输入 / 查看所有命令...",
  editable = true,
  className,
  onTitleChange,
  onChange,
  onBlur,
  showBubbleMenu = true, // 默认显示浮动工具栏
  onEditorReady,
  onSimilarQuestionClick,
}: TiptapEditorProps) {
  const [uploadState, setUploadState] = React.useState<UploadState | null>(null)
  const [localTitle, setLocalTitle] = React.useState(title)
  const [isAIInputOpen, setIsAIInputOpen] = React.useState(false)
  const [aiAnchorElement, setAiAnchorElement] = React.useState<HTMLElement | null>(null)
  const [aiContext, setAiContext] = React.useState("")
  const [documentSummary, setDocumentSummary] = React.useState<string>("")
  const [floatingInput, setFloatingInput] = React.useState<{
    isOpen: boolean
    type: 'link' | 'image' | 'video' | 'inline-math' | 'block-math'
    defaultValue?: string
    anchorElement?: HTMLElement | null
  }>({
    isOpen: false,
    type: 'link',
  })
  const editorRef = React.useRef<Editor | null>(null)
  const summaryGenerationTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // 当外部 title 改变时，更新本地 title
  React.useEffect(() => {
    setLocalTitle(title)
  }, [title])

  // 获取文档摘要
  React.useEffect(() => {
    const fetchSummary = async () => {
      if (!contentId) {
        console.log('[TiptapEditor] 没有 contentId，跳过获取摘要')
        return
      }

      console.log('[TiptapEditor] 开始获取摘要，contentId (outlineId):', contentId)

      try {
        // 使用 outlineId 参数查询（因为传递的实际上是 outlineId）
        const response = await fetch(`/api/ai/get-summary?outlineId=${contentId}`)
        console.log('[TiptapEditor] 摘要 API 响应状态:', response.status)
        
        if (response.ok) {
          const data = await response.json() as { summary: string | null }
          console.log('[TiptapEditor] 获取到的摘要:', data.summary ? '有摘要' : '摘要为空')
          
          if (data.summary) {
            setDocumentSummary(data.summary)
            console.log('[TiptapEditor] 摘要已设置，长度:', data.summary.length)
          }
        }
      } catch (error) {
        console.error('[TiptapEditor] 获取摘要失败:', error)
      }
    }

    fetchSummary()
  }, [contentId])

  // 格式化结构化摘要为易读文本
  const formatStructuredSummary = (summaryString: string): string => {
    try {
      const summary = JSON.parse(summaryString)
      
      let formatted = `# 文档摘要\n\n`
      formatted += `**主题**: ${summary.topic || '未知'}\n`
      formatted += `**用户需求**: ${summary.userQuery || '未知'}\n`
      formatted += `**文档长度**: ${summary.totalLength || '未知'}\n\n`
      
      // 文档大纲（包含每个章节的格式信息）
      if (summary.outline && summary.outline.length > 0) {
        formatted += `## 文档大纲\n`
        summary.outline.forEach((item: { 
          title: string; 
          level: number; 
          summary: string;
          format?: {
            titleLevel: string;
            hasCodeBlocks: boolean;
            codeLanguages?: string[];
            hasLists: boolean;
            listStyle?: string;
            hasTables: boolean;
            hasImages: boolean;
            hasFormulas: boolean;
          }
        }) => {
          const indent = '  '.repeat(item.level - 2)
          formatted += `${indent}- **${item.title}** (${item.format?.titleLevel || '##'})\n`
          formatted += `${indent}  ${item.summary}\n`
          
          // 添加该章节的格式信息
          if (item.format) {
            formatted += `${indent}  格式: `
            const formatDetails = []
            if (item.format.hasCodeBlocks && item.format.codeLanguages && item.format.codeLanguages.length > 0) {
              formatDetails.push(`代码块(${item.format.codeLanguages.join(', ')})`)
            }
            if (item.format.hasLists) {
              formatDetails.push(`列表(${item.format.listStyle || '标准格式'})`)
            }
            if (item.format.hasTables) {
              formatDetails.push('表格')
            }
            if (item.format.hasImages) {
              formatDetails.push('图片')
            }
            if (item.format.hasFormulas) {
              formatDetails.push('公式')
            }
            formatted += formatDetails.length > 0 ? formatDetails.join('、') : '纯文本'
            formatted += `\n`
          }
        })
        formatted += `\n`
      }
      
      // 关键知识点
      if (summary.keyPoints && summary.keyPoints.length > 0) {
        formatted += `## 关键知识点\n`
        summary.keyPoints.forEach((point: string) => {
          formatted += `- ${point}\n`
        })
        formatted += `\n`
      }
      
      formatted += `**重要提示**: 请保持与上述每个章节的格式一致，使用相同的标题层级、列表风格和代码块格式。`
      
      return formatted
    } catch (error) {
      console.error('解析摘要失败:', error)
      return summaryString
    }
  }

  // 监听 AI 提示框打开事件
  React.useEffect(() => {
    const handleOpenAIPrompt = (event: Event) => {
      const customEvent = event as CustomEvent
      if (editorRef.current) {
        console.log('[TiptapEditor] /ai 指令触发，documentSummary:', documentSummary ? '有摘要' : '无摘要')
        
        // 使用文档摘要作为上下文，如果没有摘要则使用前200字符
        let contextToUse = ''
        if (documentSummary) {
          // 尝试解析为结构化摘要
          try {
            JSON.parse(documentSummary)
            contextToUse = formatStructuredSummary(documentSummary)
            console.log('[TiptapEditor] 使用结构化摘要作为上下文，长度:', contextToUse.length)
          } catch {
            // 如果不是 JSON，直接使用
            contextToUse = documentSummary
            console.log('[TiptapEditor] 使用原始摘要作为上下文，长度:', contextToUse.length)
          }
        } else {
          contextToUse = editorRef.current.getText().substring(0, 200)
          console.log('[TiptapEditor] 没有摘要，使用前200字符作为上下文')
        }
        
        setAiContext(contextToUse)
        
        // 获取光标位置的 DOM 元素
        const view = editorRef.current.view
        const pos = view.state.selection.from
        
        // 创建一个临时元素来获取位置
        const coords = view.coordsAtPos(pos)
        
        // 创建一个虚拟的锚点元素
        const anchorEl = document.createElement('div')
        anchorEl.style.position = 'fixed'
        anchorEl.style.left = `${coords.left}px`
        anchorEl.style.top = `${coords.top}px`
        anchorEl.style.width = '0'
        anchorEl.style.height = '0'
        anchorEl.style.pointerEvents = 'none'
        document.body.appendChild(anchorEl)
        
        setAiAnchorElement(anchorEl)
        setIsAIInputOpen(true)
      }
    }

    document.addEventListener("openAIPrompt", handleOpenAIPrompt)
    return () => {
      document.removeEventListener("openAIPrompt", handleOpenAIPrompt)
    }
  }, [documentSummary])

  // 监听打开图片对话框的事件
  React.useEffect(() => {
    const handleOpenImageDialog = () => {
      if (editorRef.current) {
        const view = editorRef.current.view
        const pos = view.state.selection.from
        const coords = view.coordsAtPos(pos)
        
        const anchorEl = document.createElement('div')
        anchorEl.style.position = 'fixed'
        anchorEl.style.left = `${coords.left}px`
        anchorEl.style.top = `${coords.top}px`
        document.body.appendChild(anchorEl)
        
        setFloatingInput({
          isOpen: true,
          type: 'image',
          anchorElement: anchorEl,
        })
      }
    }

    document.addEventListener("openImageDialog", handleOpenImageDialog)
    return () => {
      document.removeEventListener("openImageDialog", handleOpenImageDialog)
    }
  }, [])

  // 监听打开视频对话框的事件
  React.useEffect(() => {
    const handleOpenVideoDialog = () => {
      if (editorRef.current) {
        const view = editorRef.current.view
        const pos = view.state.selection.from
        const coords = view.coordsAtPos(pos)
        
        const anchorEl = document.createElement('div')
        anchorEl.style.position = 'fixed'
        anchorEl.style.left = `${coords.left}px`
        anchorEl.style.top = `${coords.top}px`
        document.body.appendChild(anchorEl)
        
        setFloatingInput({
          isOpen: true,
          type: 'video',
          anchorElement: anchorEl,
        })
      }
    }

    document.addEventListener("openVideoDialog", handleOpenVideoDialog)
    return () => {
      document.removeEventListener("openVideoDialog", handleOpenVideoDialog)
    }
  }, [])

  // 监听打开数学公式输入框的事件
  React.useEffect(() => {
    const handleOpenMathInput = (event: Event) => {
      const customEvent = event as CustomEvent
      const type = customEvent.detail?.type || 'inline'
      
      if (editorRef.current) {
        const view = editorRef.current.view
        const pos = view.state.selection.from
        const coords = view.coordsAtPos(pos)
        
        const anchorEl = document.createElement('div')
        anchorEl.style.position = 'fixed'
        anchorEl.style.left = `${coords.left}px`
        anchorEl.style.top = `${coords.top}px`
        document.body.appendChild(anchorEl)
        
        setFloatingInput({
          isOpen: true,
          type: type === 'inline' ? 'inline-math' : 'block-math',
          anchorElement: anchorEl,
        })
      }
    }

    document.addEventListener("openMathInput", handleOpenMathInput)
    return () => {
      document.removeEventListener("openMathInput", handleOpenMathInput)
    }
  }, [])

  // 监听打开链接输入框的事件（来自 bubble-menu）
  React.useEffect(() => {
    const handleOpenLinkInput = (event: Event) => {
      const customEvent = event as CustomEvent
      const defaultValue = customEvent.detail?.defaultValue || ''
      
      if (editorRef.current) {
        const view = editorRef.current.view
        const pos = view.state.selection.from
        const coords = view.coordsAtPos(pos)
        
        const anchorEl = document.createElement('div')
        anchorEl.style.position = 'fixed'
        anchorEl.style.left = `${coords.left}px`
        anchorEl.style.top = `${coords.top}px`
        document.body.appendChild(anchorEl)
        
        setFloatingInput({
          isOpen: true,
          type: 'link',
          defaultValue,
          anchorElement: anchorEl,
        })
      }
    }

    document.addEventListener("openLinkInput", handleOpenLinkInput)
    return () => {
      document.removeEventListener("openLinkInput", handleOpenLinkInput)
    }
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setLocalTitle(newTitle)
    onTitleChange?.(newTitle)
  }

  const handleAIGenerate = async (prompt: string) => {
    if (!editorRef.current) return

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          context: aiContext,
          learningPlanTitle: localTitle,
        }),
      })

      if (!response.ok) {
        const error = await response.json() as Record<string, unknown>
        throw new Error((error.error as string) || "生成失败")
      }

      const data = await response.json() as Record<string, unknown>
      const generatedContent = data.content as string

      // 将生成的内容插入到编辑器
      editorRef.current.chain().focus().insertContent(generatedContent).run()
    } catch (error) {
      throw error
    }
  }

  // 监听 Markdown 粘贴事件
  React.useEffect(() => {
    const handlePasteMarkdown = (event: Event) => {
      const customEvent = event as CustomEvent
      const { html } = customEvent.detail
      
      if (editorRef.current && html) {
        // 使用 insertContent 插入 HTML
        editorRef.current.commands.insertContent(html)
      }
    }

    document.addEventListener("pasteMarkdown", handlePasteMarkdown)
    return () => {
      document.removeEventListener("pasteMarkdown", handlePasteMarkdown)
    }
  }, [])

  // 监听导入 Markdown 文件事件
  React.useEffect(() => {
    const handleImportMarkdown = async (event: Event) => {
      const customEvent = event as CustomEvent
      const { markdown, fileName } = customEvent.detail
      
      if (editorRef.current && markdown) {
        try {
          // 使用 markdown-it 将 Markdown 转换为 HTML
          const MarkdownIt = (await import('markdown-it')).default
          const md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
            breaks: true,
          })
          
          // 处理 Mermaid 代码块
          const processedMarkdown = markdown.replace(
            /```mermaid\n([\s\S]*?)```/g,
            (_match: string, code: string) => {
              return `<div data-type="mermaid" data-content="${encodeURIComponent(code.trim())}"></div>`
            }
          )
          
          const html = md.render(processedMarkdown)
          
          // 插入到编辑器
          editorRef.current.commands.insertContent(html)
          
          // 显示成功提示
          const toastEvent = new CustomEvent("showToast", {
            detail: { 
              type: 'success', 
              message: `成功导入 ${fileName}` 
            },
          })
          document.dispatchEvent(toastEvent)
        } catch (error) {
          console.error('Markdown 解析失败:', error)
          const toastEvent = new CustomEvent("showToast", {
            detail: { 
              type: 'error', 
              message: 'Markdown 解析失败' 
            },
          })
          document.dispatchEvent(toastEvent)
        }
      }
    }

    document.addEventListener("importMarkdown", handleImportMarkdown)
    return () => {
      document.removeEventListener("importMarkdown", handleImportMarkdown)
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        bulletList: false, // 禁用 StarterKit 的 bulletList，使用自定义的
        orderedList: false, // 禁用 StarterKit 的 orderedList，使用自定义的
        listItem: false, // 禁用 StarterKit 的 listItem，使用自定义的
        link: false, // 禁用 StarterKit 的 link，使用自定义的
      }),
      Underline,
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc pl-6 my-4",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal pl-6 my-4",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "my-1",
        },
      }),
      ResizableImage,
      ResizableVideo,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[var(--color-primary)] underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CustomCodeBlock,
      Youtube.configure({
        HTMLAttributes: {
          class: "rounded-lg overflow-hidden my-4",
        },
      }),
      Vimeo.configure({
        HTMLAttributes: {
          class: "rounded-lg overflow-hidden my-4",
        },
      }),
      GenericVideo.configure({
        HTMLAttributes: {
          class: "rounded-lg overflow-hidden my-4",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 px-4 py-2",
        },
      }),
      MathExtension,
      BlockMathExtension,
      MermaidNode,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Callout,
      SlashCommand.configure({
        suggestion: slashCommandSuggestion,
      }),
      Details,
      Summary,
      SimilarQuestionButton.configure({
        onButtonClick: (questionIndex) => {
          if (onSimilarQuestionClick) {
            onSimilarQuestionClick(questionIndex)
          }
        },
      }),
      DragDropExtension.configure({
        onUploadStart: (file) => {
          setUploadState({
            fileName: file.name,
            status: 'uploading',
          })
        },
        onUploadComplete: () => {
          setUploadState((prev) =>
            prev ? { ...prev, status: 'success' } : null
          )
        },
        onUploadError: (error) => {
          setUploadState((prev) =>
            prev
              ? { ...prev, status: 'error', error: error.message }
              : null
          )
        },
      }),
      PasteExtension.configure({
        onUploadStart: (file) => {
          setUploadState({
            fileName: file.name,
            status: 'uploading',
          })
        },
        onUploadComplete: () => {
          setUploadState((prev) =>
            prev ? { ...prev, status: 'success' } : null
          )
        },
        onUploadError: (error) => {
          setUploadState((prev) =>
            prev
              ? { ...prev, status: 'error', error: error.message }
              : null
          )
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      editorRef.current = editor
      onChange?.(editor.getHTML())
    },
    onBlur: () => {
      onBlur?.()
    },
    onSelectionUpdate: ({ editor }) => {
      // 当选区变化时，如果没有选中文本，清除颜色和背景色 mark
      const { from, to, empty } = editor.state.selection
      if (empty || from === to) {
        // 清除存储的 mark，防止后续输入继承颜色
        const tr = editor.state.tr
        if (editor.schema.marks.textStyle) {
          tr.removeStoredMark(editor.schema.marks.textStyle)
        }
        if (editor.schema.marks.highlight) {
          tr.removeStoredMark(editor.schema.marks.highlight)
        }
        if (tr.docChanged || tr.storedMarksSet) {
          editor.view.dispatch(tr)
        }
      }
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-screen",
      },
    },
  })

  // 当外部 content 改变时，更新编辑器内容
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // 当编辑器准备好时，调用回调
  React.useEffect(() => {
    if (editor) {
      editorRef.current = editor
      onEditorReady?.(editor)
    }
  }, [editor, onEditorReady])

  const handleFloatingInputSubmit = React.useCallback((value: string) => {
    if (!editor) return

    if (floatingInput.type === 'link') {
      if (value === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run()
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run()
      }
    } else if (floatingInput.type === 'image') {
      if (value) {
        editor.commands.insertContent({
          type: 'resizableImage',
          attrs: {
            src: value,
            alt: '',
            width: null,
            align: 'left',
          },
        })
      }
    } else if (floatingInput.type === 'video') {
      if (value) {
        // 检测视频类型
        const detectVideoType = (url: string): 'youtube' | 'vimeo' | 'generic' | null => {
          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube'
          }
          if (url.includes('vimeo.com')) {
            return 'vimeo'
          }
          if (url.includes('bilibili.com') || url.includes('b23.tv') || 
              url.includes('v.qq.com') || url.includes('youku.com') || 
              url.includes('iqiyi.com')) {
            return 'generic'
          }
          return null
        }

        const type = detectVideoType(value)
        if (type === 'youtube') {
          editor.commands.setYoutubeVideo({ src: value })
        } else if (type === 'vimeo') {
          editor.commands.setVimeoVideo({ src: value })
        } else if (type === 'generic') {
          editor.commands.setGenericVideo({ src: value, type: 'bilibili' })
        }
      }
    } else if (floatingInput.type === 'inline-math') {
      if (value) {
        editor.chain().focus().setMath({ latex: value, display: false }).run()
      }
    } else if (floatingInput.type === 'block-math') {
      if (value) {
        editor.chain().focus().setBlockMath({ latex: value }).run()
      }
    }
  }, [editor, floatingInput.type])

  return (
    <>
      <div className={cn("flex-1 flex flex-col bg-white overflow-hidden", className)}>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-full px-8 py-12">
            {/* 标题输入框 */}
            <input
              type="text"
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="无标题"
              disabled={!editable}
              className="w-full text-4xl font-bold text-[var(--color-text)] placeholder:text-gray-300 bg-transparent border-none outline-none focus:outline-none focus:ring-0 mb-4"
            />
            
            {/* 编辑器内容 */}
            <EditorContent editor={editor} />
            
            {/* 浮动工具栏 */}
            {editor && showBubbleMenu && <BubbleMenuToolbar editor={editor} />}
            
            {/* 表格菜单 */}
            {editor && <TableMenu editor={editor} />}
          </div>
        </div>
      </div>

      {/* 上传进度提示 */}
      {uploadState && (
        <UploadProgress
          fileName={uploadState.fileName}
          status={uploadState.status}
          error={uploadState.error}
          onClose={() => setUploadState(null)}
        />
      )}

      {/* AI 悬浮输入框 */}
      <AIFloatingInput
        isOpen={isAIInputOpen}
        onClose={() => {
          setIsAIInputOpen(false)
          // 清理锚点元素
          if (aiAnchorElement && aiAnchorElement.parentNode) {
            aiAnchorElement.parentNode.removeChild(aiAnchorElement)
          }
          setAiAnchorElement(null)
        }}
        onGenerate={handleAIGenerate}
        anchorElement={aiAnchorElement}
        contentId={contentId}
        currentContent={content}
        onSummaryRegenerated={(summary) => {
          setDocumentSummary(summary)
        }}
      />

      {/* 通用悬浮输入框 */}
      <FloatingInput
        isOpen={floatingInput.isOpen}
        onClose={() => {
          setFloatingInput({ ...floatingInput, isOpen: false })
          // 清理锚点元素
          if (floatingInput.anchorElement && floatingInput.anchorElement.parentNode) {
            floatingInput.anchorElement.parentNode.removeChild(floatingInput.anchorElement)
          }
          // 触发关闭事件，通知气泡工具栏可以重新显示
          setTimeout(() => {
            const event = new CustomEvent("floatingInputClosed")
            document.dispatchEvent(event)
          }, 100)
        }}
        onSubmit={handleFloatingInputSubmit}
        placeholder={
          floatingInput.type === 'link'
            ? "输入链接 URL..."
            : floatingInput.type === 'image'
            ? "输入图片 URL..."
            : floatingInput.type === 'video'
            ? "输入视频链接..."
            : floatingInput.type === 'inline-math'
            ? "输入 LaTeX 公式（行内）..."
            : "输入 LaTeX 公式（块级）..."
        }
        defaultValue={floatingInput.defaultValue}
        title={
          floatingInput.type === 'link'
            ? "插入链接"
            : floatingInput.type === 'image'
            ? "插入图片"
            : floatingInput.type === 'video'
            ? "嵌入视频"
            : floatingInput.type === 'inline-math'
            ? "插入行内公式"
            : "插入块级公式"
        }
        anchorElement={floatingInput.anchorElement}
      />
    </>
  )
}

export function useTiptapEditor() {
  const [editor, setEditor] = React.useState<Editor | null>(null)
  return { editor, setEditor }
}
