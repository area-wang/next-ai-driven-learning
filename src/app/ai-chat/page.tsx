/**
 * AI 聊天测试页面
 */

import { ChatInterface } from '@/components/ai/chat-interface'

export default function AIChatPage() {
  return (
    <div className="h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto h-full flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            AI 对话助手
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            与 AI 进行对话，获取学习帮助和建议
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <ChatInterface
            systemPrompt="你是一个友好的 AI 学习助手，帮助用户解答问题和提供学习建议。"
            placeholder="输入您的问题..."
          />
        </div>
      </div>
    </div>
  )
}
