import type { Metadata } from "next"
import "./globals.css"
import { SessionProvider } from "@/components/providers/session-provider"

export const metadata: Metadata = {
  title: "AI学习平台",
  description: "AI驱动的个性化学习平台，利用AI生成学习计划、大纲、知识内容和测试题",
  keywords: ["AI学习", "在线教育", "个性化学习", "费曼学习法"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-[var(--color-bg-light)] text-[var(--color-text)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
