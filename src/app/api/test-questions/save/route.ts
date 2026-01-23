/**
 * 保存测试题 API
 * POST /api/test-questions/save
 * 
 * 批量保存测试题到数据库
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { testQuestions } from '@/db/schema'
import { eq } from 'drizzle-orm'

// 使用 Node.js runtime 以支持完整的数据库功能
// export const runtime = 'edge'

interface SaveRequest {
  contentId: string
  questions: Array<{
    questionIndex: number
    questionType: string
    question: string
    options: string | null
    correctAnswer: string
    explanation: string
    difficulty: string
  }>
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

    const body = await request.json() as SaveRequest
    const { contentId, questions } = body

    if (!contentId || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: '参数错误' },
        { status: 400 }
      )
    }

    // 删除旧题目
    await db
      .delete(testQuestions)
      .where(eq(testQuestions.contentId, contentId))

    // 插入新题目
    await db.insert(testQuestions).values(
      questions.map(q => ({
        contentId,
        questionIndex: q.questionIndex,
        questionType: q.questionType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      }))
    )

    return NextResponse.json({
      success: true,
      count: questions.length,
    })
  } catch (error) {
    console.error('保存测试题失败:', error)
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    )
  }
}
