'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast-container'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { FileText, Sparkles, Save, Eye, HelpCircle } from 'lucide-react'

interface CornellNote {
  id: string
  mainNotes: string
  cues: string | null
  summary: string | null
  createdAt: number
  updatedAt: number
}

interface CornellNoteDialogProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  selectedModelId?: string
}

export function CornellNoteDialog({
  isOpen,
  onClose,
  contentId,
  selectedModelId,
}: CornellNoteDialogProps) {
  const [mainNotes, setMainNotes] = useState('')
  const [cues, setCues] = useState('')
  const [summary, setSummary] = useState('')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<string | null>(null)
  const toast = useToast()

  // 加载已有的笔记
  useEffect(() => {
    if (isOpen && contentId) {
      loadNote()
    }
  }, [isOpen, contentId])

  const loadNote = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cornell/notes?contentId=${contentId}`)
      const data = await response.json() as {
        success: boolean
        data?: CornellNote[]
        error?: string
      }

      if (data.success && data.data && data.data.length > 0) {
        const note = data.data[0]
        setNoteId(note.id)
        setMainNotes(note.mainNotes)
        setCues(note.cues || '')
        setSummary(note.summary || '')
      } else {
        // 没有笔记，清空表单
        setNoteId(null)
        setMainNotes('')
        setCues('')
        setSummary('')
      }
    } catch (error) {
      console.error('加载笔记失败:', error)
      toast.error('加载笔记失败')
    } finally {
      setIsLoading(false)
    }
  }

  // AI 生成线索和总结
  const handleGenerate = async () => {
    if (!mainNotes.trim()) {
      toast.warning('请先填写主笔记区内容')
      return
    }

    if (!selectedModelId) {
      toast.warning('请先在页面顶部选择 AI 模型')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/cornell/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainNotes,
          modelId: selectedModelId,
        }),
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

  // AI 评估笔记质量
  const handleEvaluate = async () => {
    if (!mainNotes.trim()) {
      toast.warning('请先填写主笔记区内容')
      return
    }

    if (!selectedModelId) {
      toast.warning('请先在页面顶部选择 AI 模型')
      return
    }

    setIsEvaluating(true)
    setEvaluation(null)
    try {
      const response = await fetch('/api/cornell/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainNotes,
          cues: cues.trim() || null,
          summary: summary.trim() || null,
          modelId: selectedModelId,
        }),
      })

      const result = await response.json() as {
        success: boolean
        data?: { evaluation: string; score: number }
        error?: string
      }

      if (result.success && result.data) {
        setEvaluation(result.data.evaluation)
        toast.success('评估完成')
      } else {
        toast.error(result.error || '评估失败')
      }
    } catch (error) {
      console.error('评估失败:', error)
      toast.error('评估失败')
    } finally {
      setIsEvaluating(false)
    }
  }

  // 保存笔记
  const handleSave = async () => {
    if (!mainNotes.trim()) {
      toast.warning('请填写主笔记区内容')
      return
    }

    setIsSaving(true)
    try {
      const url = '/api/cornell/notes'
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
        data?: CornellNote
        error?: string
      }

      if (result.success && result.data) {
        setNoteId(result.data.id)
        toast.success(noteId ? '笔记已更新' : '笔记已保存')
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} side="right">
      <DrawerContent className="w-full max-w-4xl">
        <DrawerHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  康奈尔笔记法
                </h2>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-80">
                    <div className="text-xs space-y-1.5">
                      <p className="font-semibold mb-2">康奈尔笔记法使用流程：</p>
                      <p>• <strong>学习时</strong>：在主笔记区记录详细内容</p>
                      <p>• <strong>学习后</strong>：在线索区写下关键词和问题</p>
                      <p>• <strong>整理后</strong>：在总结区概括核心内容</p>
                      <p>• <strong>复习时</strong>：用线索区自测回忆</p>
                      <p className="mt-2 opacity-80">💡 可使用 AI 辅助生成，但建议自己思考后再参考</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                三栏笔记：线索区 + 主笔记区 + 总结区
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !mainNotes.trim()}
              variant="outline"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 生成线索和总结
                </>
              )}
            </Button>
            <Button
              onClick={handleEvaluate}
              disabled={isEvaluating || !mainNotes.trim()}
              variant="outline"
              size="sm"
            >
              {isEvaluating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  评估中...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  AI 评估笔记
                </>
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !mainNotes.trim()}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存笔记
                </>
              )}
            </Button>
          </div>
        </DrawerHeader>

        <DrawerBody className="p-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" />
              <p className="text-gray-500 mt-4">加载中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 三栏布局 */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {/* 线索区 */}
                <div className="lg:col-span-1">
                  <label className="block text-xs font-medium mb-1.5 text-gray-700">
                    线索区
                    <span className="text-xs text-gray-500 ml-1">
                      (关键词、问题)
                    </span>
                  </label>
                  <Textarea
                    value={cues}
                    onChange={(e) => setCues(e.target.value)}
                    placeholder="关键词1、关键词2&#10;问题1？&#10;问题2？"
                    rows={12}
                    className="w-full resize-none text-sm"
                  />
                </div>

                {/* 主笔记区 */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium mb-1.5 text-gray-700">
                    主笔记区
                    <span className="text-xs text-gray-500 ml-1">
                      (详细内容)
                    </span>
                  </label>
                  <Textarea
                    value={mainNotes}
                    onChange={(e) => setMainNotes(e.target.value)}
                    placeholder="记录详细的学习内容、要点、例子等..."
                    rows={12}
                    className="w-full resize-none text-sm"
                  />
                </div>
              </div>

              {/* 总结区 */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-700">
                  总结区
                  <span className="text-xs text-gray-500 ml-1">
                    (核心要点)
                  </span>
                </label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="用2-3句话总结本次学习的核心内容..."
                  rows={2}
                  className="w-full text-sm"
                />
              </div>

              {/* AI 评估结果 */}
              {evaluation && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
                  <h4 className="text-xs font-semibold mb-1.5 text-purple-800 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    AI 评估结果
                  </h4>
                  <div className="text-xs text-purple-700 whitespace-pre-wrap">
                    {evaluation}
                  </div>
                </div>
              )}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button onClick={onClose} variant="outline">
            关闭
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
