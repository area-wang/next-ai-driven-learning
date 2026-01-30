'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-container'
import { Loader2, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'

interface Flashcard {
  id: string
  front: string
  back: string
  tags: string | null
  easinessFactor: number
  interval: number
  repetitions: number
  nextReviewAt: number | null // 可以是 null
}

interface FlashcardViewDialogProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  isGenerating?: boolean // 新增：是否正在生成
}

export function FlashcardViewDialog({
  isOpen,
  onClose,
  contentId,
  isGenerating = false, // 默认不是生成状态
}: FlashcardViewDialogProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    if (isOpen && contentId) {
      if (isGenerating) {
        // 如果正在生成，重置状态并显示加载中
        setFlashcards([])
        setCurrentIndex(0)
        setIsFlipped(false)
        setIsLoading(true)
      } else {
        // 如果不是生成状态，加载闪卡
        loadFlashcards()
      }
    }
  }, [isOpen, contentId, isGenerating])

  // 监听 isGenerating 变化，从 true 变为 false 时重新加载
  useEffect(() => {
    if (isOpen && contentId && !isGenerating && flashcards.length === 0) {
      // 生成完成后自动加载闪卡
      loadFlashcards()
    }
  }, [isGenerating])

  const loadFlashcards = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ contentId })
      const response = await fetch(`/api/flashcards?${params}`)
      const result = await response.json() as { 
        success: boolean
        data?: Flashcard[]
        error?: string 
      }

      if (result.success && result.data) {
        setFlashcards(result.data)
        setCurrentIndex(0)
        setIsFlipped(false)
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

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const currentCard = flashcards[currentIndex]

  return (
    <Drawer open={isOpen} onOpenChange={onClose} side="right">
      <DrawerContent>
        <DrawerHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <h2 className="text-xl font-semibold text-gray-900">
            查看闪卡
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {flashcards.length > 0 
              ? `共 ${flashcards.length} 张闪卡，当前第 ${currentIndex + 1} 张`
              : '暂无闪卡'}
          </p>
        </DrawerHeader>

        <DrawerBody className="p-6">
            {isGenerating || isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-600">
                  {isGenerating ? '正在生成闪卡...' : '加载中...'}
                </p>
              </div>
            ) : flashcards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-center">
                  暂无闪卡，请先生成闪卡
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 闪卡 */}
                <div 
                  onClick={handleFlip}
                  className="relative h-64 cursor-pointer perspective-1000"
                >
                  <div 
                    className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* 正面 */}
                    <Card 
                      className={`absolute inset-0 backface-hidden flex items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 ${
                        isFlipped ? 'invisible' : ''
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-sm text-purple-600 font-medium mb-2">
                          问题
                        </p>
                        <p className="text-lg text-gray-900">
                          {currentCard.front}
                        </p>
                        <p className="text-xs text-gray-500 mt-4">
                          点击翻转查看答案
                        </p>
                      </div>
                    </Card>

                    {/* 背面 */}
                    <Card 
                      className={`absolute inset-0 backface-hidden flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rotate-y-180 ${
                        !isFlipped ? 'invisible' : ''
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-sm text-blue-600 font-medium mb-2">
                          答案
                        </p>
                        <p className="text-lg text-gray-900">
                          {currentCard.back}
                        </p>
                        <p className="text-xs text-gray-500 mt-4">
                          点击翻转查看问题
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* 导航按钮 */}
                <div className="flex items-center justify-between gap-4">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    上一张
                  </Button>

                  <Button
                    onClick={handleFlip}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCw className="w-4 h-4 mr-1" />
                    翻转
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === flashcards.length - 1}
                    variant="outline"
                    size="sm"
                  >
                    下一张
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* 闪卡信息 */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600">复习次数：</span>
                      <span className="font-medium">{currentCard.repetitions}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">间隔天数：</span>
                      <span className="font-medium">{currentCard.interval}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">下次复习：</span>
                      <span className="font-medium">
                        {currentCard.nextReviewAt 
                          ? new Date(
                              typeof currentCard.nextReviewAt === 'number' 
                                ? currentCard.nextReviewAt 
                                : currentCard.nextReviewAt
                            ).toLocaleString('zh-CN')
                          : '待安排'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
