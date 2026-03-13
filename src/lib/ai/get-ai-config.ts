/**
 * 统一的 AI 配置获取函数
 * 根据用户配置和模型信息，返回正确的 API Key 和 Base URL
 */

import { getDbClient } from '@/lib/db-connection'
import { aiProviders, aiModels, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
  messageFormat?: 'openai' | 'anthropic' // 消息格式（用于自定义厂商）
}

/**
 * 从模型 ID 中提取厂商 ID
 * 例如：'openai/gpt-4' -> 'openai'
 * 例如：'anthropic/claude-3.5-sonnet' -> 'anthropic'（OpenRouter 模型）
 * 例如：'stepfun/step-3.5-flash:free' -> 'openrouter'（OpenRouter 模型）
 * 例如：'deepseek-chat' -> 'deepseek'（从模型名称推断）
 */
function extractProviderId(modelId: string): string {
  // OpenRouter 模型的特征：
  // 1. 包含 / 分隔符
  // 2. 第一部分是厂商名（如 anthropic, stepfun, google 等）
  // 3. 可能包含 : 后缀（如 :free）

  if (modelId.includes('/')) {
    const firstPart = modelId.split('/')[0]

    // 检查是否是"其他"厂商（格式：other-xxx）
    if (firstPart.startsWith('other-')) {
      return firstPart
    }

    // 检查第一部分是否是已知的独立厂商
    const knownProviders = ['openai', 'google', 'deepseek', 'anthropic', 'qwen', 'moonshotai', 'z-ai', 'minimax', 'bytedance']

    // 如果是已知的独立厂商，直接返回
    if (knownProviders.includes(firstPart)) {
      return firstPart
    }

    // 否则，这是一个 OpenRouter 模型（如 stepfun/step-3.5-flash:free）
    return 'openrouter'
  }

  // 如果不包含 /，尝试从模型名称推断厂商
  // 常见模式：厂商名-模型名（如 deepseek-chat, qwen-turbo）
  const providerPatterns: Record<string, RegExp> = {
    'deepseek': /^deepseek/i,
    'openai': /^(gpt|o1|chatgpt)/i,
    'google': /^gemini/i,
    'anthropic': /^claude/i,
    'qwen': /^qwen/i,
    'moonshotai': /^moonshot/i,
    'z-ai': /^glm/i,
    'minimax': /^abab/i,
    'bytedance': /^doubao/i,
  }

  for (const [providerId, pattern] of Object.entries(providerPatterns)) {
    if (pattern.test(modelId)) {
      return providerId
    }
  }

  // 如果无法推断，返回原始 ID
  return modelId
}

/**
 * 获取用户的默认模型配置
 * @param request - Next.js Request 对象
 * @param userId - 用户 ID
 * @returns 默认模型的配置，如果没有则返回 null
 */
export async function getUserDefaultModel(
  request: Request,
  userId: string
): Promise<{ modelId: string; provider: string } | null> {
  try {
    const db = getDbClient(request)
    if (!db) return null

    const defaultModel = await db
      .select()
      .from(aiModels)
      .where(
        and(
          eq(aiModels.userId, userId),
          eq(aiModels.isDefault, true)
        )
      )
      .limit(1)

    if (defaultModel.length > 0) {
      return {
        modelId: defaultModel[0].modelId,
        provider: defaultModel[0].provider,
      }
    }

    // 如果没有设置默认模型，返回第一个选中的模型
    const firstModel = await db
      .select()
      .from(aiModels)
      .where(
        and(
          eq(aiModels.userId, userId),
          eq(aiModels.isSelected, true)
        )
      )
      .limit(1)

    if (firstModel.length > 0) {
      return {
        modelId: firstModel[0].modelId,
        provider: firstModel[0].provider,
      }
    }

    return null
  } catch (error) {
    console.error('[AI Config] 获取默认模型失败:', error)
    return null
  }
}

/**
 * 获取 AI 配置
 * 根据模型 ID 自动识别厂商，并返回对应的配置
 *
 * @param request - Next.js Request 对象
 * @param userId - 用户 ID
 * @param modelId - 可选的模型 ID，如果不提供则使用用户的默认模型
 * @returns AI 配置对象
 */
