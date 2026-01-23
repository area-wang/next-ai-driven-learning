/**
 * 文档树组件
 * 左侧显示文档的树形结构，支持父子嵌套
 */

"use client"

import * as React from "react"
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface DocumentNode {
  id: string
  title: string
  children?: DocumentNode[]
  isExpanded?: boolean
  isTestDocument?: boolean  // 标记是否为测试题文档
}

interface DocumentTreeProps {
  documents: DocumentNode[]
  activeDocId?: string
  onDocumentSelect: (docId: string) => void
  onDocumentAdd?: (parentId?: string) => void
  onDocumentDelete?: (docId: string) => void
  onAIGenerate?: (parentId: string) => void
  className?: string
}

interface TreeNodeProps {
  node: DocumentNode
  level: number
  activeDocId?: string
  highlightedDocId?: string  // 新增：实际要高亮的文档ID
  onSelect: (docId: string) => void
  onToggle: (docId: string) => void
  onAdd?: (parentId: string) => void
  onDelete?: (docId: string) => void
  onAIGenerate?: (parentId: string) => void
}

function TreeNode({
  node,
  level,
  activeDocId,
  highlightedDocId,
  onSelect,
  onToggle,
  onAdd,
  onDelete,
  onAIGenerate,
}: TreeNodeProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const hasChildren = node.children && node.children.length > 0
  const isActive = node.id === highlightedDocId  // 使用 highlightedDocId 而不是 activeDocId

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
          isActive
            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "hover:bg-gray-100 text-[var(--color-text)]"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect(node.id)}
      >
        {/* 展开/收起按钮 */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
            className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 transition-colors"
            aria-label={node.isExpanded ? "收起" : "展开"}
          >
            {node.isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* 文档图标 */}
        <FileText className="w-4 h-4 flex-shrink-0" />

        {/* 文档标题 */}
        <span className="flex-1 text-sm truncate">
          {node.title || "无标题"}
        </span>

        {/* 操作按钮（悬停时显示） */}
        {isHovered && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onAdd && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd(node.id)
                }}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 transition-colors"
                aria-label="添加子文档"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            {onAIGenerate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onAIGenerate(node.id)
                }}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-purple-100 text-purple-600 transition-colors"
                aria-label="AI 生成子文档"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(node.id)
                }}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-red-100 text-red-600 transition-colors"
                aria-label="删除文档"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 子文档 */}
      {hasChildren && node.isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              activeDocId={activeDocId}
              highlightedDocId={highlightedDocId}
              onSelect={onSelect}
              onToggle={onToggle}
              onAdd={onAdd}
              onDelete={onDelete}
              onAIGenerate={onAIGenerate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DocumentTree({
  documents,
  activeDocId,
  onDocumentSelect,
  onDocumentAdd,
  onDocumentDelete,
  onAIGenerate,
  className,
}: DocumentTreeProps) {
  const [expandedDocs, setExpandedDocs] = React.useState<Set<string>>(
    new Set()
  )
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const handleToggle = React.useCallback((docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(docId)) {
        next.delete(docId)
      } else {
        next.add(docId)
      }
      return next
    })
  }, [])

  // 计算应该高亮的文档ID
  // 如果当前文档不可见（任何祖先节点收起），则高亮最近的可见祖先节点
  const highlightedDocId = React.useMemo(() => {
    if (!activeDocId) return undefined

    // 查找文档路径（从根到目标文档的所有节点ID）
    const findPath = (nodes: DocumentNode[], targetId: string, path: string[] = []): string[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, node.id]
        
        if (node.id === targetId) {
          return currentPath
        }
        
        if (node.children) {
          const result = findPath(node.children, targetId, currentPath)
          if (result) return result
        }
      }
      return null
    }

    const path = findPath(documents, activeDocId)
    if (!path) return activeDocId

    // 从后往前查找第一个可见的节点
    // 一个节点可见的条件是：它的所有祖先节点都是展开的
    for (let i = path.length - 1; i >= 0; i--) {
      const nodeId = path[i]
      
      // 检查该节点是否可见（所有祖先都展开）
      let isVisible = true
      for (let j = 0; j < i; j++) {
        if (!expandedDocs.has(path[j])) {
          isVisible = false
          break
        }
      }
      
      if (isVisible) {
        // 找到第一个可见的节点
        return nodeId
      }
    }

    // 如果没有找到可见节点（理论上不应该发生），返回第一个节点
    return path[0]
  }, [activeDocId, documents, expandedDocs])

  const documentsWithExpanded = React.useMemo(() => {
    const addExpanded = (nodes: DocumentNode[]): DocumentNode[] => {
      return nodes.map((node) => ({
        ...node,
        isExpanded: expandedDocs.has(node.id),
        children: node.children ? addExpanded(node.children) : undefined,
      }))
    }
    return addExpanded(documents)
  }, [documents, expandedDocs])

  return (
    <div
      className={cn(
        "border-r border-gray-200 bg-white/50 backdrop-blur-sm flex flex-col transition-all duration-300",
        isCollapsed ? "w-12" : "w-64",
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {!isCollapsed && (
          <>
            <h2 className="font-semibold text-[var(--color-text)]">文档</h2>
            {onDocumentAdd && (
              <button
                type="button"
                onClick={() => onDocumentAdd()}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="新建文档"
              >
                <Plus className="w-4 h-4 text-[var(--color-primary)]" />
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer",
            isCollapsed && "mx-auto"
          )}
          aria-label={isCollapsed ? "展开文档树" : "收起文档树"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[var(--color-text)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text)]" />
          )}
        </button>
      </div>

      {/* 文档树 */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          {documentsWithExpanded.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-3">还没有文档</p>
              {onDocumentAdd && (
                <button
                  type="button"
                  onClick={() => onDocumentAdd()}
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer"
                >
                  创建第一个文档
                </button>
              )}
            </div>
          ) : (
            documentsWithExpanded.map((doc) => (
              <TreeNode
                key={doc.id}
                node={doc}
                level={0}
                activeDocId={activeDocId}
                highlightedDocId={highlightedDocId}
                onSelect={onDocumentSelect}
                onToggle={handleToggle}
                onAdd={onDocumentAdd}
                onDelete={onDocumentDelete}
                onAIGenerate={onAIGenerate}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
