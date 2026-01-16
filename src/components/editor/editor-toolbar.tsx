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
  Youtube,
  Table,
  Code2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const addImage = React.useCallback(() => {
    const url = window.prompt("输入图片URL:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = React.useCallback(() => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("输入链接URL:", previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const addYoutube = React.useCallback(() => {
    const url = window.prompt("输入YouTube视频URL:")
    if (url) {
      editor.commands.setYoutubeVideo({ src: url })
    }
  }, [editor])

  const insertTable = React.useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  return (
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
      <ToolbarButton onClick={addImage} tooltip="图片">
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addYoutube} tooltip="YouTube视频">
        <Youtube className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={insertTable} tooltip="表格">
        <Table className="w-4 h-4" />
      </ToolbarButton>
    </div>
  )
}
