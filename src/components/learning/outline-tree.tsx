/**
 * 学习大纲树形组件
 */

'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Clock, BookOpen, CheckCircle2 } from 'lucide-react'

export interface OutlineItem {
  id?: string
  title: string
  description: string
  estimatedTime: string
  prerequisites?: string[]
  children?: OutlineItem[]
  completed?: boolean
}

interface OutlineTreeProps {
  items: OutlineItem[]
  onItemClick?: (item: OutlineItem) => void
}

export function OutlineTree({ items, onItemClick }: OutlineTreeProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <OutlineTreeItem
          key={item.id || index}
          item={item}
          level={0}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  )
}

interface OutlineTreeItemProps {
  item: OutlineItem
  level: number
  onItemClick?: (item: OutlineItem) => void
}

function OutlineTreeItem({ item, level, onItemClick }: OutlineTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = item.children && item.children.length > 0

  const paddingLeft = level * 24

  return (
    <div>
      <div
        className={`
          flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700
          hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
          ${onItemClick ? 'cursor-pointer' : ''}
        `}
        style={{ marginLeft: `${paddingLeft}px` }}
        onClick={() => onItemClick?.(item)}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="flex-shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            )}
          </button>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
              ) : (
                <BookOpen className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
              <h4 className="font-medium text-slate-900 dark:text-white truncate">
                {item.title}
              </h4>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 flex-shrink-0">
              <Clock className="w-4 h-4" />
              <span>{item.estimatedTime}</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {item.description}
          </p>

          {item.prerequisites && item.prerequisites.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">前置：</span>
              {item.prerequisites.map((prereq, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                >
                  {prereq}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 子项 */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {item.children!.map((child, index) => (
            <OutlineTreeItem
              key={child.id || index}
              item={child}
              level={level + 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
