/**
 * AI 设置页面
 * 用户可以配置 AI 模型和 API Keys
 */

import { ModelSelector } from '@/components/ai/model-selector'
import { ApiKeyConfig } from '@/components/ai/api-key-config'

export default function AISettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            AI 模型设置
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            选择您喜欢的 AI 模型并配置 API Keys
          </p>
        </div>

        <ModelSelector />
        <ApiKeyConfig />
      </div>
    </div>
  )
}
