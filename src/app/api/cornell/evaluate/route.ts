import { NextRequest, NextResponse } from 'next/server'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { OpenAIClient } from '@/lib/ai/client'

/**
 * POST /api/cornell/evaluate - AI 评估康奈尔笔记质量
 */

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()
    
    const body = await request.json() as {
      mainNotes: string
      cues: string
      summary: string
      modelId?: string
    }

    const { mainNotes, cues, summary, modelId } = body

    if (!mainNotes || !cues || !summary) {
      return NextResponse.json({ error: '缺少笔记内容' }, { status: 400 })
    }

    // 获取 AI 配置
    const config = await getAIConfig(request as unknown as Request, userId, modelId)
    const aiClient = new OpenAIClient(config.apiKey, config.model, config.baseUrl)

    const prompt = `请评估以下康奈尔笔记的质量，并给出改进建议：

【线索区】
${cues}

【主笔记区】
${mainNotes}

【总结区】
${summary}

请从以下几个维度评估（每项满分10分）：
1. 线索区质量：关键词是否准确、问题是否有启发性
2. 主笔记区质量：内容是否详细、结构是否清晰
3. 总结区质量：总结是否简洁、是否抓住核心
4. 整体协调性：三个区域是否相互呼应

请返回 JSON 格式：
{
  "score": 总分（满分40分）,
  "evaluation": "详细的评估和改进建议（200字左右）"
}

要求：
1. 评估要客观、具体
2. 改进建议要可操作
3. 使用简洁的中文`

    const response = await aiClient.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 100000,
    })

    // 尝试解析 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        success: true,
        data: result
      })
    }

    // 如果无法解析 JSON，返回原始文本
    return NextResponse.json({
      success: true,
      data: {
        score: 0,
        evaluation: response
      }
    })
  } catch (error) {
    console.error('评估康奈尔笔记失败:', error)
    return NextResponse.json({
      success: false,
      error: '评估失败'
    }, { status: 500 })
  }
}
