/**
 * 学习大纲页面
 */

import { OutlineGenerator } from '@/components/learning/outline-generator'

export default function LearningOutlinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            AI 学习大纲生成器
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            输入您想学习的主题，AI 将为您生成详细的学习大纲
          </p>
        </div>

        <OutlineGenerator />
      </div>
    </div>
  )
}
