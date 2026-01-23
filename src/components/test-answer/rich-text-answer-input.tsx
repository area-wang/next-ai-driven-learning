/**
 * 富文本答题输入组件
 * 使用简化版的 Tiptap 编辑器
 */

"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { cn } from "@/lib/utils"
import { Bold, Italic, Code, List, ListOrdered, Undo, Redo } from "lucide-react"

const lowlight = createLowlight(common)

interface RichTextAnswerInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function RichTextAnswerInput({
  value,
  onChange,
  disabled = false,
  placeholder = "请输入你的答案...",
  className,
}: RichTextAnswerInputProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 禁用默认的代码块，使用 lowlight 版本
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // 当外部 value 变化时更新编辑器内容
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // 当 disabled 状态变化时更新编辑器
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border-2 border-gray-200 rounded-lg overflow-hidden", className)}>
      {/* 工具栏 */}
      {!disabled && (
        <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              editor.isActive('bold') && "bg-gray-300"
            )}
            title="粗体"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              editor.isActive('italic') && "bg-gray-300"
            )}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              editor.isActive('code') && "bg-gray-300"
            )}
            title="行内代码"
          >
            <Code className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              editor.isActive('bulletList') && "bg-gray-300"
            )}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              editor.isActive('orderedList') && "bg-gray-300"
            )}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
              editor.isActive('codeBlock') && "bg-gray-300"
            )}
            title="代码块"
          >
            <Code className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="撤销"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="重做"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 编辑器内容区域 */}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none",
          disabled && "bg-gray-50 cursor-not-allowed"
        )}
      />
    </div>
  )
}
