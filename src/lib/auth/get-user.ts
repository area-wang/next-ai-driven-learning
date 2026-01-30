import { auth } from '@/lib/auth'

/**
 * 从请求中获取当前登录用户的 ID
 * 如果未登录，返回 null
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth()
    return session?.user?.id || null
  } catch (error) {
    console.error('获取用户 session 失败:', error)
    return null
  }
}

/**
 * 从请求中获取当前登录用户的 ID
 * 如果未登录，抛出错误
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    throw new Error('未登录或 session 已过期')
  }
  
  return userId
}

/**
 * 获取用户 ID，如果未登录则使用 demo-user（用于开发环境）
 * 生产环境应该使用 requireUserId
 */
export async function getUserIdOrDemo(): Promise<string> {
  const userId = await getCurrentUserId()
  
  // 开发环境：如果未登录，使用 demo-user
  if (!userId && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ 开发环境：使用 demo-user，生产环境请确保用户已登录')
    return 'demo-user'
  }
  
  // 生产环境：必须登录
  if (!userId) {
    throw new Error('未登录或 session 已过期')
  }
  
  return userId
}
