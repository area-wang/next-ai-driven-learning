/**
 * AI 厂商配置 API
 * 管理用户的各个 AI 厂商配置（API Key、Base URL、是否启用）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { aiProviders } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { decodeApiKey, isBase64Encoded } from '@/lib/crypto'

// export const runtime = 'edge'

/**
 * 脱敏 API Key
 * 格式：sk-****...****（显示前3位和后4位）
 */
function maskApiKey(apiKey: string | null): string {
  if (!apiKey || apiKey.length < 10) {
    return ''
  }
  const prefix = apiKey.slice(0, 3)
  const suffix = apiKey.slice(-4)
  return `${prefix}****...****${suffix}`
}

/**
 * GET - 获取用户的所有厂商配置
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
    const providers = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.userId, userId))

    // 解析 selectedModels JSON 字符串，并脱敏 API Key
    const providersWithParsedModels = providers.map(p => ({
      ...p,
      apiKey: maskApiKey(p.apiKey), // 脱敏 API Key
      selectedModels: p.selectedModels ? JSON.parse(p.selectedModels) as string[] : [],
    }))

    return NextResponse.json({
      success: true,
      data: providersWithParsedModels,
    })
  } catch (error) {
    console.error('获取厂商配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取厂商配置失败' },
      { status: 500 }
    )
  }
}

/**
 * POST - 创建或更新厂商配置
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Providers API] 开始处理保存请求')
    
    const userId = await getCurrentUserId()
    console.log('[Providers API] 用户 ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json() as {
      provider: string
      apiKey?: string
      baseUrl?: string
      isEnabled?: boolean
      selectedModels?: string[]
    }
    console.log('[Providers API] 请求体:', {
      provider: body.provider,
      hasApiKey: !!body.apiKey,
      apiKeyLength: body.apiKey?.length,
      baseUrl: body.baseUrl,
      isEnabled: body.isEnabled,
      selectedModelsCount: body.selectedModels?.length || 0,
    })
    
    const { provider, baseUrl, isEnabled, selectedModels } = body
    let { apiKey } = body

    if (!provider) {
      return NextResponse.json(
        { success: false, error: '厂商名称不能为空' },
        { status: 400 }
      )
    }

    // 解码 API Key（如果是 Base64 编码的）
    if (apiKey && isBase64Encoded(apiKey)) {
      console.log('[Providers API] 检测到 Base64 编码的 API Key，正在解码')
      apiKey = decodeApiKey(apiKey)
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      console.error('[Providers API] 数据库连接失败')
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    console.log('[Providers API] 数据库连接成功，查询现有配置')

    // 检查是否已存在该厂商配置
    const existing = await db
      .select()
      .from(aiProviders)
      .where(
        and(
          eq(aiProviders.userId, userId),
          eq(aiProviders.provider, provider)
        )
      )
      .limit(1)

    console.log('[Providers API] 现有配置:', existing.length > 0 ? '存在' : '不存在')

    if (existing.length > 0) {
      // 更新现有配置
      console.log('[Providers API] 更新现有配置, ID:', existing[0].id)
      
      await db
        .update(aiProviders)
        .set({
          apiKey: apiKey || null,
          baseUrl: baseUrl || null,
          isEnabled: isEnabled ?? false,
          selectedModels: selectedModels ? JSON.stringify(selectedModels) : null,
          updatedAt: new Date(),
        })
        .where(eq(aiProviders.id, existing[0].id))

      console.log('[Providers API] 更新成功')

      return NextResponse.json({
        success: true,
        data: { ...existing[0], apiKey, baseUrl, isEnabled, selectedModels },
      })
    } else {
      // 创建新配置
      console.log('[Providers API] 创建新配置')
      
      const newProvider = {
        id: crypto.randomUUID(),
        userId: userId,
        provider,
        apiKey: apiKey || null,
        baseUrl: baseUrl || null,
        isEnabled: isEnabled ?? false,
        selectedModels: selectedModels ? JSON.stringify(selectedModels) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.insert(aiProviders).values(newProvider)

      console.log('[Providers API] 创建成功, ID:', newProvider.id)

      return NextResponse.json({
        success: true,
        data: newProvider,
      })
    }
  } catch (error) {
    console.error('[Providers API] 保存厂商配置失败:', error)
    console.error('[Providers API] 错误详情:', error instanceof Error ? error.message : String(error))
    console.error('[Providers API] 错误堆栈:', error instanceof Error ? error.stack : '')
    
    return NextResponse.json(
      { 
        success: false, 
        error: '保存厂商配置失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - 删除厂商配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('id')

    if (!providerId) {
      return NextResponse.json(
        { success: false, error: '厂商配置 ID 不能为空' },
        { status: 400 }
      )
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    await db
      .delete(aiProviders)
      .where(
        and(
          eq(aiProviders.id, providerId),
          eq(aiProviders.userId, userId)
        )
      )

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('删除厂商配置失败:', error)
    return NextResponse.json(
      { success: false, error: '删除厂商配置失败' },
      { status: 500 }
    )
  }
}
