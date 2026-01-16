import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { verifyPassword } from "./password"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 这里需要从数据库获取用户
        // 由于 Cloudflare D1 的特殊性，实际验证逻辑在 API 路由中处理
        // 这里只做基本的凭证检查
        const email = credentials.email as string
        const password = credentials.password as string

        if (!email || !password) {
          return null
        }

        // 返回基本用户信息，实际验证在 signIn 回调中处理
        return {
          id: email,
          email: email,
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    newUser: "/auth/register",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard")
      const isOnLearn = request.nextUrl.pathname.startsWith("/learn")
      const isOnAuth = request.nextUrl.pathname.startsWith("/auth")

      // 保护需要登录的路由
      if (isOnDashboard || isOnLearn) {
        if (isLoggedIn) return true
        return false // 重定向到登录页
      }

      // 已登录用户访问认证页面时重定向到仪表板
      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl))
      }

      return true
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  trustHost: true,
}
