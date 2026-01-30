/**
 * SM-2 (SuperMemo 2) 间隔重复算法
 * 
 * 用于闪卡复习的智能调度算法
 * 根据用户的回忆质量动态调整复习间隔
 */

export interface SM2Result {
  easinessFactor: number // 难度因子 (1.3-2.5)
  repetitions: number // 重复次数
  interval: number // 复习间隔（天）
  nextReviewAt: Date // 下次复习时间
}

export interface FlashcardState {
  easinessFactor: number // 当前难度因子
  repetitions: number // 当前重复次数
  interval: number // 当前间隔（天）
}

/**
 * SM-2 算法核心计算
 * @param quality 回忆质量 (0-5)
 *   0: 完全不记得
 *   1: 错误的回答
 *   2: 错误的回答，但正确答案看起来很熟悉
 *   3: 正确的回答，但很困难
 *   4: 正确的回答，有些犹豫
 *   5: 完全正确，毫不犹豫
 * @param state 当前闪卡状态
 * @returns SM-2 计算结果
 */
export function calculateSM2(quality: number, state: FlashcardState): SM2Result {
  let { easinessFactor, repetitions, interval } = state
  
  // 质量值必须在 0-5 之间
  quality = Math.max(0, Math.min(5, quality))
  
  // 更新难度因子
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  // 难度因子最小值为 1.3
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3
  }
  
  // 如果回忆质量 < 3，重置重复次数
  if (quality < 3) {
    repetitions = 0
    interval = 1 // 第二天再复习
  } else {
    repetitions += 1
    
    // 计算新的间隔
    if (repetitions === 1) {
      interval = 1 // 第一次：1天后
    } else if (repetitions === 2) {
      interval = 6 // 第二次：6天后
    } else {
      // 后续：interval = interval * EF
      interval = Math.round(interval * easinessFactor)
    }
  }
  
  // 计算下次复习时间
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)
  nextReviewAt.setHours(9, 0, 0, 0) // 设置为早上9点
  
  return {
    easinessFactor: Math.round(easinessFactor * 100) / 100, // 保留2位小数
    repetitions,
    interval,
    nextReviewAt
  }
}

/**
 * 初始化新闪卡的状态
 * @returns 初始状态
 */
export function initializeFlashcard(): FlashcardState {
  return {
    easinessFactor: 2.5, // 默认难度因子
    repetitions: 0,
    interval: 0
  }
}

/**
 * 检查闪卡是否到期需要复习
 * @param nextReviewAt 下次复习时间
 * @param currentTime 当前时间
 * @returns 是否需要复习
 */
export function isDue(nextReviewAt: Date | null, currentTime: Date = new Date()): boolean {
  if (!nextReviewAt) return true // 新卡片总是需要复习
  return currentTime >= nextReviewAt
}

/**
 * 获取到期的闪卡数量
 * @param flashcards 闪卡数组
 * @param currentTime 当前时间
 * @returns 到期数量
 */
export function getDueCount(
  flashcards: Array<{ nextReviewAt: Date | null }>,
  currentTime: Date = new Date()
): number {
  return flashcards.filter(card => isDue(card.nextReviewAt, currentTime)).length
}

/**
 * 根据难度因子预测记忆保持率
 * @param easinessFactor 难度因子
 * @param daysSinceReview 距离上次复习的天数
 * @returns 预测的记忆保持率 (0-1)
 */
export function predictRetention(easinessFactor: number, daysSinceReview: number): number {
  // 简化的遗忘曲线模型
  // R = e^(-t/S)
  // S = stability (与难度因子相关)
  const stability = easinessFactor * 2 // 稳定性
  const retention = Math.exp(-daysSinceReview / stability)
  return Math.max(0, Math.min(1, retention))
}

/**
 * 将质量评分转换为描述
 * @param quality 质量评分 (0-5)
 * @returns 描述文本
 */
export function qualityToDescription(quality: number): string {
  const descriptions = {
    0: '完全不记得',
    1: '错误的回答',
    2: '错误但熟悉',
    3: '正确但困难',
    4: '正确有犹豫',
    5: '完全正确'
  }
  return descriptions[quality as keyof typeof descriptions] || '未知'
}

/**
 * 计算学习统计
 * @param flashcards 闪卡数组
 * @returns 统计信息
 */
export function calculateStats(flashcards: Array<FlashcardState>) {
  const total = flashcards.length
  const mature = flashcards.filter(card => card.repetitions >= 3).length // 成熟卡片
  const young = flashcards.filter(card => card.repetitions > 0 && card.repetitions < 3).length // 年轻卡片
  const newCards = flashcards.filter(card => card.repetitions === 0).length // 新卡片
  
  const avgEasiness = flashcards.reduce((sum, card) => sum + card.easinessFactor, 0) / total || 0
  
  return {
    total,
    mature,
    young,
    newCards,
    avgEasiness: Math.round(avgEasiness * 100) / 100
  }
}
