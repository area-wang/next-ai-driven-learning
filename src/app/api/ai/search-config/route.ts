/**
 * 搜索配置 API
 * 用于读取和保存用户的搜索参数配置（包括 Tavily API Key）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { encrypt, decrypt } from '@/lib/crypto'

interface SearchConfigRequest {
  searchResultCount?: number
  searchLanguage?: 'auto' | 'zh' | 'en'
  tavilyApiKey?: string // 新增：Tavily API Key
}

// 脱敏函数：只显示前4位和后4位
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 8) {
    return '****'
  }
  return `${apiKey.slice(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.slice(-4)}`
}

// GET: 获取搜索配置
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    // 查询用户配置
    const [user] = await db
      .select({
        searchResultCount: users.searchResultCount,
        searchLanguage: users.searchLanguage,
        tavilyApiKey: users.tavilyApiKey,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 解密并脱敏 API Key
    let maskedApiKey = ''
    if (user.tavilyApiKey) {
      try {
        const decryptedKey = decrypt(user.tavilyApiKey)
        maskedApiKey = maskApiKey(decryptedKey)
      } catch (error) {
        console.error('[Search Config] 解密 API Key 失败:', error)
      }
    }

    return NextResponse.json({
      searchResultCount: user.searchResultCount || 5,
      searchLanguage: user.searchLanguage || 'auto',
      tavilyApiKey: maskedApiKey, // 返回脱敏后的 API Key
      hasApiKey: !!user.tavilyApiKey, // 是否已配置 API Key
    })
  } catch (error) {
    console.error('[Search Config API] GET 错误:', error)
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    )
  }
}

// POST: 保存搜索配置
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const body = await request.json() as SearchConfigRequest
    const { searchResultCount, searchLanguage, tavilyApiKey } = body

    // 验证参数
    if (searchResultCount !== undefined) {
      if (![3, 5, 10].includes(searchResultCount)) {
        return NextResponse.json(
          { error: '搜索结果数量必须是 3、5 或 10' },
          { status: 400 }
        )
      }
    }

    if (searchLanguage !== undefined) {
      if (!['auto', 'zh', 'en'].includes(searchLanguage)) {
        return NextResponse.json(
          { error: '搜索语言必须是 auto、zh 或 en' },
          { status: 400 }
        )
      }
    }

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    // 准备更新数据
    const updateData: Partial<typeof users.$inferInsert> = {}
    
    if (searchResultCount !== undefined) {
      updateData.searchResultCount = searchResultCount
    }
    
    if (searchLanguage !== undefined) {
      updateData.searchLanguage = searchLanguage
    }

    // 处理 API Key：加密存储
    if (tavilyApiKey !== undefined) {
      if (tavilyApiKey.trim() === '') {
        // 空字符串表示删除 API Key
        updateData.tavilyApiKey = null as any
      } else {
        // 加密 API Key
        try {
          updateData.tavilyApiKey = encrypt(tavilyApiKey.trim())
        } catch (error) {
          console.error('[Search Config] 加密 API Key 失败:', error)
          return NextResponse.json(
            { error: '保存 API Key 失败' },
            { status: 500 }
          )
        }
      }
    }

    // 更新用户配置
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))

    console.log('[Search Config API] 配置已更新')

    // 返回脱敏后的 API Key
    let maskedApiKey = ''
    if (updateData.tavilyApiKey) {
      try {
        const decryptedKey = decrypt(updateData.tavilyApiKey)
        maskedApiKey = maskApiKey(decryptedKey)
      } catch (error) {
        console.error('[Search Config] 解密 API Key 失败:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: '配置已保存',
      tavilyApiKey: maskedApiKey,
      hasApiKey: !!updateData.tavilyApiKey,
    })
  } catch (error) {
    console.error('[Search Config API] POST 错误:', error)
    return NextResponse.json(
      { error: '保存配置失败' },
      { status: 500 }
    )
  }
}
