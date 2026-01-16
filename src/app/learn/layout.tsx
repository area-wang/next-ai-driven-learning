import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-light)]">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
