import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { pomodoroSessions } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * POST /api/pomodoro/session - 开始番茄钟会话
 * PUT /api/pomodoro/session - 更新番茄钟会话（完成或中断）
 */

export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as {
      contentId?: string
      duration: number // 秒
      sessionType?: 'work' | 'short_break' | 'long_break'
    }

    const { contentId, duration, sessionType = 'work' } = body

    if (!duration || duration <= 0) {
      return NextResponse.json({ error: '时长必须大于0' }, { status: 400 })
    }

    const now = new Date()
    const endTime = new Date(now.getTime() + duration * 1000)

    const result = await db.insert(pomodoroSessions).values({
      userId,
      contentId: contentId || null,
      startTime: now,
      endTime,
      duration,
      status: 'in_progress',
      sessionType,
    }).returning()

    return NextResponse.json({
      success: true,
      data: result[0],
      message: '番茄钟已开始'
    })
  } catch (error) {
    console.error('开始番茄钟失败:', error)
    return NextResponse.json({ error: '开始番茄钟失败' }, { status: 500 })
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
      sessionId: string
      status: 'completed' | 'interrupted'
      notes?: string
    }

    const { sessionId, status, notes } = body

    if (!sessionId || !status) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 获取会话
    const [session] = await db
      .select()
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.id, sessionId),
          eq(pomodoroSessions.userId, userId)
        )
      )

    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 })
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json({ error: '会话已结束' }, { status: 400 })
    }

    const now = new Date()
    const actualDuration = Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000)

    await db
      .update(pomodoroSessions)
      .set({
        status,
        actualDuration,
        notes: notes || null,
        endTime: now,
      })
      .where(eq(pomodoroSessions.id, sessionId))

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        status,
        actualDuration,
      },
      message: status === 'completed' ? '番茄钟已完成' : '番茄钟已中断'
    })
  } catch (error) {
    console.error('更新番茄钟失败:', error)
    return NextResponse.json({ error: '更新番茄钟失败' }, { status: 500 })
  }
}
