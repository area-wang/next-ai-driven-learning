import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // 保护需要登录的路由
  const protectedRoutes = ["/dashboard", "/learn", "/test", "/notes"]
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }

  // 已登录用户访问认证页面时重定向
  const authRoutes = ["/auth/login", "/auth/register"]
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  return
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)",
  ],
}
