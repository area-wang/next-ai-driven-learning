/**
 * 命令列表组件
 * 显示斜杠命令的下拉菜单
 */

"use client"

import * as React from "react"
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Minus,
  Image as ImageIcon,
  Video,
  Table,
  Sigma,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SlashCommandItem } from "./slash-command"

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface CommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  H1: Heading1,
  H2: Heading2,
  H3: Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Minus,
  Image: ImageIcon,
  Video,
  Table,
  Sigma,
}

export const CommandList = React.forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])

    const selectItem = React.useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

    // 滚动到选中的项
    React.useEffect(() => {
      const selectedElement = itemRefs.current[selectedIndex]
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      }
    }, [selectedIndex])

    React.useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          event.preventDefault()
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }

        if (event.key === "ArrowDown") {
          event.preventDefault()
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }

        if (event.key === "Enter") {
          event.preventDefault()
          selectItem(selectedIndex)
          return true
        }

        return false
      },
    }))

    React.useEffect(() => {
      setSelectedIndex(0)
      itemRefs.current = []
    }, [items])

    if (items.length === 0) {
      return (
        <div className="px-4 py-3 text-sm text-gray-500">
          没有找到匹配的命令
        </div>
      )
    }

    return (
      <div className="w-72 rounded-xl border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="max-h-80 overflow-y-auto p-2">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon]
            return (
              <button
                key={index}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                type="button"
                onClick={() => selectItem(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer",
                  index === selectedIndex
                    ? "bg-[var(--color-primary)] text-white shadow-lg"
                    : "hover:bg-[var(--color-secondary)]/20 text-[var(--color-text)]"
                )}
              >
                {Icon && (
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                      index === selectedIndex
                        ? "bg-white/20"
                        : "bg-[var(--color-secondary)]/20"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        index === selectedIndex
                          ? "text-white"
                          : "text-[var(--color-primary)]"
                      )}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-medium text-sm",
                      index === selectedIndex ? "text-white" : "text-[var(--color-text)]"
                    )}
                  >
                    {item.title}
                  </div>
                  <div
                    className={cn(
                      "text-xs truncate",
                      index === selectedIndex
                        ? "text-white/80"
                        : "text-[var(--color-text)]/60"
                    )}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            ↑↓ 选择 · Enter 确认 · Esc 关闭
          </p>
        </div>
      </div>
    )
  }
)

CommandList.displayName = "CommandList"
