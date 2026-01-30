/**
 * 学习内容生成 API
 * 为具体章节生成详细的学习内容
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { marked } from 'marked'
import { getDbClient } from '@/lib/db-connection'
import { knowledgeContents } from '@/db/schema'
import { generateContentPrompt, type ContentInput } from '@/lib/ai/prompts'
import { OpenAIClient, type AIClient } from '@/lib/ai/client'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { getCurrentUserId } from '@/lib/auth/get-user'

interface GenerateRequest {
  outlineId: string
  topic: string
  chapterTitle: string
  goal?: string
  additionalContext?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  modelId?: string // 指定使用的模型ID
}

// 配置 marked 选项
marked.setOptions({
  gfm: true, // 启用 GitHub Flavored Markdown
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

    // 构建提示词
    const input: ContentInput = {
      topic,
      outlineItem: chapterTitle,
      level,
    }
    
    let prompt = generateContentPrompt(input)
    
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
    const response = await aiClient.chat({
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

    // 使用 marked 将 Markdown 转换为 HTML
    let htmlContent = await marked.parse(response, {
      async: true,
      gfm: true,
      breaks: true,
    })

    // 后处理：修复常见的格式问题
    // 1. 移除列表项内多余的 <p> 标签（marked 有时会在列表项内添加 <p>）
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
      await db
        .update(knowledgeContents)
        .set({
          content: htmlContent,
          aiGenerated: true,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeContents.outlineId, outlineId))

      console.log('[API] Content updated successfully')

      return NextResponse.json({
        content: htmlContent,
        markdown: response,
        saved: true,
      })
    } catch (dbError) {
      console.error('[API] Failed to save content:', dbError)
      // 即使保存失败，也返回生成的内容
      return NextResponse.json({
        content: htmlContent,
        markdown: response,
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
