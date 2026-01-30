/**
 * 学习计划 CRUD API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

// 获取用户的学习计划列表
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    const plans = await db
      .select()
      .from(learningPlans)
      .where(eq(learningPlans.userId, userId))
      .orderBy(desc(learningPlans.createdAt))

    return NextResponse.json({
      plans: plans.map(plan => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        topic: plan.topic,
        progress: plan.progress,
        level: plan.level,
        createdAt: plan.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get learning plans error:', error)
    return NextResponse.json(
      { error: '获取学习计划失败' },
      { status: 500 }
    )
  }
}

// 创建学习计划
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()
    
    const body = await request.json() as {
      title: string
      description?: string
      topic: string
      goal?: string
      level?: string
    }
    const { title, description, topic, goal, level } = body

    if (!title || !topic) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    const [plan] = await db.insert(learningPlans).values({
      userId,
      title,
      description,
      topic,
      goal,
      level,
      status: 'active',
      progress: 0,
    }).returning()

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Create learning plan error:', error)
    return NextResponse.json(
      { error: '创建学习计划失败' },
      { status: 500 }
    )
  }
}

// 更新学习计划
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as {
      id: string
      [key: string]: any
    }
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: '缺少计划 ID' },
        { status: 400 }
      )
    }

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    const [plan] = await db
      .update(learningPlans)
      .set(updates)
      .where(eq(learningPlans.id, id))
      .returning()

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Update learning plan error:', error)
    return NextResponse.json(
      { error: '更新学习计划失败' },
      { status: 500 }
    )
  }
}

// 删除学习计划
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '缺少计划 ID' },
        { status: 400 }
      )
    }

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    await db
      .delete(learningPlans)
      .where(eq(learningPlans.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete learning plan error:', error)
    return NextResponse.json(
      { error: '删除学习计划失败' },
      { status: 500 }
    )
  }
}
