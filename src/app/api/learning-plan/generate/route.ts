/**
 * 学习计划生成 API
 * 使用 AI 生成个性化学习计划
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans } from '@/db/schema'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { OpenAIClient } from '@/lib/ai/client'
import { generateLearningPlanPrompt, type LearningPlanInput } from '@/lib/ai/prompts'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { performSearch, extractSearchQuery } from '@/lib/search/utils'
import { getSearchConfig } from '@/lib/search/get-search-config'

interface GenerateRequest {
  topic: string
  goal?: string
  level?: 'beginner' | 'intermediate' | 'advanced' // 改为可选
  additionalContext?: string // 添加补充描述
  duration?: string
  userId?: string
  modelId?: string
  enableWebSearch?: boolean // 是否启用联网搜索
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
    const { topic, goal, level, additionalContext, duration, userId, modelId, enableWebSearch = false } = body

    if (!topic) {
      return NextResponse.json(
        { error: '主题不能为空' },
        { status: 400 }
      )
    }

    // 获取用户 ID
    const currentUserId = await getCurrentUserId()
    if (!currentUserId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 处理联网搜索
    let searchResults = ''
    if (enableWebSearch) {
      try {
        console.log('[Learning Plan API] 联网搜索已启用')
        
        // 获取 AI 配置（用于搜索意图分析）
        let aiConfig
        try {
          const config = await getAIConfig(request as unknown as Request, currentUserId, modelId)
          aiConfig = {
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
          }
        } catch (error) {
          console.warn('[Learning Plan API] 无法获取 AI 配置用于搜索分析，将使用简单提取')
        }
        
        // 获取用户的搜索配置
        const searchConfig = await getSearchConfig(request as unknown as Request, currentUserId)
        console.log('[Learning Plan API] 搜索配置:', searchConfig)
        
        // 构建搜索查询
        const searchQuery = `${topic} 学习路径 学习计划 教程 ${additionalContext || ''}`
        console.log('[Learning Plan API] 搜索查询:', searchQuery)
        
        // 执行搜索（传递 AI 配置用于智能分析）
        searchResults = await performSearch(searchQuery, searchConfig, aiConfig)
        console.log('[Learning Plan API] 搜索完成，结果长度:', searchResults.length)
      } catch (searchError) {
        console.error('[Learning Plan API] 搜索失败，降级到普通模式:', searchError)
        // 搜索失败不影响主流程
      }
    }

    // 获取 AI 配置
    const config = await getAIConfig(request as unknown as Request, currentUserId, modelId)
    const aiClient = new OpenAIClient(config.apiKey, config.model, config.baseUrl)

    // 生成提示词
    const input: LearningPlanInput = {
      topic,
      goal,
      level,
      additionalContext,
      duration,
    }
    let prompt = generateLearningPlanPrompt(input)
    
    // 如果有搜索结果，添加到 prompt
    if (searchResults) {
      prompt = `${searchResults}\n\n${prompt}`
    }

    // 调用 AI 生成学习计划
    const response = await aiClient.chat({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 100000,
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
    const saveUserId = userId || currentUserId
    if (saveUserId) {
      const db = getDbClient(request)
      if (db) {
        try {
          const [plan] = await db.insert(learningPlans).values({
            userId: saveUserId,
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
