/**
 * 测试 DeepSeek API 调用
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Starting DeepSeek test...')
    
    const body = await request.json() as { apiKey: string }
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: '需要 API Key' }, { status: 400 })
    }

    console.log('[TEST] Calling DeepSeek API...')

    // 直接调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: '请用一句话介绍你自己',
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    })

    console.log('[TEST] DeepSeek response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TEST] DeepSeek error:', errorText)
      return NextResponse.json(
        { error: `DeepSeek API 错误: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json() as any
    console.log('[TEST] DeepSeek success!')

    return NextResponse.json({
      success: true,
      message: data.choices?.[0]?.message?.content || 'No response',
      fullResponse: data,
    })
  } catch (error) {
    console.error('[TEST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
