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
}

/**
 * 从模型 ID 中提取厂商 ID
 * 例如：'openai/gpt-4' -> 'openai'
 * 例如：'deepseek-chat' -> 'deepseek'（从模型名称推断）
 */
function extractProviderId(modelId: string): string {
  // 如果包含 /，直接提取前缀
  if (modelId.includes('/')) {
    return modelId.split('/')[0]
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
      console.log(`[AI Config] 从模型 ID "${modelId}" 推断出厂商: ${providerId}`)
      return providerId
    }
  }
  
  // 如果无法推断，返回原始 ID（可能会导致错误，但至少有日志）
  console.warn(`[AI Config] 无法从模型 ID "${modelId}" 提取厂商 ID，返回原始值`)
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
 * 根据用户的配置模式决定使用哪个 API:
 * - OpenRouter 模式：使用 OpenRouter API
 * - 独立厂商模式：使用对应厂商的独立 API
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

  // 获取用户的配置模式
  const user = await db
    .select({ configMode: users.configMode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const configMode = user[0]?.configMode || 'openrouter'

  // 如果没有提供 modelId，使用用户的默认模型
  let finalModelId = modelId
  if (!finalModelId) {
    const defaultModel = await getUserDefaultModel(request, userId)
    if (!defaultModel) {
      throw new Error('未配置默认模型，请在设置页面选择模型')
    }
    finalModelId = defaultModel.modelId
  }

  console.log(`[AI Config] 配置模式: ${configMode}`)
  console.log(`[AI Config] 模型 ID: ${finalModelId}`)

  // 根据配置模式选择 API
  if (configMode === 'independent') {
    // 独立厂商模式：从模型 ID 中提取厂商 ID，使用该厂商的 API
    const providerId = extractProviderId(finalModelId)
    
    console.log(`[AI Config] 提取的厂商 ID: ${providerId}`)
    
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
      // 独立厂商模式：去掉模型 ID 的厂商前缀
      // 例如：'deepseek/deepseek-chat' -> 'deepseek-chat'
      const actualModelId = finalModelId.includes('/') 
        ? finalModelId.split('/')[1] 
        : finalModelId
      
      console.log(`[AI Config] 使用厂商独立配置: ${providerId}`)
      console.log(`[AI Config] Base URL: ${providerConfig[0].baseUrl || getDefaultBaseUrl(providerId)}`)
      console.log(`[AI Config] 原始模型 ID: ${finalModelId}`)
      console.log(`[AI Config] 实际调用模型 ID: ${actualModelId}`)
      
      return {
        apiKey: providerConfig[0].apiKey,
        baseUrl: providerConfig[0].baseUrl || getDefaultBaseUrl(providerId),
        model: actualModelId, // 使用不带前缀的模型 ID
      }
    }

    throw new Error(`厂商 "${providerId}" 未配置或未启用（模型 ID: ${finalModelId}）。请在设置页面配置该厂商的 API Key`)
  }

  // OpenRouter 模式：使用 OpenRouter API
  // 从数据库读取 OpenRouter API Key
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
    console.log('[AI Config] 使用 OpenRouter 统一配置')
    console.log(`[AI Config] Model: ${finalModelId}`)
    return {
      apiKey: openrouterConfig[0].apiKey,
      baseUrl: openrouterConfig[0].baseUrl || 'https://openrouter.ai/api/v1',
      model: finalModelId,
    }
  }

  throw new Error(
    'OpenRouter 未配置。请在设置页面配置 OpenRouter API Key'
  )
}

/**
 * 获取厂商的默认 Base URL
 */
function getDefaultBaseUrl(providerId: string): string {
  const baseUrls: Record<string, string> = {
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
