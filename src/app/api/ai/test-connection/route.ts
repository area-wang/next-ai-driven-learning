/**
 * AI 模型连通性测试 API
 * POST /api/ai/test-connection
 * 
 * 统一使用 OpenRouter API 进行测试和调用
 */

import { NextRequest, NextResponse } from 'next/server'

// export const runtime = 'edge'

interface TestRequest {
  provider: 'openai' | 'google' | 'anthropic' | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot' | 'minimax' | 'bytedance' | 'custom'
  apiKey: string
  baseUrl?: string
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TestRequest
    const { apiKey, baseUrl, model } = body

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key 不能为空' },
        { status: 400 }
      )
    }

    // 使用自定义 baseUrl 或默认的 OpenRouter API
    const testResult = await testOpenRouterAPI(apiKey, baseUrl, model)

    return NextResponse.json(testResult)
  } catch (error) {
    console.error('测试连接失败:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

/**
 * 测试 OpenRouter API 连接
 * 支持自定义 baseUrl 或使用默认的 OpenRouter API
 */
async function testOpenRouterAPI(
  apiKey: string,
  baseUrl?: string,
  model?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 使用自定义 baseUrl 或默认的 OpenRouter API
    const apiBaseUrl = baseUrl || 'https://openrouter.ai/api/v1'
    const url = `${apiBaseUrl}/chat/completions`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const errorData = await response.json().catch(() => ({ error: { message: '未知错误' } })) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || `API 错误: ${response.status}`
      return { success: false, error: errorMessage }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '连接失败',
    }
  }
}
