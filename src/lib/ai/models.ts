/**
 * AI 模型配置和管理
 * 支持多个 LLM 提供商的模型选择
 */

import { AIProvider } from './client'

export interface ModelInfo {
  id: string
  name: string
  provider: AIProvider
  description: string
  contextWindow: number
  costPer1kTokens: number
  speed: 'fast' | 'medium' | 'slow'
  capabilities: string[]
  requiresApiKey: boolean
}

export interface ModelConfig {
  provider: AIProvider
  model: string
  apiKey?: string
}

/**
 * 可用的 AI 模型列表
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  // OpenAI / ChatGPT
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: '最新的 GPT-4 优化版本，速度快，成本低',
    contextWindow: 128000,
    costPer1kTokens: 0.005,
    speed: 'fast',
    capabilities: ['文本生成', '代码生成', '推理', '多语言'],
    requiresApiKey: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: '轻量级 GPT-4，速度更快，成本更低',
    contextWindow: 128000,
    costPer1kTokens: 0.00015,
    speed: 'fast',
    capabilities: ['文本生成', '代码生成', '多语言'],
    requiresApiKey: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'GPT-4 的高性能版本',
    contextWindow: 128000,
    costPer1kTokens: 0.01,
    speed: 'medium',
    capabilities: ['文本生成', '代码生成', '推理', '多语言', '视觉理解'],
    requiresApiKey: true,
  },
  
  // DeepSeek
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    description: 'DeepSeek 的对话模型，性价比高',
    contextWindow: 32000,
    costPer1kTokens: 0.0001,
    speed: 'fast',
    capabilities: ['文本生成', '代码生成', '多语言'],
    requiresApiKey: true,
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'deepseek',
    description: 'DeepSeek 的代码专用模型',
    contextWindow: 16000,
    costPer1kTokens: 0.0001,
    speed: 'fast',
    capabilities: ['代码生成', '代码理解', '代码补全'],
    requiresApiKey: true,
  },
  
  // Google Gemini
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Google 最强大的模型，超大上下文窗口',
    contextWindow: 2000000,
    costPer1kTokens: 0.00125,
    speed: 'medium',
    capabilities: ['文本生成', '代码生成', '推理', '多语言', '视觉理解', '音频理解'],
    requiresApiKey: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'Google 的快速模型，平衡性能和成本',
    contextWindow: 1000000,
    costPer1kTokens: 0.000075,
    speed: 'fast',
    capabilities: ['文本生成', '代码生成', '多语言', '视觉理解'],
    requiresApiKey: true,
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (实验)',
    provider: 'gemini',
    description: 'Google 最新的实验性模型',
    contextWindow: 1000000,
    costPer1kTokens: 0,
    speed: 'fast',
    capabilities: ['文本生成', '代码生成', '多语言', '视觉理解', '实时交互'],
    requiresApiKey: true,
  },
  
  // Anthropic Claude
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    description: 'Anthropic 最新的平衡模型，推理能力强',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    speed: 'medium',
    capabilities: ['文本生成', '代码生成', '推理', '多语言', '长文本理解'],
    requiresApiKey: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'claude',
    description: 'Claude 的快速模型',
    contextWindow: 200000,
    costPer1kTokens: 0.0008,
    speed: 'fast',
    capabilities: ['文本生成', '代码生成', '多语言'],
    requiresApiKey: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'claude',
    description: 'Claude 最强大的模型',
    contextWindow: 200000,
    costPer1kTokens: 0.015,
    speed: 'slow',
    capabilities: ['文本生成', '代码生成', '推理', '多语言', '长文本理解', '复杂任务'],
    requiresApiKey: true,
  },
  
  // Cloudflare AI (免费)
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    provider: 'cloudflare',
    description: 'Cloudflare 提供的免费模型，无需 API Key',
    contextWindow: 8000,
    costPer1kTokens: 0,
    speed: 'fast',
    capabilities: ['文本生成', '代码生成', '多语言'],
    requiresApiKey: false,
  },
  {
    id: '@cf/meta/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'cloudflare',
    description: 'Cloudflare 提供的大型免费模型',
    contextWindow: 8000,
    costPer1kTokens: 0,
    speed: 'medium',
    capabilities: ['文本生成', '代码生成', '推理', '多语言'],
    requiresApiKey: false,
  },
]

/**
 * 按提供商分组的模型
 */
export const MODELS_BY_PROVIDER: Record<AIProvider, ModelInfo[]> = {
  openai: AVAILABLE_MODELS.filter(m => m.provider === 'openai'),
  deepseek: AVAILABLE_MODELS.filter(m => m.provider === 'deepseek'),
  gemini: AVAILABLE_MODELS.filter(m => m.provider === 'gemini'),
  claude: AVAILABLE_MODELS.filter(m => m.provider === 'claude'),
  cloudflare: AVAILABLE_MODELS.filter(m => m.provider === 'cloudflare'),
}

/**
 * 提供商信息
 */
export interface ProviderInfo {
  id: AIProvider
  name: string
  description: string
  website: string
  requiresApiKey: boolean
  apiKeyUrl: string
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: '业界领先的 AI 模型提供商',
    website: 'https://openai.com',
    requiresApiKey: true,
    apiKeyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '高性价比的中文友好 AI 模型',
    website: 'https://deepseek.com',
    requiresApiKey: true,
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google 的多模态 AI 模型',
    website: 'https://ai.google.dev',
    requiresApiKey: true,
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: '注重安全和推理能力的 AI 模型',
    website: 'https://anthropic.com',
    requiresApiKey: true,
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare AI',
    description: '免费的 AI 模型，无需 API Key',
    website: 'https://ai.cloudflare.com',
    requiresApiKey: false,
    apiKeyUrl: '',
  },
]

/**
 * 获取模型信息
 */
export function getModelInfo(provider: AIProvider, modelId: string): ModelInfo | undefined {
  return AVAILABLE_MODELS.find(m => m.provider === provider && m.id === modelId)
}

/**
 * 获取提供商信息
 */
export function getProviderInfo(provider: AIProvider): ProviderInfo | undefined {
  return PROVIDERS.find(p => p.id === provider)
}

/**
 * 获取默认模型
 */
export function getDefaultModel(provider: AIProvider): string {
  const models = MODELS_BY_PROVIDER[provider]
  return models[0]?.id || ''
}
