/**
 * 生成文档摘要 API
 * POST /api/ai/generate-summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { knowledgeContents } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { OpenAIClient } from '@/lib/ai/client'

export const runtime = 'nodejs'

interface GenerateSummaryRequest {
  contentId: string
  content: string
  modelId?: string
}

/**
 * 从 HTML 内容中提取纯文本
 */
function extractTextFromHtml(html: string): string {
  // 移除 HTML 标签
  let text = html.replace(/<[^>]*>/g, ' ')
  // 解码 HTML 实体
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // 移除多余空白
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

/**
 * 生成文档摘要
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json() as GenerateSummaryRequest
    const { contentId, content, modelId } = body

    if (!contentId || !content) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 提取纯文本
    const plainText = extractTextFromHtml(content)

    // 如果内容太短，直接使用原文作为摘要
    if (plainText.length < 200) {
      const db = getDbClient(request as unknown as Request)
      if (!db) {
        return NextResponse.json(
          { error: '数据库连接失败' },
          { status: 500 }
        )
      }

      await db
        .update(knowledgeContents)
        .set({ summary: plainText })
        .where(eq(knowledgeContents.id, contentId))

      return NextResponse.json({
        success: true,
        summary: plainText,
      })
    }

    // 获取 AI 配置
    const config = await getAIConfig(request as unknown as Request, userId, modelId)
    const aiClient = new OpenAIClient(
      config.apiKey,
      config.model,
      config.baseUrl
    )

    // 生成结构化摘要
    const summaryPrompt = `请为以下文档生成一个结构化的摘要，以 JSON 格式返回：

${plainText.substring(0, 8000)}

**【重要】返回格式要求：**
必须返回 JSON 格式，包含以下字段：

\`\`\`json
{
  "topic": "文档主题",
  "userQuery": "文档的核心问题或主题",
  "outline": [
    {
      "title": "章节标题",
      "level": 2,
      "summary": "该章节的核心内容总结（50-100字）",
      "format": {
        "titleLevel": "##",
        "hasCodeBlocks": true,
        "codeLanguages": ["python"],
        "hasLists": true,
        "listStyle": "使用 - 开头，标题加粗",
        "hasTables": false,
        "hasImages": false,
        "hasFormulas": false
      }
    }
  ],
}
\`\`\`

要求：
1. 分析每个章节使用的格式（标题层级、代码块、列表等）
2. 为每个章节单独记录其格式信息
3. 提取文档大纲，每个章节包含标题、层级、总结、格式
4. 提取 3-5 个关键知识点
5. 估算文档字数
6. 只返回 JSON，不要包含其他文本`

    const response = await aiClient.chat({
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文档分析助手，擅长提取文档的结构和核心内容。',
        },
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
      temperature: 0.3,
      maxTokens: 2000,
    })

    // 解析 JSON 响应
    let summaryData: Record<string, unknown>
    try {
      // 清理响应：移除可能的 Markdown 代码块标记
      let cleanedResponse = response.trim()
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '')
      cleanedResponse = cleanedResponse.replace(/\n?```\s*$/i, '')
      
      summaryData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('[Generate Summary API] Failed to parse JSON:', parseError)
      // 如果解析失败，生成默认结构
      summaryData = {
        topic: '未知主题',
        userQuery: '文档内容',
        outline: [
          {
            title: '主要内容',
            level: 2,
            summary: plainText.substring(0, 100),
            format: {
              titleLevel: '##',
              hasCodeBlocks: false,
              codeLanguages: [],
              hasLists: true,
              listStyle: '使用 - 开头',
              hasTables: false,
              hasImages: false,
              hasFormulas: false,
            },
          },
        ],
        keyPoints: [],
        totalLength: `约${Math.round(plainText.length / 100) * 100}字`,
      }
    }

    // 将 summary 对象序列化为 JSON 字符串存储
    const summaryString = JSON.stringify(summaryData)

    // 保存摘要到数据库
    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    await db
      .update(knowledgeContents)
      .set({ summary: summaryString })
      .where(eq(knowledgeContents.id, contentId))

    return NextResponse.json({
      success: true,
      summary: summaryData,
    })
  } catch (error) {
    console.error('[Generate Summary API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成摘要失败' },
      { status: 500 }
    )
  }
}
