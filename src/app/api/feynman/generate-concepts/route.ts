import { NextRequest, NextResponse } from 'next/server'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig, createAIClientFromConfig } from '@/lib/ai/get-ai-config'
import { type AIClient } from '@/lib/ai/client'

/**
 * POST /api/feynman/generate-concepts
 * 从文档内容中提取需要用户解释的核心概念
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()
    
    const body = await request.json() as {
      content: string
      title: string
    }

    const { content, title } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '缺少文档内容' }, { status: 400 })
    }

    // 获取 AI 配置
    const config = await getAIConfig(request as unknown as Request, userId)
    const aiClient = createAIClientFromConfig(config)

    // 提取纯文本内容
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

    const prompt = `请从以下学习内容中提取 3-5 个最核心的概念,这些概念需要学习者用自己的话解释清楚。

学习内容标题：${title}

学习内容：
${plainText.substring(0, 3000)}

要求：
1. 提取 3-5 个核心概念
2. 每个概念应该是学习者需要深入理解的关键知识点
3. 概念应该具有一定的复杂度,适合用费曼学习法练习
4. 按重要性排序

请返回 JSON 格式：
{
  "concepts": [
    {
      "name": "概念名称",
      "description": "简短描述（1句话）",
      "difficulty": "easy|medium|hard"
    }
  ]
}

只返回 JSON，不要包含其他内容。`

    const response = await aiClient.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    // 尝试解析 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as { concepts: Array<{ name: string; description: string; difficulty: string }> }
      return NextResponse.json({
        success: true,
        data: result
      })
    }

    return NextResponse.json({
      success: false,
      error: '无法解析 AI 响应'
    }, { status: 500 })
  } catch (error) {
    console.error('提取概念失败:', error)
    return NextResponse.json({
      success: false,
      error: '提取概念失败'
    }, { status: 500 })
  }
}
