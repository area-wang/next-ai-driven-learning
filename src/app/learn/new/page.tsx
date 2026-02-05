"use client"

import * as React from "react"
import { ArrowLeft, Sparkles, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { ConfiguredModelSelector } from "@/components/ai/configured-model-selector"
import { useToast } from "@/components/ui/toast-container"
import { OutlinePreviewDialog } from "@/components/editor/outline-preview-dialog"

const levels = [
  { value: "beginner", label: "入门", description: "零基础开始学习" },
  { value: "intermediate", label: "中级", description: "有一定基础" },
  { value: "advanced", label: "高级", description: "深入学习高级内容" },
]

export default function NewLearningPlanPage() {
  const toast = useToast()
  const [topic, setTopic] = React.useState("")
  const [goal, setGoal] = React.useState("")
  const [additionalContext, setAdditionalContext] = React.useState("") // 新增：补充描述
  const [level, setLevel] = React.useState("beginner")
  const [depth, setDepth] = React.useState<number>(2) // 新增：大纲层级，默认2级
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [selectedModelId, setSelectedModelId] = React.useState<string | undefined>(undefined)
  const [enableWebSearch, setEnableWebSearch] = React.useState(false)
  
  // 新增：大纲预览相关状态
  const [isOutlinePreviewOpen, setIsOutlinePreviewOpen] = React.useState(false)
  const [previewOutlines, setPreviewOutlines] = React.useState<any[]>([])
  const [isRegeneratingOutline, setIsRegeneratingOutline] = React.useState(false)
  const [generatedPlanId, setGeneratedPlanId] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedModelId) {
      toast.warning('请选择一个 AI 模型')
      return
    }

    setIsGenerating(true)

    try {
      const requestBody = {
        topic,
        goal: goal || undefined,
        level,
        additionalContext: additionalContext || undefined, // 新增：传递补充描述
        modelId: selectedModelId,
        depth, // 新增：传递层级深度
        enableWebSearch, // 传递联网搜索开关
      }

      console.log('[Form] Request body:', requestBody)

      // 调用 API 生成大纲
      const response = await fetch('/api/learning-outline/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        let errorMessage = 'AI 生成失败'
        try {
          const error = await response.json() as { error?: string; details?: string }
          errorMessage = error.error || errorMessage
          if (error.details) {
            console.error('[Form] Error details:', error.details)
          }
        } catch (e) {
          console.error('[Form] Failed to parse error response:', e)
          errorMessage = `服务器错误 (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json() as { planId: string; outlines: any[]; saved: boolean }
      
      if (data.saved && data.planId && data.outlines) {
        // 保存 planId 和大纲数据
        setGeneratedPlanId(data.planId)
        setPreviewOutlines(data.outlines)
        
        // 打开预览对话框
        setIsOutlinePreviewOpen(true)
        setIsGenerating(false)
        
        toast.success('学习大纲生成成功，请预览确认')
      } else {
        throw new Error('生成失败：数据不完整')
      }
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'AI 生成失败')
      setIsGenerating(false)
    }
  }

  // 新增：接受大纲并跳转
  const handleAcceptOutline = () => {
    if (!generatedPlanId) {
      toast.error('计划ID丢失')
      return
    }

    toast.success('学习计划已创建！即将跳转...')
    
    // 关闭预览对话框
    setIsOutlinePreviewOpen(false)
    
    // 延迟跳转
    setTimeout(() => {
      window.location.href = '/learn'
    }, 500)
  }

  // 新增：重新生成大纲
  const handleRegenerateOutline = async (feedback: string) => {
    if (!feedback.trim()) {
      return
    }

    setIsRegeneratingOutline(true)
    
    try {
      const requestBody = {
        planId: generatedPlanId, // 使用已创建的计划ID
        topic,
        goal: goal || undefined,
        level,
        additionalContext: additionalContext 
          ? `${additionalContext}\n\n用户反馈：${feedback}`
          : `用户反馈：${feedback}`,
        modelId: selectedModelId,
        depth, // 新增：传递层级深度
        enableWebSearch, // 传递联网搜索开关
      }

      console.log('[Regenerate] Request body:', requestBody)

      const response = await fetch('/api/learning-outline/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || '重新生成失败')
      }

      const data = await response.json() as { outlines: any[] }
      
      // 更新预览大纲
      setPreviewOutlines(data.outlines)
      
      toast.success('大纲已重新生成')
    } catch (error) {
      console.error('Regenerate failed:', error)
      toast.error(error instanceof Error ? error.message : '重新生成失败')
    } finally {
      setIsRegeneratingOutline(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        返回学习计划
      </Link>

      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          创建新的学习计划
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          告诉AI您想学什么，它会为您生成个性化的学习计划
        </p>
      </div>

      {/* 表单 */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
            AI学习计划生成器
          </CardTitle>
          <CardDescription>
            填写以下信息，AI将为您生成完整的学习计划、大纲和内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI 模型选择 */}
            <ConfiguredModelSelector
              value={selectedModelId}
              onChange={setSelectedModelId}
              label="AI 模型"
            />

            {/* 学习主题 */}
            <div className="space-y-2">
              <Label htmlFor="topic" required>
                学习主题
              </Label>
              <div className="relative">
                <Input
                  id="topic"
                  placeholder="例如：JavaScript、机器学习、产品设计..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* 学习目标 */}
            <div className="space-y-2">
              <Label htmlFor="goal">
                学习目标（可选）
              </Label>
              <div className="relative">
                <Textarea
                  id="goal"
                  placeholder="描述您想要达成的目标，例如：能够独立开发一个完整的Web应用..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* 新增：补充描述 */}
            <div className="space-y-2">
              <Label htmlFor="additionalContext">
                补充描述（可选）
              </Label>
              <div className="relative">
                <Textarea
                  id="additionalContext"
                  placeholder="例如：需要循序渐进，从基础到进阶；包含实战项目案例；重点讲解核心概念..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="min-h-[80px]"
                  disabled={isGenerating}
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                提供更多细节可以帮助 AI 生成更符合您需求的学习计划
              </p>
            </div>

            {/* 难度级别 */}
            <div className="space-y-2">
              <Label>难度级别</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {levels.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    disabled={isGenerating}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      level === l.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-[var(--color-text)]">
                      {l.label}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {l.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 新增：大纲层级选择 */}
            <div className="space-y-2">
              <Label>大纲层级</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 1, label: '1级', description: '只生成主章节' },
                  { value: 2, label: '2级', description: '章节+小节' },
                  { value: 3, label: '3级', description: '章节+小节+细节' },
                ].map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDepth(d.value)}
                    disabled={isGenerating}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      depth === d.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-[var(--color-text)]">
                      {d.label}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {d.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 预计时间提示 */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--color-secondary)]/20">
              <Clock className="w-5 h-5 text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                AI将根据您的目标和级别，自动规划合理的学习时间
              </p>
            </div>

            {/* 联网搜索开关 */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={enableWebSearch}
                  onChange={(e) => setEnableWebSearch(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <span>🌐 使用联网搜索</span>
              </label>
              <span className="text-xs text-slate-500">搜索最新信息</span>
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              variant="cta"
              size="lg"
              className="w-full"
              disabled={!topic || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" className="mr-2 text-white" />
                  AI正在生成学习计划...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  生成学习计划
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className="text-center text-sm text-[var(--color-text-muted)]">
        <p>AI将为您生成：学习计划 → 详细大纲 → 知识内容 → 测试题目</p>
      </div>

      {/* 新增：大纲预览对话框 */}
      {isOutlinePreviewOpen && (
        <OutlinePreviewDialog
          isOpen={isOutlinePreviewOpen}
          onClose={() => {
            setIsOutlinePreviewOpen(false)
            setPreviewOutlines([])
            setGeneratedPlanId(null)
          }}
          onAccept={handleAcceptOutline}
          onRegenerate={handleRegenerateOutline}
          outlines={previewOutlines}
          isRegenerating={isRegeneratingOutline}
        />
      )}
    </div>
  )
}
