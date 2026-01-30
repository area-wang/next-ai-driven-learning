'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-container'
import { FeynmanHistoryDialog } from '@/components/feynman/feynman-history-dialog'
import { 
  Brain, 
  CreditCard, 
  Calendar,
  FileText,
  Sparkles,
  Loader2,
  History,
  Eye
} from 'lucide-react'

interface LearningToolsSidebarProps {
  contentId: string
  documentContent: string
  documentTitle: string
  selectedModelId?: string // 页面顶部选择的模型 ID
  onToolGenerate: (toolType: string) => void
  onOpenFlashcardDialog: () => void
  onOpenFeynmanDialog: () => void
  onOpenReviewDialog: () => void // 新增：打开复习计划对话框的回调
  onOpenCornellDialog: () => void // 新增：打开康奈尔笔记对话框的回调
  onFlashcardGeneratingChange: (isGenerating: boolean) => void
  isFeynmanGenerating?: boolean // 费曼概念生成状态
}

interface Tool {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  aiPrompt: string
}

const TOOLS: Tool[] = [
  {
    id: 'flashcard',
    name: '生成闪卡',
    description: '从文档内容提取关键知识点生成闪卡',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'text-purple-600',
    aiPrompt: '根据以下内容生成记忆闪卡',
  },
  {
    id: 'review',
    name: '创建复习计划',
    description: '基于艾宾浩斯遗忘曲线安排复习',
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-blue-600',
    aiPrompt: '为这个知识点创建复习计划',
  },
  {
    id: 'feynman',
    name: '费曼学习法',
    description: 'AI 提取核心概念，您来解释',
    icon: <Brain className="w-5 h-5" />,
    color: 'text-teal-600',
    aiPrompt: '提取需要您解释的核心概念',
  },
  {
    id: 'cornell',
    name: '康奈尔笔记',
    description: '生成结构化的康奈尔笔记',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-green-600',
    aiPrompt: '将内容整理为康奈尔笔记格式',
  },
]

