/**
 * 提交答题记录并评估
 * POST /api/test-answer/submit
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAIConfig, createAIClientFromConfig } from '@/lib/ai/get-ai-config'
import { type AIClient } from '@/lib/ai/client'

interface SubmitRequest {
  documentId: string
  planId: string
  modelId?: string
  answers: Array<{
    questionIndex: number
    questionText: string
    questionType: string
    userAnswer: string
    correctAnswer: string
    options?: string[]
  }>
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json() as SubmitRequest
    const { documentId, answers, modelId } = body

    if (!documentId || !answers || answers.length === 0) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 获取 AI 配置
    const config = await getAIConfig(request as unknown as Request, session.user.id, modelId)
    const aiClient = createAIClientFromConfig(config)

    // 评估每道题
    const results = await Promise.all(
      answers.map(async (answer) => {
        const { questionIndex, questionText, questionType, userAnswer, correctAnswer, options } = answer

        // 客观题：直接比较答案
        if (questionType === 'choice' || questionType === 'fill') {
          const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer)
          return {
            questionIndex,
            isCorrect,
            score: isCorrect ? 100 : 0,
          }
        }

        // 主观题：调用 AI 评估
        if (questionType === 'short' || questionType === 'code') {
          try {
            const prompt = `你是一位专业的教育评估专家。请评估以下答案的质量。

题目：${questionText}
标准答案：${correctAnswer}
学生答案：${userAnswer}

请从以下维度评估：
1. 准确性：答案是否正确
2. 完整性：是否涵盖关键要点
3. 清晰度：表达是否清晰

请以 JSON 格式返回评估结果：
{
  "score": 分数（0-100）,
  "feedback": "详细评语和改进建议"
}

只返回 JSON，不要返回其他内容。`

            const content = await aiClient.chat({
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.3,
            })
            const jsonMatch = content.match(/\{[^]*\}/)
            const evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, feedback: '评估失败' }

            return {
              questionIndex,
              isCorrect: evaluation.score >= 60,
              score: evaluation.score,
              feedback: evaluation.feedback,
            }
          } catch (error) {
            console.error('AI 评估失败:', error)
            return {
              questionIndex,
              isCorrect: false,
              score: 0,
              feedback: 'AI 评估失败，请稍后重试',
            }
          }
        }

        return {
          questionIndex,
          isCorrect: false,
          score: 0,
        }
      })
    )

    // 计算总分和正确题数
    const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    const correctCount = results.filter(r => r.isCorrect).length

    return NextResponse.json({
      results,
      totalScore,
      correctCount,
    })
  } catch (error) {
    console.error('提交答题记录失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '提交失败' },
      { status: 500 }
    )
  }
}

/**
 * 标准化答案（去除空格、标点，转小写）
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]/g, '')
    .trim()
}
