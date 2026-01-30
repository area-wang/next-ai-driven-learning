import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { flashcards, knowledgeContents } from '@/db/schema'
import { eq, and, lte, or, isNull } from 'drizzle-orm'
import { initializeFlashcard } from '@/lib/learning-methods/sm2'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/flashcards - 获取闪卡列表
 * POST /api/flashcards - 创建闪卡
 */

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()
    console.log('[闪卡查询] 开始查询闪卡, userId:', userId)
    
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId') // 这里实际上可能是 outlineId
    const dueOnly = searchParams.get('dueOnly') === 'true'
    
    console.log('[闪卡查询] 查询参数:', { contentId, dueOnly })

    // 构建查询条件
    const conditions = [eq(flashcards.userId, userId)]
    
    if (contentId) {
      // 先尝试根据 outlineId 查找 knowledge_contents 记录
      console.log('[闪卡查询] 查找 knowledge_contents, outlineId:', contentId)
      const content = await db
        .select()
        .from(knowledgeContents)
        .where(eq(knowledgeContents.outlineId, contentId))
        .limit(1)
      
      console.log('[闪卡查询] knowledge_contents 查询结果:', content.length > 0 ? content[0].id : '未找到')
      
      if (content.length > 0) {
        // 如果找到了，使用 knowledge_contents 的 ID 查询闪卡
        conditions.push(eq(flashcards.contentId, content[0].id))
        console.log('[闪卡查询] 使用 contentId 查询:', content[0].id)
      } else {
        // 如果没找到，尝试直接使用 contentId 查询（兼容旧数据）
        conditions.push(eq(flashcards.contentId, contentId))
        console.log('[闪卡查询] 直接使用 contentId 查询:', contentId)
      }
    }

    if (dueOnly) {
      const now = new Date()
      conditions.push(
        or(
          lte(flashcards.nextReviewAt, now),
          isNull(flashcards.nextReviewAt)
        )!
      )
    }

    const results = await db
      .select()
      .from(flashcards)
      .where(and(...conditions))

    console.log('[闪卡查询] 查询结果数量:', results.length)
    if (results.length > 0) {
      console.log('[闪卡查询] 第一张闪卡:', {
        id: results[0].id,
        userId: results[0].userId,
        contentId: results[0].contentId,
        front: results[0].front.substring(0, 50)
      })
    }

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length
    })
  } catch (error) {
    console.error('[闪卡查询] 获取闪卡失败:', error)
    return NextResponse.json({ error: '获取闪卡失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()
    
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const body = await request.json() as {
      front: string
      back: string
      contentId?: string
      tags?: string[]
    }

    const { front, back, contentId, tags } = body

    if (!front || !back) {
      return NextResponse.json({ error: '正面和背面内容不能为空' }, { status: 400 })
    }

    const initialState = initializeFlashcard()

    const result = await db.insert(flashcards).values({
      userId,
      contentId: contentId || null,
      front,
      back,
      tags: tags ? JSON.stringify(tags) : null,
      easinessFactor: Math.round(initialState.easinessFactor * 1000),
      repetitions: initialState.repetitions,
      interval: initialState.interval,
    }).returning()

    return NextResponse.json({
      success: true,
      data: result[0],
      message: '闪卡创建成功'
    })
  } catch (error) {
    console.error('创建闪卡失败:', error)
    return NextResponse.json({ error: '创建闪卡失败' }, { status: 500 })
  }
}
