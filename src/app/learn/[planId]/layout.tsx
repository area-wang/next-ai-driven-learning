/**
 * 学习计划详情页布局
 * 只包含顶部导航，不包含左侧菜单栏，提供更宽的编辑空间
 */

import { Header } from "@/components/layout/header"

export default function LearnPlanDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-light)]">
      <Header />
      <main>{children}</main>
    </div>
  )
}
