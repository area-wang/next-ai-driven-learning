'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Code2, X, Bot } from 'lucide-react'
import { AIChatDrawer } from '@/components/ai/ai-chat-drawer'

export function FloatingToolButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-4 right-2 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label="打开工具菜单"
          >
            <Code2 className="w-6 h-6" />
          </button>
        )}

        {/* 工具列表 */}
        {isOpen && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[240px]">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                工具箱
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="关闭工具菜单"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI 对话助手 */}
            <button
              onClick={() => {
                setIsChatOpen(true)
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Bot className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">AI 对话助手</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  智能问答和学习辅导
                </div>
              </div>
            </button>

            {/* 代码运行环境 */}
            <Link
              href="/playground"
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <Code2 className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">代码运行环境</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  支持 18 种编程语言
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* AI 对话抽屉 */}
      <AIChatDrawer open={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  )
}
