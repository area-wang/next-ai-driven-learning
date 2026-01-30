/**
 * 厂商模型列表 API
 * 从各厂商的 API 动态获取模型列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchProviderModels } from '@/lib/ai/provider-models'

export const runtime = 'nodejs'

/**
 * GET - 获取指定厂商的模型列表
 * 查询参数:
 * - provider: 厂商 ID (必需)
 * - apiKey: API Key (必需)
 * - baseUrl: 自定义 Base URL (可选)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const apiKey = searchParams.get('apiKey')
    const baseUrl = searchParams.get('baseUrl') || undefined

    if (!provider) {
      return NextResponse.json(
        { success: false, error: '缺少 provider 参数' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '缺少 apiKey 参数' },
        { status: 400 }
      )
    }

    console.log(`[Provider Models API] 获取 ${provider} 的模型列表`)

    const models = await fetchProviderModels(provider, apiKey, baseUrl)

    return NextResponse.json({
      success: true,
      data: {
        provider,
        models,
        total: models.length,
      },
    })
  } catch (error) {
    console.error('[Provider Models API] 获取模型列表失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取模型列表失败',
      },
      { status: 500 }
    )
  }
}
