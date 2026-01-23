/**
 * 学习内容生成 API
 * 为具体章节生成详细的学习内容
 */

import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDbClient } from '@/lib/db-connection'
import { knowledgeContents } from '@/db/schema'
import { createAIClientFromRequest } from '@/lib/ai/config-client'
import { generateContentPrompt, type ContentInput } from '@/lib/ai/prompts'
import { type AIClient } from '@/lib/ai/client'

interface GenerateRequest {
  outlineId: string
  topic: string
  chapterTitle: string
  goal?: string
  additionalContext?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  modelId?: string // 指定使用的模型ID
}

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

    // 从配置创建 AI 客户端
    console.log('[API] Creating AI client from config...')
    let aiClient: AIClient
    try {
      // 如果提供了 modelId，使用指定的模型
      if (modelId) {
        const { OpenAIClient } = await import('@/lib/ai/client')
        
        // 从环境变量读取 OpenRouter API Key（安全）
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
          throw new Error('未配置 OPENROUTER_API_KEY 环境变量')
        }
        
        const modelConfigHeader = request.headers.get('x-model-config')
        if (modelConfigHeader) {
          const modelConfig = JSON.parse(modelConfigHeader)
          // 使用环境变量中的 API Key
          aiClient = new OpenAIClient(
            apiKey,
            modelConfig.model,
            modelConfig.baseUrl || 'https://openrouter.ai/api/v1'
          )
        } else {
          throw new Error('未提供模型配置，请确保客户端正确传递了模型信息')
        }
      } else {
        // 使用默认配置
        aiClient = createAIClientFromRequest(request)
      }
    } catch (clientError) {
      console.error('[API] Failed to create AI client:', clientError)
      return NextResponse.json(
        { error: `${clientError instanceof Error ? clientError.message : '创建 AI 客户端失败'}` },
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
      maxTokens: 4000,
    })

    console.log('[API] AI response received, length:', response.length)

    // 将 Markdown 转换为 HTML
    // 注意：需要先处理代码块，避免被其他规则影响
    let htmlContent = response
    
    // 1. 先提取并保护代码块（避免被其他规则处理）
    const codeBlocks: string[] = []
    // 修复正则表达式：更准确地匹配代码块
    htmlContent = htmlContent.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
      const language = lang || 'plaintext'
      // 转义 HTML 特殊字符
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      codeBlocks.push(`<pre data-language="${language}"><code class="language-${language}">${escapedCode}</code></pre>`)
      return placeholder
    })
    
    // 2. 处理行内代码（单个反引号，但不是代码块的一部分）
    htmlContent = htmlContent.replace(/`([^`\n]+)`/g, '<code>$1</code>')
    
    // 3. 处理标题
    htmlContent = htmlContent
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // 4. 处理粗体和斜体
    htmlContent = htmlContent
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // 5. 处理列表
    htmlContent = htmlContent
      .replace(/^\* (.+$)/gim, '<li>$1</li>')
      .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
      .replace(/^\d+\. (.+$)/gim, '<li>$1</li>')
    
    // 6. 处理段落（将连续的非 HTML 行包裹在 <p> 标签中）
    htmlContent = htmlContent
      .split('\n\n')
      .map(para => {
        para = para.trim()
        if (!para) return ''
        // 如果已经是 HTML 标签或占位符，不处理
        if (para.startsWith('<') || para.startsWith('__CODE_BLOCK_')) return para
        return `<p>${para}</p>`
      })
      .join('\n')
    
    // 7. 恢复代码块
    codeBlocks.forEach((block, index) => {
      htmlContent = htmlContent.replace(`__CODE_BLOCK_${index}__`, block)
    })

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
