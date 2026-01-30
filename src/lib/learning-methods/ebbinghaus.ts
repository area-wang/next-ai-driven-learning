/**
 * 艾宾浩斯遗忘曲线复习算法
 * 
 * 复习间隔：5分钟、30分钟、12小时、1天、2天、4天、7天、15天
 */

export interface ReviewSchedule {
  round: number // 第几轮复习 (1-8)
  intervalDays: number // 距离学习开始的天数
  scheduledAt: Date // 计划复习日期（只精确到天，不包含具体时间）
}

/**
 * 艾宾浩斯复习间隔（天数）
 * 第一天2次，第二天2次，后续按间隔递增
 */
const EBBINGHAUS_INTERVALS_DAYS = [
  0,  // 第1轮：当天
  0,  // 第2轮：当天
  1,  // 第3轮：第1天
  1,  // 第4轮：第1天
  2,  // 第5轮：第2天
  4,  // 第6轮：第4天
  7,  // 第7轮：第7天
  15  // 第8轮：第15天
]

/**
 * 生成艾宾浩斯复习计划
 * @param startTime 学习开始时间
 * @returns 复习计划数组
 */
export function generateEbbinghausSchedule(startTime: Date = new Date()): ReviewSchedule[] {
  const schedules: ReviewSchedule[] = []
  
  // 获取开始日期（只保留日期部分，时间设为 00:00:00）
  const startDate = new Date(startTime)
  startDate.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < EBBINGHAUS_INTERVALS_DAYS.length; i++) {
    const intervalDays = EBBINGHAUS_INTERVALS_DAYS[i]
    const scheduledAt = new Date(startDate)
    scheduledAt.setDate(startDate.getDate() + intervalDays)
    
    schedules.push({
      round: i + 1,
      intervalDays,
      scheduledAt
    })
  }
  
  return schedules
}

/**
 * 获取下一轮复习时间
 * @param currentRound 当前复习轮次 (1-8)
 * @param completedAt 完成当前复习的时间
 * @returns 下一轮复习日期，如果已完成所有轮次则返回 null
 */
export function getNextReviewTime(currentRound: number, completedAt: Date = new Date()): Date | null {
  if (currentRound >= EBBINGHAUS_INTERVALS_DAYS.length) {
    return null // 已完成所有复习轮次
  }
  
  const nextRound = currentRound + 1
  const nextIntervalDays = EBBINGHAUS_INTERVALS_DAYS[nextRound - 1]
  
  // 获取完成日期（只保留日期部分）
  const completedDate = new Date(completedAt)
  completedDate.setHours(0, 0, 0, 0)
  
  // 从完成日期开始计算下一轮
  const nextDate = new Date(completedDate)
  nextDate.setDate(completedDate.getDate() + nextIntervalDays)
  
  return nextDate
}

/**
 * 根据复习效果调整下次复习时间
 * @param scheduledDate 原计划复习日期
 * @param effectiveness 复习效果评分 (1-5)
 * @returns 调整后的复习日期
 */
export function adjustReviewTime(scheduledDate: Date, effectiveness: number): Date {
  // effectiveness: 1=完全忘记, 2=模糊, 3=一般, 4=清晰, 5=完全记得
  
  const adjustmentDays = {
    1: -1,  // 完全忘记：提前1天
    2: 0,   // 模糊：不调整
    3: 0,   // 一般：不调整
    4: 1,   // 清晰：延后1天
    5: 2    // 完全记得：延后2天
  }
  
  const daysToAdd = adjustmentDays[effectiveness as keyof typeof adjustmentDays] || 0
  const adjustedDate = new Date(scheduledDate)
  adjustedDate.setDate(scheduledDate.getDate() + daysToAdd)
  
  return adjustedDate
}

/**
 * 检查是否需要复习
 * @param scheduledAt 计划复习日期
 * @param currentTime 当前时间
 * @returns 是否需要复习
 */
export function shouldReview(scheduledAt: Date, currentTime: Date = new Date()): boolean {
  // 只比较日期，不比较时间
  const scheduledDate = new Date(scheduledAt)
  scheduledDate.setHours(0, 0, 0, 0)
  
  const currentDate = new Date(currentTime)
  currentDate.setHours(0, 0, 0, 0)
  
  return currentDate >= scheduledDate
}

/**
 * 计算复习进度百分比
 * @param completedRounds 已完成的复习轮次
 * @returns 进度百分比 (0-100)
 */
export function calculateProgress(completedRounds: number): number {
  return Math.round((completedRounds / EBBINGHAUS_INTERVALS_DAYS.length) * 100)
}

/**
 * 获取当天的复习轮次
 * @param schedules 所有复习计划
 * @param targetDate 目标日期（默认今天）
 * @returns 当天需要复习的轮次数组
 */
export function getTodayReviewRounds(schedules: ReviewSchedule[], targetDate: Date = new Date()): ReviewSchedule[] {
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduledAt)
    scheduleDate.setHours(0, 0, 0, 0)
    return scheduleDate.getTime() === target.getTime()
  })
}
