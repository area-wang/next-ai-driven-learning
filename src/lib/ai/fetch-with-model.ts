/**
 * 带模型配置的 fetch 辅助函数
 * 用于在调用 API 时自动添加模型配置到请求头
 * 
 * 注意：为了安全，不再传递 API Key 到后端
 * API Key 应该存储在后端环境变量中
 */

import { getModelConfig } from './config'

/**
 * 使用指定模型调用 API
 * @param url API 地址
 * @param modelId 模型 ID
 * @param options fetch 选项
 */
export async function fetchWithModel(
  url: string,
  modelId: string | undefined,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // 如果提供了 modelId，添加模型配置到请求头（不包含 API Key）
  if (modelId) {
    const modelConfig = getModelConfig(modelId)
    if (modelConfig) {
      headers['x-model-config'] = JSON.stringify({
        id: modelConfig.id,
        provider: modelConfig.provider,
        // 不再传递 API Key，后端从环境变量读取
        model: modelConfig.model,
        baseUrl: modelConfig.baseUrl,
      })
    } else {
      console.warn(`[fetchWithModel] Model config not found for modelId: ${modelId}`)
    }
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
