import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { pomodoroSessions } from '@/db/schema'
import { eq, and, gte, lte, count, sql } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/pomodoro/stats - 获取番茄钟统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建查询条件
    const conditions = [eq(pomodoroSessions.userId, userId)]
    
    if (startDate) {
      conditions.push(gte(pomodoroSessions.startTime, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(pomodoroSessions.startTime, new Date(endDate)))
    }

    // 总会话数
    const [totalResult] = await db
      .select({ count: count() })
      .from(pomodoroSessions)
      .where(and(...conditions))

    const totalSessions = totalResult?.count || 0

    // 完成的会话数
    const [completedResult] = await db
      .select({ count: count() })
      .from(pomodoroSessions)
      .where(
        and(
          ...conditions,
          eq(pomodoroSessions.status, 'completed')
        )
      )

    const completedSessions = completedResult?.count || 0

    // 总时长（秒）
    const [durationResult] = await db
      .select({ 
        totalDuration: sql<number>`sum(${pomodoroSessions.actualDuration})` 
      })
      .from(pomodoroSessions)
      .where(
        and(
          ...conditions,
          eq(pomodoroSessions.status, 'completed')
        )
      )

    const totalDuration = durationResult?.totalDuration || 0

    // 完成率
    const completionRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0

    // 按日期统计
    const dailyStats = await db
      .select({
        date: sql<string>`date(${pomodoroSessions.startTime} / 1000, 'unixepoch')`,
        sessions: count(),
        completedSessions: sql<number>`sum(case when ${pomodoroSessions.status} = 'completed' then 1 else 0 end)`,
        duration: sql<number>`sum(case when ${pomodoroSessions.status} = 'completed' then ${pomodoroSessions.actualDuration} else 0 end)`,
      })
      .from(pomodoroSessions)
      .where(and(...conditions))
      .groupBy(sql`date(${pomodoroSessions.startTime} / 1000, 'unixepoch')`)
      .orderBy(sql`date(${pomodoroSessions.startTime} / 1000, 'unixepoch')`)

    // 按会话类型统计
    const typeStats = await db
      .select({
        sessionType: pomodoroSessions.sessionType,
        count: count(),
        completedCount: sql<number>`sum(case when ${pomodoroSessions.status} = 'completed' then 1 else 0 end)`,
      })
      .from(pomodoroSessions)
      .where(and(...conditions))
      .groupBy(pomodoroSessions.sessionType)

    return NextResponse.json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        totalDuration,
        completionRate,
        dailyStats: dailyStats.map(stat => ({
          date: stat.date,
          sessions: stat.sessions,
          completedSessions: stat.completedSessions || 0,
          duration: stat.duration || 0,
        })),
        typeStats: typeStats.map(stat => ({
          sessionType: stat.sessionType,
          count: stat.count,
          completedCount: stat.completedCount || 0,
        })),
      }
    })
  } catch (error) {
    console.error('获取番茄钟统计失败:', error)
    return NextResponse.json({ error: '获取番茄钟统计失败' }, { status: 500 })
  }
}
