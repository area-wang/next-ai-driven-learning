/**
 * 答题输入组件
 * 根据题型渲染不同的输入控件
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { RichTextAnswerInput } from "./rich-text-answer-input"

interface AnswerInputProps {
  type: 'choice' | 'multiple-choice' | 'true-false' | 'fill' | 'short' | 'essay' | 'code' | 'matching' | 'ordering'
  options?: string[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function AnswerInput({
  type,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: AnswerInputProps) {
  // 单选题：单选按钮组
  if (type === 'choice' && options) {
    return (
      <div className={cn("space-y-2", className)}>
        {options.map((option, index) => {
          // 检查选项是否已经包含标签（如 "A. xxx"）
          const hasLabel = /^[A-H]\.\s/.test(option)
          let optionLabel: string
          let optionText: string
          
          if (hasLabel) {
            // 如果已经有标签，提取标签和文本
            optionLabel = option.charAt(0)
            optionText = option.substring(3) // 跳过 "A. "
          } else {
            // 如果没有标签，生成标签
            optionLabel = String.fromCharCode(65 + index) // A, B, C, D
            optionText = option
          }
          
          const isSelected = value === optionLabel
          return (
            <label
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                isSelected
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300 bg-white",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="radio"
                  name="answer"
                  value={optionLabel}
                  checked={isSelected}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all",
                    isSelected
                      ? "border-teal-500 bg-teal-500"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && (
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
              <span className="flex-1 text-sm text-gray-700">
                <strong className={cn("mr-2", isSelected ? "text-teal-600" : "text-gray-600")}>
                  {optionLabel}.
                </strong>
                {optionText}
              </span>
            </label>
          )
        })}
      </div>
    )
  }

  // 多选题：复选框组
  if (type === 'multiple-choice' && options) {
    const selectedOptions = value ? value.split(',').map(v => v.trim()) : []
    
    const handleCheckboxChange = (optionLabel: string) => {
      let newSelected: string[]
      if (selectedOptions.includes(optionLabel)) {
        newSelected = selectedOptions.filter(v => v !== optionLabel)
      } else {
        newSelected = [...selectedOptions, optionLabel].sort()
      }
      onChange(newSelected.join(', '))
    }
    
    return (
      <div className={cn("space-y-2", className)}>
        {options.map((option, index) => {
          const hasLabel = /^[A-H]\.\s/.test(option)
          let optionLabel: string
          let optionText: string
          
          if (hasLabel) {
            optionLabel = option.charAt(0)
            optionText = option.substring(3)
          } else {
            optionLabel = String.fromCharCode(65 + index)
            optionText = option
          }
          
          const isSelected = selectedOptions.includes(optionLabel)
          return (
            <label
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                isSelected
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300 bg-white",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleCheckboxChange(optionLabel)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
                    isSelected
                      ? "border-teal-500 bg-teal-500"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="flex-1 text-sm text-gray-700">
                <strong className={cn("mr-2", isSelected ? "text-teal-600" : "text-gray-600")}>
                  {optionLabel}.
                </strong>
                {optionText}
              </span>
            </label>
          )
        })}
        <p className="text-xs text-gray-500 mt-2">提示：可以选择多个选项</p>
      </div>
    )
  }

  // 判断题：对/错选择
  if (type === 'true-false') {
    return (
      <div className={cn("space-y-2", className)}>
        {['对', '错'].map((option) => {
          const isSelected = value === option
          return (
            <label
              key={option}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
                isSelected
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-teal-300 bg-white",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="true-false"
                  value={option}
                  checked={isSelected}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all",
                    isSelected
                      ? "border-teal-500 bg-teal-500"
                      : "border-gray-300 bg-white"
                  )}
                >
                  {isSelected && (
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
              <span className={cn(
                "flex-1 text-sm font-medium",
                isSelected ? "text-teal-600" : "text-gray-700"
              )}>
                {option}
              </span>
            </label>
          )
        })}
      </div>
    )
  }

  // 填空题：单行文本输入
  if (type === 'fill') {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="请输入答案..."
        className={cn(
          "w-full px-4 py-2 border-2 border-gray-200 rounded-lg",
          "focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
          "disabled:bg-gray-50 disabled:cursor-not-allowed",
          "text-sm",
          className
        )}
      />
    )
  }

  // 简答题和论述题：使用富文本编辑器
  if (type === 'short' || type === 'essay' || type === 'code') {
    return (
      <RichTextAnswerInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={
          type === 'code' ? "请输入你的代码..." : 
          type === 'essay' ? "请详细阐述你的观点..." :
          "请输入你的答案..."
        }
        className={className}
      />
    )
  }

  // 匹配题和排序题：使用富文本编辑器（可以后续优化为拖拽界面）
  if (type === 'matching' || type === 'ordering') {
    return (
      <RichTextAnswerInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={
          type === 'matching' ? "请输入匹配结果，例如：A-1, B-2, C-3..." :
          "请输入正确的排序，例如：C, A, D, B..."
        }
        className={className}
      />
    )
  }

  return null
}
