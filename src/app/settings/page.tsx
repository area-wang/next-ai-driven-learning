'use client'

import Link from 'next/link'
import { Bot, User, Bell, Shield } from 'lucide-react'

const settingsOptions = [
  {
    id: 'ai',
    name: 'AI 模型配置',
    description: '配置 AI 模型和 API Key',
    href: '/settings/ai',
    icon: Bot,
  },
  // 后续可以添加更多设置项
  // {
  //   id: 'account',
  //   name: '账号设置',
  //   description: '管理你的账号信息',
  //   href: '/settings/account',
  //   icon: User,
  // },
]

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          设置
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          管理你的应用设置和偏好
        </p>
      </div>

      <div className="grid gap-4">
        {settingsOptions.map((option) => {
          const Icon = option.icon
          return (
            <Link
              key={option.id}
              href={option.href}
              className="glass rounded-lg border border-[var(--color-border-light)] p-6 hover:border-[var(--color-primary)] transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                    {option.name}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {option.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
