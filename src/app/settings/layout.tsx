'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Settings, Bot, ArrowLeft } from 'lucide-react'

const settingsNav = [
  {
    id: 'ai',
    name: 'AI 模型',
    href: '/settings/ai',
    icon: Bot,
  },
  // 后续可以添加更多设置项
  // {
  //   id: 'account',
  //   name: '账号设置',
  //   href: '/settings/account',
  //   icon: User,
  // },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                设置
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-[240px_1fr] gap-8">
          {/* 左侧导航 */}
          <nav className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* 右侧内容 */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
