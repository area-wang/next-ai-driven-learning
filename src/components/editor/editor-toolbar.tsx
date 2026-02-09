"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Table,
  Code2,
  Sigma,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VideoEmbedDialog } from "./video-embed-dialog"
import { ImageInsertDialog } from "./image-insert-dialog"
import { FloatingInput } from "./floating-input"
import { useToast } from "@/components/ui/toast-container"

interface EditorToolbarProps {
  editor: Editor
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  tooltip: string
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 w-8",
              isActive && "bg-[var(--color-secondary)]/30 text-[var(--color-primary)]"
            )}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [isVideoDialogOpen, setIsVideoDialogOpen] = React.useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false)
  const [floatingInput, setFloatingInput] = React.useState<{
    isOpen: boolean
    type: 'link' | 'inline-math' | 'block-math'
    defaultValue?: string
    anchorElement?: HTMLElement | null
  }>({
    isOpen: false,
    type: 'link',
  })
  const toast = useToast()

  // 监听打开图片对话框的事件
  React.useEffect(() => {
    const handleOpenImageDialog = () => {
      setIsImageDialogOpen(true)
    }

    document.addEventListener("openImageDialog", handleOpenImageDialog)
    return () => {
      document.removeEventListener("openImageDialog", handleOpenImageDialog)
    }
  }, [])

  // 监听打开视频对话框的事件
  React.useEffect(() => {
    const handleOpenVideoDialog = () => {
      setIsVideoDialogOpen(true)
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
      setFloatingInput({
        isOpen: true,
        type: type === 'inline' ? 'inline-math' : 'block-math',
      })
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
      setFloatingInput({
        isOpen: true,
        type: 'link',
        defaultValue,
      })
    }

    document.addEventListener("openLinkInput", handleOpenLinkInput)
    return () => {
      document.removeEventListener("openLinkInput", handleOpenLinkInput)
    }
  }, [])

  const handleImageInsert = React.useCallback((src: string, alt?: string) => {
    editor.commands.insertContent({
      type: 'resizableImage',
      attrs: {
        src,
        alt: alt || '',
        width: null,
        align: 'left',
      },
    })
  }, [editor])

  const addLink = React.useCallback(() => {
    const previousUrl = editor.getAttributes("link").href
    setFloatingInput({
      isOpen: true,
      type: 'link',
      defaultValue: previousUrl || '',
    })
  }, [editor])

  const handleFloatingInputSubmit = React.useCallback((value: string) => {
    if (floatingInput.type === 'link') {
      if (value === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run()
      } else {
        editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run()
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

  const handleVideoEmbed = React.useCallback((url: string, type: 'youtube' | 'vimeo' | 'bilibili' | 'tencent' | 'youku' | 'iqiyi') => {
    if (type === 'youtube') {
      editor.commands.setYoutubeVideo({ src: url })
    } else if (type === 'vimeo') {
      editor.commands.setVimeoVideo({ src: url })
    } else {
      editor.commands.setGenericVideo({ src: url, type })
    }
  }, [editor])

  const insertTable = React.useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const addInlineMath = React.useCallback(() => {
    setFloatingInput({
      isOpen: true,
      type: 'inline-math',
    })
  }, [])

  const addBlockMath = React.useCallback(() => {
    setFloatingInput({
      isOpen: true,
      type: 'block-math',
    })
  }, [])

  const importMarkdown = React.useCallback(() => {
    // 创建文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,text/markdown'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        // 读取文件内容
        const text = await file.text()
        
        // 触发导入事件
        const event = new CustomEvent("importMarkdown", {
          detail: { markdown: text, fileName: file.name },
        })
        document.dispatchEvent(event)
      } catch (error) {
        console.error('Markdown 导入失败:', error)
        // 触发 toast 通知
        const toastEvent = new CustomEvent("showToast", {
          detail: { type: 'error', message: 'Markdown 导入失败，请重试' },
        })
        document.dispatchEvent(toastEvent)
      }
    }
    input.click()
  }, [])

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50/50">
      {/* 撤销/重做 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="撤销"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="重做"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 标题 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        tooltip="标题1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        tooltip="标题2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        tooltip="标题3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 文本格式 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        tooltip="粗体"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        tooltip="斜体"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        tooltip="删除线"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        tooltip="行内代码"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 列表 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        tooltip="无序列表"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        tooltip="有序列表"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        tooltip="任务列表"
      >
        <ListChecks className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 块级元素 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        tooltip="引用"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        tooltip="代码块"
      >
        <Code2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        tooltip="分割线"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 插入 */}
      <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} tooltip="链接">
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => setIsImageDialogOpen(true)} tooltip="插入图片">
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => setIsVideoDialogOpen(true)} tooltip="嵌入视频">
        <Video className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={insertTable} tooltip="表格">
        <Table className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={importMarkdown} tooltip="导入 Markdown">
        <FileText className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* 数学公式 */}
      <ToolbarButton onClick={addInlineMath} tooltip="行内公式" aria-label="插入行内数学公式">
        <Sigma className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addBlockMath} tooltip="块级公式" aria-label="插入块级数学公式">
        <Sigma className="w-4 h-4 font-bold" />
      </ToolbarButton>
    </div>

    {/* 视频嵌入对话框 */}
    <VideoEmbedDialog
      isOpen={isVideoDialogOpen}
      onClose={() => setIsVideoDialogOpen(false)}
      onEmbed={handleVideoEmbed}
    />

    {/* 图片插入对话框 */}
    <ImageInsertDialog
      isOpen={isImageDialogOpen}
      onClose={() => setIsImageDialogOpen(false)}
      onInsert={handleImageInsert}
    />

    {/* 悬浮输入框 */}
    <FloatingInput
      isOpen={floatingInput.isOpen}
      onClose={() => setFloatingInput({ ...floatingInput, isOpen: false })}
      onSubmit={handleFloatingInputSubmit}
      placeholder={
        floatingInput.type === 'link'
          ? "输入链接 URL..."
          : floatingInput.type === 'inline-math'
          ? "输入 LaTeX 公式（行内）..."
          : "输入 LaTeX 公式（块级）..."
      }
      defaultValue={floatingInput.defaultValue}
      title={
        floatingInput.type === 'link'
          ? "插入链接"
          : floatingInput.type === 'inline-math'
          ? "插入行内公式"
          : "插入块级公式"
      }
      anchorElement={floatingInput.anchorElement}
    />
  </>
  )
}
