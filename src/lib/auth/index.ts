import NextAuth from "next-auth"
import { authConfig } from "./config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// 导出 handlers 中的 GET 和 POST 方法供 API 路由使用
export const { GET, POST } = handlers
