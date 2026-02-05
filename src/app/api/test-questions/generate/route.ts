/**
 * 测试题生成 API
 * 根据主题、难度等参数生成测试题
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateTestQuestionsPrompt, type TestQuestionsInput } from '@/lib/ai/prompts'
import { type AIClient, OpenAIClient } from '@/lib/ai/client'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { performSearch } from '@/lib/search/utils'
import { getSearchConfig } from '@/lib/search/get-search-config'

interface GenerateRequest {
  topic: string
  planTopic?: string // 学习计划主题
  planGoal?: string // 学习计划目标
  currentContent?: string // 当前章节内容
  additionalContext?: string // 用户自定义描述
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  questionTypes: string[]
  modelId?: string // 指定使用的模型ID
  enableWebSearch?: boolean // 是否启用联网搜索
}

interface Question {
  question: string
  options?: string[]
  answer: string
  explanation?: string
  type: string
}

interface TestQuestionsResponse {
  questions: Question[]
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdOrDemo()
    
    const body = await request.json() as GenerateRequest
    const {
      topic,
      planTopic,
      planGoal,
      currentContent,
      additionalContext,
      difficulty,
      questionCount,
      questionTypes,
      modelId,
      enableWebSearch = false,
    } = body

    console.log('[API] Test questions generate request:', {
      topic,
      planTopic,
      planGoal,
      hasCurrentContent: !!currentContent,
      hasAdditionalContext: !!additionalContext,
      difficulty,
      questionCount,
      questionTypes,
      modelId,
      userId,
      enableWebSearch,
    })

    if (!topic) {
      return NextResponse.json(
        { error: '主题不能为空' },
        { status: 400 }
      )
    }

    if (questionCount < 1 || questionCount > 20) {
      return NextResponse.json(
        { error: '题目数量必须在 1-20 之间' },
        { status: 400 }
      )
    }

    if (questionTypes.length === 0) {
      return NextResponse.json(
        { error: '必须选择至少一种题型' },
        { status: 400 }
      )
    }

    // 处理联网搜索
    let searchResults = ''
    if (enableWebSearch) {
      try {
        console.log('[Test Questions API] 联网搜索已启用')
        
        // 获取 AI 配置（用于搜索意图分析）
        let aiConfig
        try {
          const config = await getAIConfig(request as unknown as Request, userId, modelId)
          aiConfig = {
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
          }
        } catch (error) {
          console.warn('[Test Questions API] 无法获取 AI 配置用于搜索分析，将使用简单提取')
        }
        
        // 获取用户的搜索配置
        const searchConfig = await getSearchConfig(request as unknown as Request, userId)
        console.log('[Test Questions API] 搜索配置:', searchConfig)
        
        // 构建搜索查询
        const searchQuery = `${topic} 考试题 面试题 测试题 ${difficulty}`
        console.log('[Test Questions API] 搜索查询:', searchQuery)
        
        // 执行搜索（传递 AI 配置用于智能分析）
        searchResults = await performSearch(searchQuery, searchConfig, aiConfig)
        console.log('[Test Questions API] 搜索完成，结果长度:', searchResults.length)
      } catch (searchError) {
        console.error('[Test Questions API] 搜索失败，降级到普通模式:', searchError)
        // 搜索失败不影响主流程
      }
    }

    // 获取 AI 配置
    console.log('[API] Getting AI config...')
    let aiClient: AIClient
    try {
      const config = await getAIConfig(request as unknown as Request, userId, modelId)
      console.log('[API] AI config:', {
        hasApiKey: !!config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      })

      aiClient = new OpenAIClient(
        config.apiKey,
        config.model,
        config.baseUrl
      )
    } catch (configError) {
      console.error('[API] Failed to get AI config:', configError)
      return NextResponse.json(
        { error: `${configError instanceof Error ? configError.message : '获取 AI 配置失败'}` },
        { status: 500 }
      )
    }

    // 生成提示词
    const input: TestQuestionsInput = {
      topic,
      planTopic,
      planGoal,
      currentContent,
      additionalContext,
      difficulty,
      questionCount,
      questionTypes,
    }
    let prompt = generateTestQuestionsPrompt(input)
    
    // 如果有搜索结果，添加到 prompt
    if (searchResults) {
      prompt = `${searchResults}\n\n${prompt}`
    }
    
    console.log('[API] Generated prompt length:', prompt.length)

    // 调用 AI 生成测试题
    console.log('[API] Calling AI...')
    let response: string
    try {
      response = await aiClient.chat({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 100000,
      })
      console.log('[API] AI response received, length:', response.length)
      console.log('[API] AI response preview:', response.slice(0, 200))
    } catch (aiError) {
      console.error('[API] AI call failed:', aiError)
      return NextResponse.json(
        { error: `AI 调用失败: ${aiError instanceof Error ? aiError.message : '未知错误'}` },
        { status: 500 }
      )
    }

    // 解析 AI 响应
    let testData: TestQuestionsResponse
    try {
      // 尝试多种方式解析 JSON
      let jsonStr = response.trim()
      
      // 移除 markdown 代码块标记
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '')
      }
      
      jsonStr = jsonStr.trim()
      
      // 尝试直接解析
      try {
        testData = JSON.parse(jsonStr)
      } catch {
        // 如果直接解析失败，尝试提取 JSON 对象
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          testData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法找到有效的 JSON 对象')
        }
      }
      
      // 验证数据结构
      if (!testData.questions || !Array.isArray(testData.questions)) {
        throw new Error('响应中缺少 questions 数组')
      }
      
      if (testData.questions.length === 0) {
        throw new Error('生成的题目数量为 0')
      }
      
      // 清理选项中的 \n 字符
      testData.questions = testData.questions.map((question) => {
        if (question.options && Array.isArray(question.options)) {
          question.options = question.options.map((option) => 
            option.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
          )
        }
        
        // 标准化题型字段
        const normalizeType = (type: string): string => {
          if (!type) return 'short'
          
          const lowerType = type.toLowerCase().trim()
          
          // 单选题的各种表达
          if (lowerType.includes('choice') || lowerType.includes('单选') || lowerType.includes('选择')) {
            // 排除多选
            if (lowerType.includes('multiple') || lowerType.includes('多选')) {
              return 'multiple-choice'
            }
            return 'choice'
          }
          
          // 多选题的各种表达
          if (lowerType.includes('multiple') || lowerType.includes('多选')) {
            return 'multiple-choice'
          }
          
          // 判断题的各种表达
          if (lowerType.includes('true') || lowerType.includes('false') || lowerType.includes('判断') || lowerType.includes('对错')) {
            return 'true-false'
          }
          
          // 填空题的各种表达
          if (lowerType.includes('fill') || lowerType.includes('填空') || lowerType.includes('blank')) {
            return 'fill'
          }
          
          // 编程题的各种表达
          if (lowerType.includes('code') || lowerType.includes('编程') || lowerType.includes('coding') || lowerType.includes('program')) {
            return 'code'
          }
          
          // 论述题的各种表达
          if (lowerType.includes('essay') || lowerType.includes('论述') || lowerType.includes('作文')) {
            return 'essay'
          }
          
          // 匹配题的各种表达
          if (lowerType.includes('match') || lowerType.includes('匹配') || lowerType.includes('连线')) {
            return 'matching'
          }
          
          // 排序题的各种表达
          if (lowerType.includes('order') || lowerType.includes('排序') || lowerType.includes('顺序')) {
            return 'ordering'
          }
          
          // 简答题的各种表达
          if (lowerType.includes('short') || lowerType.includes('简答') || lowerType.includes('问答')) {
            return 'short'
          }
          
          // 默认返回简答题
          return 'short'
        }
        
        // 标准化 type 字段
        question.type = normalizeType(question.type)
        
        // 如果有选项，根据选项数量和内容判断题型
        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
          // 判断题：只有两个选项，且是"对/错"、"True/False"、"是/否"等
          if (question.options.length === 2) {
            const opt1 = question.options[0].toLowerCase().trim()
            const opt2 = question.options[1].toLowerCase().trim()
            const trueFalsePairs = [
              ['对', '错'], ['true', 'false'], ['是', '否'], ['正确', '错误'],
              ['t', 'f'], ['yes', 'no'], ['y', 'n']
            ]
            const isJudgment = trueFalsePairs.some(([a, b]) => 
              (opt1.includes(a) && opt2.includes(b)) || (opt1.includes(b) && opt2.includes(a))
            )
            if (isJudgment) {
              question.type = 'true-false'
            }
          }
          
          // 如果不是判断题，且 type 不是 choice 或 multiple-choice，默认为单选题
          if (question.type !== 'true-false' && question.type !== 'choice' && question.type !== 'multiple-choice') {
            question.type = 'choice'
          }
        }
        
        // 自动检测并转换代码为代码块格式
        const autoConvertCode = (text: string): string => {
          if (!text) return text
          
          // 如果已经包含代码块，直接返回
          if (text.includes('```')) return text
          
          // 检测常见的代码模式
          const codePatterns = [
            // Python: def, class, import, for, if, while 等关键字
            /\b(def|class|import|from|for|if|while|try|except|with|print|return)\s+/,
            // JavaScript/TypeScript: const, let, var, function, class 等
            /\b(const|let|var|function|class|async|await|return|console\.log)\s+/,
            // Java/C++: public, private, void, int, String 等
            /\b(public|private|protected|void|int|String|boolean|class|static)\s+/,
            // 函数调用模式: functionName(...)
            /\w+\([^)]*\)/,
            // 赋值语句: x = ...
            /\w+\s*=\s*[^=]/,
            // C++: #include, cout, cin
            /#include|cout|cin|std::/,
            // Go: func, package, fmt.
            /\b(func|package|fmt\.)\s+/,
          ]
          
          // 只要检测到任何代码模式，就把整个内容当作代码块
          const hasCode = codePatterns.some(pattern => pattern.test(text))
          
          if (hasCode) {
            // 检测语言
            let language = 'plaintext'
            if (/\b(def|import|from|print)\b/.test(text)) {
              language = 'python'
            } else if (/\b(const|let|var|function|console\.log)\b/.test(text)) {
              language = 'javascript'
            } else if (/\b(public|private|void|System\.out)\b/.test(text)) {
              language = 'java'
            } else if (/#include|cout|cin|std::/.test(text)) {
              language = 'cpp'
            } else if (/\b(func|package|fmt\.)\b/.test(text)) {
              language = 'go'
            }
            
            // 整个内容包裹在代码块中
            return '```' + language + '\n' + text + '\n```'
          }
          
          return text
        }
        
        // 对题目、答案、解析应用自动转换
        if (question.question) {
          question.question = autoConvertCode(question.question)
        }
        if (question.answer) {
          question.answer = autoConvertCode(question.answer)
        }
        if (question.explanation) {
          question.explanation = autoConvertCode(question.explanation)
        }
        
        return question
      })
      
      console.log('[API] Parsed questions:', testData.questions?.length)
    } catch (error) {
      console.error('[API] Failed to parse AI response:', error)
      console.error('[API] Raw response:', response)
      return NextResponse.json(
        { error: `AI 响应格式错误: ${error instanceof Error ? error.message : '未知错误'}` },
        { status: 500 }
      )
    }

    return NextResponse.json(testData)
  } catch (error) {
    console.error('[API] Test questions generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 服务错误' },
      { status: 500 }
    )
  }
}
