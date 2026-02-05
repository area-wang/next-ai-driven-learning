/**
 * 获取用户的搜索配置（包括 Tavily API Key）
 */

import { getDbClient } from '@/lib/db-connection'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { decrypt } from '@/lib/crypto'
import type { SearchConfig } from './utils'

export async function getSearchConfig(
  request: Request,
  userId: string
): Promise<SearchConfig & { apiKey?: string }> {
  const db = getDbClient(request)
  
  if (!db) {
    return {
      resultCount: 5,
      language: 'auto',
    }
  }

  try {
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
      return {
        resultCount: 5,
        language: 'auto',
      }
    }

    // 解密 API Key
    let apiKey: string | undefined
    if (user.tavilyApiKey) {
      try {
        apiKey = decrypt(user.tavilyApiKey)
      } catch (error) {
        console.error('[Get Search Config] 解密 API Key 失败:', error)
      }
    }

    return {
      resultCount: user.searchResultCount || 5,
      language: (user.searchLanguage as 'auto' | 'zh' | 'en') || 'auto',
      apiKey, // 返回解密后的 API Key
    }
  } catch (error) {
    console.error('[Get Search Config] 获取配置失败:', error)
    return {
      resultCount: 5,
      language: 'auto',
    }
  }
}
