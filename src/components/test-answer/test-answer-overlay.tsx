/**
 * 测试题答题覆盖层组件
 * 管理答题模式的整体状态和交互
 */

"use client"

import * as React from "react"
import { AnswerModeHeader } from "./answer-mode-header"
import { QuestionAnswerItem, type ParsedQuestion, type QuestionResult } from "./question-answer-item"
import { AnswerCardPanel } from "./answer-card-panel"
import { useAIConfig } from "@/hooks/use-ai-config"
import { useToast } from "@/components/ui/toast-container"

interface TestAnswerOverlayProps {
  documentContent: string
  documentId: string
  planId: string
  onClose: () => void
  onUpdateContent: (content: string) => void
}

interface AnswerState {
  mode: 'answer' | 'result'
  questions: ParsedQuestion[]
  userAnswers: Record<number, string>
  results: Record<number, QuestionResult>
  isSubmitting: boolean
  score: number
  correctCount: number
  generatingQuestions: Set<number>
  currentQuestionIndex: number
  startTime: number
  elapsedTime: number
}

export function TestAnswerOverlay({
  documentContent,
  documentId,
  planId,
  onClose,
  onUpdateContent,
}: TestAnswerOverlayProps) {
  const { config, getApiKey } = useAIConfig()
  const toast = useToast()
  
  const [state, setState] = React.useState<AnswerState>({
    mode: 'answer',
    questions: [],
    userAnswers: {},
    results: {},
    isSubmitting: false,
    score: 0,
    correctCount: 0,
    generatingQuestions: new Set(),
    currentQuestionIndex: 1,
    startTime: Date.now(),
    elapsedTime: 0,
  })

  // 题目引用，用于滚动定位
  const questionRefs = React.useRef<Record<number, HTMLDivElement | null>>({})

  // 计时器
  React.useEffect(() => {
    if (state.mode !== 'answer') return

    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [state.mode, state.startTime])

  // 解析文档内容，提取题目
  React.useEffect(() => {
    const loadQuestions = async () => {
      try {
        // 优先从 API 读取题目
        console.log('[答题] 开始从 API 读取题目，documentId:', documentId)
        const contentResponse = await fetch(`/api/learning-outline/${documentId}/content`)
        
        if (contentResponse.ok) {
          const contentData = await contentResponse.json() as { contentId: string }
          console.log('[答题] 获取到 contentId:', contentData.contentId)
          
          const questionsResponse = await fetch(`/api/test-questions/${contentData.contentId}`)
          
          if (questionsResponse.ok) {
            const data = await questionsResponse.json() as { questions: ParsedQuestion[] }
            if (data.questions && data.questions.length > 0) {
              // 从 API 成功读取题目
              console.log('[答题] 从 API 成功读取', data.questions.length, '道题目')
              setState(prev => ({ ...prev, questions: data.questions }))
              
              // 尝试恢复答题进度
              const storageKey = `answer-progress-${documentId}`
              const savedData = localStorage.getItem(storageKey)
              if (savedData) {
                try {
                  const { userAnswers, savedAt } = JSON.parse(savedData)
                  // 只恢复 24 小时内的数据
                  if (Date.now() - savedAt < 24 * 60 * 60 * 1000) {
                    setState(prev => ({ ...prev, userAnswers }))
                  } else {
                    localStorage.removeItem(storageKey)
                  }
                } catch (error) {
                  console.error('恢复答题进度失败:', error)
                }
              }
              return
            } else {
              console.warn('[答题] API 返回的题目列表为空')
            }
          } else {
            console.warn('[答题] 查询题目失败，状态码:', questionsResponse.status)
          }
        } else {
          const errorData = await contentResponse.json().catch(() => ({}))
          console.warn('[答题] 获取内容ID失败，状态码:', contentResponse.status, '错误:', errorData)
        }
      } catch (error) {
        console.error('[答题] 从API读取题目失败，降级到HTML解析:', error)
      }

      // 降级：从 HTML 解析题目
      console.log('[答题] 降级到 HTML 解析模式')
      const questions = parseQuestionsFromHTML(documentContent)
      console.log('[答题] 从 HTML 解析到', questions.length, '道题目')
      setState(prev => ({ ...prev, questions }))

      // 尝试恢复答题进度
      const storageKey = `answer-progress-${documentId}`
      const savedData = localStorage.getItem(storageKey)
      if (savedData) {
        try {
          const { userAnswers, savedAt } = JSON.parse(savedData)
          // 只恢复 24 小时内的数据
          if (Date.now() - savedAt < 24 * 60 * 60 * 1000) {
            setState(prev => ({ ...prev, userAnswers }))
          } else {
            localStorage.removeItem(storageKey)
          }
        } catch (error) {
          console.error('恢复答题进度失败:', error)
        }
      }
    }

    loadQuestions()
  }, [documentContent, documentId])

  // 开始答题
  const handleStartAnswer = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'answer',
      userAnswers: {},
      results: {},
      score: 0,
      correctCount: 0,
    }))
  }, [])

  // 退出答题
  const handleExitAnswer = React.useCallback(() => {
    // 如果正在答题且有未提交的答案，提示用户
    if (state.mode === 'answer' && Object.keys(state.userAnswers).length > 0) {
      const confirmed = window.confirm('您还有未提交的答案，确定要退出答题吗？')
      if (!confirmed) return
    }
    
    onClose()
  }, [state.mode, state.userAnswers, onClose])

  // 更新答案
  const handleAnswerChange = React.useCallback((questionIndex: number, answer: string) => {
    setState(prev => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [questionIndex]: answer,
      },
    }))

    // 自动保存到 localStorage
    const storageKey = `answer-progress-${documentId}`
    const savedData = {
      userAnswers: {
        ...state.userAnswers,
        [questionIndex]: answer,
      },
      savedAt: Date.now(),
    }
    localStorage.setItem(storageKey, JSON.stringify(savedData))
  }, [documentId, state.userAnswers])

  // 提交答案
  const handleSubmit = React.useCallback(async () => {
    setState(prev => ({ ...prev, isSubmitting: true }))

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const apiKey = getApiKey(config.provider)
      if (apiKey) {
        headers['x-api-key'] = apiKey
      }

      // 重新解析 HTML，提取完整的题目数据（包括答案和解析）
      const fullQuestions = parseQuestionsFromHTML(documentContent, true)

      // 准备提交数据
      const answers = state.questions.map(q => {
        const fullQuestion = fullQuestions.find(fq => fq.index === q.index)
        return {
          questionIndex: q.index,
          questionText: q.question,
          questionType: q.type,
          userAnswer: state.userAnswers[q.index] || '',
          correctAnswer: fullQuestion?.correctAnswer || '',
          options: q.options,
        }
      })

      const response = await fetch('/api/test-answer/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentId,
          planId,
          answers,
          provider: config.provider,
          model: config.model,
        }),
      })

      if (!response.ok) {
        throw new Error('提交失败')
      }

      const data = await response.json() as {
        results: Array<{
          questionIndex: number
          isCorrect: boolean
          score: number
          feedback?: string
        }>
        totalScore: number
        correctCount: number
      }

      // 更新结果
      const results: Record<number, QuestionResult> = {}
      data.results.forEach(result => {
        const question = state.questions.find(q => q.index === result.questionIndex)
        const fullQuestion = fullQuestions.find(fq => fq.index === result.questionIndex)
        if (question && fullQuestion) {
          results[result.questionIndex] = {
            isCorrect: result.isCorrect,
            userAnswer: state.userAnswers[result.questionIndex] || '',
            correctAnswer: fullQuestion.correctAnswer,
            score: result.score,
            feedback: result.feedback,
          }
        }
      })

      setState(prev => ({
        ...prev,
        mode: 'result',
        results,
        score: data.totalScore,
        correctCount: data.correctCount,
        isSubmitting: false,
      }))

      // 清除本地存储的答题进度
      const storageKey = `answer-progress-${documentId}`
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('提交失败:', error)
      toast.error('提交失败，请重试')
      setState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [state.questions, state.userAnswers, documentId, planId, documentContent, config, getApiKey, toast])

  // 重新答题
  const handleRetry = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'answer',
      userAnswers: {},
      results: {},
      score: 0,
      correctCount: 0,
    }))
  }, [])

  // 生成相似题目
  const handleGenerateSimilar = React.useCallback(async (questionIndex: number) => {
    const question = state.questions.find(q => q.index === questionIndex)
    if (!question) return

    setState(prev => ({
      ...prev,
      generatingQuestions: new Set(prev.generatingQuestions).add(questionIndex),
    }))

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const apiKey = getApiKey(config.provider)
      if (apiKey) {
        headers['x-api-key'] = apiKey
      }

      const response = await fetch('/api/test-answer/generate-similar', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originalQuestion: {
            type: question.type,
            question: question.question,
            difficulty: 'medium',
            topic: question.question.substring(0, 50),
          },
          provider: config.provider,
          model: config.model,
        }),
      })

      if (!response.ok) {
        throw new Error('生成失败')
      }

      const data = await response.json() as {
        question: string
        options?: string[]
        answer: string
        explanation: string
      }

      // 生成相似题目的 HTML 内容
      let similarQuestionHTML = `<details><summary>💡 举一反三</summary><div style="margin-top: 12px;">`
      similarQuestionHTML += `<p><strong>题目：</strong>${data.question}</p>`
      
      if (data.options && data.options.length > 0) {
        similarQuestionHTML += `<p><strong>选项：</strong></p>`
        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        data.options.forEach((option: string, optIndex: number) => {
          // 检查选项是否已经包含标签（如 "A. "）
          const hasLabel = /^[A-H]\.\s/.test(option)
          if (hasLabel) {
            // 如果已经有标签，直接使用
            similarQuestionHTML += `<p>${option}</p>`
          } else {
            // 如果没有标签，添加标签
            similarQuestionHTML += `<p>${optionLabels[optIndex]}. ${option}</p>`
          }
        })
      }
      
      similarQuestionHTML += `<details><summary>💡 答案和解析</summary>`
      similarQuestionHTML += `<p><strong>答案：</strong>${data.answer}</p>`
      if (data.explanation) {
        similarQuestionHTML += `<p><strong>解析：</strong>${data.explanation}</p>`
      }
      similarQuestionHTML += `</details></div></details>`

      // 在当前题目后插入相似题目
      const parser = new DOMParser()
      const doc = parser.parseFromString(documentContent, 'text/html')
      
      // 查找当前题目的标题
      const questionHeaders = doc.querySelectorAll('h3')
      let targetHeader: Element | null = null
      
      for (const header of Array.from(questionHeaders)) {
        const headerText = header.textContent || ''
        const match = headerText.match(/第\s*(\d+)\s*题/)
        if (match && parseInt(match[1]) === questionIndex) {
          targetHeader = header
          break
        }
      }

      if (targetHeader) {
        // 找到下一个 <hr> 标签或下一个题目标题
        let insertBeforeElement = targetHeader.nextElementSibling
        while (insertBeforeElement) {
          if (insertBeforeElement.tagName === 'HR' || 
              (insertBeforeElement.tagName === 'H3' && insertBeforeElement.textContent?.includes('第') && insertBeforeElement.textContent?.includes('题'))) {
            break
          }
          insertBeforeElement = insertBeforeElement.nextElementSibling
        }

        // 创建新的 details 元素
        const tempDiv = doc.createElement('div')
        tempDiv.innerHTML = similarQuestionHTML
        const newDetailsElement = tempDiv.firstElementChild

        if (newDetailsElement && insertBeforeElement) {
          insertBeforeElement.parentNode?.insertBefore(newDetailsElement, insertBeforeElement)
        }

        // 更新文档内容
        const updatedContent = doc.body.innerHTML
        onUpdateContent(updatedContent)
      }
    } catch (error) {
      console.error('生成相似题目失败:', error)
      toast.error('生成失败，请重试')
    } finally {
      setState(prev => {
        const newSet = new Set(prev.generatingQuestions)
        newSet.delete(questionIndex)
        return { ...prev, generatingQuestions: newSet }
      })
    }
  }, [state.questions, config, getApiKey, documentContent, onUpdateContent, toast])

  // 跳转到指定题目
  const handleQuestionClick = React.useCallback((questionIndex: number) => {
    setState(prev => ({ ...prev, currentQuestionIndex: questionIndex }))
    
    // 滚动到对应题目
    const element = questionRefs.current[questionIndex]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // 计算已答题数：检查答案是否有实际内容
  const answeredCount = Object.keys(state.userAnswers).filter(key => {
    const answer = state.userAnswers[parseInt(key)]
    if (!answer) return false
    
    // 移除 HTML 标签和空白字符，检查是否有实际内容
    const textContent = answer.replace(/<[^>]*>/g, '').trim()
    return textContent !== ''
  }).length

  // 获取已答题目集合
  const answeredQuestions = new Set(
    Object.keys(state.userAnswers)
      .filter(key => {
        const answer = state.userAnswers[parseInt(key)]
        if (!answer) return false
        
        // 移除 HTML 标签和空白字符，检查是否有实际内容
        const textContent = answer.replace(/<[^>]*>/g, '').trim()
        return textContent !== ''
      })
      .map(key => parseInt(key))
  )

  // 获取结果状态
  const resultsStatus = state.mode === 'result' 
    ? Object.fromEntries(
        Object.entries(state.results).map(([key, result]) => [
          parseInt(key),
          { isCorrect: result.isCorrect }
        ])
      )
    : undefined

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* 顶部标题栏 */}
      <AnswerModeHeader
        mode={state.mode}
        totalQuestions={state.questions.length}
        correctCount={state.correctCount}
        isSubmitting={state.isSubmitting}
        onExitAnswer={handleExitAnswer}
        onSubmit={handleSubmit}
        onRetry={handleRetry}
      />

      {/* 主体区域：题目列表 + 答题卡 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：题目列表（可滚动） */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {state.questions.map(question => {
              const questionForDisplay = state.mode === 'answer' 
                ? { ...question, correctAnswer: '', explanation: '' }
                : question
              
              return (
                <div
                  key={question.index}
                  ref={(el) => { questionRefs.current[question.index] = el }}
                >
                  <QuestionAnswerItem
                    question={questionForDisplay}
                    mode={state.mode}
                    userAnswer={state.userAnswers[question.index]}
                    result={state.results[question.index]}
                    onAnswerChange={(answer) => handleAnswerChange(question.index, answer)}
                    onGenerateSimilar={() => handleGenerateSimilar(question.index)}
                    isGenerating={state.generatingQuestions.has(question.index)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 右侧：答题卡 */}
        <AnswerCardPanel
          totalQuestions={state.questions.length}
          answeredQuestions={answeredQuestions}
          currentQuestionIndex={state.currentQuestionIndex}
          results={resultsStatus}
          mode={state.mode}
          onQuestionClick={handleQuestionClick}
          answeredCount={answeredCount}
          elapsedTime={state.elapsedTime}
        />
      </div>
    </div>
  )
}

/**
 * 从 HTML 内容中解析题目
 * @param html HTML 内容
 * @param includeAnswers 是否包含答案和解析（默认 false，答题时不显示）
 */
function parseQuestionsFromHTML(html: string, includeAnswers: boolean = false): ParsedQuestion[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const questions: ParsedQuestion[] = []

  // 查找所有题目标题（<h3>第 X 题</h3>）
  const questionHeaders = doc.querySelectorAll('h3')
  
  questionHeaders.forEach((header) => {
    const headerText = header.textContent || ''
    const match = headerText.match(/第\s*(\d+)\s*题/)
    if (!match) return

    const questionIndex = parseInt(match[1])
    
    // 优先从 data-question-type 属性读取题型
    const questionTypeAttr = header.getAttribute('data-question-type')
    let questionType: 'choice' | 'multiple-choice' | 'true-false' | 'fill' | 'short' | 'essay' | 'code' | 'matching' | 'ordering' = questionTypeAttr as any || 'short'
    
    let currentElement = header.nextElementSibling
    
    let questionText = ''
    let options: string[] = []
    let correctAnswer = ''
    let explanation = ''

    // 遍历题目内容
    while (currentElement && currentElement.tagName !== 'H3' && currentElement.tagName !== 'HR') {
      // 跳过 DETAILS 标签（答案和解析区域）
      if (currentElement.tagName === 'DETAILS') {
        // 只在需要时提取答案和解析
        if (includeAnswers) {
          // 查找 details 内部的所有元素
          const detailsContent = currentElement.querySelectorAll('p, div, pre')
          detailsContent.forEach(elem => {
            const elemText = elem.textContent || ''
            if (elemText.includes('答案：')) {
              correctAnswer = elemText.replace(/^.*答案：/, '').trim()
            }
            if (elemText.includes('解析：')) {
              explanation = elemText.replace(/^.*解析：/, '').trim()
            }
          })
        }
        currentElement = currentElement.nextElementSibling
        continue
      }

      const text = currentElement.textContent || ''
      
      // 检查是否是代码块
      if (currentElement.tagName === 'PRE') {
        const codeElement = currentElement.querySelector('code')
        if (codeElement) {
          const codeText = codeElement.textContent || ''
          // 提取题目文本（整个代码块内容）
          questionText = codeText.trim()
        }
      }
      
      // 提取题目文本（支持代码块和普通文本）
      // 情况1: <p>题目：xxx</p> 或 <div>题目：xxx</div>
      if ((currentElement.tagName === 'P' || currentElement.tagName === 'DIV') && text.includes('题目：')) {
        // 如果还没有题目文本（非代码块情况）
        if (!questionText) {
          const extractedText = text.replace('题目：', '').replace(/^.*题目：/, '').trim()
          if (extractedText) {
            // 题目内容在同一个元素中
            questionText = extractedText
          } else {
            // 题目标签单独一行，内容在下一个元素
            const nextElement = currentElement.nextElementSibling
            if (nextElement) {
              if (nextElement.tagName === 'PRE') {
                // 代码块已经在上面处理过了，跳过
              } else {
                const nextText = nextElement.textContent || ''
                if (nextText && !nextText.includes('选项：') && !nextText.includes('答案：')) {
                  questionText = nextText.trim()
                }
              }
            }
          }
        }
      }
      // 情况2: 如果前一个元素是"题目："标签，当前元素就是题目内容
      else if (currentElement.previousElementSibling && !questionText) {
        const prevText = currentElement.previousElementSibling.textContent || ''
        if (prevText.includes('题目：')) {
          // 确保不是选项或答案
          if (!text.includes('选项：') && !text.includes('答案：') && text.trim()) {
            // 如果是代码块，已经在上面处理过了
            if (currentElement.tagName !== 'PRE') {
              questionText = text.trim()
            }
          }
        }
      }
      
      // 提取选项 - 支持多种格式
      if (text.includes('选项：')) {
        // 继续查找后续的选项元素
      } else if (currentElement.tagName === 'UL') {
        const listItems = currentElement.querySelectorAll('li')
        options = Array.from(listItems).map(li => li.textContent?.trim() || '')
      } else if (currentElement.tagName === 'P' && /^[A-H]\.\s/.test(text)) {
        // 检测到 "A. xxx" 格式的选项
        options.push(text.trim())
      }
      
      currentElement = currentElement.nextElementSibling
    }

    // 只在没有明确标记题型时才根据内容推断
    if (!questionTypeAttr) {
      if (options.length > 0) {
        // 有选项就是选择题
        questionType = 'choice'
      } else if (correctAnswer.length > 0 && correctAnswer.length < 20) {
        questionType = 'fill' // 短答案 -> 填空题
      } else if (correctAnswer.length >= 20) {
        questionType = 'short' // 长答案 -> 简答题
      } else {
        // 根据题目关键词判断
        if (questionText.includes('填空') || questionText.includes('填写')) {
          questionType = 'fill'
        } else if (questionText.includes('代码') || questionText.includes('编程') || questionText.includes('实现') || questionText.includes('function') || questionText.includes('class')) {
          questionType = 'code'
        } else {
          questionType = 'short' // 默认为简答题
        }
      }
    }

    if (questionText) {
      questions.push({
        index: questionIndex,
        type: questionType,
        question: questionText,
        options: options.length > 0 ? options : undefined,
        correctAnswer,
        explanation,
      })
    }
  })

  return questions
}
