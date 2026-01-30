/**
 * AI 模型配置管理
 * 从数据库读取用户配置的模型
 */

export interface ModelConfig {
  id: string
  name: string
  provider: string
  model: string // 实际的模型名称，如 gpt-4, claude-3-opus
  apiKey?: string // 前端不再存储 API Key
  baseUrl?: string
  isConnected?: boolean
  lastTested?: string
}

export interface AIConfig {
  models: ModelConfig[]
  defaultModelId?: string
}

/**
 * 从数据库获取用户配置的模型
 */
export async function getAIConfig(): Promise<AIConfig> {
  try {
    const response = await fetch('/api/ai/user-models')
    const result = await response.json() as {
      success: boolean
      data?: Array<{ modelId: string; modelName: string; provider: string; isDefault: boolean }>
    }

    if (result.success && result.data) {
      const models: ModelConfig[] = result.data.map(m => ({
        id: m.modelId,
        name: m.modelName,
        provider: m.provider,
        model: m.modelId,
        isConnected: true, // 数据库中的模型都是已配置的
      }))

      const defaultModelId = result.data.find(m => m.isDefault)?.modelId

      return {
        models,
        defaultModelId,
      }
    }
  } catch (error) {
    console.error('[AI Config] 读取配置失败:', error)
  }

  return { models: [] }
}

/**
 * 获取已配置的模型列表
 */
export async function getAvailableModels(): Promise<ModelConfig[]> {
  const config = await getAIConfig()
  return config.models
}

/**
 * 获取默认模型
 */
export async function getDefaultModel(): Promise<ModelConfig | null> {
  const config = await getAIConfig()
  
  // 优先返回设置的默认模型
  if (config.defaultModelId) {
    const model = config.models.find(m => m.id === config.defaultModelId)
    if (model) {
      return model
    }
  }

  // 返回第一个模型
  return config.models[0] || null
}

/**
 * 获取指定模型配置
 */
export async function getModelConfig(modelId: string): Promise<ModelConfig | null> {
  const config = await getAIConfig()
  return config.models.find(m => m.id === modelId) || null
}
