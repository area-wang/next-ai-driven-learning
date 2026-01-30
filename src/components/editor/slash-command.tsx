/**
 * 斜杠命令扩展
 * 输入 / 弹出命令菜单，快速插入各种内容块
 */

"use client"

import { Extension } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion"
import tippy, { Instance as TippyInstance } from "tippy.js"
import { CommandList, CommandListRef } from "./command-list"

export interface SlashCommandItem {
  title: string
  description: string
  icon: string
  command: (props: { editor: any; range: any }) => void
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

// 命令列表配置
export const slashCommandItems: SlashCommandItem[] = [
  {
    title: "标题 1",
    description: "大标题",
    icon: "H1",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run()
    },
  },
  {
    title: "标题 2",
    description: "中标题",
    icon: "H2",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run()
    },
  },
  {
    title: "标题 3",
    description: "小标题",
    icon: "H3",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run()
    },
  },
  {
    title: "标题 4",
    description: "更小的标题",
    icon: "Heading4",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 4 })
        .run()
    },
  },
  {
    title: "标题 5",
    description: "次级标题",
    icon: "Heading5",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 5 })
        .run()
    },
  },
  {
    title: "标题 6",
    description: "最小标题",
    icon: "Heading6",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 6 })
        .run()
    },
  },
  {
    title: "无序列表",
    description: "创建无序列表",
    icon: "List",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: "有序列表",
    description: "创建有序列表",
    icon: "ListOrdered",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: "任务列表",
    description: "创建待办事项",
    icon: "ListChecks",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: "引用",
    description: "插入引用块",
    icon: "Quote",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: "代码块",
    description: "插入代码块",
    icon: "Code2",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: "分割线",
    description: "插入水平分割线",
    icon: "Minus",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: "图片",
    description: "插入图片（支持在线图片和上传）",
    icon: "Image",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      
      // 触发打开图片插入对话框的事件
      const event = new CustomEvent("openImageDialog")
      document.dispatchEvent(event)
    },
  },
  {
    title: "视频",
    description: "上传本地视频",
    icon: "Video",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      
      // 创建文件选择器
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'video/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        try {
          // 上传视频
          const formData = new FormData()
          formData.append('file', file)

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error('上传失败')
          }

          const data = await response.json() as { url: string }

          // 插入可调整大小的视频
          editor.commands.insertContent({
            type: 'resizableVideo',
            attrs: {
              src: data.url,
              width: null,
              align: 'left',
            },
          })
        } catch (error) {
          console.error('视频上传失败:', error)
          // 触发 toast 通知
          const event = new CustomEvent("showToast", {
            detail: { type: 'error', message: '视频上传失败，请重试' },
          })
          document.dispatchEvent(event)
        }
      }
      input.click()
    },
  },
  {
    title: "嵌入视频",
    description: "嵌入主流视频平台视频",
    icon: "Youtube",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      
      // 触发打开视频嵌入对话框的事件
      const event = new CustomEvent("openVideoDialog")
      document.dispatchEvent(event)
    },
  },
  {
    title: "表格",
    description: "插入表格",
    icon: "Table",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
  {
    title: "数学公式",
    description: "插入 LaTeX 公式",
    icon: "Sigma",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      
      // 触发打开数学公式输入框的事件
      const event = new CustomEvent("openMathInput", {
        detail: { type: 'inline' },
      })
      document.dispatchEvent(event)
    },
  },
  {
    title: "AI 生成",
    description: "使用 AI 生成内容",
    icon: "Sparkles",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      // 触发 AI 对话框
      const event = new CustomEvent("openAIPrompt", {
        detail: { editor, range },
      })
      document.dispatchEvent(event)
    },
  },
]

// Suggestion 配置
export const slashCommandSuggestion: Partial<SuggestionOptions> = {
  items: ({ query }: { query: string }) => {
    return slashCommandItems.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  },

  render: () => {
    let component: ReactRenderer<CommandListRef> | undefined
    let popup: TippyInstance[] | undefined

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandList, {
          props: {
            items: props.items,
            command: (item: SlashCommandItem) => {
              props.command(item)
            },
          },
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          offset: [0, 8],
          popperOptions: {
            modifiers: [
              {
                name: 'flip',
                enabled: true,
                options: {
                  padding: 8,
                },
              },
              {
                name: 'preventOverflow',
                enabled: true,
                options: {
                  padding: 8,
                },
              },
            ],
          },
        })

        // 自动滚动编辑器，确保菜单在视口可见区域
        setTimeout(() => {
          const editorContainer = document.querySelector('.ProseMirror')?.closest('.flex-1') as HTMLElement
          if (editorContainer && props.clientRect) {
            const rect = props.clientRect()
            const containerRect = editorContainer.getBoundingClientRect()
            const menuHeight = 320 // 估计菜单高度
            const padding = 20

            // 检查菜单是否超出下边界
            if (rect.top + menuHeight + padding > window.innerHeight) {
              const scrollTop = editorContainer.scrollTop
              const targetScrollTop = scrollTop + (rect.top - containerRect.top) - 100
              
              editorContainer.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth',
              })
            }
          }
        }, 50)
      },

      onUpdate(props: any) {
        component?.updateProps({
          items: props.items,
          command: (item: SlashCommandItem) => {
            props.command(item)
          },
        })

        if (!props.clientRect) {
          return
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide()
          return true
        }

        return component?.ref?.onKeyDown(props) ?? false
      },

      onExit() {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
}
