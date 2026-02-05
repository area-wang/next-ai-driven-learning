/**
 * 加密工具函数
 * 用于敏感数据的加密和解密
 */

/**
 * 简单的 Base64 编码（用于传输）
 * 注意：这不是真正的加密，只是编码，主要用于避免明文传输
 */
export function encodeApiKey(apiKey: string): string {
  if (!apiKey) return ''
  // 使用 Base64 编码
  return btoa(apiKey)
}

/**
 * Base64 解码
 */
export function decodeApiKey(encoded: string): string {
  if (!encoded) return ''
  try {
    return atob(encoded)
  } catch (error) {
    console.error('解码失败:', error)
    return encoded // 如果解码失败，返回原始值（可能是未编码的）
  }
}

/**
 * 检查字符串是否是 Base64 编码
 */
export function isBase64Encoded(str: string): boolean {
  if (!str) return false
  try {
    return btoa(atob(str)) === str
  } catch {
    return false
  }
}

/**
 * 加密函数（用于数据库存储）
 * 使用 Base64 编码（简单加密）
 */
export function encrypt(text: string): string {
  if (!text) return ''
  return btoa(text)
}

/**
 * 解密函数（从数据库读取）
 * 使用 Base64 解码
 */
export function decrypt(encoded: string): string {
  if (!encoded) return ''
  try {
    return atob(encoded)
  } catch (error) {
    console.error('解密失败:', error)
    return encoded // 如果解密失败，返回原始值
  }
}

/**
 * 脱敏 API Key
 * 格式：显示前4位和后4位，中间用*替代
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return apiKey
  }
  const prefix = apiKey.slice(0, 4)
  const suffix = apiKey.slice(-4)
  const middleLength = apiKey.length - 8
  const masked = '*'.repeat(Math.min(middleLength, 20)) // 最多显示20个*
  return `${prefix}${masked}${suffix}`
}
