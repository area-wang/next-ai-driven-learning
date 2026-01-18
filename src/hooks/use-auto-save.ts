/**
 * 自动保存 Hook
 * 使用防抖机制自动保存编辑器内容
 */

import { useEffect, useRef, useCallback } from 'react'

export interface AutoSaveOptions {
  delay?: number // 防抖延迟（毫秒）
  onSave: (data: { title: string; content: string }) => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useAutoSave(
  title: string,
  content: string,
  options: AutoSaveOptions
) {
  const { delay = 2000, onSave, onSuccess, onError } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const lastSavedRef = useRef({ title, content })

  const save = useCallback(async () => {
    if (isSavingRef.current) return

    // 检查内容是否有变化
    if (
      lastSavedRef.current.title === title &&
      lastSavedRef.current.content === content
    ) {
      return
    }

    try {
      isSavingRef.current = true
      await onSave({ title, content })
      lastSavedRef.current = { title, content }
      onSuccess?.()
    } catch (error) {
      console.error('自动保存失败:', error)
      onError?.(error instanceof Error ? error : new Error('保存失败'))
    } finally {
      isSavingRef.current = false
    }
  }, [title, content, onSave, onSuccess, onError])

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      save()
    }, delay)

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [title, content, delay, save])

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      if (
        lastSavedRef.current.title !== title ||
        lastSavedRef.current.content !== content
      ) {
        // 同步保存（不等待）
        onSave({ title, content }).catch(console.error)
      }
    }
  }, [])

  return { save }
}
