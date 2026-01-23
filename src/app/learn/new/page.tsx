"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, BookOpen, Target, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { ConfiguredModelSelector } from "@/components/ai/configured-model-selector"
import { getModelConfig } from "@/lib/ai/config"
import { useToast } from "@/components/ui/toast-container"

const levels = [
  { value: "beginner", label: "入门", description: "零基础开始学习" },
  { value: "intermediate", label: "中级", description: "有一定基础" },
  { value: "advanced", label: "高级", description: "深入学习高级内容" },
]

export default function NewLearningPlanPage() {
  const router = useRouter()
  const toast = useToast()
  const [topic, setTopic] = React.useState("")
  const [goal, setGoal] = React.useState("")
  const [level, setLevel] = React.useState("beginner")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [selectedModelId, setSelectedModelId] = React.useState<string | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedModelId) {
      toast.warning('请选择一个 AI 模型')
      return
    }

    setIsGenerating(true)

    try {
      // 获取选中模型的配置
      const modelConfig = getModelConfig(selectedModelId)
      if (!modelConfig) {
        throw new Error('模型配置不存在')
      }

      console.log('[Form] Using model:', {
        id: modelConfig.id,
        name: modelConfig.name,
        model: modelConfig.model,
      })

      const requestBody = {
        topic,
        goal: goal || undefined,
        level,
        modelId: selectedModelId, // 传递模型ID
      }

      console.log('[Form] Request body:', requestBody)

      // 调用 AI 生成 API
      const { fetchWithModel } = await import('@/lib/ai/fetch-with-model')
      const response = await fetchWithModel(
        '/api/learning-outline/generate',
        selectedModelId,
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        let errorMessage = 'AI 生成失败'
        try {
          const error = await response.json() as { error?: string }
          errorMessage = error.error || errorMessage
          console.error('[Form] API error:', error)
        } catch (e) {
          console.error('[Form] Failed to parse error response:', e)
          errorMessage = `服务器错误 (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json() as { planId: string; saved: boolean }
      
      if (data.saved && data.planId) {
        // 生成成功，显示成功消息
        toast.success('学习计划生成成功!即将跳转到学习计划列表...')
        // 延迟跳转,避免模块加载问题
        setTimeout(() => {
          window.location.href = '/learn'
        }, 500)
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'AI 生成失败')
      setIsGenerating(false)
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
                <BookOpen className="absolute left-3 top-3 w-5 h-5 text-[var(--color-text-muted)]" />
                <Input
                  id="topic"
                  placeholder="例如：JavaScript、机器学习、产品设计..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="pl-10"
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
                <Target className="absolute left-3 top-3 w-5 h-5 text-[var(--color-text-muted)]" />
                <Textarea
                  id="goal"
                  placeholder="描述您想要达成的目标，例如：能够独立开发一个完整的Web应用..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="pl-10 min-h-[100px]"
                  disabled={isGenerating}
                />
              </div>
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

            {/* 预计时间提示 */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--color-secondary)]/20">
              <Clock className="w-5 h-5 text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                AI将根据您的目标和级别，自动规划合理的学习时间
              </p>
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
    </div>
  )
}
