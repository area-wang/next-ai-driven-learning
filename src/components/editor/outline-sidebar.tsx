/**
 * 大纲侧边栏组件
 * 自动提取文档中的标题生成大纲导航
 */

"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { ChevronRight, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeadingItem {
  id: string
  level: number
  text: string
  pos: number
}

interface OutlineSidebarProps {
  editor: Editor | null
  className?: string
}

export function OutlineSidebar({ editor, className }: OutlineSidebarProps) {
  const [headings, setHeadings] = React.useState<HeadingItem[]>([])
  const [activeId, setActiveId] = React.useState<string>("")

  // 提取文档中的标题
  React.useEffect(() => {
    if (!editor) return

    const updateHeadings = () => {
      const items: HeadingItem[] = []
      const { doc } = editor.state

      doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const id = `heading-${pos}`
          items.push({
            id,
            level: node.attrs.level,
            text: node.textContent,
            pos,
          })
        }
      })

      setHeadings(items)
    }

    // 初始化
    updateHeadings()

    // 监听编辑器更新
    editor.on("update", updateHeadings)

    return () => {
      editor.off("update", updateHeadings)
    }
  }, [editor])

  // 监听滚动，自动高亮当前可见的标题
  React.useEffect(() => {
    if (!editor || headings.length === 0) return

    // 找到编辑器的滚动容器
    const editorDom = editor.view.dom
    let scrollContainer: HTMLElement | null = editorDom.parentElement
    
    // 向上查找带有 overflow 的容器
    let depth = 0
    while (scrollContainer && depth < 10) {
      const style = window.getComputedStyle(scrollContainer)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        break
      }
      scrollContainer = scrollContainer.parentElement
      depth++
    }

    if (!scrollContainer) return

    // 直接从 DOM 中查找所有标题元素
    const allHeadingElements = Array.from(editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[]

    // 创建标题元素映射
    const headingElementMap = new Map<string, HTMLElement>()
    headings.forEach((heading, index) => {
      let headingElement = allHeadingElements[index]
      
      if (headingElement && headingElement.textContent?.trim() !== heading.text.trim()) {
        headingElement = allHeadingElements.find(
          el => el.textContent?.trim() === heading.text.trim()
        ) || headingElement
      }
      
      if (headingElement) {
        headingElementMap.set(heading.id, headingElement)
      }
    })

    // 滚动事件处理函数
    const handleScroll = () => {
      const containerRect = scrollContainer!.getBoundingClientRect()
      const referenceLine = containerRect.top + 100

      const headingsAboveLine: Array<{ heading: HeadingItem; distance: number }> = []

      headings.forEach((heading) => {
        const element = headingElementMap.get(heading.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= referenceLine) {
            headingsAboveLine.push({
              heading,
              distance: referenceLine - rect.top,
            })
          }
        }
      })

      if (headingsAboveLine.length > 0) {
        headingsAboveLine.sort((a, b) => a.distance - b.distance)
        const newActiveId = headingsAboveLine[0].heading.id
        if (newActiveId !== activeId) {
          setActiveId(newActiveId)
        }
      } else if (headings.length > 0 && activeId !== headings[0].id) {
        setActiveId(headings[0].id)
      }
    }

    handleScroll()
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [editor, headings, activeId])

  // 当 activeId 变化时，自动滚动大纲使高亮项可见
  React.useEffect(() => {
    if (!activeId) return

    const timer = setTimeout(() => {
      const activeElement = document.querySelector(`[data-outline-id="${activeId}"]`)
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [activeId])

  // 滚动到指定标题
  const scrollToHeading = React.useCallback(
    (item: HeadingItem) => {
      if (!editor) return

      // 设置光标位置
      editor.commands.focus(item.pos)

      // 滚动到视图
      const element = editor.view.domAtPos(item.pos).node as HTMLElement
      element.scrollIntoView({ behavior: "smooth", block: "center" })

      setActiveId(item.id)
    },
    [editor]
  )

  if (!editor || headings.length === 0) {
    return (
      <div
        className={cn(
          "w-64 border-r border-gray-200 bg-white/50 backdrop-blur-sm p-6",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="font-semibold text-[var(--color-text)]">文档大纲</h2>
        </div>
        <p className="text-sm text-gray-500">
          暂无标题，使用标题格式来创建大纲
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-64 border-r border-gray-200 bg-white/50 backdrop-blur-sm overflow-y-auto",
        className
      )}
    >
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="font-semibold text-[var(--color-text)]">文档大纲</h2>
        </div>
      </div>

      <nav className="p-4 space-y-1" aria-label="文档大纲">
        {headings.map((item) => (
          <button
            key={item.id}
            type="button"
            data-outline-id={item.id}
            onClick={() => scrollToHeading(item)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group",
              "hover:bg-[var(--color-secondary)]/20",
              activeId === item.id &&
                "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
            )}
            style={{
              paddingLeft: `${(item.level - 1) * 12 + 12}px`,
            }}
          >
            <div className="flex items-center gap-2">
              <ChevronRight
                className={cn(
                  "w-3 h-3 transition-transform duration-200",
                  activeId === item.id
                    ? "text-[var(--color-primary)]"
                    : "text-gray-400 group-hover:text-[var(--color-primary)]"
                )}
              />
              <span
                className={cn(
                  "text-sm truncate",
                  activeId === item.id
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text)] group-hover:text-[var(--color-primary)]",
                  item.level === 1 && "font-semibold",
                  item.level === 2 && "font-medium",
                  item.level === 3 && "font-normal"
                )}
              >
                {item.text || "（空标题）"}
              </span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  )
}
