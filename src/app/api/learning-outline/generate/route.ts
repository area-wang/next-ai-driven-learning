import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans, learningOutlines, knowledgeContents } from '@/db/schema'
import { generateOutlinePrompt, type OutlineInput } from '@/lib/ai/prompts'
import { type AIClient, OpenAIClient } from '@/lib/ai/client'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig } from '@/lib/ai/get-ai-config'

interface GenerateRequest {
  planId?: string // 添加 planId 参数
  parentId?: string // 添加 parentId 参数
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  additionalContext?: string // 添加补充描述参数
  modelId?: string // 指定使用的模型ID
  depth?: number // 新增：大纲层级深度（1-3）
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
    const userId = await getUserIdOrDemo()
    const body = await request.json() as GenerateRequest
    const { planId, parentId, topic, goal, level, additionalContext, modelId, depth } = body

    console.log('[API] Learning outline generate request:', {
      planId,
      parentId,
      topic,
      goal,
      level,
      additionalContext,
      userId,
      modelId,
      depth,
    })

    if (!topic) {
      return NextResponse.json(
        { error: '主题不能为空' },
        { status: 400 }
      )
    }

    // 获取 AI 配置
    console.log('[API] Getting AI config...')
    let aiClient: AIClient
    try {
      const config = await getAIConfig(request as unknown as Request, userId, modelId)
      console.log('[API] AI config:', {
        hasApiKey: !!config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      })

      aiClient = new OpenAIClient(
        config.apiKey,
        config.model,
        config.baseUrl
      )
    } catch (configError) {
      console.error('[API] Failed to get AI config:', configError)
      return NextResponse.json(
        { error: `${configError instanceof Error ? configError.message : '获取 AI 配置失败'}` },
        { status: 500 }
      )
    }

    // 生成提示词
    const input: OutlineInput = {
      topic,
      goal,
      level,
      additionalContext,
      depth, // 新增：传递层级深度
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
        maxTokens: 100000,
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
      // 输出原始响应用于调试
      console.log('[API] Raw AI response length:', response.length)
      console.log('[API] Raw AI response (first 1000 chars):', response.slice(0, 1000))
      console.log('[API] Raw AI response (last 500 chars):', response.slice(-500))
      
      // 清理响应：移除 Markdown 代码块标记
      let cleanedResponse = response.trim()
      
      // 移除开头的 ```json 或 ```
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '')
      
      // 移除结尾的 ```
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/i, '')
      
      console.log('[API] Cleaned response length:', cleanedResponse.length)
      console.log('[API] Cleaned response (first 1000 chars):', cleanedResponse.slice(0, 1000))
      console.log('[API] Cleaned response (last 500 chars):', cleanedResponse.slice(-500))
      
      // 先尝试直接解析清理后的响应
      try {
        outlineData = JSON.parse(cleanedResponse)
        console.log('[API] ✅ Parsed outline directly, items:', outlineData.outline?.length)
      } catch (parseError) {
        console.error('[API] ❌ Direct parse failed:', parseError)
        console.error('[API] Parse error details:', {
          message: parseError instanceof Error ? parseError.message : 'Unknown error',
          name: parseError instanceof Error ? parseError.name : 'Unknown',
        })
        
        // 如果直接解析失败，尝试提取JSON对象
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          console.log('[API] Found JSON match, length:', jsonMatch[0].length)
          console.log('[API] JSON match (first 1000 chars):', jsonMatch[0].slice(0, 1000))
          console.log('[API] JSON match (last 500 chars):', jsonMatch[0].slice(-500))
          
          try {
            outlineData = JSON.parse(jsonMatch[0])
            console.log('[API] ✅ Parsed outline from match, items:', outlineData.outline?.length)
          } catch (matchError) {
            console.error('[API] ❌ Match parse failed:', matchError)
            console.error('[API] Match parse error details:', {
              message: matchError instanceof Error ? matchError.message : 'Unknown error',
              name: matchError instanceof Error ? matchError.name : 'Unknown',
            })
            
            // 尝试找到 JSON 中的问题位置
            if (matchError instanceof SyntaxError && matchError.message.includes('position')) {
              const posMatch = matchError.message.match(/position (\d+)/)
              if (posMatch) {
                const errorPos = parseInt(posMatch[1])
                const contextStart = Math.max(0, errorPos - 100)
                const contextEnd = Math.min(jsonMatch[0].length, errorPos + 100)
                console.error('[API] Error context:', jsonMatch[0].slice(contextStart, contextEnd))
                console.error('[API] Error position marker:', ' '.repeat(errorPos - contextStart) + '^')
              }
            }
            
            throw new Error(`JSON解析失败: ${matchError instanceof Error ? matchError.message : '未知错误'}`)
          }
        } else {
          console.error('[API] ❌ No JSON found in response')
          throw new Error('AI响应中未找到有效的JSON格式')
        }
      }
      
      // 验证响应格式
      if (!outlineData.outline || !Array.isArray(outlineData.outline)) {
        console.error('[API] ❌ Invalid outline format:', outlineData)
        throw new Error('AI响应格式错误：缺少outline数组')
      }
      
      if (outlineData.outline.length === 0) {
        console.error('[API] ❌ Empty outline array')
        throw new Error('AI响应格式错误：outline数组为空')
      }
      
      console.log('[API] ✅ Successfully parsed outline with', outlineData.outline.length, 'items')
    } catch (error) {
      console.error('[API] Failed to parse AI response:', error)
      console.error('[API] Raw response:', response.slice(0, 1000))
      return NextResponse.json(
        { 
          error: 'AI 响应格式错误',
          details: error instanceof Error ? error.message : '无法解析AI响应',
          rawResponse: response.slice(0, 500) // 返回部分原始响应用于调试
        },
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
