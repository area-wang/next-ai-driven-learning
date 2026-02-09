import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { cornellNotes, knowledgeContents } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/cornell/notes - 获取康奈尔笔记列表
 * POST /api/cornell/notes - 创建康奈尔笔记
 */

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const outlineId = searchParams.get('contentId') // 实际上是 outlineId

    const conditions = [eq(cornellNotes.userId, userId)]
    
    if (outlineId) {
      // 根据 outlineId 查找对应的 knowledge_contents
      const content = await db
        .select()
        .from(knowledgeContents)
        .where(eq(knowledgeContents.outlineId, outlineId))
        .limit(1)
      
      if (content.length > 0) {
        conditions.push(eq(cornellNotes.contentId, content[0].id))
      } else {
        // 如果没找到，返回空数组
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
    }

    const results = await db
      .select()
      .from(cornellNotes)
      .where(and(...conditions))
      .orderBy(desc(cornellNotes.createdAt))

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('获取康奈尔笔记失败:', error)
    return NextResponse.json({ error: '获取康奈尔笔记失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as {
      contentId: string // 实际上是 outlineId
      mainNotes: string
      cues?: string
      summary?: string
    }

    const { contentId: outlineId, mainNotes, cues, summary } = body

    if (!outlineId || !mainNotes) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 根据 outlineId 查找对应的 knowledge_contents
    const content = await db
      .select()
      .from(knowledgeContents)
      .where(eq(knowledgeContents.outlineId, outlineId))
      .limit(1)
    
    if (content.length === 0) {
      return NextResponse.json({ 
        error: '未找到对应的学习内容'
      }, { status: 400 })
    }

    const actualContentId = content[0].id

    const result = await db.insert(cornellNotes).values({
      userId,
      contentId: actualContentId,
      mainNotes,
      cues: cues || null,
      summary: summary || null,
    }).returning()

    return NextResponse.json({
      success: true,
      data: result[0],
      message: '康奈尔笔记已保存'
    })
  } catch (error) {
    console.error('创建康奈尔笔记失败:', error)
    return NextResponse.json({ 
      error: '创建康奈尔笔记失败'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as {
      id: string
      mainNotes?: string
      cues?: string
      summary?: string
    }

    const { id, mainNotes, cues, summary } = body

    if (!id) {
      return NextResponse.json({ error: '缺少笔记 ID' }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date(),
    }
    if (mainNotes !== undefined) updateData.mainNotes = mainNotes
    if (cues !== undefined) updateData.cues = cues
    if (summary !== undefined) updateData.summary = summary

    const result = await db
      .update(cornellNotes)
      .set(updateData)
      .where(and(eq(cornellNotes.id, id), eq(cornellNotes.userId, userId)))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: '笔记不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result[0],
      message: '康奈尔笔记已更新'
    })
  } catch (error) {
    console.error('更新康奈尔笔记失败:', error)
    return NextResponse.json({ 
      error: '更新康奈尔笔记失败'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少笔记 ID' }, { status: 400 })
    }

    await db
      .delete(cornellNotes)
      .where(and(eq(cornellNotes.id, id), eq(cornellNotes.userId, userId)))

    return NextResponse.json({
      success: true,
      message: '康奈尔笔记已删除'
    })
  } catch (error) {
    console.error('删除康奈尔笔记失败:', error)
    return NextResponse.json({ error: '删除康奈尔笔记失败' }, { status: 500 })
  }
}
