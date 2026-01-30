/**
 * 复习提醒调度器
 * 
 * 负责管理和调度复习提醒
 */

import { generateEbbinghausSchedule, shouldReview } from './ebbinghaus'
import { isDue } from './sm2'

export interface ReviewItem {
  id: string
  type: 'content' | 'flashcard' // 内容复习或闪卡复习
  title: string
  scheduledAt: Date
  round?: number // 艾宾浩斯轮次（仅用于内容复习）
}

export interface DueReview {
  today: ReviewItem[] // 今天到期
  overdue: ReviewItem[] // 已逾期
  upcoming: ReviewItem[] // 即将到期（未来3天）
}

/**
 * 获取到期的复习项目
 * @param reviews 所有复习项目
 * @param currentTime 当前时间
 * @returns 分类后的复习项目
 */
export function getDueReviews(reviews: ReviewItem[], currentTime: Date = new Date()): DueReview {
  const today = new Date(currentTime)
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const threeDaysLater = new Date(today)
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)
  
  const dueReview: DueReview = {
    today: [],
    overdue: [],
    upcoming: []
  }
  
  for (const review of reviews) {
    const scheduledDate = new Date(review.scheduledAt)
    scheduledDate.setHours(0, 0, 0, 0)
    
    if (scheduledDate < today) {
      // 已逾期
      dueReview.overdue.push(review)
    } else if (scheduledDate.getTime() === today.getTime()) {
      // 今天到期
      dueReview.today.push(review)
    } else if (scheduledDate < threeDaysLater) {
      // 即将到期（未来3天）
      dueReview.upcoming.push(review)
    }
  }
  
  // 按时间排序
  const sortByTime = (a: ReviewItem, b: ReviewItem) => 
    a.scheduledAt.getTime() - b.scheduledAt.getTime()
  
  dueReview.overdue.sort(sortByTime)
  dueReview.today.sort(sortByTime)
  dueReview.upcoming.sort(sortByTime)
  
  return dueReview
}

/**
 * 获取今日复习数量
 * @param reviews 所有复习项目
 * @param currentTime 当前时间
 * @returns 今日复习数量
 */
export function getTodayReviewCount(reviews: ReviewItem[], currentTime: Date = new Date()): number {
  const dueReviews = getDueReviews(reviews, currentTime)
  return dueReviews.today.length + dueReviews.overdue.length
}

/**
 * 生成复习提醒消息
 * @param count 待复习数量
 * @returns 提醒消息
 */
export function generateReminderMessage(count: number): string {
  if (count === 0) {
    return '今天没有待复习的内容，继续保持！'
  } else if (count === 1) {
    return '你有 1 项内容需要复习'
  } else if (count <= 5) {
    return `你有 ${count} 项内容需要复习`
  } else if (count <= 10) {
    return `你有 ${count} 项内容需要复习，加油！`
  } else {
    return `你有 ${count} 项内容需要复习，建议分批完成`
  }
}

/**
 * 按优先级排序复习项目
 * @param reviews 复习项目
 * @returns 排序后的复习项目
 */
export function prioritizeReviews(reviews: ReviewItem[]): ReviewItem[] {
  return reviews.sort((a, b) => {
    // 1. 逾期的优先
    const aOverdue = a.scheduledAt < new Date()
    const bOverdue = b.scheduledAt < new Date()
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    // 2. 内容复习优先于闪卡
    if (a.type === 'content' && b.type === 'flashcard') return -1
    if (a.type === 'flashcard' && b.type === 'content') return 1
    
    // 3. 按时间排序（早的优先）
    return a.scheduledAt.getTime() - b.scheduledAt.getTime()
  })
}

/**
 * 计算复习负担
 * @param reviews 复习项目
 * @param days 未来天数
 * @returns 每天的复习数量
 */
export function calculateReviewLoad(reviews: ReviewItem[], days: number = 7): Map<string, number> {
  const load = new Map<string, number>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateKey = date.toISOString().split('T')[0]
    
    const count = reviews.filter(review => {
      const reviewDate = new Date(review.scheduledAt)
      reviewDate.setHours(0, 0, 0, 0)
      return reviewDate.getTime() === date.getTime()
    }).length
    
    load.set(dateKey, count)
  }
  
  return load
}

/**
 * 检查是否需要发送提醒
 * @param lastReminderTime 上次提醒时间
 * @param reminderInterval 提醒间隔（小时）
 * @param currentTime 当前时间
 * @returns 是否需要提醒
 */
export function shouldSendReminder(
  lastReminderTime: Date | null,
  reminderInterval: number = 4,
  currentTime: Date = new Date()
): boolean {
  if (!lastReminderTime) return true
  
  const intervalMs = reminderInterval * 60 * 60 * 1000
  return currentTime.getTime() - lastReminderTime.getTime() >= intervalMs
}

/**
 * 获取最佳复习时间段
 * @returns 推荐的复习时间段
 */
export function getOptimalReviewTimes(): Array<{ hour: number; label: string }> {
  return [
    { hour: 9, label: '早上 9:00' },
    { hour: 14, label: '下午 2:00' },
    { hour: 20, label: '晚上 8:00' }
  ]
}

/**
 * 格式化复习时间
 * @param date 日期
 * @returns 格式化的时间字符串
 */
export function formatReviewTime(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days} 天后`
  } else if (hours > 0) {
    return `${hours} 小时后`
  } else if (minutes > 0) {
    return `${minutes} 分钟后`
  } else if (diff > 0) {
    return '即将到期'
  } else {
    return '已逾期'
  }
}
