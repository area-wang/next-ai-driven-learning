/**
 * AI 聊天界面组件
 * 支持流式响应和模型切换
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Settings } from 'lucide-react'
import { useAIConfig } from '@/hooks/use-ai-config'
import { getModelInfo, getProviderInfo } from '@/lib/ai/models'
import { ModelSelector } from './model-selector'
import { AIMessage } from '@/lib/ai/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  systemPrompt?: string
  placeholder?: string
  onMessageSent?: (message: string) => void
}

export function ChatInterface({
  systemPrompt,
  placeholder = '输入您的问题...',
  onMessageSent,
}: ChatInterfaceProps) {
  const { config, hasApiKey } = useAIConfig()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentModel = getModelInfo(config.provider, config.model)
  const currentProvider = getProviderInfo(config.provider)
  const needsApiKey = currentProvider?.requiresApiKey && !hasApiKey()

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    onMessageSent?.(userMessage.content)

    try {
      // 构建消息历史
      const aiMessages: AIMessage[] = []
      
      if (systemPrompt) {
        aiMessages.push({
          role: 'system',
          content: systemPrompt,
        })
      }

      messages.forEach(msg => {
        aiMessages.push({
          role: msg.role,
          content: msg.content,
        })
      })

      aiMessages.push({
        role: 'user',
        content: userMessage.content,
      })

      // 调用 AI API
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      // 如果需要 API Key，从配置中获取并添加到请求头
      if (currentProvider?.requiresApiKey) {
        const apiKey = hasApiKey() ? config.apiKeys[config.provider] : undefined
        if (apiKey) {
          headers['x-api-key'] = apiKey
        }
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: aiMessages,
          provider: config.provider,
          model: config.model,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error('AI 服务错误')
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantContent += chunk

          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, content: assistantContent }
                : msg
            )
          )
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发生了错误。请检查您的 API Key 配置或稍后重试。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* 头部 - 显示当前模型 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">
              {currentModel?.name || '未选择模型'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {currentProvider?.name}
            </div>
          </div>
          {needsApiKey && (
            <div className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
              需要配置 API Key
            </div>
          )}
        </div>

        <button
          onClick={() => setShowModelSelector(!showModelSelector)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          title="切换模型"
        >
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* 模型选择器 */}
      {showModelSelector && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <ModelSelector
            compact
            onModelChange={() => setShowModelSelector(false)}
          />
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
            <p className="text-lg mb-2">👋 你好！</p>
            <p className="text-sm">我是 AI 助手，有什么可以帮助你的吗？</p>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.role === 'user'
                    ? 'text-teal-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl">
              <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        {needsApiKey && (
          <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm text-orange-800 dark:text-orange-200">
            当前模型需要 API Key。请前往{' '}
            <a
              href="/settings/ai"
              className="underline font-medium cursor-pointer"
            >
              设置页面
            </a>{' '}
            配置，或切换到免费的 Cloudflare AI。
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading || needsApiKey}
            rows={1}
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || needsApiKey}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
