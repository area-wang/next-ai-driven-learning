import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { users, aiProviders } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { getStaticProviderModels } from '@/lib/ai/static-provider-models'

export const runtime = 'nodejs'

// 厂商映射配置 - 将厂商 ID 映射为中文显示名称
const PROVIDER_MAP: Record<string, string> = {
  'openai': 'OpenAI',
  'google': 'Gemini',
  'deepseek': 'DeepSeek',
  'anthropic': 'Anthropic',
  'z-ai': '智谱AI',
  'qwen': 'Qwen',
  'moonshotai': 'Kimi',
  'minimax': 'MiniMax',
  'bytedance': '豆包',
  'bytedance-seed': '豆包',
}

// 需要过滤的厂商前缀
const ALLOWED_PROVIDERS = Object.keys(PROVIDER_MAP)

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
    prompt: number     // 输入价格
    completion: number // 输出价格
  }
}

/**
 * 从 OpenRouter 获取模型列表并处理成我们需要的格式
 */
export async function GET(request: NextRequest) {
  try {
    // 获取用户 ID 和配置模式
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    // 获取用户的配置模式
    const user = await db
      .select({ configMode: users.configMode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const configMode = user[0]?.configMode || 'openrouter'

    // 根据配置模式返回不同的模型列表
    if (configMode === 'independent') {
      // 独立厂商模式：从数据库读取已配置且启用的厂商，返回这些厂商的所有可用模型
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
        // 从静态定义中获取该厂商的所有模型
        const providerModels = getStaticProviderModels(provider.provider)
        
        for (const model of providerModels) {
          processedModels.push({
            id: model.id, // 使用厂商官方格式的模型 ID
            name: model.name,
            provider: PROVIDER_MAP[provider.provider] || provider.provider,
            providerId: provider.provider,
            contextLength: model.contextLength,
            pricing: {
              prompt: 0,
              completion: 0,
            },
          })
        }
      }

      // 按厂商和名称排序
      processedModels.sort((a, b) => {
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider, 'zh-CN')
        }
        return a.name.localeCompare(b.name, 'zh-CN')
      })

      // 按厂商分组统计
      const providerStats = processedModels.reduce((acc, model) => {
        acc[model.provider] = (acc[model.provider] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return NextResponse.json({
        success: true,
        data: {
          models: processedModels,
          total: processedModels.length,
          providers: Object.keys(providerStats).map(name => ({
            name,
            count: providerStats[name],
          })),
        },
      })
    }

    // OpenRouter 模式：从 OpenRouter 获取模型列表
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // 缓存1小时
    })

    if (!response.ok) {
      throw new Error('Failed to fetch models from OpenRouter')
    }

    const data = await response.json() as OpenRouterResponse

    // 过滤并转换模型列表
    const processedModels: AIModel[] = data.data
      .filter((model) => {
        // 提取厂商 ID（模型 ID 的第一部分）
        const providerId = model.id.split('/')[0]
        // 只保留允许的厂商
        return ALLOWED_PROVIDERS.includes(providerId)
      })
      .map((model) => {
        // 提取厂商 ID
        const providerId = model.id.split('/')[0]
        // 获取厂商中文名称
        const providerName = PROVIDER_MAP[providerId] || providerId

        return {
          id: model.id,
          name: model.name,
          provider: providerName,
          providerId: providerId,
          contextLength: model.context_length,
          pricing: {
            prompt: parseFloat(model.pricing.prompt),
            completion: parseFloat(model.pricing.completion),
          },
        }
      })
      // 按厂商和名称排序
      .sort((a, b) => {
        // 先按厂商排序
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider, 'zh-CN')
        }
        // 同一厂商内按名称排序
        return a.name.localeCompare(b.name, 'zh-CN')
      })

    // 按厂商分组统计
    const providerStats = processedModels.reduce((acc, model) => {
      acc[model.provider] = (acc[model.provider] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        models: processedModels,
        total: processedModels.length,
        providers: Object.keys(providerStats).map(name => ({
          name,
          count: providerStats[name],
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          models: [],
          total: 0,
          providers: [],
        },
      },
      { status: 500 }
    )
  }
}
