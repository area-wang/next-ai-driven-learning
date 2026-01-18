/**
 * AI 对话 API
 * 支持流式响应和多个 LLM 提供商
 */

import { NextRequest } from 'next/server'
import { createAIClient, type AIMessage, type AIProvider } from '@/lib/ai/client'

interface ChatRequest {
  messages: AIMessage[]
  provider?: AIProvider
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest
    const { messages, provider = 'openai', model, temperature, maxTokens, stream = true } = body

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: '消息不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 根据提供商获取对应的 API key
    // 优先使用客户端传递的 API key（从 localStorage），其次使用服务器环境变量
    let apiKey: string | undefined
    
    // 从请求头获取客户端 API key
    const clientApiKey = request.headers.get('x-api-key')
    
    switch (provider) {
      case 'openai':
        apiKey = clientApiKey || process.env.OPENAI_API_KEY
        break
      case 'deepseek':
        apiKey = clientApiKey || process.env.DEEPSEEK_API_KEY
        break
      case 'gemini':
        apiKey = clientApiKey || process.env.GEMINI_API_KEY
        break
      case 'claude':
        apiKey = clientApiKey || process.env.CLAUDE_API_KEY
        break
      case 'cloudflare':
        // Cloudflare AI 不需要 API key，使用 binding
        break
      default:
        return new Response(
          JSON.stringify({ error: `不支持的提供商: ${provider}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    // 创建 AI 客户端
    const aiClient = createAIClient({
      provider,
      apiKey,
      model,
      ai: (request as any).env?.AI, // Cloudflare AI binding
    })

    if (stream) {
      // 流式响应
      const aiStream = await aiClient.chatStream({
        messages,
        temperature,
        maxTokens,
      })

      return new Response(aiStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // 非流式响应
      const response = await aiClient.chat({
        messages,
        temperature,
        maxTokens,
      })

      return new Response(
        JSON.stringify({ response }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('AI chat error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'AI 服务错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
