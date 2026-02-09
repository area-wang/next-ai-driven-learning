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
  saveOnBlur?: boolean // 失焦时是否立即保存
  warnOnUnload?: boolean // 页面卸载时是否提示未保存内容
}

export function useAutoSave(
  title: string,
  content: string,
  options: AutoSaveOptions
) {
  const { delay = 1000, onSave, onSuccess, onError, saveOnBlur = true, warnOnUnload = true } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const lastSavedRef = useRef({ title, content })
  const hasUnsavedChangesRef = useRef(false) // 标记是否有未保存的更改

  const save = useCallback(async () => {
    if (isSavingRef.current) return

    // 检查内容是否有变化
    if (
      lastSavedRef.current.title === title &&
      lastSavedRef.current.content === content
    ) {
      hasUnsavedChangesRef.current = false
      return
    }

    try {
      isSavingRef.current = true
      await onSave({ title, content })
      lastSavedRef.current = { title, content }
      hasUnsavedChangesRef.current = false // 保存成功后清除标记
      onSuccess?.()
    } catch (error) {
      console.error('自动保存失败:', error)
      onError?.(error instanceof Error ? error : new Error('保存失败'))
    } finally {
      isSavingRef.current = false
    }
  }, [title, content, onSave, onSuccess, onError])

  // 防抖保存
  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 标记有未保存的更改
    if (
      lastSavedRef.current.title !== title ||
      lastSavedRef.current.content !== content
    ) {
      hasUnsavedChangesRef.current = true
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

  // 失焦时立即保存
  useEffect(() => {
    if (!saveOnBlur) return

    const handleVisibilityChange = () => {
      // 页面失去焦点时立即保存
      if (document.hidden) {
        // 清除防抖定时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        // 立即保存
        save()
      }
    }

    const handleBlur = () => {
      // 窗口失去焦点时立即保存
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      save()
    }

    // 监听页面可见性变化（切换标签页、最小化窗口等）
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // 监听窗口失焦（Alt+Tab、点击其他窗口等）
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [save, saveOnBlur])

  // 页面卸载时提示并保存
  useEffect(() => {
    if (!warnOnUnload) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 如果有未保存的更改或正在保存中
      if (hasUnsavedChangesRef.current || isSavingRef.current) {
        // 立即尝试保存（使用 sendBeacon 或 keepalive fetch）
        const data = JSON.stringify({ title, content })
        
        // 尝试使用 sendBeacon（最可靠的方式）
        if (navigator.sendBeacon && (window as any).__saveEndpoint) {
          const blob = new Blob([data], { type: 'application/json' })
          navigator.sendBeacon((window as any).__saveEndpoint, blob)
        } else {
          // 降级到 keepalive fetch
          if ((window as any).__saveEndpoint) {
            fetch((window as any).__saveEndpoint, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: data,
              keepalive: true, // 保持连接直到请求完成
            }).catch(console.error)
          }
        }
        
        // 提示用户（无论用户选择什么，保存请求都已发送）
        e.preventDefault()
        e.returnValue = '正在保存您的更改...'
        return '正在保存您的更改...'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [title, content, warnOnUnload])

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
