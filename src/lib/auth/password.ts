import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

/**
 * 对密码进行哈希处理
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * 验证密码是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * 验证密码强度
 * 要求：至少8个字符，包含大小写字母和数字
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("密码至少需要8个字符")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("密码需要包含小写字母")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("密码需要包含大写字母")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("密码需要包含数字")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
