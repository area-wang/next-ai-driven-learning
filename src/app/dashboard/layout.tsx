'use client'

import { SidebarProvider, Sidebar, useSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  
  return (
    <div className={`transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-64'}`}>
      <Header />
      <main className="p-6">{children}</main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[var(--color-bg-light)]">
        <Sidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  )
}
