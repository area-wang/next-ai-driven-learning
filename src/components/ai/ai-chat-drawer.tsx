'use client'

import { useState, useRef, useEffect, KeyboardEvent, useMemo } from 'react'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerBody, 
  DrawerFooter 
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  PanelLeft,
  PanelRight,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-container'
import { ConfiguredModelSelector } from './configured-model-selector'
import MarkdownIt from 'markdown-it'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface AIChatDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AIChatDrawer({ open, onOpenChange }: AIChatDrawerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [side, setSide] = useState<'left' | 'right'>('right')
  const [drawerWidth, setDrawerWidth] = useState(600)
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  // 创建 markdown-it 实例
  const md = useMemo(() => {
    return new MarkdownIt({
      html: true, // 允许 HTML 标签
      linkify: true, // 自动转换 URL 为链接
      typographer: true, // 启用智能引号和其他排版优化
      breaks: true, // 将换行符转换为 <br>
    })
  }, [])

  // Markdown 渲染函数
  const renderMarkdown = (content: string) => {
    try {
      return md.render(content)
    } catch (error) {
      console.error('Markdown 渲染失败:', error)
      return content
    }
  }

  // 加载对话历史
  useEffect(() => {
    if (open) {
      loadConversations()
    }
  }, [open])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = () => {
    try {
      const saved = localStorage.getItem('ai-conversations')
      if (saved) {
        const parsed = JSON.parse(saved) as Conversation[]
        // 转换日期字符串为 Date 对象
        const conversations = parsed.map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setConversations(conversations)
        
        // 如果有对话，加载最新的一个
        if (conversations.length > 0) {
          const latest = conversations[0]
          setCurrentConversationId(latest.id)
          setMessages(latest.messages)
        }
      }
    } catch (error) {
      console.error('加载对话历史失败:', error)
    }
  }

  const saveConversations = (convs: Conversation[]) => {
    try {
      localStorage.setItem('ai-conversations', JSON.stringify(convs))
    } catch (error) {
      console.error('保存对话历史失败:', error)
    }
  }

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const updated = [newConv, ...conversations]
    setConversations(updated)
    setCurrentConversationId(newConv.id)
    setMessages([])
    saveConversations(updated)
    toast.success('已创建新对话')
  }

  const switchConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId)
    if (conv) {
      setCurrentConversationId(convId)
      setMessages(conv.messages)
    }
  }

  const deleteConversation = (convId: string) => {
    const updated = conversations.filter(c => c.id !== convId)
    setConversations(updated)
    saveConversations(updated)
    
    if (currentConversationId === convId) {
      if (updated.length > 0) {
        setCurrentConversationId(updated[0].id)
        setMessages(updated[0].messages)
      } else {
        setCurrentConversationId(null)
        setMessages([])
      }
    }
    
    toast.success('已删除对话')
  }

  const updateConversationTitle = (convId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '')
    const updated = conversations.map(conv => 
      conv.id === convId 
        ? { ...conv, title, updatedAt: new Date() }
        : conv
    )
    setConversations(updated)
    saveConversations(updated)
  }

  // 处理 contenteditable 输入
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || ''
    setInput(text)
  }

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 清空输入框
  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.textContent = ''
      setInput('')
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    if (!selectedModel) {
      toast.warning('请先选择 AI 模型')
      return
    }

    // 如果没有当前对话，创建一个
    let convId = currentConversationId
    if (!convId) {
      const newConv: Conversation = {
        id: crypto.randomUUID(),
        title: '新对话',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      convId = newConv.id
      const updated = [newConv, ...conversations]
      setConversations(updated)
      setCurrentConversationId(convId)
      saveConversations(updated)
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    clearInput() // 清空输入框
    setIsLoading(true)

    // 如果是第一条消息，更新对话标题
    if (messages.length === 0) {
      updateConversationTitle(convId, userMessage.content)
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          modelId: selectedModel,
          stream: true,
          enableWebSearch,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'AI 响应失败' })) as { error?: string }
        throw new Error(errorData.error || 'AI 响应失败')
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let fullContent = ''
      let chunkCount = 0
      let buffer = '' // 用于缓存不完整的行
      
      // 创建 AI 消息（只在第一次收到内容时添加）
      let assistantMessageAdded = false

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        // 解码字节流
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        chunkCount++

        // 按行分割（SSE 格式是按行传输的）
        const lines = buffer.split('\n')
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || ''

        // 处理每一行
        for (const line of lines) {
          const trimmedLine = line.trim()
          
          // 跳过空行
          if (!trimmedLine) continue
          
          // 解析 SSE 格式：data: {...}
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6) // 移除 "data: " 前缀
            
            // 跳过 [DONE] 标记
            if (data === '[DONE]') {
              continue
            }

            try {
              // 解析 JSON
              const parsed = JSON.parse(data) as {
                choices?: Array<{
                  delta?: {
                    content?: string
                  }
                }>
                type?: string
                delta?: {
                  text?: string
                }
              }

              // 提取内容（支持 OpenAI 和 Anthropic 格式）
              let content = ''

              // OpenAI 格式
              if (parsed.choices?.[0]?.delta?.content) {
                content = parsed.choices[0].delta.content
              }
              // Anthropic 格式
              else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                content = parsed.delta.text
              }

              if (content) {
                fullContent += content

                // 第一次收到内容时，关闭 loading 并添加 AI 消息
                if (!assistantMessageAdded) {
                  setIsLoading(false)
                  assistantMessageAdded = true
                }

                // 实时更新消息内容
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date(),
                }
                const updatedMessages = [...newMessages, assistantMessage]
                setMessages(updatedMessages)
              }
            } catch (e) {
              // 忽略 JSON 解析错误（可能是不完整的数据）
            }
          }
        }
      }

      // 流式响应完成后，保存完整的对话
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date(),
      }
      const finalMessages = [...newMessages, assistantMessage]

      // 更新对话历史
      const updated = conversations.map(conv =>
        conv.id === convId
          ? { ...conv, messages: finalMessages, updatedAt: new Date() }
          : conv
      )
      setConversations(updated)
      saveConversations(updated)
    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error(`发送消息失败: ${error instanceof Error ? error.message : '未知错误'}`)
      
      // 移除临时的 AI 消息
      setMessages(newMessages)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} side={side} width={drawerWidth} onWidthChange={setDrawerWidth}>
      <DrawerContent className="max-w-full w-full h-full" side={side}>
        <div className="flex h-full">
          {/* 左侧对话历史列表 */}
          {showSidebar && (
            <div className="w-56 bg-gray-50 flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.08)]">
              {/* 侧边栏头部 */}
              <div className="p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <Button
                  onClick={createNewConversation}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新对话
                </Button>
              </div>

              {/* 对话列表 */}
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm mt-8">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    暂无对话历史
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => switchConversation(conv.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group relative ${
                          currentConversationId === conv.id
                            ? 'bg-white shadow-sm'
                            : 'hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span className="flex-1 truncate">{conv.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteConversation(conv.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {conv.messages.length} 条消息
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 主对话区域 */}
          <div className="flex-1 flex flex-col">
            {/* 头部 */}
            <DrawerHeader className="flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className={`w-5 h-5 transition-transform ${showSidebar ? 'rotate-180' : ''}`} />
                </button>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <DrawerTitle>AI 助手</DrawerTitle>
              </div>
              <div className="flex items-center gap-2">
                {/* 选边按钮 */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSide('left')}
                    className={`p-1.5 rounded transition-colors ${
                      side === 'left'
                        ? 'bg-white shadow-sm text-primary'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="左侧显示"
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSide('right')}
                    className={`p-1.5 rounded transition-colors ${
                      side === 'right'
                        ? 'bg-white shadow-sm text-primary'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="右侧显示"
                  >
                    <PanelRight className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DrawerHeader>

            {/* 消息列表 */}
            <DrawerBody className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Bot className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    开始新对话
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    向 AI 助手提问，获取学习帮助、解答疑问或进行知识探讨
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        ) : (
                          <div 
                            className="text-sm leading-relaxed ai-message-markdown"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                          />
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </DrawerBody>

            {/* 输入区域 */}
            <DrawerFooter className="shadow-[0_-1px_3px_rgba(0,0,0,0.06)]">
              <div className="max-w-3xl mx-auto w-full">
                {/* 输入区域 - 外层边框容器（上下布局） */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  {/* 输入框 - 上方 */}
                  <div className="p-3">
                    <div
                      ref={inputRef}
                      contentEditable
                      onInput={handleInput}
                      onKeyDown={handleKeyDown}
                      className="min-h-[100px] max-h-[200px] overflow-y-auto px-2 py-1 outline-none text-sm"
                      style={{
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                      data-placeholder="输入消息... (Shift+Enter 换行)"
                      suppressContentEditableWarning
                    />
                  </div>

                  {/* 底部工具栏 - 模型选择器（左）+ 按钮组（右） */}
                  <div className="flex items-center justify-between px-3 pb-3 pt-2 border-t border-gray-100">
                    {/* 左侧：模型选择器 */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="max-w-xs">
                        <ConfiguredModelSelector
                          showLabel={false}
                          value={selectedModel}
                          onChange={setSelectedModel}
                        />
                      </div>
                    </div>

                    {/* 右侧：工具按钮 */}
                    <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                      {/* 联网搜索按钮 */}
                      <button
                        onClick={() => setEnableWebSearch(!enableWebSearch)}
                        className={`p-2 rounded-lg transition-colors ${
                          enableWebSearch
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title={enableWebSearch ? '已启用联网搜索' : '启用联网搜索'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        title="附加文件"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        title="插入图片"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        size="sm"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 提示文本 */}
                <p className="text-xs text-gray-400 text-center mt-2">
                  AI 可能会出错，请核实重要信息
                </p>
              </div>
            </DrawerFooter>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
