'use client'

import { useEffect, useRef } from 'react'
import type { Language } from '@/lib/code-executor'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: Language
}

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      // 自动调整高度
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      
      // 设置光标位置
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  return (
    <div className="relative h-full w-full bg-gray-900">
      {/* 行号 */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 text-gray-500 text-sm font-mono flex flex-col items-end pr-2 pt-4 select-none overflow-hidden">
        {value.split('\n').map((_, i) => (
          <div key={i} className="leading-6">
            {i + 1}
          </div>
        ))}
      </div>

      {/* 代码编辑区 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="absolute left-12 top-0 right-0 bottom-0 w-[calc(100%-3rem)] h-full p-4 bg-transparent text-gray-100 font-mono text-sm leading-6 resize-none focus:outline-none"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        placeholder="在此输入代码..."
      />
    </div>
  )
}
