/**
 * 已配置模型选择器组件
 * 从用户配置的模型列表中选择
 */

'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { getAIConfig, getAvailableModels, type ModelConfig } from '@/lib/ai/config'

interface ConfiguredModelSelectorProps {
  value?: string
  onChange?: (modelId: string) => void
  label?: string
  className?: string
}

export function ConfiguredModelSelector({
  value,
  onChange,
  label = '选择模型',
  className = '',
}: ConfiguredModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(value)
  const [isOpen, setIsOpen] = useState(false)

  // 加载已配置的模型
  useEffect(() => {
    const config = getAIConfig()
    const availableModels = getAvailableModels()
    setModels(availableModels)

    // 如果没有传入 value，使用默认模型
    if (!value && config.defaultModelId) {
      setSelectedModelId(config.defaultModelId)
      onChange?.(config.defaultModelId)
    }
  }, [value, onChange])

  // 当 value 变化时更新选中的模型
  useEffect(() => {
    if (value) {
      setSelectedModelId(value)
    }
  }, [value])

  const selectedModel = models.find(m => m.id === selectedModelId)

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId)
    setIsOpen(false)
    onChange?.(modelId)
  }

  if (models.length === 0) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
          暂无可用模型，请先在设置中配置
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <span className="text-sm truncate">
            {selectedModel ? selectedModel.name : '请选择模型'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelSelect(model.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedModelId === model.id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {model.model}
                    </div>
                  </div>
                  {selectedModelId === model.id && (
                    <Check className="w-4 h-4 text-teal-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
