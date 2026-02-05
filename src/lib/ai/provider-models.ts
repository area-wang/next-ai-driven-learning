/**
 * 各厂商官方 API 动态获取模型列表
 * 用于独立厂商配置模式下的模型选择
 * 
 * 最后更新：2026-01-29
 */

export interface ProviderModel {
  id: string // 模型 ID（厂商官方格式）
  name: string // 模型显示名称
  contextLength: number // 上下文长度
}

/**
 * 厂商 API 配置
 */
const PROVIDER_API_CONFIG: Record<string, {
  listModelsUrl: string
  headers: (apiKey: string) => Record<string, string>
  parseResponse: (data: any) => ProviderModel[]
}> = {
  // DeepSeek
  // API 文档: https://api-docs.deepseek.com/api/list-models
  deepseek: {
    listModelsUrl: 'https://api.deepseek.com/v1/models',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        contextLength: model.context_length || 128000,
      }))
    },
  },

  // OpenAI
  // API 文档: https://platform.openai.com/docs/api-reference/models/list
  openai: {
    listModelsUrl: 'https://api.openai.com/v1/models',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      // 只返回 GPT 系列模型
      return data.data
        .filter((model: any) => model.id.startsWith('gpt-'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          contextLength: getOpenAIContextLength(model.id),
        }))
    },
  },

  // Google (Gemini)
  // API 文档: https://ai.google.dev/api/models
  google: {
    listModelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    headers: (apiKey: string) => ({
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.models || !Array.isArray(data.models)) return []
      // 只返回 Gemini 系列模型
      return data.models
        .filter((model: any) => model.name.includes('gemini'))
        .map((model: any) => {
          const modelId = model.name.split('/').pop() || model.name
          return {
            id: modelId,
            name: model.displayName || modelId,
            contextLength: model.inputTokenLimit || 1048576,
          }
        })
    },
  },

  // Anthropic (Claude)
  // API 文档: https://docs.anthropic.com/en/api/models-list
  anthropic: {
    listModelsUrl: 'https://api.anthropic.com/v1/models',
    headers: (apiKey: string) => ({
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.display_name || model.id,
        contextLength: model.context_window || 200000,
      }))
    },
  },

  // Qwen (通义千问)
  // API 文档: https://help.aliyun.com/zh/model-studio/getting-started/models
  qwen: {
    listModelsUrl: 'https://dashscope.aliyuncs.com/api/v1/models',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      return data.data
        .filter((model: any) => model.model_id.startsWith('qwen'))
        .map((model: any) => ({
          id: model.model_id,
          name: model.model_name || model.model_id,
          contextLength: model.context_length || 8000,
        }))
    },
  },

  // Kimi (月之暗面)
  // API 文档: https://platform.moonshot.cn/docs/api/chat
  moonshotai: {
    listModelsUrl: 'https://api.moonshot.cn/v1/models',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        contextLength: model.context_length || 8000,
      }))
    },
  },

  // 智谱AI
  // API 文档: https://open.bigmodel.cn/dev/api
  'z-ai': {
    listModelsUrl: 'https://open.bigmodel.cn/api/paas/v4/models',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        contextLength: model.context_length || 128000,
      }))
    },
  },

  // MiniMax
  // API 文档: https://www.minimaxi.com/document/guides/chat-model/V2
  minimax: {
    listModelsUrl: 'https://api.minimax.chat/v1/models',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        contextLength: model.context_length || 8192,
      }))
    },
  },

  // 豆包 (字节跳动)
  // API 文档: https://www.volcengine.com/docs/82379/1099455
  bytedance: {
    listModelsUrl: 'https://ark.cn-beijing.volces.com/api/v3/models',
    headers: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    parseResponse: (data: any) => {
      if (!data.data || !Array.isArray(data.data)) return []
      return data.data.map((model: any) => ({
        id: model.model,
        name: model.name || model.model,
        contextLength: model.context_length || 32000,
      }))
    },
  },
}

/**
 * OpenAI 模型上下文长度映射（因为 API 不返回此信息）
 */
function getOpenAIContextLength(modelId: string): number {
  if (modelId.includes('gpt-4o')) return 128000
  if (modelId.includes('gpt-4-turbo')) return 128000
  if (modelId.includes('gpt-4')) return 8192
  if (modelId.includes('gpt-3.5-turbo')) return 16385
  return 8192
}

/**
 * 从厂商 API 动态获取模型列表
 * @param providerId 厂商 ID
 * @param apiKey 厂商 API Key
 * @param baseUrl 可选的自定义 Base URL
 * @returns 模型列表
 */
export async function fetchProviderModels(
  providerId: string,
  apiKey: string,
  baseUrl?: string
): Promise<ProviderModel[]> {
  const config = PROVIDER_API_CONFIG[providerId]
  if (!config) {
    console.error(`[Provider Models] 不支持的厂商: ${providerId}`)
    return []
  }

  try {
    // 使用自定义 Base URL（如果提供）
    let url = config.listModelsUrl
    if (baseUrl) {
      const urlObj = new URL(config.listModelsUrl)
      const customUrlObj = new URL(baseUrl)
      url = `${customUrlObj.origin}${urlObj.pathname}`
    }

    // Google API 需要在 URL 中添加 API Key
    if (providerId === 'google') {
      url = `${url}?key=${apiKey}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: config.headers(apiKey),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Provider Models] API 请求失败 (${response.status}):`, errorText)
      return []
    }

    const data = await response.json()
    const models = config.parseResponse(data)

    return models
  } catch (error) {
    console.error(`[Provider Models] 获取模型列表失败:`, error)
    return []
  }
}

/**
 * 检查模型 ID 是否属于指定厂商
 * 注意：这个函数现在只能做基本的前缀检查，因为模型列表是动态的
 */
export function isValidProviderModel(providerId: string, modelId: string): boolean {
  // 基本的前缀检查
  const prefixMap: Record<string, string[]> = {
    deepseek: ['deepseek-'],
    openai: ['gpt-'],
    google: ['gemini-'],
    anthropic: ['claude-'],
    qwen: ['qwen-'],
    moonshotai: ['moonshot-'],
    'z-ai': ['glm-'],
    minimax: ['abab'],
    bytedance: ['doubao-'],
  }

  const prefixes = prefixMap[providerId] || []
  return prefixes.some(prefix => modelId.startsWith(prefix))
}
