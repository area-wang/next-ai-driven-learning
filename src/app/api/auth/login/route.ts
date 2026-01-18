import { NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/auth/password"
import { getDbClient } from "@/lib/db-connection"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string }
    const { email, password } = body

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码是必填项" },
        { status: 400 }
      )
    }

    // 获取数据库连接
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { 
          error: "数据库连接失败",
          hint: "请确保使用 'npm run dev' 启动开发服务器"
        },
        { status: 500 }
      )
    }

    // 查找用户
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get()

    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 验证密码
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "该账户使用第三方登录，请使用对应的登录方式" },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 返回用户信息（不包含密码）
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("登录错误:", error)
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    )
  }
}
