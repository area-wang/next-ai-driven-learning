/**
 * 获取用户的 AI 配置
 * 返回默认模型
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { getDbClient } from '@/lib/db-connection'
import { aiModels } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    // 获取用户的默认模型
    const defaultModelResult = await db
      .select()
      .from(aiModels)
      .where(
        and(
          eq(aiModels.userId, userId),
          eq(aiModels.isDefault, true)
        )
      )
      .limit(1)

    let defaultModel = null
    if (defaultModelResult.length > 0) {
      defaultModel = {
        id: defaultModelResult[0].modelId,
        name: defaultModelResult[0].modelName,
        provider: defaultModelResult[0].provider,
      }
    } else {
      // 如果没有默认模型，返回第一个选中的模型
      const firstModelResult = await db
        .select()
        .from(aiModels)
        .where(
          and(
            eq(aiModels.userId, userId),
            eq(aiModels.isSelected, true)
          )
        )
        .limit(1)

      if (firstModelResult.length > 0) {
        defaultModel = {
          id: firstModelResult[0].modelId,
          name: firstModelResult[0].modelName,
          provider: firstModelResult[0].provider,
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        defaultModel,
      },
    })
  } catch (error) {
    console.error('[AI Config API] 错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取配置失败' },
      { status: 500 }
    )
  }
}
