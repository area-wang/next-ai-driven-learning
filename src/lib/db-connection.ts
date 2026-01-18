/**
 * 数据库连接辅助函数
 * 处理 Next.js 开发模式和 Cloudflare Workers 环境的差异
 */

import { createDbClient, type DbClient } from '@/db/client'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * 从请求中获取数据库连接
 * 在 Cloudflare Workers 环境中，DB 绑定在 request.env 中
 * 在 Next.js 开发环境中，使用 getCloudflareContext() 获取绑定
 */
export function getDbFromRequest(request: Request): D1Database | null {
  try {
    // 尝试使用 OpenNext Cloudflare 上下文
    const context = getCloudflareContext()
    if (context?.env?.DB) {
      return context.env.DB as D1Database
    }
  } catch (error) {
    // 在非 Cloudflare 环境中会抛出错误，继续尝试其他方法
  }

  // 尝试从 request 对象中获取 env（生产环境）
  const env = (request as unknown as { env?: { DB?: D1Database } }).env
  
  if (env?.DB) {
    return env.DB
  }

  // 在开发环境中，如果没有 DB 绑定，返回 null
  return null
}

/**
 * 获取数据库客户端
 */
export function getDbClient(request: Request): DbClient | null {
  const db = getDbFromRequest(request)
  
  if (!db) {
    return null
  }

  return createDbClient(db)
}
