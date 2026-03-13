import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { feynmanExplanations } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig, createAIClientFromConfig } from '@/lib/ai/get-ai-config'
import { type AIClient } from '@/lib/ai/client'

/**
 * GET /api/feynman/explanations - 获取费曼解释列表
 * POST /api/feynman/explanations - 创建费曼解释
 */

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const outlineId = searchParams.get('contentId') // 前端传递的是 outlineId

    const conditions = [eq(feynmanExplanations.userId, userId)]
    
    // 如果提供了 outlineId，需要先转换为 contentId
    if (outlineId) {
      const { knowledgeContents } = await import('@/db/schema')
      
      // 查找对应的 contentId
      const content = await db
        .select()
        .from(knowledgeContents)
        .where(eq(knowledgeContents.outlineId, outlineId))
        .limit(1)
      
      if (content.length > 0) {
        conditions.push(eq(feynmanExplanations.contentId, content[0].id))
      } else {
        // 如果没有找到对应的 content，返回空数组
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
    }

    const results = await db
      .select()
      .from(feynmanExplanations)
      .where(and(...conditions))
      .orderBy(desc(feynmanExplanations.createdAt))

    return NextResponse.json({
      success: true,
      data: results.map(item => ({
        ...item,
        aiFeedback: item.aiFeedback ? JSON.parse(item.aiFeedback) : null,
      })),
    })
  } catch (error) {
    console.error('获取费曼解释失败:', error)
    return NextResponse.json({ error: '获取费曼解释失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as {
      contentId: string // 前端传递的是 outlineId
      concept: string
      explanation: string
    }

    const { contentId: outlineId, concept, explanation } = body

    console.log('[费曼解释] 保存解释, userId:', userId, 'outlineId:', outlineId, 'concept:', concept)

    if (!outlineId || !concept || !explanation) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 将 outlineId 转换为 contentId（参考闪卡 API 的做法）
    const { knowledgeContents } = await import('@/db/schema')
    
    // 查找或创建 knowledge_contents 记录
    let contentRecord = await db
      .select()
      .from(knowledgeContents)
      .where(eq(knowledgeContents.outlineId, outlineId))
      .limit(1)
    
    let contentId: string
    
    if (contentRecord.length === 0) {
      // 如果不存在，创建新记录
      console.log('[费曼解释] 创建新的 knowledge_contents 记录')
      const newContent = await db
        .insert(knowledgeContents)
        .values({
          outlineId,
          content: '', // 空内容
        })
        .returning()
      
      contentId = newContent[0].id
      console.log('[费曼解释] 创建成功, contentId:', contentId)
    } else {
      contentId = contentRecord[0].id
      console.log('[费曼解释] 使用已存在的 contentId:', contentId)
    }

    // 生成 AI 反馈
    console.log('[费曼解释] 生成 AI 反馈...')
    const aiFeedback = await generateAIFeedback(request, userId, concept, explanation)
    console.log('[费曼解释] AI 反馈生成成功, score:', aiFeedback.score)

    // 使用 Drizzle 插入
    console.log('[费曼解释] 插入数据库...')
    const result = await db.insert(feynmanExplanations).values({
      userId,
      contentId, // 使用正确的 contentId
      concept,
      explanation,
      aiFeedback: JSON.stringify(aiFeedback),
      version: 1,
    }).returning()

    console.log('[费曼解释] 保存成功, id:', result[0].id)

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        aiFeedback,
      },
      message: '费曼解释已保存'
    })
  } catch (error) {
    console.error('[费曼解释] 创建费曼解释失败:', error)
    console.error('[费曼解释] 错误详情:', error instanceof Error ? error.message : '未知错误')
    console.error('[费曼解释] 错误堆栈:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: '保存失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

/**
 * 生成 AI 反馈
 */
async function generateAIFeedback(request: NextRequest, userId: string, concept: string, explanation: string) {
  try {
    // 获取 AI 配置
    const config = await getAIConfig(request as unknown as Request, userId)
    const aiClient = createAIClientFromConfig(config)

    const prompt = `作为一位教育专家，请评估以下费曼学习法解释：

概念：${concept}
解释：${explanation}

请从以下维度评估：
1. 是否用简单的语言解释？
2. 是否包含具体例子？
3. 是否有类比说明？
4. 逻辑是否清晰？
5. 是否有知识盲点？

请返回 JSON 格式：
{
  "gaps": ["盲点1", "盲点2"],
  "suggestions": ["建议1", "建议2"],
  "score": 85
}`

    const response = await aiClient.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    // 尝试解析 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      gaps: [],
      suggestions: ['无法解析 AI 反馈'],
      score: 0,
    }
  } catch (error) {
    console.error('生成 AI 反馈失败:', error)
    return {
      gaps: [],
      suggestions: ['AI 反馈生成失败'],
      score: 0,
    }
  }
}
