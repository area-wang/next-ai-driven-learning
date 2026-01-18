/**
 * 表格菜单组件
 * 提供表格操作：添加行/列、删除行/列
 * 固定显示在表格上方，hover 时展开完整工具栏
 */

"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"
import {
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Table,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TableMenuProps {
  editor: Editor
}

export function TableMenu({ editor }: TableMenuProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)

  // 检查是否在表格中
  React.useEffect(() => {
    const updateVisibility = () => {
      const isInTable = editor.isActive("table")
      setIsVisible(isInTable)

      if (isInTable) {
        try {
          // 查找表格元素
          const { view } = editor
          const { from } = view.state.selection
          
          // 获取表格的 DOM 节点
          const tableNode = view.domAtPos(from).node
          const tableElement = tableNode.nodeType === 1 
            ? (tableNode as HTMLElement).closest('table')
            : (tableNode.parentElement as HTMLElement)?.closest('table')

          if (tableElement) {
            const rect = tableElement.getBoundingClientRect()
            const editorContainer = view.dom.closest('.overflow-y-auto')
            const containerRect = editorContainer?.getBoundingClientRect()
            
            // 计算表格相对于视口的位置
            const top = rect.top - 60 // 表格上方 60px
            const left = rect.left
            
            setPosition({ top, left })
          }
        } catch (error) {
          console.error('Error calculating table menu position:', error)
        }
      }
    }

    // 监听滚动事件
    const handleScroll = () => {
      requestAnimationFrame(updateVisibility)
    }

    editor.on("selectionUpdate", updateVisibility)
    editor.on("update", updateVisibility)
    
    // 监听编辑器容器的滚动
    const editorElement = editor.view.dom.closest('.overflow-y-auto')
    if (editorElement) {
      editorElement.addEventListener('scroll', handleScroll)
    }
    
    // 监听窗口滚动
    window.addEventListener('scroll', handleScroll)

    return () => {
      editor.off("selectionUpdate", updateVisibility)
      editor.off("update", updateVisibility)
      
      if (editorElement) {
        editorElement.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [editor])

  if (!isVisible) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-40"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: position.top === 0 && position.left === 0 ? 0 : 1,
        transition: 'opacity 150ms',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* 收起状态：只显示表格图标 */}
      {!isExpanded && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-2xl cursor-pointer">
          <Table className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-xs font-medium text-gray-500">表格</span>
        </div>
      )}

      {/* 展开状态：显示完整工具栏 */}
      {isExpanded && (
        <div className="flex items-center gap-1 px-3 py-2 rounded-xl border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-2xl">
          <Table className="w-4 h-4 text-[var(--color-primary)] mr-1" />
          <span className="text-xs font-medium text-gray-500 mr-2">表格</span>
          
          {/* 添加行 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              "text-[var(--color-text)]"
            )}
            title="在上方添加行"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              "text-[var(--color-text)]"
            )}
            title="在下方添加行"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* 分隔线 */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* 添加列 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              "text-[var(--color-text)]"
            )}
            title="在左侧添加列"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              "text-[var(--color-text)]"
            )}
            title="在右侧添加列"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* 分隔线 */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* 删除行 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className={cn(
              "px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-red-100 text-red-600 text-xs font-medium"
            )}
            title="删除当前行"
          >
            删除行
          </button>

          {/* 删除列 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className={cn(
              "px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-red-100 text-red-600 text-xs font-medium"
            )}
            title="删除当前列"
          >
            删除列
          </button>

          {/* 分隔线 */}
          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* 删除表格 */}
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={cn(
              "px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-red-100 text-red-600 text-xs font-medium"
            )}
            title="删除表格"
          >
            删除表格
          </button>
        </div>
      )}
    </div>
  )
}
