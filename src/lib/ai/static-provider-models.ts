/**
 * 静态厂商模型列表
 * 用于独立厂商配置模式下的模型选择
 */

export interface StaticProviderModel {
  id: string // 模型 ID（厂商官方格式）
  name: string // 模型显示名称
  contextLength: number // 上下文长度
}

export interface ProviderInfo {
  id: string
  name: string
  description: string
  baseUrl: string
  messageFormat: 'openai' | 'anthropic'
  requiresApiKey: boolean
  supportsCustomModels?: boolean // 是否支持用户自定义模型
}

/**
 * 厂商信息列表
 */
export const AI_PROVIDERS: ProviderInfo[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '聚合多个 AI 模型的统一接口，支持 OpenAI、Anthropic、Google 等多家厂商的模型',
    baseUrl: 'https://openrouter.ai/api/v1',
    messageFormat: 'openai',
    requiresApiKey: true,
    supportsCustomModels: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'ChatGPT、GPT-4 等模型的官方 API',
    baseUrl: 'https://api.openai.com/v1',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 系列模型的官方 API',
    baseUrl: 'https://api.anthropic.com/v1',
    messageFormat: 'anthropic',
    requiresApiKey: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek 系列模型',
    baseUrl: 'https://api.deepseek.com/v1',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini 系列模型',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
  {
    id: 'qwen',
    name: '通义千问',
    description: '阿里云通义千问系列模型',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
  {
    id: 'moonshotai',
    name: 'Moonshot AI',
    description: 'Kimi 系列模型（月之暗面）',
    baseUrl: 'https://api.moonshot.cn/v1',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
  {
    id: 'z-ai',
    name: '智谱 AI',
    description: 'GLM 系列模型',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    description: 'Abab 系列模型',
    baseUrl: 'https://api.minimax.chat/v1',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
  {
    id: 'bytedance',
    name: '豆包',
    description: '字节跳动豆包系列模型',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    messageFormat: 'openai',
    requiresApiKey: true,
  },
]

/**
 * 各厂商支持的模型列表（静态定义）
 */
export const STATIC_PROVIDER_MODELS: Record<string, StaticProviderModel[]> = {
  // OpenRouter - 常用模型列表
  openrouter: [
    { id: 'openai/gpt-4o', name: 'GPT-4o', contextLength: 128000 },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000 },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', contextLength: 200000 },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', contextLength: 200000 },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', contextLength: 1048576 },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', contextLength: 128000 },
    { id: 'deepseek/deepseek-reasoner', name: 'DeepSeek Reasoner', contextLength: 128000 },
  ],

  // DeepSeek
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', contextLength: 128000 },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', contextLength: 128000 },
  ],

  // OpenAI
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextLength: 128000 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextLength: 16385 },
  ],

  // Google (Gemini)
  google: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextLength: 1048576 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextLength: 1048576 },
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', contextLength: 1048576 },
  ],

  // Anthropic (Claude)
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextLength: 200000 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextLength: 200000 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextLength: 200000 },
  ],

  // Qwen (通义千问)
  qwen: [
    { id: 'qwen-turbo', name: 'Qwen Turbo', contextLength: 8000 },
    { id: 'qwen-plus', name: 'Qwen Plus', contextLength: 32000 },
    { id: 'qwen-max', name: 'Qwen Max', contextLength: 8000 },
  ],

  // Kimi (月之暗面)
  moonshotai: [
    { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', contextLength: 8000 },
    { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', contextLength: 32000 },
    { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', contextLength: 128000 },
  ],

  // 智谱AI
  'z-ai': [
    { id: 'glm-4', name: 'GLM-4', contextLength: 128000 },
    { id: 'glm-4-plus', name: 'GLM-4 Plus', contextLength: 128000 },
    { id: 'glm-4-air', name: 'GLM-4 Air', contextLength: 128000 },
  ],

  // MiniMax
  minimax: [
    { id: 'abab6.5-chat', name: 'Abab 6.5 Chat', contextLength: 8192 },
    { id: 'abab6.5s-chat', name: 'Abab 6.5s Chat', contextLength: 8192 },
  ],

  // 豆包 (字节跳动)
  bytedance: [
    { id: 'doubao-pro-32k', name: '豆包 Pro 32K', contextLength: 32000 },
    { id: 'doubao-lite-32k', name: '豆包 Lite 32K', contextLength: 32000 },
  ],

  // 其他厂商（用户自定义）
  other: [
    { id: 'custom-model', name: '自定义模型', contextLength: 8000 },
  ],
}

/**
 * 获取指定厂商的模型列表
 */
export function getStaticProviderModels(providerId: string): StaticProviderModel[] {
  return STATIC_PROVIDER_MODELS[providerId] || []
}

/**
 * 获取所有厂商的模型列表
 */
export function getAllStaticProviderModels(): Record<string, StaticProviderModel[]> {
  return STATIC_PROVIDER_MODELS
}

/**
 * 获取指定厂商的信息
 */
export function getProviderInfo(providerId: string): ProviderInfo | undefined {
  return AI_PROVIDERS.find(p => p.id === providerId)
}

/**
 * 获取所有厂商信息
 */
export function getAllProviders(): ProviderInfo[] {
  return AI_PROVIDERS
}
