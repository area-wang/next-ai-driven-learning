"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, User, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface RegisterFormProps {
  className?: string
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "至少8个字符", test: (p) => p.length >= 8 },
  { label: "包含小写字母", test: (p) => /[a-z]/.test(p) },
  { label: "包含大写字母", test: (p) => /[A-Z]/.test(p) },
  { label: "包含数字", test: (p) => /[0-9]/.test(p) },
]

export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // 验证密码匹配
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      setIsLoading(false)
      return
    }

    // 验证密码强度
    const allRequirementsMet = passwordRequirements.every((req) => req.test(password))
    if (!allRequirementsMet) {
      setError("密码不符合要求")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(data.error || "注册失败")
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch {
      setError("注册失败，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card variant="glass" className={cn("w-full max-w-md", className)}>
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">注册成功！</h2>
          <p className="text-[var(--color-text-secondary)]">正在跳转到登录页面...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="glass" className={cn("w-full max-w-md", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">创建账户</CardTitle>
        <CardDescription>开始您的AI学习之旅</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">昵称</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <Input
                id="name"
                type="text"
                placeholder="您的昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" required>邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" required>密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* 密码强度指示器 */}
            {password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.test(password) ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-red-400" />
                    )}
                    <span className={req.test(password) ? "text-green-600" : "text-[var(--color-text-muted)]"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" required>确认密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">密码不匹配</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            注册
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          已有账户？{" "}
          <a href="/auth/login" className="text-[var(--color-primary)] hover:underline cursor-pointer">
            立即登录
          </a>
        </p>
      </CardFooter>
    </Card>
  )
}
