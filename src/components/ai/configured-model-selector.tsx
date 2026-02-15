/**
 * 已配置模型选择器组件
 * 从数据库读取用户配置的模型列表
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface ModelConfig {
  id: string
  name: string
  provider: string
  model: string
}

interface ConfiguredModelSelectorProps {
  value?: string
  onChange?: (modelId: string) => void
  label?: string
  showLabel?: boolean
  className?: string
}

export function ConfiguredModelSelector({
  value,
  onChange,
  label = '选择模型',
  showLabel = true,
  className = '',
}: ConfiguredModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(value)
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const [loading, setLoading] = useState(true)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 加载已配置的模型
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/ai/user-models')
        const result = await response.json() as {
          success: boolean
          data?: Array<{ modelId: string; modelName: string; provider: string; isDefault: boolean }>
        }

        if (result.success && result.data) {
          const modelList: ModelConfig[] = result.data.map(m => ({
            id: m.modelId,
            name: m.modelName,
            provider: m.provider,
            model: m.modelId,
          }))

          setModels(modelList)

          // 缓存到 localStorage（供同步读取使用）
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('ai-models-cache', JSON.stringify(modelList))
            } catch (error) {
              console.error('[Model Selector] 缓存失败:', error)
            }
          }

          // 如果没有传入 value，使用默认模型
          if (!value) {
            const defaultModel = result.data.find(m => m.isDefault)
            if (defaultModel) {
              setSelectedModelId(defaultModel.modelId)
              onChange?.(defaultModel.modelId)
            }
          }
        }
      } catch (error) {
        console.error('[Model Selector] 加载模型失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadModels()
  }, [value, onChange])

  // 当 value 变化时更新选中的模型
  useEffect(() => {
    if (value) {
      setSelectedModelId(value)
    }
  }, [value])

  // 计算下拉框位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return
        
        const buttonRect = buttonRef.current.getBoundingClientRect()
        const dropdownHeight = Math.min(models.length * 60, 240) // 每项约60px，最大240px
        const spaceBelow = window.innerHeight - buttonRect.bottom
        const spaceAbove = buttonRect.top

        console.log('[Dropdown Position Debug]', {
          buttonRect: {
            left: buttonRect.left,
            top: buttonRect.top,
            bottom: buttonRect.bottom,
            width: buttonRect.width,
            height: buttonRect.height,
          },
          windowHeight: window.innerHeight,
          spaceBelow,
          spaceAbove,
        })

        // 如果下方空间不足且上方空间更大，则向上展开
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setDropdownPosition('top')
        } else {
          setDropdownPosition('bottom')
        }
      }

      updatePosition()

      // 监听滚动和窗口大小变化
      window.addEventListener('scroll', updatePosition, true) // 使用捕获阶段监听所有滚动
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen, models.length])

  const selectedModel = models.find(m => m.id === selectedModelId)

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId)
    setIsOpen(false)
    onChange?.(modelId)
  }

  if (loading) {
    return (
      <div className={className}>
        {showLabel && (
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            {label}
          </label>
        )}
        <div className="px-3 py-2 border border-[var(--color-border-light)] rounded-lg bg-white/80 backdrop-blur-md text-[var(--color-text-secondary)] text-sm">
          加载中...
        </div>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className={className}>
        {showLabel && (
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            {label}
          </label>
        )}
        <div className="px-3 py-2 border border-[var(--color-border-light)] rounded-lg bg-white/80 backdrop-blur-md text-[var(--color-text-secondary)] text-sm">
          暂无可用模型，请先在设置中配置
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-[var(--color-border-light)] rounded-lg bg-white/80 backdrop-blur-md text-[var(--color-text)] hover:bg-white transition-colors focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
        >
          <span className="text-sm truncate">
            {selectedModel ? selectedModel.name : '请选择模型'}
          </span>
          <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[55]"
              onClick={() => setIsOpen(false)}
            />
            <div 
              className={`absolute left-0 right-0 bg-white/95 backdrop-blur-md border border-[var(--color-border-light)] rounded-lg shadow-lg z-[60] max-h-60 overflow-y-auto ${
                dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
              }`}
            >
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelSelect(model.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[var(--color-primary)]/10 transition-colors first:rounded-t-lg last:rounded-b-lg cursor-pointer ${
                    selectedModelId === model.id ? 'bg-[var(--color-primary)]/10' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text)] truncate">
                      {model.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                      {model.model}
                    </div>
                  </div>
                  {selectedModelId === model.id && (
                    <Check className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 ml-2" />
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
