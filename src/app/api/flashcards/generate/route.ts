import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { flashcards, knowledgeContents } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { OpenAIClient, type AIClient } from '@/lib/ai/client'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig, createAIClientFromConfig } from '@/lib/ai/get-ai-config'

/**
 * POST /api/flashcards/generate
 * 从文档内容自动生成闪卡
 * 注意：采用"先创建后删除"策略，只有生成成功后才覆盖旧记录
 */
export async function POST(request: NextRequest) {
  try {
    console.log('开始生成闪卡...')
    
    // 获取当前登录用户
    const userId = await getUserIdOrDemo()
    console.log('当前用户:', userId)
    
    const db = getDbClient(request)
    
    if (!db) {
      console.error('数据库连接失败')
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const body = await request.json() as {
      contentId: string  // 这里实际上是 outlineId
      content: string
      title: string
      modelId?: string  // 可选的模型 ID
    }

    const { contentId: outlineId, content, title, modelId } = body
    
    console.log('请求参数:', { outlineId, title, userId, contentLength: content?.length })

    if (!outlineId || !content) {
      console.error('缺少必要参数')
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 查找或创建 knowledge_contents 记录
    console.log('查找或创建 knowledge_contents 记录...')
    let contentId: string
    
    const existingContent = await db
      .select()
      .from(knowledgeContents)
      .where(eq(knowledgeContents.outlineId, outlineId))
      .limit(1)
    
    if (existingContent.length > 0) {
      contentId = existingContent[0].id
      console.log('找到现有 content 记录:', contentId)
      
      // 更新内容
      await db
        .update(knowledgeContents)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeContents.id, contentId))
    } else {
      console.log('创建新的 content 记录...')
      // 创建新内容记录
      const newContent = await db.insert(knowledgeContents).values({
        outlineId,
        content,
        contentType: 'rich_text',
        aiGenerated: false,
      }).returning()
      contentId = newContent[0].id
      console.log('创建成功, contentId:', contentId, 'outlineId:', outlineId)
    }

    console.log('[重要] 将使用 contentId 保存闪卡:', contentId)

    // 检查是否已存在闪卡（用于判断是否为重新生成）
    const existingFlashcards = await db
      .select()
      .from(flashcards)
      .where(
        and(
          eq(flashcards.userId, userId),
          eq(flashcards.contentId, contentId)
        )
      )

    const isRegenerate = existingFlashcards.length > 0
    console.log('是否重新生成:', isRegenerate, '旧闪卡数量:', existingFlashcards.length)

    // 获取 AI 配置
    console.log('获取 AI 配置...')
    const config = await getAIConfig(request as unknown as Request, userId, modelId)
    console.log('AI 配置:', {
      hasApiKey: !!config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      messageFormat: config.messageFormat,
    })

    console.log('创建 AI 客户端...')
    // 创建 AI 客户端
    const aiClient = createAIClientFromConfig(config)

    // 提取纯文本内容（移除 HTML 标签）
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log('纯文本长度:', plainText.length)

    // 使用 AI 生成闪卡
    const prompt = `请从以下学习内容中提取关键知识点，生成记忆闪卡。

学习内容标题：${title}

学习内容：
${plainText.substring(0, 3000)}

要求：
1. 提取 5-10 个最重要的知识点
2. 每个知识点生成一张闪卡
3. 闪卡正面是问题或概念
4. 闪卡背面是答案或解释
5. 问题要简洁明确
6. 答案要准确完整

请以 JSON 格式返回，格式如下：
{
  "flashcards": [
    {
      "front": "问题或概念",
      "back": "答案或解释"
    }
  ]
}

只返回 JSON，不要包含其他内容。`

    console.log('调用 AI 生成闪卡...')
    const response = await aiClient.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })
    
    console.log('AI 响应长度:', response?.length)

    // 解析 AI 响应
    let generatedFlashcards: Array<{ front: string; back: string }> = []
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { flashcards: Array<{ front: string; back: string }> }
        generatedFlashcards = parsed.flashcards || []
        console.log('成功解析闪卡数量:', generatedFlashcards.length)
      }
    } catch (error) {
      console.error('解析 AI 响应失败:', error)
      return NextResponse.json(
        { error: 'AI 生成的内容格式不正确' },
        { status: 500 }
      )
    }

    if (generatedFlashcards.length === 0) {
      console.error('未能生成闪卡')
      return NextResponse.json(
        { error: '未能生成闪卡' },
        { status: 500 }
      )
    }
    
    console.log('开始保存闪卡到数据库...')

    // 先保存新闪卡到数据库
    const insertedCards = []
    try {
      for (const card of generatedFlashcards) {
        console.log('准备插入闪卡:', { userId, contentId, front: card.front.substring(0, 50) })
        
        // 使用 Drizzle 插入
        const result = await db.insert(flashcards).values({
          userId,
          contentId,
          front: card.front,
          back: card.back,
          easinessFactor: 2500,
          repetitions: 0,
          interval: 0,
        }).returning()
        
        console.log('插入成功:', result[0].id)
        insertedCards.push(result[0])
      }

      console.log('成功插入新闪卡数量:', insertedCards.length)

      // 只有新闪卡保存成功后，才删除旧的闪卡
      if (isRegenerate && insertedCards.length > 0) {
        console.log('删除旧的闪卡, 数量:', existingFlashcards.length)
        // 删除旧闪卡（通过 ID 删除，避免误删新闪卡）
        for (const old of existingFlashcards) {
          await db
            .delete(flashcards)
            .where(eq(flashcards.id, old.id))
        }
        console.log('旧闪卡已删除')
      }
    } catch (error) {
      console.error('保存新闪卡失败:', error)
      // 如果保存失败，尝试清理已保存的部分新闪卡
      if (insertedCards.length > 0) {
        console.log('清理部分保存的新闪卡')
        for (const saved of insertedCards) {
          try {
            await db
              .delete(flashcards)
              .where(eq(flashcards.id, saved.id))
          } catch (cleanupError) {
            console.error('清理失败:', cleanupError)
          }
        }
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      count: insertedCards.length,
      flashcards: insertedCards,
      message: isRegenerate 
        ? `已重新生成 ${insertedCards.length} 张闪卡` 
        : `已生成 ${insertedCards.length} 张闪卡`
    })
  } catch (error) {
    console.error('生成闪卡失败 - 详细错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成闪卡失败' },
      { status: 500 }
    )
  }
}
