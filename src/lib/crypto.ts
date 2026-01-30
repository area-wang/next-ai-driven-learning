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
