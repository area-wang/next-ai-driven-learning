import { NextRequest, NextResponse } from "next/server"
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password"
import { getDbClient } from "@/lib/db-connection"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; name?: string }
    const { email, password, name } = body

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码是必填项" },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      )
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(", ") },
        { status: 400 }
      )
    }

    // 获取数据库连接
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { 
          error: "数据库连接失败",
          hint: "请确保使用 'npm run dev' 启动开发服务器，并且已经初始化数据库（npm run db:migrate:local）"
        },
        { status: 500 }
      )
    }

    // 检查邮箱是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get()

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      )
    }

    // 哈希密码
    const passwordHash = await hashPassword(password)

    // 创建用户
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name: name || email.split("@")[0],
        provider: "email",
      })
      .returning()

    const user = newUser[0]

    return NextResponse.json(
      {
        message: "注册成功",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("注册错误:", error)
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    )
  }
}
