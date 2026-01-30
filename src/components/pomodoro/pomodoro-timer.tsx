'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-container'

interface PomodoroTimerProps {
  contentId?: string
  defaultDuration?: number // 默认时长（分钟）
  onComplete?: () => void
}

type SessionType = 'work' | 'short_break' | 'long_break'

const SESSION_DURATIONS = {
  work: 25 * 60, // 25分钟
  short_break: 5 * 60, // 5分钟
  long_break: 15 * 60, // 15分钟
}

export function PomodoroTimer({ contentId, defaultDuration = 25, onComplete }: PomodoroTimerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<SessionType>('work')
  const [duration, setDuration] = useState(defaultDuration * 60)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleStart = async () => {
    try {
      const response = await fetch('/api/pomodoro/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          duration,
          sessionType,
        }),
      })

      const result = await response.json() as { success: boolean; data?: { id: string }; error?: string }

      if (result.success && result.data) {
        setSessionId(result.data.id)
        setIsRunning(true)
        toast.success('番茄钟已开始')
      } else {
        toast.error(result.error || '开始失败')
      }
    } catch (error) {
      console.error('开始番茄钟失败:', error)
      toast.error('开始失败')
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleResume = () => {
    setIsRunning(true)
  }

  const handleComplete = async () => {
    if (!sessionId) return

    setIsRunning(false)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/pomodoro/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: 'completed',
        }),
      })

      const result = await response.json() as { success: boolean; error?: string }

      if (result.success) {
        toast.success('番茄钟已完成！')
        playNotificationSound()
        onComplete?.()
        handleReset()
      } else {
        toast.error(result.error || '完成失败')
      }
    } catch (error) {
      console.error('完成番茄钟失败:', error)
      toast.error('完成失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStop = async () => {
    if (!sessionId) {
      handleReset()
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/pomodoro/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          status: 'interrupted',
        }),
      })

      const result = await response.json() as { success: boolean; error?: string }

      if (result.success) {
        toast.info('番茄钟已停止')
        handleReset()
      } else {
        toast.error(result.error || '停止失败')
      }
    } catch (error) {
      console.error('停止番茄钟失败:', error)
      toast.error('停止失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setSessionId(null)
    setTimeLeft(duration)
  }

  const handleTypeChange = (type: SessionType) => {
    if (isRunning) {
      toast.warning('请先停止当前番茄钟')
      return
    }
    setSessionType(type)
    const newDuration = SESSION_DURATIONS[type]
    setDuration(newDuration)
    setTimeLeft(newDuration)
  }

  const playNotificationSound = () => {
    // 简单的提示音（可以替换为实际音频文件）
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((duration - timeLeft) / duration) * 100

  return (
    <Card className="p-8 max-w-md mx-auto">
      {/* 会话类型选择 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={sessionType === 'work' ? 'default' : 'outline'}
          onClick={() => handleTypeChange('work')}
          disabled={isRunning}
          className="flex-1"
        >
          工作
        </Button>
        <Button
          variant={sessionType === 'short_break' ? 'default' : 'outline'}
          onClick={() => handleTypeChange('short_break')}
          disabled={isRunning}
          className="flex-1"
        >
          短休息
        </Button>
        <Button
          variant={sessionType === 'long_break' ? 'default' : 'outline'}
          onClick={() => handleTypeChange('long_break')}
          disabled={isRunning}
          className="flex-1"
        >
          长休息
        </Button>
      </div>

      {/* 计时器显示 */}
      <div className="relative mb-8">
        {/* 进度环 */}
        <svg className="w-64 h-64 mx-auto transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className="text-blue-500 transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>

        {/* 时间文本 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">{formatTime(timeLeft)}</div>
            <div className="text-sm text-gray-600">
              {sessionType === 'work' ? '专注工作' : sessionType === 'short_break' ? '短休息' : '长休息'}
            </div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-2 justify-center">
        {!isRunning && !sessionId && (
          <Button onClick={handleStart} size="lg" className="px-8">
            开始
          </Button>
        )}

        {isRunning && (
          <Button onClick={handlePause} size="lg" variant="outline" className="px-8">
            暂停
          </Button>
        )}

        {!isRunning && sessionId && (
          <Button onClick={handleResume} size="lg" className="px-8">
            继续
          </Button>
        )}

        {sessionId && (
          <Button
            onClick={handleStop}
            size="lg"
            variant="outline"
            disabled={isSubmitting}
            className="px-8"
          >
            停止
          </Button>
        )}
      </div>
    </Card>
  )
}
