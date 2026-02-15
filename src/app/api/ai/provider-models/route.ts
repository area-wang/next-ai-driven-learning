/**
 * 厂商模型列表 API
 * 从各厂商的 API 动态获取模型列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchProviderModels } from '@/lib/ai/provider-models'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { getDbClient } from '@/lib/db-connection'
import { aiProviders } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { decodeApiKey } from '@/lib/crypto'

export const runtime = 'nodejs'

/**
 * GET - 获取指定厂商的模型列表
 * 查询参数:
 * - provider: 厂商 ID (必需)
 * - apiKey: API Key (必需)
 * - baseUrl: 自定义 Base URL (可选)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const apiKey = searchParams.get('apiKey')
    const baseUrl = searchParams.get('baseUrl') || undefined
    const useSavedKey = searchParams.get('useSavedKey') === 'true'

    if (!provider) {
      return NextResponse.json(
        { success: false, error: '缺少 provider 参数' },
        { status: 400 }
      )
    }

    let finalApiKey = apiKey

    // 如果使用保存的 Key，从数据库获取
    if (useSavedKey) {
      const userId = await getCurrentUserId()
      if (!userId) {
        return NextResponse.json(
          { success: false, error: '未登录' },
          { status: 401 }
        )
      }

      const db = await getDbClient(request as any)
      if (!db) {
        return NextResponse.json(
          { success: false, error: '数据库连接失败' },
          { status: 500 }
        )
      }

      const configs = await db
        .select()
        .from(aiProviders)
        .where(
          and(
            eq(aiProviders.userId, userId),
            eq(aiProviders.provider, provider)
          )
        )
        .limit(1)

      if (configs.length === 0 || !configs[0].apiKey) {
        return NextResponse.json(
          { success: false, error: '未找到该厂商的 API Key 配置' },
          { status: 404 }
        )
      }

      // 解密 API Key
      finalApiKey = decodeApiKey(configs[0].apiKey)
    }

    if (!finalApiKey) {
      return NextResponse.json(
        { success: false, error: '缺少 apiKey 参数' },
        { status: 400 }
      )
    }

    console.log(`[Provider Models API] 获取 ${provider} 的模型列表`)

    const models = await fetchProviderModels(provider, finalApiKey, baseUrl)

    return NextResponse.json({
      success: true,
      data: {
        provider,
        models,
        total: models.length,
      },
    })
  } catch (error) {
    console.error('[Provider Models API] 获取模型列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取模型列表失败',
      },
      { status: 500 }
    )
  }
}