export async function getAIConfig(
  request: Request,
  userId: string,
  modelId?: string
): Promise<AIConfig> {
  const db = getDbClient(request)
  if (!db) {
    throw new Error('数据库连接失败')
  }

  // 如果没有提供 modelId，使用用户的默认模型
  let finalModelId = modelId
  if (!finalModelId) {
    const defaultModel = await getUserDefaultModel(request, userId)
    if (!defaultModel) {
      throw new Error('未配置默认模型，请在设置页面选择模型')
    }
    finalModelId = defaultModel.modelId
  }

  // 从模型 ID 中提取厂商 ID
  const providerId = extractProviderId(finalModelId)

  // 查询该厂商的配置
  const providerConfig = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.userId, userId),
        eq(aiProviders.provider, providerId),
        eq(aiProviders.isEnabled, true)
      )
    )
    .limit(1)

  if (providerConfig.length > 0 && providerConfig[0].apiKey) {
    // 处理模型 ID
    // OpenRouter: 'anthropic/claude-3.5-sonnet' -> 保持不变（OpenRouter 需要完整的 provider/model 格式）
    // OpenRouter: 'stepfun/step-3.5-flash:free' -> 保持不变
    // 独立厂商: 'deepseek/deepseek-chat' -> 'deepseek-chat'
    // 其他厂商: 'other-xxx/gpt-5.2' -> 'gpt-5.2'
    let actualModelId = finalModelId

    if (providerId === 'openrouter') {
      // OpenRouter: 保持完整的模型 ID（provider/model 格式）
      actualModelId = finalModelId
    } else if (providerId.startsWith('other-')) {
      // 其他厂商: 去掉 'other-xxx/' 前缀
      if (finalModelId.includes('/')) {
        const parts = finalModelId.split('/')
        actualModelId = parts.length > 1 ? parts[1] : finalModelId
      }
    } else if (finalModelId.includes('/')) {
      // 其他厂商: 去掉厂商前缀
      const parts = finalModelId.split('/')
      actualModelId = parts.length > 1 ? parts[1] : finalModelId
    }

    return {
      apiKey: providerConfig[0].apiKey,
      baseUrl: providerConfig[0].baseUrl || getDefaultBaseUrl(providerId),
      model: actualModelId,
      messageFormat: providerConfig[0].messageFormat as 'openai' | 'anthropic' || 'openai',
    }
  }

  throw new Error(`厂商 "${providerId}" 未配置或未启用（模型 ID: ${finalModelId}）。请在设置页面配置该厂商的 API Key`)
}

/**
 * 获取厂商的默认 Base URL
 */
function getDefaultBaseUrl(providerId: string): string {
  const baseUrls: Record<string, string> = {
    'openrouter': 'https://openrouter.ai/api/v1',
    'openai': 'https://api.openai.com/v1',
    'google': 'https://generativelanguage.googleapis.com/v1',
    'deepseek': 'https://api.deepseek.com/v1',
    'anthropic': 'https://api.anthropic.com/v1',
    'qwen': 'https://dashscope.aliyuncs.com/api/v1',
    'moonshotai': 'https://api.moonshot.cn/v1',
    'z-ai': 'https://open.bigmodel.cn/api/paas/v4',
    'minimax': 'https://api.minimax.chat/v1',
    'bytedance': 'https://ark.cn-beijing.volces.com/api/v3',
  }

  return baseUrls[providerId] || 'https://openrouter.ai/api/v1'
}

/**
 * 简化版本：只获取 API Key 和 Base URL，不需要模型 ID
 * 适用于不需要指定模型的场景（如测试连接）
 */
export async function getAIApiKey(
  request: Request,
  userId: string,
  providerId?: string
): Promise<{ apiKey: string; baseUrl: string }> {
  const db = getDbClient(request)
  if (!db) {
    throw new Error('数据库连接失败')
  }

  // 如果指定了厂商，尝试获取该厂商的配置
  if (providerId) {
    const providerConfig = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.userId, userId),
          eq(aiProviders.provider, providerId),
          eq(aiProviders.isEnabled, true)
        )
      )
      .limit(1)

    if (providerConfig.length > 0 && providerConfig[0].apiKey) {
      return {
        apiKey: providerConfig[0].apiKey,
        baseUrl: providerConfig[0].baseUrl || getDefaultBaseUrl(providerId),
      }
    }

    throw new Error(`厂商 "${providerId}" 未配置或未启用`)
  }

  // 默认使用 OpenRouter 配置
  const openrouterConfig = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.userId, userId),
        eq(aiProviders.provider, 'openrouter'),
        eq(aiProviders.isEnabled, true)
      )
    )
    .limit(1)

  if (openrouterConfig.length > 0 && openrouterConfig[0].apiKey) {
    return {
      apiKey: openrouterConfig[0].apiKey,
      baseUrl: openrouterConfig[0].baseUrl || 'https://openrouter.ai/api/v1',
    }
  }

  throw new Error('未配置 AI API Key。请在设置页面配置')
}

/**
 * 根据 AI 配置创建对应的 AI 客户端
 * 自动处理不同厂商的消息格式
 */
export function createAIClientFromConfig(config: AIConfig) {
  const { createAIClient } = require('./client')
  
  // 根据消息格式和 baseUrl 判断厂商类型
  const messageFormat = config.messageFormat || 'openai'
  
  return createAIClient({
    provider: 'custom',
    apiKey: config.apiKey,
    model: config.model,
    baseURL: config.baseUrl,
    messageFormat,
  })
}
