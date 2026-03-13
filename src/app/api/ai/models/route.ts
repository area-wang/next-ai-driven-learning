import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { aiProviders } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { getStaticProviderModels, getProviderInfo } from '@/lib/ai/static-provider-models'

export const runtime = 'nodejs'

// OpenRouter API 返回的模型数据结构
interface OpenRouterModel {
  id: string
  name: string
  created: number
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
}

interface OpenRouterResponse {
  data: OpenRouterModel[]
}

// 我们的模型数据结构
export interface AIModel {
  id: string           // 模型 ID，如 "openai/gpt-4"
  name: string         // 模型显示名称
  provider: string     // 厂商名称（中文）
  providerId: string   // 厂商 ID（英文）
  contextLength: number // 上下文长度
  pricing: {
    prompt: number     // 输入价格（每 1M tokens）
    completion: number // 输出价格（每 1M tokens）
  }
}

/**
 * 获取所有厂商的可用模型
 * 包括：
 * 1. 用户已配置的厂商（从 aiProviders 表）
 * 2. 静态模型列表（从 static-provider-models）
 * 3. OpenRouter 模型（从 OpenRouter API）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    // 获取用户已配置且启用的厂商
    const enabledProviders = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.userId, userId),
          eq(aiProviders.isEnabled, true)
        )
      )

    const processedModels: AIModel[] = []

    for (const provider of enabledProviders) {
      const providerInfo = getProviderInfo(provider.provider)

      // 如果有自定义模型列表（用于"其他"厂商）
      if (provider.customModels) {
        try {
          const customModels = JSON.parse(provider.customModels)
          if (Array.isArray(customModels) && customModels.length > 0) {
            customModels.forEach((model: { id: string; name: string }) => {
              processedModels.push({
                id: `${provider.provider}/${model.id}`,
                name: model.name,
                provider: provider.customProviderName || provider.provider,
                providerId: provider.provider,
                contextLength: 8000,
                pricing: { prompt: 0, completion: 0 },
              })
            })
            continue
          }
        } catch (e) {
          console.error('解析 customModels 失败:', e)
        }
      }

      // 从静态定义中获取该厂商的所有模型
      const staticModels = getStaticProviderModels(provider.provider)

      for (const model of staticModels) {
        processedModels.push({
          id: `${provider.provider}/${model.id}`,
          name: model.name,
          provider: providerInfo?.name || provider.provider,
          providerId: provider.provider,
          contextLength: model.contextLength,
          pricing: { prompt: 0, completion: 0 },
        })
      }

      // 如果是 OpenRouter，从 API 获取实时模型列表
      if (provider.provider === 'openrouter' && provider.apiKey) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
            },
          })

          if (response.ok) {
            const data = await response.json() as OpenRouterResponse
            data.data.forEach(model => {
              // OpenRouter 模型 ID 格式：provider/model（如 anthropic/claude-3.5-sonnet）
              // 保持完整的模型 ID，不添加额外前缀
              const [modelProvider] = model.id.split('/')
              if (modelProvider) {
                processedModels.push({
                  id: model.id, // 保持原始格式：provider/model
                  name: model.name,
                  provider: 'OpenRouter', // 统一显示为 OpenRouter
                  providerId: 'openrouter', // 标记为 openrouter，用于配置查找
                  contextLength: model.context_length,
                  pricing: {
                    prompt: parseFloat(model.pricing.prompt) * 1000000, // 转换为每 1M tokens
                    completion: parseFloat(model.pricing.completion) * 1000000,
                  },
                })
              }
            })
          }
        } catch (error) {
          console.error('获取 OpenRouter 模型列表失败:', error)
        }
      }
    }

    // 去重：相同的模型 ID 只保留一个
    const uniqueModels = Array.from(
      new Map(processedModels.map(m => [m.id, m])).values()
    )

    return NextResponse.json({
      success: true,
      data: uniqueModels,
    })
  } catch (error) {
    console.error('获取模型列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取模型列表失败' },
      { status: 500 }
    )
  }
}
