/**
 * 学习大纲生成 API
 * 生成学习大纲并保存到数据库
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans, learningOutlines, knowledgeContents } from '@/db/schema'
import { createAIClientFromRequest } from '@/lib/ai/config-client'
import { generateOutlinePrompt, type OutlineInput } from '@/lib/ai/prompts'
import { type AIClient } from '@/lib/ai/client'

interface GenerateRequest {
  planId?: string // 添加 planId 参数
  parentId?: string // 添加 parentId 参数
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  userId?: string
  modelId?: string // 指定使用的模型ID
}

interface OutlineItem {
  title: string
  description: string
  estimatedTime: string
  prerequisites?: string[]
  children?: OutlineItem[]
}

interface OutlineResponse {
  outline: OutlineItem[]
  planId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateRequest
    const { planId, parentId, topic, goal, level, userId = 'demo-user', modelId } = body

    console.log('[API] Learning outline generate request:', {
      planId,
      parentId,
      topic,
      goal,
      level,
      userId,
      modelId,
    })

    if (!topic) {
      return NextResponse.json(
        { error: '主题不能为空' },
        { status: 400 }
      )
    }

    // 从配置创建 AI 客户端
    console.log('[API] Creating AI client from config...')
    let aiClient: AIClient
    try {
      // 如果提供了 modelId，使用指定的模型
      if (modelId) {
        const { OpenAIClient } = await import('@/lib/ai/client')
        
        // 从环境变量读取 OpenRouter API Key（安全）
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
          throw new Error('未配置 OPENROUTER_API_KEY 环境变量')
        }
        
        const modelConfigHeader = request.headers.get('x-model-config')
        if (modelConfigHeader) {
          const modelConfig = JSON.parse(modelConfigHeader)
          // 使用环境变量中的 API Key
          aiClient = new OpenAIClient(
            apiKey,
            modelConfig.model,
            modelConfig.baseUrl || 'https://openrouter.ai/api/v1'
          )
        } else {
          throw new Error('未提供模型配置，请确保客户端正确传递了模型信息')
        }
      } else {
        // 使用默认配置
        aiClient = createAIClientFromRequest(request)
      }
    } catch (clientError) {
      console.error('[API] Failed to create AI client:', clientError)
      return NextResponse.json(
        { error: `${clientError instanceof Error ? clientError.message : '创建 AI 客户端失败'}` },
        { status: 500 }
      )
    }

    // 生成提示词
    const input: OutlineInput = {
      topic,
      goal,
      level,
    }
    const prompt = generateOutlinePrompt(input)
    console.log('[API] Generated prompt length:', prompt.length)

    // 调用 AI 生成大纲
    console.log('[API] Calling AI...')
    let response: string
    try {
      response = await aiClient.chat({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        maxTokens: 3000,
      })
      console.log('[API] AI response received, length:', response.length)
      console.log('[API] AI response preview:', response.slice(0, 200))
    } catch (aiError) {
      console.error('[API] AI call failed:', aiError)
      return NextResponse.json(
        { error: `AI 调用失败: ${aiError instanceof Error ? aiError.message : '未知错误'}` },
        { status: 500 }
      )
    }

    // 解析 AI 响应
    let outlineData: OutlineResponse
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        outlineData = JSON.parse(jsonMatch[0])
        console.log('[API] Parsed outline items:', outlineData.outline?.length)
      } else {
        console.error('[API] No JSON found in response:', response.slice(0, 200))
        throw new Error('无法解析 AI 响应')
      }
    } catch (error) {
      console.error('[API] Failed to parse AI response:', error)
      return NextResponse.json(
        { error: 'AI 响应格式错误' },
        { status: 500 }
      )
    }

    // 保存到数据库
    const db = getDbClient(request)
    if (!db) {
      console.error('[API] Database connection failed')
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    try {
      console.log('[API] Saving to database...')
      
      let targetPlanId = planId
      
      // 如果没有提供 planId，创建新的学习计划
      if (!targetPlanId) {
        // 确保 demo-user 存在
        const { users } = await import('@/db/schema')
        const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
        
        if (existingUser.length === 0) {
          console.log('[API] Creating demo user...')
          await db.insert(users).values({
            id: userId,
            email: 'demo@example.com',
            name: 'Demo User',
            provider: 'demo',
          })
        }
        
        // 创建学习计划
        const [plan] = await db.insert(learningPlans).values({
          userId,
          title: topic,
          description: goal || `学习 ${topic}`,
          topic,
          goal,
          level,
          status: 'active',
          progress: 0,
        }).returning()
        targetPlanId = plan.id
        console.log('[API] Created plan:', targetPlanId)
      } else {
        console.log('[API] Using existing plan:', targetPlanId)
      }

      // 递归保存大纲项和内容
      const savedOutlines: any[] = []
      
      const saveOutlineItems = async (
        items: OutlineItem[],
        currentParentId: string | null = null,
        level: number = 0
      ): Promise<any[]> => {
        const results: any[] = []
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const estimatedMinutes = parseInt(item.estimatedTime) || 60

          // 保存大纲项
          const [outline] = await db.insert(learningOutlines).values({
            planId: targetPlanId!,
            parentId: currentParentId,
            title: item.title,
            description: item.description,
            order: i,
            level,
            estimatedTime: estimatedMinutes,
          }).returning()

          // 生成并保存知识内容
          let htmlContent = `<h2>${item.title}</h2>`
          if (item.description) {
            htmlContent += `<p>${item.description}</p>`
          }
          if (item.estimatedTime) {
            htmlContent += `<p><strong>预计学习时间：</strong>${item.estimatedTime}</p>`
          }
          if (item.prerequisites && item.prerequisites.length > 0) {
            htmlContent += `<p><strong>前置知识：</strong></p><ul>`
            item.prerequisites.forEach((prereq: string) => {
              htmlContent += `<li>${prereq}</li>`
            })
            htmlContent += `</ul>`
          }

          await db.insert(knowledgeContents).values({
            outlineId: outline.id,
            content: htmlContent,
            contentType: 'rich_text',
            aiGenerated: true,
          })

          // 构建返回对象
          const outlineResult: any = {
            id: outline.id,
            title: outline.title,
            description: outline.description,
            estimatedTime: outline.estimatedTime,
          }

          // 递归保存子项
          if (item.children && item.children.length > 0) {
            outlineResult.children = await saveOutlineItems(item.children, outline.id, level + 1)
          }
          
          results.push(outlineResult)
        }
        
        return results
      }

      const savedItems = await saveOutlineItems(outlineData.outline, parentId || null)
      console.log('[API] Successfully saved all outline items')

      return NextResponse.json({
        outlines: savedItems,
        planId: targetPlanId,
        saved: true,
      })
    } catch (dbError) {
      console.error('[API] Failed to save outline:', dbError)
      return NextResponse.json(
        { error: '保存失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[API] Outline generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 服务错误' },
      { status: 500 }
    )
  }
}