export function LearningToolsSidebar({
  contentId,
  documentContent,
  documentTitle,
  selectedModelId,
  onToolGenerate,
  onOpenFlashcardDialog,
  onOpenFeynmanDialog,
  onOpenReviewDialog,
  onOpenCornellDialog,
  onFlashcardGeneratingChange,
  isFeynmanGenerating = false,
}: LearningToolsSidebarProps) {
  const [generatingTool, setGeneratingTool] = useState<string | null>(null)
  const [isFeynmanHistoryOpen, setIsFeynmanHistoryOpen] = useState(false)
  const toast = useToast()

  const handleGenerate = async (tool: Tool) => {
    if (!documentContent || documentContent.trim().length < 50) {
      toast.warning('文档内容太少，请先添加更多内容')
      return
    }

    // 检查是否选择了模型
    if (!selectedModelId) {
      toast.warning('请先在页面顶部选择 AI 模型')
      return
    }

    // 费曼学习法：直接打开对话框（会在对话框内生成概念）
    if (tool.id === 'feynman') {
      onOpenFeynmanDialog()
      return
    }

    // 复习计划：先生成，成功后打开对话框
    if (tool.id === 'review') {
      setGeneratingTool(tool.id)
      try {
        toast.info('正在创建复习计划...')
        
        const response = await fetch('/api/review/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            outlineId: contentId,
            modelId: selectedModelId, // 传递模型 ID
          }),
        })

        const data = await response.json() as { success: boolean; error?: string }

        if (data.success) {
          toast.success('复习计划创建成功！')
          onOpenReviewDialog() // 调用回调打开对话框
        } else {
          throw new Error(data.error || '创建复习计划失败')
        }
      } catch (error) {
        console.error('创建复习计划失败:', error)
        toast.error(error instanceof Error ? error.message : '创建复习计划失败')
      } finally {
        setGeneratingTool(null)
      }
      return
    }

    // 闪卡工具：先生成，然后打开对话框
    if (tool.id === 'flashcard') {
      setGeneratingTool(tool.id)
      onFlashcardGeneratingChange(true) // 设置生成状态
      // 立即打开对话框（显示 loading 状态）
      onOpenFlashcardDialog()
      
      try {
        // 生成新闪卡（API 内部会先清除旧记录）
        const response = await fetch('/api/flashcards/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            content: documentContent,
            title: documentTitle,
            modelId: selectedModelId, // 传递模型 ID
          }),
        })

        if (!response.ok) {
          const errorData = await response.json() as { error?: string }
          throw new Error(errorData.error || '生成闪卡失败')
        }

        const data = await response.json() as { success: boolean; count: number }
        
        if (data.success) {
          toast.success(`成功生成 ${data.count} 张闪卡！`)
          // 生成成功后，对话框会自动刷新显示新闪卡
        } else {
          throw new Error('生成闪卡失败')
        }
      } catch (error) {
        console.error('生成闪卡失败:', error)
        toast.error(error instanceof Error ? error.message : '生成闪卡失败')
      } finally {
        setGeneratingTool(null)
        onFlashcardGeneratingChange(false) // 清除生成状态
      }
      return
    }

    // 康奈尔笔记：直接打开对话框
    if (tool.id === 'cornell') {
      onOpenCornellDialog()
      return
    }

    // 其他工具正常生成
    setGeneratingTool(tool.id)
    try {
      await onToolGenerate(tool.id)
      toast.success(`${tool.name}生成成功！`)
    } catch (error) {
      console.error('生成失败:', error)
      toast.error(`${tool.name}生成失败`)
    } finally {
      setGeneratingTool(null)
    }
  }

  const handleViewHistory = async (toolId: string) => {
    if (toolId === 'flashcard') {
      onOpenFlashcardDialog()
    } else if (toolId === 'feynman') {
      // 先加载历史记录，加载完成后再打开对话框
      toast.info('正在加载历史记录...')
      try {
        const response = await fetch(`/api/feynman/explanations?contentId=${contentId}`)
        if (response.ok) {
          const result = await response.json() as { success: boolean; data: any[] }
          if (result.success && result.data.length > 0) {
            setIsFeynmanHistoryOpen(true)
          } else {
            toast.info('暂无历史记录')
          }
        } else {
          toast.error('加载历史记录失败')
        }
      } catch (error) {
        console.error('加载历史记录失败:', error)
        toast.error('加载历史记录失败')
      }
    } else if (toolId === 'review') {
      // 打开复习计划对话框
      onOpenReviewDialog()
    } else if (toolId === 'cornell') {
      // 打开康奈尔笔记对话框
      onOpenCornellDialog()
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 工具列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {TOOLS.map((tool) => (
          <Card
            key={tool.id}
            className="transition-all duration-200"
          >
            {/* 工具卡片 */}
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`${tool.color} mt-0.5`}>
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {tool.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* 功能说明 */}
              <div className="mb-3">
                {tool.id === 'flashcard' && (
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 关键概念的问答卡片</li>
                    <li>• 自动设置复习间隔</li>
                    <li>• 支持 SM-2 算法</li>
                  </ul>
                )}
                {tool.id === 'review' && (
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 7 轮复习计划</li>
                    <li>• 基于遗忘曲线</li>
                    <li>• 自动提醒复习</li>
                  </ul>
                )}
                {tool.id === 'feynman' && (
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• AI 提取核心概念</li>
                    <li>• 您用自己的话解释</li>
                    <li>• AI 评估您的理解</li>
                  </ul>
                )}
                {tool.id === 'cornell' && (
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 提取关键词和问题</li>
                    <li>• 生成内容总结</li>
                    <li>• 三栏笔记格式</li>
                  </ul>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {/* 生成按钮 */}
                <Button
                  onClick={() => handleGenerate(tool)}
                  disabled={generatingTool !== null || isFeynmanGenerating} // 费曼生成时也禁用
                  className="flex-1"
                  size="sm"
                >
                  {generatingTool === tool.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : tool.id === 'feynman' && isFeynmanGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      提取概念中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成
                    </>
                  )}
                </Button>

                {/* 查看历史按钮（仅闪卡和费曼） */}
                {(tool.id === 'flashcard' || tool.id === 'feynman') && (
                  <Button
                    onClick={() => handleViewHistory(tool.id)}
                    variant="outline"
                    size="sm"
                    disabled={generatingTool !== null || isFeynmanGenerating} // 生成时禁用查看历史
                  >
                    {tool.id === 'flashcard' ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <History className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* 查看按钮（复习计划和康奈尔笔记） */}
                {(tool.id === 'review' || tool.id === 'cornell') && (
                  <Button
                    onClick={() => handleViewHistory(tool.id)}
                    variant="outline"
                    size="sm"
                    disabled={generatingTool !== null || isFeynmanGenerating}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="flex-shrink-0 p-4 border-t bg-blue-50">
        <p className="text-xs text-blue-800">
          💡 提示：文档内容越详细，AI 生成的学习材料质量越高
        </p>
      </div>

      {/* 费曼学习法历史记录对话框 */}
      <FeynmanHistoryDialog
        isOpen={isFeynmanHistoryOpen}
        onClose={() => setIsFeynmanHistoryOpen(false)}
        contentId={contentId}
      />
    </div>
  )
}
