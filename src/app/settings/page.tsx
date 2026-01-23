'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // 重定向到 AI 设置页面
    router.replace('/settings/ai')
  }, [router])

  return null
}
