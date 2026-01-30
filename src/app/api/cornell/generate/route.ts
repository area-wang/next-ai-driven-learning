import { NextRequest, NextResponse } from 'next/server'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { OpenAIClient } from '@/lib/ai/client'

/**
 * POST /api/cornell/generate - AI 生成康奈尔笔记的线索和总结
 */

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()
    
    const body = await request.json() as {
      mainNotes: string
      modelId?: string  // 可选的模型 ID
    }

    const { mainNotes, modelId } = body

    if (!mainNotes || !mainNotes.trim()) {
      return NextResponse.json({ error: '缺少笔记内容' }, { status: 400 })
    }

    // 获取 AI 配置
    const config = await getAIConfig(request as unknown as Request, userId, modelId)
    const aiClient = new OpenAIClient(config.apiKey, config.model, config.baseUrl)

    const prompt = `请根据以下康奈尔笔记的主笔记区内容，生成线索区和总结区的内容：

主笔记区：
${mainNotes}

请返回 JSON 格式：
{
  "cues": "关键词1、关键词2、问题1？、问题2？",
  "summary": "简洁的总结（2-3句话）"
}

要求：
1. 线索区：提取3-5个关键词和2-3个问题，用顿号和问号分隔
2. 总结区：用2-3句话概括核心内容
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

    return NextResponse.json({
      success: false,
      error: '无法解析 AI 响应'
    }, { status: 500 })
  } catch (error) {
    console.error('生成康奈尔笔记失败:', error)
    return NextResponse.json({
      success: false,
      error: '生成失败'
    }, { status: 500 })
  }
}
