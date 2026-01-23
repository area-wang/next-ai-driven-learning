/**
 * AI 配置客户端
 * 用于在客户端和服务端统一获取 AI 配置并创建客户端
 */

import { getDefaultModel, type ModelConfig } from './config'
import { createAIClient, type AIProvider } from './client'

/**
 * 从配置获取默认模型并创建 AI 客户端（客户端使用）
 */
export function createAIClientFromConfig() {
  const model = getDefaultModel()
  
  if (!model) {
    throw new Error('未配置可用的 AI 模型，请前往设置页面配置')
  }

  return {
    client: createAIClient({
      provider: model.provider as AIProvider,
      apiKey: model.apiKey,
      model: model.model,
      baseURL: model.baseUrl,
    }),
    modelConfig: model,
  }
}

/**
 * 从请求头获取模型配置（服务端使用）
 * 客户端会通过请求头传递模型配置
 */
export function getModelConfigFromHeaders(headers: Headers): ModelConfig | null {
  const modelConfigStr = headers.get('x-model-config')
  if (!modelConfigStr) {
    return null
  }

  try {
    return JSON.parse(modelConfigStr) as ModelConfig
  } catch {
    return null
  }
}

/**
 * 创建 AI 客户端（服务端使用）
 * 优先使用请求头中的模型配置，否则使用环境变量
 */
export function createAIClientFromRequest(
  request: Request,
  fallbackProvider: AIProvider = 'openai'
): ReturnType<typeof createAIClient> {
  // 尝试从请求头获取模型配置
  const modelConfig = getModelConfigFromHeaders(request.headers)
  
  if (modelConfig) {
    return createAIClient({
      provider: modelConfig.provider as AIProvider,
      apiKey: modelConfig.apiKey,
      model: modelConfig.model,
      baseURL: modelConfig.baseUrl,
    })
  }

  // 回退到环境变量
  let apiKey: string | undefined
  
  switch (fallbackProvider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY
      break
    case 'deepseek':
      apiKey = process.env.DEEPSEEK_API_KEY
      break
    case 'gemini':
      apiKey = process.env.GEMINI_API_KEY
      break
    case 'claude':
      apiKey = process.env.CLAUDE_API_KEY
      break
  }

  if (!apiKey) {
    throw new Error(`未配置 ${fallbackProvider} 的 API Key`)
  }

  return createAIClient({
    provider: fallbackProvider,
    apiKey,
  })
}

/**
 * 将模型配置添加到请求头（客户端使用）
 */
export function addModelConfigToHeaders(
  headers: Record<string, string>,
  modelConfig: ModelConfig
): Record<string, string> {
  return {
    ...headers,
    'x-model-config': JSON.stringify({
      id: modelConfig.id,
      provider: modelConfig.provider,
      apiKey: modelConfig.apiKey,
      model: modelConfig.model,
      baseUrl: modelConfig.baseUrl,
    }),
  }
}
