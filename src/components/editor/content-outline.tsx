/**
 * 内容大纲组件
 * 自动提取文档中的标题，生成可点击的大纲
 */

"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeadingItem {
  id: string
  level: number
  text: string
  pos: number
}

interface ContentOutlineProps {
  editor: Editor | null
  className?: string
}

export function ContentOutline({ editor, className }: ContentOutlineProps) {
  const [headings, setHeadings] = React.useState<HeadingItem[]>([])
  const [expandedLevels, setExpandedLevels] = React.useState<Set<number>>(
    new Set([1, 2, 3, 4, 5, 6])
  )
  const [activeId, setActiveId] = React.useState<string | null>(null)

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

    updateHeadings()

    editor.on("update", updateHeadings)
    editor.on("selectionUpdate", updateHeadings)

    return () => {
      editor.off("update", updateHeadings)
      editor.off("selectionUpdate", updateHeadings)
    }
  }, [editor])

  // 跳转到指定标题
  const scrollToHeading = React.useCallback((pos: number) => {
    if (!editor) return

    // 获取编辑器容器
    const editorContainer = editor.view.dom.closest('.flex-1') as HTMLElement
    if (!editorContainer) return

    // 获取标题元素的坐标
    const { view } = editor
    const coords = view.coordsAtPos(pos)
    
    // 计算滚动位置：将标题滚动到距离视口顶部 100px 的位置
    const containerRect = editorContainer.getBoundingClientRect()
    const targetScrollTop = editorContainer.scrollTop + (coords.top - containerRect.top) - 100
    
    editorContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    })
  }, [editor])

  // 切换展开/收起
  const toggleLevel = React.useCallback((level: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
      }
      return next
    })
  }, [])

  // 按层级组织标题
  const organizedHeadings = React.useMemo(() => {
    const result: Array<HeadingItem & { children?: HeadingItem[] }> = []
    const stack: Array<HeadingItem & { children?: HeadingItem[] }> = []

    headings.forEach((heading) => {
      const item = { ...heading, children: [] }

      // 找到合适的父级
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop()
      }

      if (stack.length === 0) {
        result.push(item)
      } else {
        const parent = stack[stack.length - 1]
        if (!parent.children) parent.children = []
        parent.children.push(item)
      }

      stack.push(item)
    })

    return result
  }, [headings])

  const renderHeading = React.useCallback((
    item: HeadingItem & { children?: HeadingItem[] },
    depth: number = 0
  ) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedLevels.has(item.level)
    const isActive = activeId === item.id

    const handleHeadingClick = () => {
      scrollToHeading(item.pos)
      setActiveId(item.id)
    }

    return (
      <div key={item.id}>
        <div
          className={cn(
            "group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer",
            isActive
              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "hover:bg-gray-100 text-[var(--color-text)]"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={handleHeadingClick}
        >
          {/* 展开/收起按钮 */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleLevel(item.level)
              }}
              className="flex items-center justify-center w-4 h-4 rounded hover:bg-gray-200 transition-colors"
              aria-label={isExpanded ? "收起" : "展开"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* 标题文本 */}
          <span
            className={cn(
              "flex-1 text-sm truncate",
              item.level === 1 && "font-semibold",
              item.level === 2 && "font-medium"
            )}
          >
            {item.text || "无标题"}
          </span>
        </div>

        {/* 子标题 */}
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map((child) => renderHeading(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }, [activeId, expandedLevels, scrollToHeading, toggleLevel])

  if (!editor || headings.length === 0) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-400 text-center">
            文档中还没有标题
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 大纲列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {organizedHeadings.map((heading) => renderHeading(heading))}
      </div>
    </div>
  )
}
