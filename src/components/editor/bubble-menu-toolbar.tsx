/**
 * 浮动工具栏组件
 * 选中文本时显示，支持分类下拉菜单
 */

"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  ChevronDown,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BubbleMenuToolbarProps {
  editor: Editor
}

interface ToolCategory {
  name: string
  icon: React.ComponentType<{ className?: string }>
  items: ToolItem[]
}

interface ToolItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  isActive?: () => boolean
}

export function BubbleMenuToolbar({ editor }: BubbleMenuToolbarProps) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const showDelayTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // 文本格式工具
  const textFormatTools: ToolItem[] = [
    {
      name: "粗体",
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      name: "斜体",
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      name: "删除线",
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive("strike"),
    },
    {
      name: "行内代码",
      icon: Code,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive("code"),
    },
  ]

  // 标题工具
  const headingTools: ToolItem[] = [
    {
      name: "标题 1",
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive("heading", { level: 1 }),
    },
    {
      name: "标题 2",
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive("heading", { level: 2 }),
    },
    {
      name: "标题 3",
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive("heading", { level: 3 }),
    },
    {
      name: "标题 4",
      icon: Heading4,
      action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
      isActive: () => editor.isActive("heading", { level: 4 }),
    },
    {
      name: "标题 5",
      icon: Heading5,
      action: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
      isActive: () => editor.isActive("heading", { level: 5 }),
    },
    {
      name: "标题 6",
      icon: Heading6,
      action: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
      isActive: () => editor.isActive("heading", { level: 6 }),
    },
  ]

  // 列表工具
  const listTools: ToolItem[] = [
    {
      name: "无序列表",
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
    },
    {
      name: "有序列表",
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive("orderedList"),
    },
    {
      name: "引用",
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive("blockquote"),
    },
  ]

  // 预设文字颜色（常用颜色）
  const textColors = [
    { name: "黑色", color: '#1F2937', textColor: '#1F2937' },
    { name: "灰色", color: '#6B7280', textColor: '#6B7280' },
    { name: "红色", color: '#EF4444', textColor: '#EF4444' },
    { name: "橙色", color: '#F97316', textColor: '#F97316' },
    { name: "黄色", color: '#D97706', textColor: '#D97706' },
    { name: "绿色", color: '#10B981', textColor: '#10B981' },
    { name: "蓝色", color: '#3B82F6', textColor: '#3B82F6' },
    { name: "紫色", color: '#8B5CF6', textColor: '#8B5CF6' },
  ]

  // 预设背景色（浅色系）
  const backgroundColors = [
    { name: "无背景", color: 'transparent', bgColor: 'transparent' },
    { name: "浅灰", color: '#F3F4F6', bgColor: '#F3F4F6' },
    { name: "浅红", color: '#FEE2E2', bgColor: '#FEE2E2' },
    { name: "浅橙", color: '#FFEDD5', bgColor: '#FFEDD5' },
    { name: "浅黄", color: '#FEF3C7', bgColor: '#FEF3C7' },
    { name: "浅绿", color: '#D1FAE5', bgColor: '#D1FAE5' },
    { name: "浅蓝", color: '#DBEAFE', bgColor: '#DBEAFE' },
    { name: "浅紫", color: '#EDE9FE', bgColor: '#EDE9FE' },
  ]

  // 对齐工具
  const alignTools: ToolItem[] = [
    {
      name: "左对齐",
      icon: AlignLeft,
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: () => editor.isActive({ textAlign: 'left' }),
    },
    {
      name: "居中对齐",
      icon: AlignCenter,
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: () => editor.isActive({ textAlign: 'center' }),
    },
    {
      name: "右对齐",
      icon: AlignRight,
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: () => editor.isActive({ textAlign: 'right' }),
    },
    {
      name: "两端对齐",
      icon: AlignJustify,
      action: () => editor.chain().focus().setTextAlign('justify').run(),
      isActive: () => editor.isActive({ textAlign: 'justify' }),
    },
  ]

  // 工具分类（不包含颜色和背景，它们单独处理）
  const categories: ToolCategory[] = [
    { name: "文本", icon: Bold, items: textFormatTools },
    { name: "标题", icon: Heading1, items: headingTools },
    { name: "列表", icon: List, items: listTools },
    { name: "对齐", icon: AlignLeft, items: alignTools },
  ]

  // 处理分类菜单的鼠标进入
  const handleCategoryMouseEnter = (categoryName: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setActiveCategory(categoryName)
  }

  // 处理分类菜单的鼠标离开
  const handleCategoryMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null)
    }, 200)
  }

  // 处理下拉菜单的鼠标进入
  const handleDropdownMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  // 处理下拉菜单的鼠标离开
  const handleDropdownMouseLeave = () => {
    setActiveCategory(null)
  }

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
      if (showDelayTimeoutRef.current) {
        clearTimeout(showDelayTimeoutRef.current)
      }
    }
  }, [])

  // 添加链接
  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("输入链接URL:", previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  // 应用文字颜色（只应用到选中文本）
  const applyTextColor = (color: string) => {
    const { from, to } = editor.state.selection
    
    if (color === 'transparent') {
      // 清除颜色
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetColor()
        .run()
    } else {
      // 应用颜色到选中文本
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .setColor(color)
        .run()
    }
    
    // 清除 mark 状态，但保持选中
    editor.view.dispatch(
      editor.state.tr.removeStoredMark(editor.schema.marks.textStyle)
    )
    
    setActiveCategory(null)
  }

  // 应用背景色（只应用到选中文本）
  const applyHighlight = (color: string) => {
    const { from, to } = editor.state.selection
    
    if (color === 'transparent') {
      // 清除背景色
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetHighlight()
        .run()
    } else {
      // 应用背景色到选中文本
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ color })
        .run()
    }
    
    // 清除 highlight mark 状态，但保持选中
    editor.view.dispatch(
      editor.state.tr.removeStoredMark(editor.schema.marks.highlight)
    )
    
    setActiveCategory(null)
  }

  // 更新浮动菜单位置
  React.useEffect(() => {
    const updatePosition = () => {
      const { state, view } = editor
      const { from, to, empty } = state.selection

      // 清除之前的延迟显示定时器
      if (showDelayTimeoutRef.current) {
        clearTimeout(showDelayTimeoutRef.current)
        showDelayTimeoutRef.current = null
      }

      // 严格规则：只要没有选中文本，就隐藏工具栏
      if (empty || from === to) {
        setIsVisible(false)
        setActiveCategory(null)
        return
      }

      // 额外检查：确保 DOM 中确实有选中的文本
      const domSelection = window.getSelection()
      if (!domSelection || domSelection.rangeCount === 0) {
        setIsVisible(false)
        setActiveCategory(null)
        return
      }

      // 检查选中的文本是否为空（只有空白字符）
      const selectedText = domSelection.toString().trim()
      if (!selectedText || selectedText.length === 0) {
        setIsVisible(false)
        setActiveCategory(null)
        return
      }

      // 检查选中的内容是否在 details/summary 元素内
      try {
        const $from = state.selection.$from
        const $to = state.selection.$to
        
        // 检查选区的父节点是否是 details 或 summary
        let node = $from.parent
        let depth = $from.depth
        
        while (depth > 0) {
          if (node.type.name === 'details' || node.type.name === 'summary') {
            // 如果选中的内容在 details/summary 内，不显示工具栏
            setIsVisible(false)
            setActiveCategory(null)
            return
          }
          depth--
          node = $from.node(depth)
        }
        
        // 同样检查 $to
        node = $to.parent
        depth = $to.depth
        
        while (depth > 0) {
          if (node.type.name === 'details' || node.type.name === 'summary') {
            setIsVisible(false)
            setActiveCategory(null)
            return
          }
          depth--
          node = $to.node(depth)
        }
        
        // 检查选区是否在按钮元素内
        const domSelection = window.getSelection()
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0)
          const container = range.commonAncestorContainer
          const element = container.nodeType === Node.ELEMENT_NODE 
            ? container as Element 
            : container.parentElement
          
          if (element) {
            // 检查是否在按钮内或按钮本身
            const button = element.closest('button[data-similar-question-btn="true"]')
            if (button) {
              setIsVisible(false)
              setActiveCategory(null)
              return
            }
          }
        }
      } catch (error) {
        // 如果检查失败，继续正常流程
        console.error('Error checking selection context:', error)
      }

      // 如果有选中文本，先计算位置，再延迟显示菜单（150ms）
      try {
        // 获取选中文本的位置
        const start = view.coordsAtPos(from)
        const end = view.coordsAtPos(to)

        if (!menuRef.current) {
          // 如果菜单还没渲染，先更新位置再显示
          const centerX = (start.left + end.left) / 2
          const left = centerX - 150 // 使用估算宽度
          const top = start.top - 60 // 使用估算高度
          setPosition({ top, left })
          
          showDelayTimeoutRef.current = setTimeout(() => {
            setIsVisible(true)
          }, 150)
          return
        }

        const menuWidth = menuRef.current.offsetWidth || 300
        const menuHeight = menuRef.current.offsetHeight || 50

        // 计算菜单位置（在选中文本上方居中）
        const centerX = (start.left + end.left) / 2
        const left = centerX - menuWidth / 2
        const top = start.top - menuHeight - 10

        // 先更新位置，再延迟显示
        setPosition({ top, left })
        
        showDelayTimeoutRef.current = setTimeout(() => {
          setIsVisible(true)
        }, 150)
      } catch (error) {
        console.error('Error calculating bubble menu position:', error)
      }
    }

    // 监听编辑器更新
    const handleUpdate = () => {
      // 使用 requestAnimationFrame 确保 DOM 更新完成后再计算位置
      requestAnimationFrame(() => {
        // 再次使用 requestAnimationFrame 确保选区完全稳定
        requestAnimationFrame(updatePosition)
      })
    }

    // 监听滚动事件（滚动时立即更新，不需要延迟）
    const handleScroll = () => {
      // 只有在菜单已经显示时才更新位置
      if (!isVisible) return
      
      const { state, view } = editor
      const { from, to, empty } = state.selection

      if (empty || from === to) {
        setIsVisible(false)
        return
      }

      try {
        const start = view.coordsAtPos(from)
        const end = view.coordsAtPos(to)

        if (!menuRef.current) return

        const menuWidth = menuRef.current.offsetWidth || 300
        const menuHeight = menuRef.current.offsetHeight || 50

        const centerX = (start.left + end.left) / 2
        const left = centerX - menuWidth / 2
        const top = start.top - menuHeight - 10

        setPosition({ top, left })
      } catch (error) {
        console.error('Error calculating bubble menu position:', error)
      }
    }

    // 立即执行一次，检查当前选区
    updatePosition()

    editor.on("selectionUpdate", handleUpdate)
    editor.on("update", handleUpdate)
    editor.on("focus", handleUpdate)
    
    // 监听编辑器容器的滚动
    const editorElement = editor.view.dom.closest('.overflow-y-auto')
    if (editorElement) {
      editorElement.addEventListener('scroll', handleScroll)
    }
    
    // 监听窗口滚动
    window.addEventListener('scroll', handleScroll)

    return () => {
      editor.off("selectionUpdate", handleUpdate)
      editor.off("update", handleUpdate)
      editor.off("focus", handleUpdate)
      
      if (editorElement) {
        editorElement.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [editor, isVisible])

  if (!isVisible) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 flex items-center gap-1 px-2 py-1.5 rounded-xl border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-2xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: position.top === 0 && position.left === 0 ? 0 : 1,
      }}
    >
      {/* 分类工具 */}
      {categories.map((category) => (
        <div
          key={category.name}
          className="relative"
          onMouseEnter={() => handleCategoryMouseEnter(category.name)}
          onMouseLeave={handleCategoryMouseLeave}
        >
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              category.items.some((item) => item.isActive?.())
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--color-text)]"
            )}
          >
            <category.icon className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* 下拉菜单 */}
          {activeCategory === category.name && (
            <div 
              className="absolute top-full left-0 mt-2 w-40 rounded-xl border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden z-50"
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              {category.items.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    item.action()
                    setActiveCategory(null)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 cursor-pointer",
                    "hover:bg-[var(--color-secondary)]/20",
                    item.isActive?.()
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                      : "text-[var(--color-text)]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 分隔线 */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* 颜色选择器（合并字体颜色和背景色） */}
      <div
        className="relative"
        onMouseEnter={() => handleCategoryMouseEnter("color")}
        onMouseLeave={handleCategoryMouseLeave}
      >
        <button
          type="button"
          className={cn(
            "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
            "hover:bg-[var(--color-secondary)]/20",
            "text-[var(--color-text)]"
          )}
          title="颜色"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* 颜色选择下拉菜单 */}
        {activeCategory === "color" && (
          <div 
            className="absolute top-full left-0 mt-2 w-64 rounded-xl border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-2xl p-4 z-50"
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
            {/* 字体颜色 */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">字体颜色</div>
              <div className="grid grid-cols-8 gap-2">
                {textColors.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => applyTextColor(preset.color)}
                    className="group relative w-8 h-8 rounded-lg border-2 border-gray-200 hover:border-[var(--color-primary)] transition-all duration-200 cursor-pointer hover:scale-110 flex items-center justify-center"
                    title={preset.name}
                  >
                    <span 
                      className="text-xl font-bold"
                      style={{ color: preset.textColor }}
                    >
                      A
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 背景颜色 */}
            <div>
              <div className="text-xs text-gray-500 mb-2 font-medium">背景颜色</div>
              <div className="grid grid-cols-8 gap-2">
                {backgroundColors.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => applyHighlight(preset.color)}
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-110",
                      preset.color === 'transparent' 
                        ? "border-gray-300 hover:border-[var(--color-primary)] relative" 
                        : "border-gray-200 hover:border-[var(--color-primary)]"
                    )}
                    style={{ 
                      backgroundColor: preset.color === 'transparent' ? 'white' : preset.bgColor 
                    }}
                    title={preset.name}
                  >
                    {preset.color === 'transparent' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-red-500 rotate-45" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* 链接按钮 */}
      <button
        type="button"
        onClick={addLink}
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
          "hover:bg-[var(--color-secondary)]/20",
          editor.isActive("link")
            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "text-[var(--color-text)]"
        )}
        title="添加链接"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
