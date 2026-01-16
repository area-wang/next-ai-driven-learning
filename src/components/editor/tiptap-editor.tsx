"use client"

import * as React from "react"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Youtube from "@tiptap/extension-youtube"
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table"
import { common, createLowlight } from "lowlight"
import { cn } from "@/lib/utils"
import { EditorToolbar } from "./editor-toolbar"

const lowlight = createLowlight(common)

export interface TiptapEditorProps {
  content?: string
  placeholder?: string
  editable?: boolean
  className?: string
  onChange?: (content: string) => void
  onBlur?: () => void
}

export function TiptapEditor({
  content = "",
  placeholder = "开始输入...",
  editable = true,
  className,
  onChange,
  onBlur,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
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
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "rounded-lg bg-slate-900 text-slate-50 p-4 my-4 overflow-x-auto",
        },
      }),
      Youtube.configure({
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
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-slate max-w-none focus:outline-none min-h-[200px] p-4",
          "prose-headings:text-[var(--color-text)]",
          "prose-p:text-[var(--color-text)]",
          "prose-strong:text-[var(--color-text)]",
          "prose-a:text-[var(--color-primary)]",
          "prose-code:text-[var(--color-primary)] prose-code:bg-[var(--color-secondary)]/20 prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-slate-900 prose-pre:text-slate-50"
        ),
      },
    },
  })

  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm overflow-hidden", className)}>
      {editable && editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

export function useTiptapEditor() {
  const [editor, setEditor] = React.useState<Editor | null>(null)
  return { editor, setEditor }
}
