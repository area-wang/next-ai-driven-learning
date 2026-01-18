/**
 * AI 模型选择器组件
 * 允许用户选择 AI 提供商和具体模型
 */

'use client'

import { useState } from 'react'
import { Check, ChevronDown, Zap, DollarSign, Clock } from 'lucide-react'
import { useAIConfig } from '@/hooks/use-ai-config'
import { PROVIDERS, MODELS_BY_PROVIDER, type ModelInfo } from '@/lib/ai/models'
import { AIProvider } from '@/lib/ai/client'

interface ModelSelectorProps {
  onModelChange?: (provider: AIProvider, model: string) => void
  compact?: boolean
}

export function ModelSelector({ onModelChange, compact = false }: ModelSelectorProps) {
  const { config, setProvider, setModel } = useAIConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(config.provider)

  const currentProvider = PROVIDERS.find(p => p.id === config.provider)
  const currentModels = MODELS_BY_PROVIDER[config.provider] || []
  const currentModel = currentModels.find(m => m.id === config.model)

  const handleProviderSelect = (provider: AIProvider) => {
    setSelectedProvider(provider)
  }

  const handleModelSelect = (model: ModelInfo) => {
    setProvider(model.provider)
    setModel(model.id)
    setIsOpen(false)
    onModelChange?.(model.provider, model.id)
  }

  const displayModels = MODELS_BY_PROVIDER[selectedProvider] || []

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white/90 dark:hover:bg-slate-800/90 transition-colors cursor-pointer"
        >
          <span className="font-medium">{currentModel?.name || '选择模型'}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <ModelSelectorContent
                selectedProvider={selectedProvider}
                currentModel={currentModel}
                displayModels={displayModels}
                onProviderSelect={handleProviderSelect}
                onModelSelect={handleModelSelect}
              />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        选择 AI 模型
      </h3>

      <ModelSelectorContent
        selectedProvider={selectedProvider}
        currentModel={currentModel}
        displayModels={displayModels}
        onProviderSelect={handleProviderSelect}
        onModelSelect={handleModelSelect}
      />
    </div>
  )
}

interface ModelSelectorContentProps {
  selectedProvider: AIProvider
  currentModel?: ModelInfo
  displayModels: ModelInfo[]
  onProviderSelect: (provider: AIProvider) => void
  onModelSelect: (model: ModelInfo) => void
}

function ModelSelectorContent({
  selectedProvider,
  currentModel,
  displayModels,
  onProviderSelect,
  onModelSelect,
}: ModelSelectorContentProps) {
  return (
    <div className="space-y-4">
      {/* 提供商选择 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          AI 提供商
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.filter(p => p.id !== 'cloudflare').map(provider => (
            <button
              key={provider.id}
              onClick={() => onProviderSelect(provider.id)}
              className={`
                p-3 rounded-lg border-2 transition-all cursor-pointer text-left
                ${
                  selectedProvider === provider.id
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              <div className="font-medium text-sm text-slate-900 dark:text-white">
                {provider.name}
              </div>
              {!provider.requiresApiKey && (
                <div className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                  免费使用
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 模型列表 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          选择模型
        </label>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayModels.map(model => (
            <button
              key={model.id}
              onClick={() => onModelSelect(model)}
              className={`
                w-full p-4 rounded-lg border-2 transition-all cursor-pointer text-left
                ${
                  currentModel?.id === model.id
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {model.name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {model.description}
                  </div>
                </div>
                {currentModel?.id === model.id && (
                  <Check className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="capitalize">{model.speed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>
                    {model.costPer1kTokens === 0
                      ? '免费'
                      : `$${model.costPer1kTokens}/1k`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{(model.contextWindow / 1000).toFixed(0)}k</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {model.capabilities.slice(0, 3).map(cap => (
                  <span
                    key={cap}
                    className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                  >
                    {cap}
                  </span>
                ))}
                {model.capabilities.length > 3 && (
                  <span className="px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                    +{model.capabilities.length - 3}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
