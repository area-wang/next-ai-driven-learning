'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-container'
import { Spinner } from '@/components/ui/spinner'

interface CornellNoteEditorProps {
  contentId: string
  initialNote?: {
    id?: string
    mainNotes: string
    cues: string | null
    summary: string | null
  }
  onSave?: (note: any) => void
}

export function CornellNoteEditor({
  contentId,
  initialNote,
  onSave,
}: CornellNoteEditorProps) {
  const [noteId, setNoteId] = useState(initialNote?.id)
  const [mainNotes, setMainNotes] = useState(initialNote?.mainNotes || '')
  const [cues, setCues] = useState(initialNote?.cues || '')
  const [summary, setSummary] = useState(initialNote?.summary || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (initialNote) {
      setNoteId(initialNote.id)
      setMainNotes(initialNote.mainNotes)
      setCues(initialNote.cues || '')
      setSummary(initialNote.summary || '')
    }
  }, [initialNote])

  const handleGenerate = async () => {
    if (!mainNotes.trim()) {
      toast.warning('请先填写主笔记区内容')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/cornell/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainNotes }),
      })

      const result = await response.json() as {
        success: boolean
        data?: { cues: string; summary: string }
        error?: string
      }

      if (result.success && result.data) {
        setCues(result.data.cues)
        setSummary(result.data.summary)
        toast.success('AI 生成成功')
      } else {
        toast.error(result.error || '生成失败')
      }
    } catch (error) {
      console.error('生成失败:', error)
      toast.error('生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!mainNotes.trim()) {
      toast.warning('请填写主笔记区内容')
      return
    }

    setIsSubmitting(true)

    try {
      const url = noteId ? '/api/cornell/notes' : '/api/cornell/notes'
      const method = noteId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          contentId,
          mainNotes: mainNotes.trim(),
          cues: cues.trim() || null,
          summary: summary.trim() || null,
        }),
      })

      const result = await response.json() as {
        success: boolean
        data?: any
        error?: string
      }

      if (result.success && result.data) {
        setNoteId(result.data.id)
        toast.success(noteId ? '笔记已更新' : '笔记已保存')
        onSave?.(result.data)
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-teal-600">
            康奈尔笔记法
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating || !mainNotes.trim()}
            >
              {isGenerating ? (
                <>
                  <Spinner className="mr-2" />
                  生成中...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  AI 生成线索和总结
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存笔记'}
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          康奈尔笔记法将笔记分为三个区域：线索区（关键词和问题）、主笔记区（详细内容）、总结区（核心要点）
        </p>

        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 线索区 */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium mb-2">
              线索区
              <span className="text-xs text-gray-500 ml-2">
                (关键词、问题)
              </span>
            </label>
            <Textarea
              value={cues}
              onChange={(e) => setCues(e.target.value)}
              placeholder="关键词1、关键词2&#10;问题1？&#10;问题2？"
              rows={20}
              className="w-full resize-none"
            />
          </div>

          {/* 主笔记区 */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium mb-2">
              主笔记区
              <span className="text-xs text-gray-500 ml-2">
                (详细内容)
              </span>
            </label>
            <Textarea
              value={mainNotes}
              onChange={(e) => setMainNotes(e.target.value)}
              placeholder="记录详细的学习内容、要点、例子等..."
              rows={20}
              className="w-full resize-none"
            />
          </div>
        </div>

        {/* 总结区 */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            总结区
            <span className="text-xs text-gray-500 ml-2">
              (核心要点)
            </span>
          </label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="用2-3句话总结本次学习的核心内容..."
            rows={3}
            className="w-full"
          />
        </div>
      </Card>

      {/* 使用提示 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="text-sm font-semibold mb-2 text-blue-800">
          💡 使用提示
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 先在主笔记区记录详细内容</li>
          <li>• 点击"AI 生成"按钮自动生成线索和总结</li>
          <li>• 也可以手动编辑线索区和总结区</li>
          <li>• 线索区用于快速回顾，总结区用于整体把握</li>
        </ul>
      </Card>
    </div>
  )
}
