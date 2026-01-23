/**
 * 删除确认对话框组件
 * 用于确认删除文档操作
 */

"use client"

import * as React from "react"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (deleteChildren: boolean) => void
  documentTitle: string
  childrenCount?: number
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
  childrenCount = 0,
}: DeleteConfirmDialogProps) {
  const [deleteChildren, setDeleteChildren] = React.useState(true)
  const hasChildren = childrenCount > 0

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(deleteChildren)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              确认删除
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-700">
            确定要删除文档 <span className="font-semibold text-gray-900">「{documentTitle}」</span> 吗？
          </p>

          {hasChildren && (
            <>
              <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  该文档包含 <span className="font-semibold">{childrenCount}</span> 个子文档
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteOption"
                    checked={deleteChildren}
                    onChange={() => setDeleteChildren(true)}
                    className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      删除该文档及其所有子文档
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      将永久删除该文档及其包含的所有 {childrenCount} 个子文档
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteOption"
                    checked={!deleteChildren}
                    onChange={() => setDeleteChildren(false)}
                    className="mt-0.5 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      仅删除该文档（保留子文档）
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      子文档将提升一级，成为当前文档父级的子文档
                    </div>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-800">
              ⚠️ 此操作无法撤销，请谨慎操作
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer text-sm"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors cursor-pointer text-sm"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}
