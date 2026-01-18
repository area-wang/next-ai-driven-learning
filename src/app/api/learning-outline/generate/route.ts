/**
 * 学习大纲生成 API
 * 生成学习大纲并保存到数据库
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans, learningOutlines, knowledgeContents } from '@/db/schema'
import { createAIClient, type AIProvider } from '@/lib/ai/client'
import { generateOutlinePrompt, type OutlineInput } from '@/lib/ai/prompts'

interface GenerateRequest {
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  provider?: AIProvider
  model?: string
  userId?: string
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
    const { topic, goal, level, provider = 'openai', model, userId = 'demo-user' } = body

    console.log('[API] Learning outline generate request:', {
      topic,
      goal,
      level,
      provider,
      model,
      userId,
    })

    if (!topic) {
      return NextResponse.json(
        { error: '主题不能为空' },
        { status: 400 }
      )
    }

    // 获取 API Key
    let apiKey: string | undefined
    const clientApiKey = request.headers.get('x-api-key')
    
    switch (provider) {
      case 'openai':
        apiKey = clientApiKey || process.env.OPENAI_API_KEY
        break
      case 'deepseek':
        apiKey = clientApiKey || process.env.DEEPSEEK_API_KEY
        break
      case 'gemini':
        apiKey = clientApiKey || process.env.GEMINI_API_KEY
        break
      case 'claude':
        apiKey = clientApiKey || process.env.CLAUDE_API_KEY
        break
      case 'cloudflare':
        break
    }

    console.log('[API] API Key check:', {
      provider,
      hasClientKey: !!clientApiKey,
      hasEnvKey: !!apiKey,
    })

    // 检查是否需要 API Key
    if (provider === 'cloudflare') {
      return NextResponse.json(
        { error: 'Cloudflare AI 在当前环境不可用,请选择其他 AI 提供商(OpenAI、DeepSeek、Gemini 或 Claude)并配置 API Key' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `请配置 ${provider} 的 API Key` },
        { status: 400 }
      )
    }

    // 创建 AI 客户端
    console.log('[API] Creating AI client:', { 
      provider, 
      model,
      hasAI: !!(request as any).env?.AI,
    })
    
    let aiClient: ReturnType<typeof createAIClient>
    try {
      aiClient = createAIClient({
        provider,
        apiKey,
        model,
        ai: (request as any).env?.AI,
      })
    } catch (clientError) {
      console.error('[API] Failed to create AI client:', clientError)
      return NextResponse.json(
        { error: `创建 AI 客户端失败: ${clientError instanceof Error ? clientError.message : '未知错误'}` },
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
      
      // 特别处理 DeepSeek 错误
      if (provider === 'deepseek') {
        return NextResponse.json(
          { error: `DeepSeek API 调用失败: ${aiError instanceof Error ? aiError.message : '未知错误'}。请检查 API Key 是否正确。` },
          { status: 500 }
        )
      }
      
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
      
      // 0. 确保 demo-user 存在
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
      
      // 1. 创建学习计划
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
      console.log('[API] Created plan:', plan.id)

      // 2. 递归保存大纲项和内容
      const saveOutlineItems = async (
        items: OutlineItem[],
        parentId: string | null = null,
        level: number = 0
      ) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const estimatedMinutes = parseInt(item.estimatedTime) || 60

          // 保存大纲项
          const [outline] = await db.insert(learningOutlines).values({
            planId: plan.id,
            parentId,
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

          // 递归保存子项
          if (item.children && item.children.length > 0) {
            await saveOutlineItems(item.children, outline.id, level + 1)
          }
        }
      }

      await saveOutlineItems(outlineData.outline)
      console.log('[API] Successfully saved all outline items')

      return NextResponse.json({
        ...outlineData,
        planId: plan.id,
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
