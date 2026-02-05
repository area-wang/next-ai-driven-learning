import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbClient } from '@/lib/db-connection'
import { learningPlans, learningOutlines, knowledgeContents } from '@/db/schema'
import { generateOutlinePrompt, type OutlineInput } from '@/lib/ai/prompts'
import { type AIClient, OpenAIClient } from '@/lib/ai/client'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { performSearch } from '@/lib/search/utils'
import { getSearchConfig } from '@/lib/search/get-search-config'

interface GenerateRequest {
  planId?: string // 添加 planId 参数
  parentId?: string // 添加 parentId 参数
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  additionalContext?: string // 添加补充描述参数
  modelId?: string // 指定使用的模型ID
  depth?: number // 新增：大纲层级深度（1-3）
  enableWebSearch?: boolean // 是否启用联网搜索
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
    const { planId, parentId, topic, goal, level, additionalContext, modelId, depth, enableWebSearch = false } = body

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
      enableWebSearch,
    })

    if (!topic) {
      return NextResponse.json(
        { error: '主题不能为空' },
        { status: 400 }
      )
    }

    // 处理联网搜索
    let searchResults = ''
    if (enableWebSearch) {
      try {
        // 获取 AI 配置（用于搜索意图分析）
        let aiConfig
        try {
          const config = await getAIConfig(request as unknown as Request, userId, modelId)
          aiConfig = {
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
          }
        } catch (error) {
          // 无法获取 AI 配置，将使用简单提取
        }
        
        // 获取用户的搜索配置
        const searchConfig = await getSearchConfig(request as unknown as Request, userId)
        
        // 构建搜索查询
        const searchQuery = `${topic} 知识大纲 学习内容 ${level} 知识点`
        
        // 执行搜索（传递 AI 配置用于智能分析）
        searchResults = await performSearch(searchQuery, searchConfig, aiConfig)
      } catch (searchError) {
        // 搜索失败不影响主流程
      }
    }

    // 获取 AI 配置
    let aiClient: AIClient
    try {
      const config = await getAIConfig(request as unknown as Request, userId, modelId)

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
    let prompt = generateOutlinePrompt(input)
    
    // 如果有搜索结果，添加到 prompt
    if (searchResults) {
      prompt = `${searchResults}\n\n${prompt}`
    }

    // 调用 AI 生成大纲
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
      // 清理响应：移除 Markdown 代码块标记
      let cleanedResponse = response.trim()
      
      // 移除开头的 ```json 或 ```
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '')
      
      // 移除结尾的 ```
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/i, '')
      
      // 先尝试直接解析清理后的响应
      try {
        outlineData = JSON.parse(cleanedResponse)
      } catch (parseError) {
        // 如果直接解析失败，尝试提取JSON对象
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            outlineData = JSON.parse(jsonMatch[0])
          } catch (matchError) {
            throw new Error(`JSON解析失败: ${matchError instanceof Error ? matchError.message : '未知错误'}`)
          }
        } else {
          throw new Error('AI响应中未找到有效的JSON格式')
        }
      }
      
      // 验证响应格式
      if (!outlineData.outline || !Array.isArray(outlineData.outline)) {
        throw new Error('AI响应格式错误：缺少outline数组')
      }
      
      if (outlineData.outline.length === 0) {
        throw new Error('AI响应格式错误：outline数组为空')
      }
    } catch (error) {
      console.error('[API] Failed to parse AI response:', error)
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
      let targetPlanId = planId
      
      // 如果没有提供 planId，创建新的学习计划
      if (!targetPlanId) {
        // 确保 demo-user 存在
        const { users } = await import('@/db/schema')
        const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
        
        if (existingUser.length === 0) {
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
      } else {
        // 使用现有计划
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
