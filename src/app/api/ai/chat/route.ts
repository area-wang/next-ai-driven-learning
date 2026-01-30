/**
 * AI 对话 API
 * 支持流式响应，使用统一的配置逻辑
 */

import { NextRequest } from 'next/server'
import { type AIMessage } from '@/lib/ai/client'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { getCurrentUserId } from '@/lib/auth/get-user'

interface ChatRequest {
  messages: AIMessage[]
  modelId?: string // 可选的模型 ID，如果不提供则使用默认模型
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest
    const { messages, modelId, temperature, maxTokens, stream = true } = body

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '消息不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取当前用户 ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return new Response(
        JSON.stringify({ error: '未登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取 AI 配置（使用统一配置逻辑）
    console.log('[AI Chat API] 获取 AI 配置...')
    let config
    try {
      config = await getAIConfig(request as unknown as Request, userId, modelId)
      console.log('[AI Chat API] AI 配置:', {
        hasApiKey: !!config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      })
    } catch (configError) {
      console.error('[AI Chat API] 获取 AI 配置失败:', configError)
      return new Response(
        JSON.stringify({ error: configError instanceof Error ? configError.message : '获取 AI 配置失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (stream) {
      // 流式响应
      console.log('[AI Chat API] 开始流式响应...')
      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            ...(config.baseUrl.includes('openrouter.ai') ? {
              'HTTP-Referer': 'https://ai-learning-platform.com',
              'X-Title': 'AI Learning Platform'
            } : {})
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            temperature: temperature || 0.7,
            max_tokens: maxTokens || 100000,
            stream: true,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[AI Chat API] AI API 错误:', response.status, errorText)
          throw new Error(`AI API error: ${response.statusText}`)
        }

        console.log('[AI Chat API] 流式响应创建成功')
        
        // 直接返回原始的 SSE 流
        return new Response(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } catch (streamError) {
        console.error('[AI Chat API] 流式响应错误:', streamError)
        throw streamError
      }
    } else {
      // 非流式响应
      console.log('[AI Chat API] 开始非流式响应...')
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          ...(config.baseUrl.includes('openrouter.ai') ? {
            'HTTP-Referer': 'https://ai-learning-platform.com',
            'X-Title': 'AI Learning Platform'
          } : {})
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 100000,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AI Chat API] AI API 错误:', response.status, errorText)
        throw new Error(`AI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = (data as any).choices?.[0]?.message?.content || ''

      console.log('[AI Chat API] 非流式响应成功，长度:', content.length)
      return new Response(
        JSON.stringify({ response: content }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('[AI Chat API] 错误:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
