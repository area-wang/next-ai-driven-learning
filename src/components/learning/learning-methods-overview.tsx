'use client'

import { Card } from '@/components/ui/card'
import { 
  BookOpen, 
  Brain, 
  Clock, 
  CreditCard, 
  FileText, 
  Network,
  Calendar
} from 'lucide-react'

interface LearningMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
}

interface LearningMethodsOverviewProps {
  onMethodSelect: (methodId: string) => void
}

const LEARNING_METHODS: LearningMethod[] = [
  {
    id: 'review',
    name: '艾宾浩斯复习',
    description: '基于遗忘曲线的科学复习计划，帮助你在最佳时机复习知识',
    icon: <Calendar className="w-8 h-8" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'flashcard',
    name: '闪卡记忆',
    description: '使用 SM-2 算法的间隔重复系统，高效记忆知识点',
    icon: <CreditCard className="w-8 h-8" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'pomodoro',
    name: '番茄工作法',
    description: '25分钟专注学习 + 5分钟休息，提高学习效率',
    icon: <Clock className="w-8 h-8" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    id: 'feynman',
    name: '费曼学习法',
    description: '用简单的语言解释概念，发现知识盲点',
    icon: <Brain className="w-8 h-8" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
  {
    id: 'cornell',
    name: '康奈尔笔记',
    description: '三栏笔记法：线索区、主笔记区、总结区，系统化记录',
    icon: <FileText className="w-8 h-8" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'zettelkasten',
    name: '卡片盒笔记',
    description: '构建知识网络，通过双向链接建立知识之间的联系',
    icon: <Network className="w-8 h-8" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
]

export function LearningMethodsOverview({ onMethodSelect }: LearningMethodsOverviewProps) {
  return (
    <div className="space-y-6">
      {/* 标题和说明 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          学习方法工具箱
        </h2>
        <p className="text-gray-600">
          选择适合你的学习方法，提升学习效率
        </p>
      </div>

      {/* 方法卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEARNING_METHODS.map((method) => (
          <Card
            key={method.id}
            onClick={() => onMethodSelect(method.id)}
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 ${method.borderColor} ${method.bgColor}`}
          >
            <div className="flex flex-col h-full">
              {/* 图标 */}
              <div className={`${method.color} mb-4`}>
                {method.icon}
              </div>

              {/* 标题 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {method.name}
              </h3>

              {/* 描述 */}
              <p className="text-sm text-gray-600 flex-1">
                {method.description}
              </p>

              {/* 启动按钮 */}
              <div className="mt-4">
                <button
                  className={`w-full py-2 px-4 rounded-lg ${method.color} ${method.bgColor} hover:opacity-80 transition-opacity text-sm font-medium`}
                >
                  开始使用
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 使用提示 */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          使用建议
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>艾宾浩斯复习</strong>：适合需要长期记忆的知识点</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>闪卡记忆</strong>：适合快速记忆大量零散知识点</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>番茄工作法</strong>：适合需要长时间专注的学习任务</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>费曼学习法</strong>：适合理解复杂概念和检验学习效果</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>康奈尔笔记</strong>：适合课堂笔记和系统化整理</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>卡片盒笔记</strong>：适合构建知识体系和深度思考</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
