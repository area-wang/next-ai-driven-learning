/**
 * 学习内容生成 API
 * 为具体章节生成详细的学习内容
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import MarkdownIt from 'markdown-it'
import { getDbClient } from '@/lib/db-connection'
import { knowledgeContents } from '@/db/schema'
import { generateContentPrompt, type ContentInput } from '@/lib/ai/prompts'
import { type AIClient } from '@/lib/ai/client'
import { getAIConfig, createAIClientFromConfig } from '@/lib/ai/get-ai-config'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { learningContentSchema, learningContentTool } from '@/lib/ai/schemas'

interface GenerateRequest {
  outlineId: string
  topic: string
  chapterTitle: string
  goal?: string
  additionalContext?: string
  level?: 'beginner' | 'intermediate' | 'advanced' // 改为可选
  modelId?: string // 指定使用的模型ID
}

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true, // 允许 HTML 标签
  linkify: true, // 自动转换 URL 为链接
  typographer: true, // 启用智能引号和其他排版优化
  breaks: true, // 将换行符转换为 <br>
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateRequest
    const { 
      outlineId,
      topic, 
      chapterTitle,
      goal,
      additionalContext,
      level,
      modelId,
    } = body

    console.log('[API] Learning content generate request:', {
      outlineId,
      topic,
      chapterTitle,
      level,
      modelId,
    })

    if (!outlineId || !topic || !chapterTitle) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 获取当前用户 ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 获取父文档摘要（如果当前文档有父文档）
    let parentDocSummary = ''
    try {
      const db = getDbClient(request as unknown as Request)
      if (db) {
        // 先查询当前文档的 parentId
        const { learningOutlines } = await import('@/db/schema')
        const currentOutline = await db
          .select({ parentId: learningOutlines.parentId })
          .from(learningOutlines)
          .where(eq(learningOutlines.id, outlineId))
          .limit(1)
        
        if (currentOutline.length > 0 && currentOutline[0].parentId) {
          const parentId = currentOutline[0].parentId
          console.log('[API] 当前文档有父文档，parentId:', parentId)
          
          // 通过 parentId 查询父文档的摘要
          const parentContent = await db
            .select({ summary: knowledgeContents.summary })
            .from(knowledgeContents)
            .where(eq(knowledgeContents.outlineId, parentId))
            .limit(1)
          
          if (parentContent.length > 0 && parentContent[0].summary) {
            parentDocSummary = parentContent[0].summary
            console.log('[API] 获取到父文档摘要，长度:', parentDocSummary.length)
          } else {
            console.log('[API] 父文档没有摘要')
          }
        } else {
          console.log('[API] 当前文档没有父文档')
        }
      }
    } catch (error) {
      console.error('[API] 获取父文档摘要失败:', error)
      // 失败不影响主流程
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
        messageFormat: config.messageFormat,
      })

      aiClient = createAIClientFromConfig(config)
    } catch (configError) {
      console.error('[API] Failed to get AI config:', configError)
      return NextResponse.json(
        { error: `${configError instanceof Error ? configError.message : '获取 AI 配置失败'}` },
        { status: 500 }
      )
    }

    // 构建提示词
    const input: ContentInput = {
      topic,
      outlineItem: chapterTitle,
      level,
    }
    
    let prompt = generateContentPrompt(input)
    
    // 如果有父文档摘要，添加到 prompt 前面
    if (parentDocSummary) {
      // 尝试解析为结构化摘要
      try {
        const summaryObj = JSON.parse(parentDocSummary)
        
        // 直接使用 JSON 格式传递父文档摘要
        const parentSummaryPrompt = `# 父文档摘要

以下是父文档的结构化摘要（JSON 格式）：

${JSON.stringify(summaryObj, null, 2)}

**重要提示**: 当前章节是父文档的子章节，生成的内容应该与父文档内容相关联，可以深入展开父文档中的某个知识点，保持知识的连贯性和格式一致性。

`
        
        prompt = `${parentSummaryPrompt}${prompt}`
      } catch {
        // 如果不是 JSON，直接使用原始摘要
        prompt = `# 父文档摘要\n\n${parentDocSummary}\n\n**重要提示**: 当前章节是父文档的子章节，生成的内容应该与父文档内容相关联。\n\n${prompt}`
      }
    }
    
    // 添加学习目标和补充描述
    if (goal || additionalContext) {
      prompt += '\n\n额外要求：\n'
      if (goal) {
        prompt += `- 学习目标：${goal}\n`
      }
      if (additionalContext) {
        prompt += `- 补充说明：${additionalContext}\n`
      }
    }

    console.log('[API] Generated prompt length:', prompt.length)

    // 调用 AI 生成内容
    console.log('[API] Calling AI...')

    // 根据消息格式选择使用 structured output 或 tool call
    const messageFormat = aiClient.getMessageFormat()
    console.log('[API] Message format:', messageFormat)

    let response: string
    if (messageFormat === 'openai') {
      // OpenAI: 使用 JSON Schema 约束输出
      response = await aiClient.chat({
        messages: [
          {
            role: 'system',
            content: '你是一个专业的教育内容生成助手。请严格按照 JSON Schema 定义的格式返回内容。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0,
        responseFormat: {
          type: 'json_schema',
          schema: learningContentSchema,
        },
      })
    } else {
      // Anthropic: 使用 Tool Call 约束输出
      response = await aiClient.chat({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0,
        tools: [learningContentTool],
      })
    }

    console.log('[API] AI response received, length:', response.length)

    // 解析 JSON 响应
    let contentData: { content: string; summary: Record<string, unknown> | string }
    try {
      contentData = JSON.parse(response)

      if (!contentData.content || !contentData.summary) {
        throw new Error('响应格式错误：缺少 content 或 summary 字段')
      }

      console.log('[API] JSON parsed successfully')
    } catch (parseError) {
      console.error('[API] Failed to parse JSON response:', parseError)
      console.error('[API] Response preview:', response.substring(0, 200))
      // 如果解析失败，尝试将整个响应作为 content，并生成简单摘要
      contentData = {
        content: response,
        summary: {
          topic: topic,
          userQuery: chapterTitle,
          outline: [
            {
              title: chapterTitle,
              level: 2,
              summary: '内容总结',
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
        },
      }
    }

    // 使用 markdown-it 将 Markdown 转换为 HTML
    let htmlContent = md.render(contentData.content)

    // 后处理：修复常见的格式问题
    // 1. 移除列表项内多余的 <p> 标签
    htmlContent = htmlContent.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/g, '<li>$1</li>')
    
    // 2. 移除空的段落标签
    htmlContent = htmlContent.replace(/<p>\s*<\/p>/g, '')
    
    // 3. 修复错误的代码块格式（如果 AI 在列表项中使用了代码块）
    // 将 <li>```xxx```</li> 转换为 <li><code>xxx</code></li>
    htmlContent = htmlContent.replace(/<li>```([^`]+)```<\/li>/g, '<li><code>$1</code></li>')
    
    // 4. 修复列表项中的错误代码块（带语言标识）
    // 将 <li>```language\ncode\n```</li> 转换为 <li><code>code</code></li>
    htmlContent = htmlContent.replace(/<li>```\w+\s*\n([^`]+)\n```<\/li>/g, '<li><code>$1</code></li>')
    
    // 5. 确保代码块有正确的语言类名
    htmlContent = htmlContent.replace(/<pre><code class="language-(\w+)">/g, '<pre><code class="language-$1">')
    
    // 6. 确保标题后有适当的间距
    htmlContent = htmlContent.replace(/(<\/h[1-6]>)(?!<)/g, '$1\n')
    
    // 7. 确保列表前后有适当的间距
    htmlContent = htmlContent.replace(/(<\/[uo]l>)(?!<)/g, '$1\n')
    
    // 8. 清理多余的换行符
    htmlContent = htmlContent.replace(/\n{3,}/g, '\n\n')

    console.log('[API] Markdown converted to HTML, length:', htmlContent.length)

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
      console.log('[API] Updating content in database...')
      
      // 先清空旧的学习材料（闪卡、复习计划、费曼解释、康奈尔笔记）
      // 因为重新生成内容后，旧的学习材料已经不适用了
      console.log('[API] Clearing old learning materials...')
      try {
        // 查找对应的 knowledge_contents 记录
        const existingContent = await db
          .select()
          .from(knowledgeContents)
          .where(eq(knowledgeContents.outlineId, outlineId))
          .limit(1)
        
        if (existingContent.length > 0) {
          const contentId = existingContent[0].id
          const userId = await (await import('@/lib/auth/get-user')).getUserIdOrDemo()
          
          // 导入需要的表
          const { flashcards, reviewSchedules, feynmanExplanations, cornellNotes } = await import('@/db/schema')
          
          // 清空闪卡
          await db.delete(flashcards).where(
            and(
              eq(flashcards.userId, userId),
              eq(flashcards.contentId, contentId)
            )
          )
          
          // 清空复习计划
          await db.delete(reviewSchedules).where(
            and(
              eq(reviewSchedules.userId, userId),
              eq(reviewSchedules.contentId, contentId)
            )
          )
          
          // 清空费曼解释
          await db.delete(feynmanExplanations).where(
            and(
              eq(feynmanExplanations.userId, userId),
              eq(feynmanExplanations.contentId, contentId)
            )
          )
          
          // 清空康奈尔笔记
          await db.delete(cornellNotes).where(
            and(
              eq(cornellNotes.userId, userId),
              eq(cornellNotes.contentId, contentId)
            )
          )
          
          console.log('[API] Old learning materials cleared')
        }
      } catch (clearError) {
        console.warn('[API] Failed to clear old learning materials:', clearError)
        // 继续执行，不影响内容生成
      }
      
      // 更新知识内容
      console.log('[API] Saving content and summary...')

      // 将 summary 对象序列化为 JSON 字符串存储
      const summaryString = typeof contentData.summary === 'string' 
        ? contentData.summary 
        : JSON.stringify(contentData.summary)

      // 保存 HTML 到数据库
      await db
        .update(knowledgeContents)
        .set({
          content: htmlContent,
          summary: summaryString, // 保存 LLM 生成的摘要（JSON 字符串）
          aiGenerated: true,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeContents.outlineId, outlineId))

      console.log('[API] Content and summary updated successfully')

      return NextResponse.json({
        content: htmlContent,
        summary: contentData.summary,
        markdown: contentData.content,
        saved: true,
      })
    } catch (dbError) {
      console.error('[API] Failed to save content:', dbError)
      // 即使保存失败，也返回生成的内容
      return NextResponse.json({
        content: htmlContent,
        summary: contentData.summary,
        markdown: contentData.content,
        saved: false,
        error: '保存失败，但内容已生成',
      })
    }
  } catch (error) {
    console.error('[API] Content generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 服务错误' },
      { status: 500 }
    )
  }
}
