'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-container'

interface Flashcard {
  id: string
  front: string
  back: string
  tags: string | null
}

interface FlashcardReviewerProps {
  contentId?: string
  onComplete?: () => void
}

const QUALITY_LABELS = [
  { value: 0, label: '完全不记得', color: 'bg-red-500' },
  { value: 1, label: '几乎不记得', color: 'bg-orange-500' },
  { value: 2, label: '记得一点', color: 'bg-yellow-500' },
  { value: 3, label: '记得但困难', color: 'bg-lime-500' },
  { value: 4, label: '记得较清楚', color: 'bg-green-500' },
  { value: 5, label: '完全记得', color: 'bg-emerald-500' },
]

export function FlashcardReviewer({ contentId, onComplete }: FlashcardReviewerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewStartTime, setReviewStartTime] = useState<number>(Date.now())
  const toast = useToast()

  useEffect(() => {
    loadFlashcards()
  }, [contentId])

  const loadFlashcards = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ dueOnly: 'true' })
      if (contentId) params.append('contentId', contentId)

      const response = await fetch(`/api/flashcards?${params}`)
      const result = await response.json() as { success: boolean; data?: Flashcard[]; error?: string }

      if (result.success && result.data) {
        setFlashcards(result.data)
        if (result.data.length === 0) {
          toast.info('暂无待复习的闪卡')
        }
      } else {
        toast.error('加载闪卡失败')
      }
    } catch (error) {
      console.error('加载闪卡失败:', error)
      toast.error('加载闪卡失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleQuality = async (quality: number) => {
    if (isSubmitting) return

    const currentCard = flashcards[currentIndex]
    const timeSpent = Math.floor((Date.now() - reviewStartTime) / 1000)

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcardId: currentCard.id,
          quality,
          timeSpent,
        }),
      })

      const result = await response.json() as { success: boolean; error?: string }

      if (result.success) {
        // 移动到下一张卡片
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setIsFlipped(false)
          setReviewStartTime(Date.now())
        } else {
          // 完成所有复习
          toast.success('恭喜！完成所有闪卡复习')
          onComplete?.()
        }
      } else {
        toast.error(result.error || '提交失败')
      }
    } catch (error) {
      console.error('提交复习结果失败:', error)
      toast.error('提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600 mb-4">暂无待复习的闪卡</p>
        <Button onClick={loadFlashcards}>刷新</Button>
      </Card>
    )
  }

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>进度</span>
          <span>{currentIndex + 1} / {flashcards.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 闪卡 */}
      <div className="perspective-1000 mb-6">
        <div
          className={`relative w-full h-80 transition-transform duration-500 transform-style-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={handleFlip}
        >
          {/* 正面 */}
          <Card
            className={`absolute inset-0 backface-hidden flex items-center justify-center p-8 ${
              isFlipped ? 'invisible' : ''
            }`}
          >
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">正面（点击翻转）</p>
              <p className="text-xl font-medium">{currentCard.front}</p>
            </div>
          </Card>

          {/* 背面 */}
          <Card
            className={`absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center p-8 bg-teal-50 ${
              !isFlipped ? 'invisible' : ''
            }`}
          >
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">背面</p>
              <p className="text-xl font-medium">{currentCard.back}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* 质量评分按钮 */}
      {isFlipped && (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600 mb-4">
            你记得多清楚？
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUALITY_LABELS.map((item) => (
              <Button
                key={item.value}
                onClick={() => handleQuality(item.value)}
                disabled={isSubmitting}
                className={`${item.color} hover:opacity-90 text-white cursor-pointer`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {!isFlipped && (
        <div className="text-center">
          <Button onClick={handleFlip} size="lg">
            显示答案
          </Button>
        </div>
      )}

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
