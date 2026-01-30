/**
 * 静态厂商模型列表
 * 用于独立厂商配置模式下的模型选择
 */

export interface StaticProviderModel {
  id: string // 模型 ID（厂商官方格式）
  name: string // 模型显示名称
  contextLength: number // 上下文长度
}

/**
 * 各厂商支持的模型列表（静态定义）
 */
export const STATIC_PROVIDER_MODELS: Record<string, StaticProviderModel[]> = {
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
