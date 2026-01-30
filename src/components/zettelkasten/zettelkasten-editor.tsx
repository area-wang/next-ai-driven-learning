'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-container'
import { Badge } from '@/components/ui/badge'

interface ZettelkastenEditorProps {
  initialNote?: {
    id?: string
    title: string
    content: string
    tags: string[]
  }
  onSave?: (note: any) => void
  onCancel?: () => void
}

export function ZettelkastenEditor({
  initialNote,
  onSave,
  onCancel,
}: ZettelkastenEditorProps) {
  const [noteId, setNoteId] = useState(initialNote?.id)
  const [title, setTitle] = useState(initialNote?.title || '')
  const [content, setContent] = useState(initialNote?.content || '')
  const [tags, setTags] = useState<string[]>(initialNote?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (initialNote) {
      setNoteId(initialNote.id)
      setTitle(initialNote.title)
      setContent(initialNote.content)
      setTags(initialNote.tags)
    }
  }, [initialNote])

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.warning('请填写标题和内容')
      return
    }

    setIsSubmitting(true)

    try {
      const url = '/api/zettelkasten/notes'
      const method = noteId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          title: title.trim(),
          content: content.trim(),
          tags,
        }),
      })

      const result = await response.json() as {
        success: boolean
        data?: any
        error?: string
      }

      if (result.success && result.data) {
        setNoteId(result.data.id)
        toast.success(noteId ? '笔记已更新' : '笔记已创建')
        onSave?.(result.data)
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-teal-600">
        {noteId ? '编辑笔记' : '创建笔记'}
      </h3>

      <div className="space-y-4">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            标题
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入笔记标题..."
            className="w-full"
          />
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            内容
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入笔记内容...&#10;&#10;提示：使用 [[笔记标题]] 创建双向链接"
            rows={12}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-2">
            支持 Markdown 格式，使用 [[笔记标题]] 创建链接
          </p>
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            标签
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入标签后按回车..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              添加
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存笔记'}
          </Button>
        </div>
      </div>

      {/* 使用提示 */}
      <div className="mt-6 p-4 bg-blue-50 rounded border-l-4 border-blue-400">
        <h4 className="text-sm font-semibold mb-2 text-blue-800">
          💡 卡片盒笔记法
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 每张卡片只记录一个核心想法</li>
          <li>• 使用 [[笔记标题]] 创建笔记之间的链接</li>
          <li>• 添加标签帮助分类和检索</li>
          <li>• 通过链接构建知识网络</li>
        </ul>
      </div>
    </Card>
  )
}
