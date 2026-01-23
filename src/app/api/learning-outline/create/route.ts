/**
 * 创建单个学习大纲项 API
 * 用于手动创建大纲项（不使用 AI 生成）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { learningOutlines } from '@/db/schema'

interface CreateRequest {
  planId: string
  parentId?: string
  title: string
  description?: string
  level?: number
  order?: number
  estimatedTime?: number
  isTestDocument?: boolean  // 添加测试题文档标志
}

export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    const body = await request.json() as CreateRequest
    const { planId, parentId, title, description, level = 0, order = 0, estimatedTime, isTestDocument = false } = body

    if (!planId || !title) {
      return NextResponse.json(
        { error: 'planId 和 title 不能为空' },
        { status: 400 }
      )
    }

    // 创建大纲项
    const [outline] = await db.insert(learningOutlines).values({
      planId,
      parentId: parentId || null,
      title,
      description: description || null,
      level,
      order,
      estimatedTime: estimatedTime || null,
      isTestDocument,  // 设置测试题文档标志
    }).returning()

    return NextResponse.json({ outline })
  } catch (error) {
    console.error('创建大纲项失败:', error)
    return NextResponse.json(
      { error: '创建大纲项失败' },
      { status: 500 }
    )
  }
}
