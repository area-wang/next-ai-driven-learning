/**
 * AI 对话 API
 * 支持流式响应，使用统一的配置逻辑
 * 支持不同厂商的消息格式（OpenAI 和 Anthropic）
 */

import { NextRequest } from 'next/server'
import { type AIMessage } from '@/lib/ai/client'
import { getAIConfig, createAIClientFromConfig } from '@/lib/ai/get-ai-config'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { performSearch, extractSearchQuery } from '@/lib/search/utils'
import { getSearchConfig } from '@/lib/search/get-search-config'

interface ChatRequest {
  messages: AIMessage[]
  modelId?: string // 可选的模型 ID，如果不提供则使用默认模型
  temperature?: number
  maxTokens?: number
  stream?: boolean
  enableWebSearch?: boolean // 是否启用联网搜索
}

/**
 * 根据消息格式转换消息
 * OpenAI 格式：直接使用
 * Anthropic 格式：分离 system 消息
 */
function convertMessagesForFormat(
  messages: AIMessage[],
  format: 'openai' | 'anthropic' = 'openai'
): { messages: AIMessage[]; systemMessage?: string } {
  if (format === 'anthropic') {
    const systemMessage = messages.find(m => m.role === 'system')?.content
    const conversationMessages = messages.filter(m => m.role !== 'system')
    return {
      messages: conversationMessages,
      systemMessage,
    }
  }
  return { messages }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest
    const { messages, modelId, temperature, maxTokens, stream = true, enableWebSearch = false } = body

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

    // 处理联网搜索
    let searchResults = ''
    if (enableWebSearch) {
      try {
        // 获取 AI 配置（用于搜索意图分析）
        let aiConfig
        try {
          const config = await getAIConfig(request as unknown as Request, userId, modelId)
          aiConfig = {
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
          }
        } catch (error) {
          // 无法获取 AI 配置，将使用简单提取
        }
        
        // 获取用户的搜索配置
        const searchConfig = await getSearchConfig(request as unknown as Request, userId)
        
        // 提取最后一条用户消息作为搜索查询
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()
        if (lastUserMessage) {
          const searchQuery = lastUserMessage.content
          
          // 执行搜索（传递 AI 配置用于智能分析）
          searchResults = await performSearch(searchQuery, searchConfig, aiConfig)
        }
      } catch (searchError) {
        // 搜索失败不影响主流程，继续使用普通 LLM 调用
      }
    }

    // 如果有搜索结果，将其添加到消息中
    let finalMessages = messages
    if (searchResults) {
      // 在最后一条用户消息之前插入搜索结果
      const messagesBeforeLast = messages.slice(0, -1)
      const lastMessage = messages[messages.length - 1]
      
      finalMessages = [
        ...messagesBeforeLast,
        {
          role: 'system' as const,
          content: searchResults,
        },
        lastMessage,
      ]
    }

    // 获取 AI 配置（使用统一配置逻辑）
    let config
    try {
      config = await getAIConfig(request as unknown as Request, userId, modelId)
    } catch (configError) {
      console.error('[AI Chat API] 获取 AI 配置失败:', configError)
      return new Response(
        JSON.stringify({ error: configError instanceof Error ? configError.message : '获取 AI 配置失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 根据消息格式转换消息
    const messageFormat = config.messageFormat || 'openai'
    const { messages: convertedMessages, systemMessage } = convertMessagesForFormat(finalMessages, messageFormat)

    // 调试日志
    console.log('[AI Chat API] 请求配置:', {
      baseUrl: config.baseUrl,
      model: config.model,
      messageFormat,
      isOpenRouter: config.baseUrl.includes('openrouter.ai'),
    })

    if (stream) {
      // 流式响应
      try {
        let response
        
        if (messageFormat === 'anthropic') {
          // Anthropic 格式
          const anthropicBody: any = {
            model: config.model,
            messages: convertedMessages,
            system: systemMessage,
            temperature: temperature || 0.7,
            stream: true,
          }

          // 只在明确指定 maxTokens 时才添加
          if (maxTokens !== undefined) {
            anthropicBody.max_tokens = maxTokens
          }

          response = await fetch(`${config.baseUrl}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': config.apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(anthropicBody),
          })
        } else {
          // OpenAI 格式
          const requestBody: any = {
            model: config.model,
            messages: convertedMessages,
            temperature: temperature || 0.7,
            stream: true,
          }

          // 只在明确指定 maxTokens 时才添加
          if (maxTokens !== undefined) {
            requestBody.max_tokens = maxTokens
          }

          console.log('[AI Chat API] 请求体:', {
            model: requestBody.model,
            messageCount: requestBody.messages.length,
            temperature: requestBody.temperature,
            max_tokens: requestBody.max_tokens,
          })

          response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
              ...(config.baseUrl.includes('openrouter.ai') ? {
                'HTTP-Referer': 'https://ai-learning-platform.com',
                'X-Title': 'AI Learning Platform'
              } : {})
            },
            body: JSON.stringify(requestBody),
          })
        }

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[AI Chat API] AI API 错误:', {
            status: response.status,
            statusText: response.statusText,
            baseUrl: config.baseUrl,
            model: config.model,
            errorText,
          })

          // 尝试解析错误信息
          let errorMessage = response.statusText
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error?.message || errorData.message || errorMessage
          } catch (e) {
            // 无法解析 JSON，使用原始文本
            errorMessage = errorText || errorMessage
          }

          throw new Error(`AI API 错误 (${config.model}): ${errorMessage}`)
        }
        
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
      let response
      
      if (messageFormat === 'anthropic') {
        // Anthropic 格式
        const anthropicBody: any = {
          model: config.model,
          messages: convertedMessages,
          system: systemMessage,
          temperature: temperature || 0.7,
        }

        // 只在明确指定 maxTokens 时才添加
        if (maxTokens !== undefined) {
          anthropicBody.max_tokens = maxTokens
        }

        response = await fetch(`${config.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(anthropicBody),
        })
      } else {
        // OpenAI 格式
        const requestBody: any = {
          model: config.model,
          messages: convertedMessages,
          temperature: temperature || 0.7,
          stream: false,
        }

        // 只在明确指定 maxTokens 时才添加
        if (maxTokens !== undefined) {
          requestBody.max_tokens = maxTokens
        }

        response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            ...(config.baseUrl.includes('openrouter.ai') ? {
              'HTTP-Referer': 'https://ai-learning-platform.com',
              'X-Title': 'AI Learning Platform'
            } : {})
          },
          body: JSON.stringify(requestBody),
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[AI Chat API] AI API 错误:', {
          status: response.status,
          statusText: response.statusText,
          baseUrl: config.baseUrl,
          model: config.model,
          errorText,
        })

        // 尝试解析错误信息
        let errorMessage = response.statusText
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error?.message || errorData.message || errorMessage
        } catch (e) {
          // 无法解析 JSON，使用原始文本
          errorMessage = errorText || errorMessage
        }

        throw new Error(`AI API 错误 (${config.model}): ${errorMessage}`)
      }

      const data = await response.json()
      
      let content = ''
      if (messageFormat === 'anthropic') {
        content = (data as any).content?.[0]?.text || ''
      } else {
        content = (data as any).choices?.[0]?.message?.content || ''
      }

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
