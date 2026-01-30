'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-container'

interface FlashcardCreatorProps {
  contentId?: string
  onSave?: (flashcard: any) => void
  onCancel?: () => void
}

export function FlashcardCreator({ contentId, onSave, onCancel }: FlashcardCreatorProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [tags, setTags] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!front.trim() || !back.trim()) {
      toast.warning('请填写正面和背面内容')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
          contentId,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()) : [],
        }),
      })

      const result = await response.json() as { success: boolean; data?: any; error?: string }

      if (result.success) {
        toast.success('闪卡创建成功')
        setFront('')
        setBack('')
        setTags('')
        onSave?.(result.data)
      } else {
        toast.error(result.error || '创建失败')
      }
    } catch (error) {
      console.error('创建闪卡失败:', error)
      toast.error('创建闪卡失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">创建闪卡</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            正面（问题）
          </label>
          <Textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="输入问题或提示..."
            rows={3}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            背面（答案）
          </label>
          <Textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="输入答案或解释..."
            rows={4}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            标签（可选，用逗号分隔）
          </label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：数学, 公式, 重要"
            className="w-full"
          />
        </div>

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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '创建中...' : '创建闪卡'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
