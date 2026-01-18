/**
 * 获取学习计划详情 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans, learningOutlines, knowledgeContents } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    // 获取学习计划
    const [plan] = await db
      .select()
      .from(learningPlans)
      .where(eq(learningPlans.id, planId))
      .limit(1)

    if (!plan) {
      return NextResponse.json(
        { error: '学习计划不存在' },
        { status: 404 }
      )
    }

    // 获取所有大纲项
    const outlines = await db
      .select()
      .from(learningOutlines)
      .where(eq(learningOutlines.planId, planId))
      .orderBy(learningOutlines.order)

    // 获取所有内容
    const outlineIds = outlines.map(o => o.id)
    const contents = await db
      .select()
      .from(knowledgeContents)
      .where(eq(knowledgeContents.outlineId, outlineIds[0]))

    // 为每个大纲项获取内容
    const contentsMap: Record<string, any> = {}
    for (const outline of outlines) {
      const [content] = await db
        .select()
        .from(knowledgeContents)
        .where(eq(knowledgeContents.outlineId, outline.id))
        .limit(1)
      
      if (content) {
        contentsMap[outline.id] = content
      }
    }

    // 构建树形结构
    const buildTree = (parentId: string | null = null): any[] => {
      return outlines
        .filter(o => o.parentId === parentId)
        .map(outline => ({
          id: outline.id,
          title: outline.title,
          description: outline.description,
          content: contentsMap[outline.id]?.content || '',
          estimatedTime: outline.estimatedTime,
          children: buildTree(outline.id),
        }))
    }

    const tree = buildTree()

    return NextResponse.json({
      plan: {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        topic: plan.topic,
        goal: plan.goal,
        level: plan.level,
        status: plan.status,
        progress: plan.progress,
        createdAt: plan.createdAt,
      },
      outlines: tree,
    })
  } catch (error) {
    console.error('Failed to fetch plan:', error)
    return NextResponse.json(
      { error: '获取学习计划失败' },
      { status: 500 }
    )
  }
}
