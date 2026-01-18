/**
 * AI 配置管理 Hook
 * 管理用户的 AI 模型偏好和 API Keys
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { AIProvider } from '@/lib/ai/client'
import { getDefaultModel } from '@/lib/ai/models'

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKeys: Partial<Record<AIProvider, string>>
}

/**
 * 默认配置 - 使用 DeepSeek 作为默认提供商
 */
const DEFAULT_CONFIG: AIConfig = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKeys: {},
}

const STORAGE_KEY = 'ai-config'

/**
 * 从 localStorage 加载配置
 */
function loadConfig(): AIConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const config = JSON.parse(stored) as AIConfig
      return {
        ...DEFAULT_CONFIG,
        ...config,
        apiKeys: {
          ...DEFAULT_CONFIG.apiKeys,
          ...config.apiKeys,
        },
      }
    }
  } catch (error) {
    console.error('Failed to load AI config:', error)
  }

  return DEFAULT_CONFIG
}

/**
 * 保存配置到 localStorage
 */
function saveConfig(config: AIConfig): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save AI config:', error)
  }
}

/**
 * AI 配置管理 Hook
 */
export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(true)

  // 加载配置
  useEffect(() => {
    const loaded = loadConfig()
    setConfig(loaded)
    setIsLoading(false)
  }, [])

  // 更新提供商
  const setProvider = useCallback((provider: AIProvider) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        provider,
        model: getDefaultModel(provider),
      }
      console.log('[useAIConfig] setProvider:', newConfig)
      saveConfig(newConfig)
      return newConfig
    })
  }, [])

  // 更新模型
  const setModel = useCallback((model: string) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        model,
      }
      console.log('[useAIConfig] setModel:', newConfig)
      saveConfig(newConfig)
      return newConfig
    })
  }, [])

  // 更新 API Key
  const setApiKey = useCallback((provider: AIProvider, apiKey: string) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        apiKeys: {
          ...prev.apiKeys,
          [provider]: apiKey,
        },
      }
      saveConfig(newConfig)
      return newConfig
    })
  }, [])

  // 获取当前提供商的 API Key
  const getApiKey = useCallback((provider?: AIProvider): string | undefined => {
    const targetProvider = provider || config.provider
    return config.apiKeys[targetProvider]
  }, [config])

  // 检查是否已配置 API Key
  const hasApiKey = useCallback((provider?: AIProvider): boolean => {
    const targetProvider = provider || config.provider
    const apiKey = config.apiKeys[targetProvider]
    return !!apiKey && apiKey.length > 0
  }, [config])

  // 重置配置
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    saveConfig(DEFAULT_CONFIG)
  }, [])

  return {
    config,
    isLoading,
    setProvider,
    setModel,
    setApiKey,
    getApiKey,
    hasApiKey,
    resetConfig,
  }
}
