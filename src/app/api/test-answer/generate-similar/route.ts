/**
 * 生成相似题目（举一反三）
 * POST /api/test-answer/generate-similar
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAIClientFromRequest } from '@/lib/ai/config-client'

interface GenerateSimilarRequest {
  originalQuestion: {
    type: string
    question: string
    difficulty: string
    topic: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json() as GenerateSimilarRequest
    const { originalQuestion } = body

    if (!originalQuestion) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 从配置创建 AI 客户端
    let aiClient: ReturnType<typeof createAIClientFromRequest>
    try {
      aiClient = createAIClientFromRequest(request)
    } catch (clientError) {
      console.error('创建 AI 客户端失败:', clientError)
      return NextResponse.json(
        { error: `${clientError instanceof Error ? clientError.message : '创建 AI 客户端失败'}` },
        { status: 500 }
      )
    }

    const typeMap: Record<string, string> = {
      choice: '选择题',
      fill: '填空题',
      short: '简答题',
      code: '编程题',
    }

    const difficultyMap: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    }

    const prompt = `你是一位专业的教育内容创作者。请基于以下原题生成一道同类型的相似题目。

原题信息：
- 题型：${typeMap[originalQuestion.type] || originalQuestion.type}
- 难度：${difficultyMap[originalQuestion.difficulty] || originalQuestion.difficulty}
- 题目：${originalQuestion.question}

要求：
1. 保持相同的题型和难度级别
2. 考察相同的知识点，但换一个角度或场景
3. 题目清晰明确，答案准确无误
4. 包含详细的解析说明

请以 JSON 格式返回：
\`\`\`json
{
  "question": "题目内容",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "answer": "正确答案",
  "explanation": "详细解析"
}
\`\`\`

注意：
- 如果是选择题，必须包含 options 数组
- 如果是其他题型，options 可以省略
- 只返回 JSON，不要返回其他内容`

    const content = await aiClient.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })
    
    // 提取 JSON
    const jsonMatch = content.match(/\{[^]*\}/)
    if (!jsonMatch) {
      throw new Error('AI 返回格式错误')
    }

    const similarQuestion = JSON.parse(jsonMatch[0])

    return NextResponse.json(similarQuestion)
  } catch (error) {
    console.error('生成相似题目失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    )
  }
}
