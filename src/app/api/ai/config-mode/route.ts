/**
 * 用户 AI 配置模式 API
 * 管理用户选择的配置模式（OpenRouter 或独立厂商）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'

/**
 * GET - 获取用户的配置模式
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

    const user = await db
      .select({ configMode: users.configMode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        configMode: user[0].configMode || 'openrouter',
      },
    })
  } catch (error) {
    console.error('获取配置模式失败:', error)
    return NextResponse.json(
      { success: false, error: '获取配置模式失败' },
      { status: 500 }
    )
  }
}

/**
 * POST - 更新用户的配置模式
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json() as { configMode: 'openrouter' | 'independent' }
    const { configMode } = body

    if (!configMode || !['openrouter', 'independent'].includes(configMode)) {
      return NextResponse.json(
        { success: false, error: '无效的配置模式' },
        { status: 400 }
      )
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    await db
      .update(users)
      .set({ configMode, updatedAt: new Date() })
      .where(eq(users.id, userId))

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('更新配置模式失败:', error)
    return NextResponse.json(
      { success: false, error: '更新配置模式失败' },
      { status: 500 }
    )
  }
}
