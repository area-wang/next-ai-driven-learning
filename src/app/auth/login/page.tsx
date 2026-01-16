import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "登录 - AI学习平台",
  description: "登录您的AI学习平台账户",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--color-bg-light)] via-white to-[var(--color-secondary)]/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--color-secondary)]/20 rounded-full blur-3xl" />
      </div>
      <LoginForm className="relative z-10" />
    </div>
  )
}
