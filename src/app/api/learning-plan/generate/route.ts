/**
 * 学习计划生成 API
 * 使用 AI 生成个性化学习计划
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans } from '@/db/schema'
import { createAIClientFromRequest } from '@/lib/ai/config-client'
import { generateLearningPlanPrompt, type LearningPlanInput } from '@/lib/ai/prompts'

interface GenerateRequest {
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  userId?: string
}

interface LearningPlanResponse {
  title: string
  description: string
  goals: string[]
  phases: Array<{
    title: string
    duration: string
    topics: string[]
    resources: string[]
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateRequest
    const { topic, goal, level, duration, userId } = body

    if (!topic) {
      return NextResponse.json(
        { error: '主题不能为空' },
        { status: 400 }
      )
    }

    // 从配置创建 AI 客户端
    const aiClient = createAIClientFromRequest(request)

    // 生成提示词
    const input: LearningPlanInput = {
      topic,
      goal,
      level,
      duration,
    }
    const prompt = generateLearningPlanPrompt(input)

    // 调用 AI 生成学习计划
    const response = await aiClient.chat({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    })

    // 解析 AI 响应
    let planData: LearningPlanResponse
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法解析 AI 响应')
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return NextResponse.json(
        { error: 'AI 响应格式错误' },
        { status: 500 }
      )
    }

    // 如果提供了 userId，保存到数据库
    if (userId) {
      const db = getDbClient(request)
      if (db) {
        try {
          const [plan] = await db.insert(learningPlans).values({
            userId,
            title: planData.title,
            description: planData.description,
            topic,
            goal,
            level,
            status: 'active',
            progress: 0,
          }).returning()

          return NextResponse.json({
            ...planData,
            id: plan.id,
            saved: true,
          })
        } catch (dbError) {
          console.error('Failed to save learning plan:', dbError)
          // 即使保存失败，也返回生成的计划
          return NextResponse.json({
            ...planData,
            saved: false,
            error: '保存失败，但计划已生成',
          })
        }
      }
    }

    return NextResponse.json(planData)
  } catch (error) {
    console.error('Learning plan generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 服务错误' },
      { status: 500 }
    )
  }
}
