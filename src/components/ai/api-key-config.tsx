/**
 * API Key 配置组件
 * 允许用户配置各个 AI 提供商的 API Keys
 */

'use client'

import { useState } from 'react'
import { Eye, EyeOff, ExternalLink, Check, AlertCircle } from 'lucide-react'
import { useAIConfig } from '@/hooks/use-ai-config'
import { PROVIDERS } from '@/lib/ai/models'
import { AIProvider } from '@/lib/ai/client'

export function ApiKeyConfig() {
  const { config, setApiKey, hasApiKey } = useAIConfig()
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    deepseek: false,
    gemini: false,
    claude: false,
    cloudflare: false,
  })
  const [editingKeys, setEditingKeys] = useState<Partial<Record<AIProvider, string>>>({})
  const [savedProvider, setSavedProvider] = useState<AIProvider | null>(null)

  const handleToggleShow = (provider: AIProvider) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  const handleKeyChange = (provider: AIProvider, value: string) => {
    setEditingKeys(prev => ({
      ...prev,
      [provider]: value,
    }))
  }

  const handleSave = (provider: AIProvider) => {
    const key = editingKeys[provider]
    if (key) {
      setApiKey(provider, key)
      setSavedProvider(provider)
      setTimeout(() => setSavedProvider(null), 2000)
    }
  }

  return (
    <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        API Key 配置
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        配置 API Keys 以使用不同的 AI 提供商。API Keys 仅保存在本地浏览器中。
      </p>

      <div className="space-y-4">
        {PROVIDERS.filter(p => p.requiresApiKey).map(provider => {
          const currentKey = config.apiKeys[provider.id] || ''
          const editingKey = editingKeys[provider.id]
          const displayKey = editingKey !== undefined ? editingKey : currentKey
          const isConfigured = hasApiKey(provider.id)
          const isSaved = savedProvider === provider.id

          return (
            <div
              key={provider.id}
              className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {provider.name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {provider.description}
                  </div>
                </div>
                {isConfigured && !editingKey && (
                  <div className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                    <Check className="w-4 h-4" />
                    <span>已配置</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showKeys[provider.id] ? 'text' : 'password'}
                    value={displayKey}
                    onChange={e => handleKeyChange(provider.id, e.target.value)}
                    placeholder={`输入 ${provider.name} API Key`}
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={() => handleToggleShow(provider.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                  >
                    {showKeys[provider.id] ? (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href={provider.apiKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    <span>获取 API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {editingKey !== undefined && editingKey !== currentKey && (
                    <button
                      onClick={() => handleSave(provider.id)}
                      className="px-3 py-1 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {isSaved ? '已保存' : '保存'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <div className="font-medium mb-1">关于 API Keys</div>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• API Keys 仅保存在您的浏览器本地存储中</li>
                <li>• 我们不会将您的 API Keys 上传到服务器</li>
                <li>• 如果不配置 API Key，可以使用免费的 Cloudflare AI</li>
                <li>• 建议定期更换 API Keys 以确保安全</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
