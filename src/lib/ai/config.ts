/**
 * AI 模型配置管理
 * 统一管理所有 AI 模型的配置和连通性测试
 */

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'google' | 'anthropic' | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot' | 'minimax' | 'bytedance' | 'custom'
  apiKey: string
  baseUrl?: string
  isConnected: boolean
  lastTested?: string
  model?: string // 实际的模型名称，如 gpt-4, claude-3-opus
}

export interface AIConfig {
  models: ModelConfig[]
  defaultModelId?: string
}

const CONFIG_KEY = 'ai-config'

/**
 * 获取所有 AI 配置
 */
export function getAIConfig(): AIConfig {
  if (typeof window === 'undefined') {
    return { models: [] }
  }

  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('读取 AI 配置失败:', error)
  }

  return { models: [] }
}

/**
 * 保存 AI 配置
 */
export function saveAIConfig(config: AIConfig): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('保存 AI 配置失败:', error)
  }
}

/**
 * 获取已连通的模型列表
 */
export function getAvailableModels(): ModelConfig[] {
  const config = getAIConfig()
  // 只检查 isConnected,不再检查 apiKey（API Key 现在在后端管理）
  return config.models.filter(m => m.isConnected)
}

/**
 * 获取默认模型
 */
export function getDefaultModel(): ModelConfig | null {
  const config = getAIConfig()
  
  // 优先返回设置的默认模型
  if (config.defaultModelId) {
    const model = config.models.find(m => m.id === config.defaultModelId)
    if (model && model.isConnected) {
      return model
    }
  }

  // 返回第一个已连通的模型
  const available = getAvailableModels()
  return available[0] || null
}

/**
 * 获取指定模型配置
 */
export function getModelConfig(modelId: string): ModelConfig | null {
  const config = getAIConfig()
  return config.models.find(m => m.id === modelId) || null
}

/**
 * 保存模型配置
 */
export function saveModelConfig(modelConfig: ModelConfig): void {
  const config = getAIConfig()
  const index = config.models.findIndex(m => m.id === modelConfig.id)
  
  if (index >= 0) {
    config.models[index] = modelConfig
  } else {
    config.models.push(modelConfig)
  }
  
  saveAIConfig(config)
}

/**
 * 删除模型配置
 */
export function deleteModelConfig(modelId: string): void {
  const config = getAIConfig()
  config.models = config.models.filter(m => m.id !== modelId)
  
  // 如果删除的是默认模型，清除默认设置
  if (config.defaultModelId === modelId) {
    config.defaultModelId = undefined
  }
  
  saveAIConfig(config)
}

/**
 * 设置默认模型
 */
export function setDefaultModel(modelId: string): void {
  const config = getAIConfig()
  config.defaultModelId = modelId
  saveAIConfig(config)
}

/**
 * 测试模型连通性
 */
export async function testModelConnection(modelConfig: ModelConfig): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch('/api/ai/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: modelConfig.provider,
        apiKey: modelConfig.apiKey,
        baseUrl: modelConfig.baseUrl,
        model: modelConfig.model,
      }),
    })

    const data = await response.json() as { success?: boolean; error?: string }

    if (response.ok && data.success) {
      // 更新连通状态
      modelConfig.isConnected = true
      modelConfig.lastTested = new Date().toISOString()
      saveModelConfig(modelConfig)
      
      return { success: true }
    } else {
      modelConfig.isConnected = false
      modelConfig.lastTested = new Date().toISOString()
      saveModelConfig(modelConfig)
      
      return { success: false, error: data.error || '连接失败' }
    }
  } catch (error) {
    modelConfig.isConnected = false
    modelConfig.lastTested = new Date().toISOString()
    saveModelConfig(modelConfig)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    }
  }
}

/**
 * 预定义的模型列表
 * 注意：现在统一使用 OpenRouter API，baseUrl 都是 https://openrouter.ai/api/v1
 */
export const PREDEFINED_MODELS = [
  {
    id: 'openai-gpt4',
    name: 'GPT-4',
    provider: 'openai' as const,
    model: 'openai/gpt-4',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'openai-gpt35',
    name: 'GPT-3.5 Turbo',
    provider: 'openai' as const,
    model: 'openai/gpt-3.5-turbo',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'google-gemini-pro',
    name: 'Gemini Pro',
    provider: 'google' as const,
    model: 'google/gemini-pro',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'anthropic-claude3',
    name: 'Claude 3 Opus',
    provider: 'anthropic' as const,
    model: 'anthropic/claude-3-opus',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek' as const,
    model: 'deepseek/deepseek-chat',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'qwen-turbo',
    name: 'Qwen Turbo',
    provider: 'qwen' as const,
    model: 'qwen/qwen-turbo',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'zhipu-glm4',
    name: '智谱 GLM-4',
    provider: 'zhipu' as const,
    model: 'zhipuai/glm-4',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'moonshot-v1',
    name: 'Moonshot v1',
    provider: 'moonshot' as const,
    model: 'moonshot/moonshot-v1-8k',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'minimax-abab',
    name: 'MiniMax abab',
    provider: 'minimax' as const,
    model: 'minimax/abab6-chat',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'bytedance-doubao',
    name: '字节豆包',
    provider: 'bytedance' as const,
    model: 'bytedance/doubao-pro',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
]
