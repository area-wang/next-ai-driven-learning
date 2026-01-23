/**
 * 确认对话框组件
 * 用于需要用户确认的操作
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, Info, HelpCircle } from 'lucide-react'

export type ConfirmType = 'danger' | 'warning' | 'info'

interface ConfirmOptions {
  title: string
  message: string
  type?: ConfirmType
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setIsOpen(true)
  }, [])

  const handleConfirm = async () => {
    if (!options) return

    setIsLoading(true)
    try {
      await options.onConfirm()
      setIsOpen(false)
    } catch (error) {
      console.error('Confirm action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    options?.onCancel?.()
    setIsOpen(false)
  }

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false)
    }
  }

  if (!isOpen || !options) {
    return <ConfirmContext.Provider value={{ confirm }}>{children}</ConfirmContext.Provider>
  }

  const type = options.type || 'info'
  
  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    info: <HelpCircle className="w-6 h-6 text-blue-600" />,
  }

  const confirmButtonColors = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500',
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* 对话框遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* 对话框内容 */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 图标和标题 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {icons[type]}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {options.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {options.message}
              </p>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {options.cancelText || '取消'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${confirmButtonColors[type]}`}
            >
              {isLoading ? '处理中...' : (options.confirmText || '确认')}
            </button>
          </div>
        </div>
      </div>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context
}
