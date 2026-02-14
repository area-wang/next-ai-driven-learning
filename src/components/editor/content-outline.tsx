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
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())
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

  // 监听滚动，自动高亮当前可见的标题
  React.useEffect(() => {
    if (!editor || headings.length === 0) return

    // 找到编辑器的滚动容器
    const editorDom = editor.view.dom
    let scrollContainer: HTMLElement | null = editorDom.parentElement
    
    // 向上查找带有 overflow-y-auto 的容器
    let depth = 0
    while (scrollContainer && depth < 10) {
      const style = window.getComputedStyle(scrollContainer)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        break
      }
      scrollContainer = scrollContainer.parentElement
      depth++
    }

    if (!scrollContainer) {
      console.error('[大纲] 无法找到滚动容器')
      return
    }

    // 直接从 DOM 中查找所有标题元素
    const allHeadingElements = Array.from(editorDom.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[]

    // 创建标题元素映射
    const headingElementMap = new Map<string, HTMLElement>()
    headings.forEach((heading, index) => {
      let headingElement = allHeadingElements[index]
      
      // 如果文本不匹配，通过文本查找
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
      // 定义一个参考线：容器顶部 + 100px
      const referenceLine = containerRect.top + 100

      // 找到所有在参考线之上的标题
      const headingsAboveLine: Array<{ heading: HeadingItem; distance: number }> = []

      headings.forEach((heading) => {
        const element = headingElementMap.get(heading.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          const headingTop = rect.top

          // 如果标题在参考线之上（或刚好在参考线上）
          if (headingTop <= referenceLine) {
            headingsAboveLine.push({
              heading,
              distance: referenceLine - headingTop, // 距离参考线的距离
            })
          }
        }
      })

      // 如果有标题在参考线之上，选择距离最近的那个（即最后一个经过参考线的）
      if (headingsAboveLine.length > 0) {
        // 按距离排序，距离最小的就是最近经过参考线的
        headingsAboveLine.sort((a, b) => a.distance - b.distance)
        const newActiveId = headingsAboveLine[0].heading.id

        if (newActiveId !== activeId) {
          setActiveId(newActiveId)
        }
      } else {
        // 如果没有标题在参考线之上，高亮第一个标题
        if (headings.length > 0 && activeId !== headings[0].id) {
          setActiveId(headings[0].id)
        }
      }
    }

    // 初始化时执行一次
    handleScroll()

    // 监听滚动事件
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll)
    }
  }, [editor, headings, activeId])

  // 当 activeId 变化时，自动滚动大纲使高亮项可见
  React.useEffect(() => {
    if (!activeId) return

    // 使用 setTimeout 确保 DOM 已更新
    const timer = setTimeout(() => {
      const activeElement = document.querySelector(`[data-outline-id="${activeId}"]`)
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // 只在需要时滚动
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [activeId])

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
  const toggleExpanded = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
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
    const isExpanded = expandedIds.has(item.id)
    const isActive = activeId === item.id

    const handleHeadingClick = () => {
      scrollToHeading(item.pos)
      setActiveId(item.id)
    }

    return (
      <div key={item.id}>
        <div
          data-outline-id={item.id}
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
                toggleExpanded(item.id)
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
  }, [activeId, expandedIds, scrollToHeading, toggleExpanded])

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
