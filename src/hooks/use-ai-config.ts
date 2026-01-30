/**
 * AI 配置管理 Hook
 * 从数据库读取用户的 AI 配置（通过 ConfiguredModelSelector 组件）
 * 
 * 注意：此 hook 已废弃，建议使用 ConfiguredModelSelector 组件
 * 为了向后兼容，保留此 hook 但返回空配置
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { AIProvider } from '@/lib/ai/client'

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKeys: Partial<Record<AIProvider, string>>
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AIConfig = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  apiKeys: {},
}

/**
 * AI 配置管理 Hook
 * 
 * @deprecated 此 hook 已废弃，新代码应该：
 * 1. 使用 ConfiguredModelSelector 组件选择模型
 * 2. 直接调用后端 API，传递 modelId
 * 3. 后端使用 getAIConfig() 函数获取配置
 */
export function useAIConfig() {
  const [config] = useState<AIConfig>(DEFAULT_CONFIG)
  const [isLoading] = useState(false)

  // 废弃的方法，返回空实现
  const setProvider = useCallback((_provider: AIProvider) => {
    console.warn('[useAIConfig] setProvider 已废弃，请使用 ConfiguredModelSelector 组件')
  }, [])

  const setModel = useCallback((_model: string) => {
    console.warn('[useAIConfig] setModel 已废弃，请使用 ConfiguredModelSelector 组件')
  }, [])

  const setApiKey = useCallback((_provider: AIProvider, _apiKey: string) => {
    console.warn('[useAIConfig] setApiKey 已废弃，请在设置页面配置')
  }, [])

  const getApiKey = useCallback((_provider?: AIProvider): string | undefined => {
    console.warn('[useAIConfig] getApiKey 已废弃，后端会自动处理 API Key')
    return undefined
  }, [])

  const hasApiKey = useCallback((_provider?: AIProvider): boolean => {
    // 总是返回 true，让后端处理验证
    return true
  }, [])

  const resetConfig = useCallback(() => {
    console.warn('[useAIConfig] resetConfig 已废弃')
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
