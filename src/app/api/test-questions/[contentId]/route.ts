/**
 * 查询测试题 API
 * GET /api/test-questions/[contentId]
 * 
 * 查询指定知识内容的所有测试题
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { testQuestions } from '@/db/schema'
import { eq } from 'drizzle-orm'

// 使用 Node.js runtime 以支持完整的数据库功能
// export const runtime = 'edge'

interface RouteParams {
  params: Promise<{
    contentId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    const { contentId } = await params
    const { searchParams } = new URL(request.url)
    const includeAnswers = searchParams.get('includeAnswers') === 'true'

    // 查询题目
    const questions = await db
      .select()
      .from(testQuestions)
      .where(eq(testQuestions.contentId, contentId))
      .orderBy(testQuestions.questionIndex)

    // 格式化返回数据
    const formattedQuestions = questions.map((q: any) => {
      const base = {
        id: q.id,
        index: q.questionIndex,
        type: q.questionType,
        question: q.question,
        options: q.options ? JSON.parse(q.options) : undefined,
      }

      // 根据参数决定是否包含答案和解析
      if (includeAnswers) {
        return {
          ...base,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        }
      }

      return base
    })

    return NextResponse.json({
      questions: formattedQuestions,
    })
  } catch (error) {
    console.error('查询测试题失败:', error)
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    )
  }
}
