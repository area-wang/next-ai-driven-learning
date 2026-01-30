"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "仪表板" },
  { href: "/learn", icon: BookOpen, label: "学习" },
  { href: "/chat", icon: MessageSquare, label: "AI助手" },
  { href: "/settings", icon: Settings, label: "设置" },
]

// 创建 Context 来共享 collapsed 状态
const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}>({
  collapsed: false,
  setCollapsed: () => {},
})

export const useSidebar = () => React.useContext(SidebarContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { collapsed, setCollapsed } = useSidebar()
  
  const user = session?.user
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U"

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col",
        "bg-white/80 backdrop-blur-md border-r border-gray-200",
        "transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <Brain className="w-8 h-8 text-[var(--color-primary)] flex-shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold text-[var(--color-text)]">AI学习</span>
        )}
      </div>

      {/* 导航 */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
                "transition-colors duration-200",
                isActive
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/30 hover:text-[var(--color-text)]"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )

          if (collapsed) {
            return (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return <div key={item.href}>{linkContent}</div>
        })}
      </nav>

      {/* 底部 - 用户信息和退出登录 */}
      <div className="p-2 border-t border-gray-200 flex flex-col items-center space-y-2">
        {/* 用户头像 - hover 显示信息 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center justify-center py-2 cursor-pointer">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-[var(--color-primary)] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white">
              <div>
                <p className="font-medium text-white">{user?.name || "用户"}</p>
                <p className="text-xs text-gray-300">{user?.email}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* 退出登录按钮 */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex justify-center">
              <Button
                variant="ghost"
                className={cn(
                  "text-[var(--color-text-secondary)] hover:text-red-600 transition-colors",
                  collapsed ? "px-0" : "gap-2"
                )}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="w-5 h-5" />
                {!collapsed && <span>退出登录</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white">
              <p className="text-white">退出登录</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 折叠按钮 */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full",
          "bg-white border border-gray-200 shadow-sm",
          "flex items-center justify-center cursor-pointer",
          "hover:bg-gray-50 transition-colors"
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        )}
      </button>
    </aside>
  )
}
