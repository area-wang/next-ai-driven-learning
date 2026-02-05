/**
 * 搜索工具函数
 */

import { searchWithTavily, formatSearchResultsForPrompt, type TavilySearchOptions } from './tavily'

export interface SearchConfig {
  resultCount: number
  language: 'auto' | 'zh' | 'en'
}

/**
 * 搜索场景类型
 */
export type SearchContext = 
  | 'general'           // 通用搜索
  | 'learning'          // 学习相关
  | 'programming'       // 编程相关
  | 'documentation'     // 文档查询
  | 'news'              // 新闻资讯

/**
 * AI 分析的搜索策略
 */
interface SearchStrategy {
  context: SearchContext
  recommendedDomains: string[]
  optimizedQuery: string
  reasoning: string
}

/**
 * 根据搜索场景获取推荐的域名
 */
function getRecommendedDomains(context: SearchContext): string[] | undefined {
  const domainMap: Record<SearchContext, string[] | undefined> = {
    general: undefined, // 不限制
    learning: [
      'wikipedia.org',
      'coursera.org',
      'udemy.com',
      'edx.org',
      'khanacademy.org',
      'medium.com',
      'dev.to',
      'freecodecamp.org',
    ],
    programming: [
      'stackoverflow.com',
      'github.com',
      'dev.to',
      'medium.com',
      'docs.python.org',
      'developer.mozilla.org',
      'reactjs.org',
      'nodejs.org',
      'typescript.org',
    ],
    documentation: [
      'docs.python.org',
      'developer.mozilla.org',
      'reactjs.org',
      'nodejs.org',
      'typescript.org',
      'vuejs.org',
      'angular.io',
      'nextjs.org',
    ],
    news: [
      'techcrunch.com',
      'theverge.com',
      'arstechnica.com',
      'wired.com',
      'reuters.com',
    ],
  }
  
  return domainMap[context]
}

/**
 * 使用 AI 分析查询并生成搜索策略
 */
async function analyzeQueryWithAI(
  query: string,
  aiConfig: { apiKey: string; baseUrl: string; model: string }
): Promise<SearchStrategy> {
  const prompt = `你是一个搜索策略专家。分析用户的查询意图，并提供最佳的搜索策略。

用户查询：${query}

请分析并返回 JSON 格式的搜索策略：
{
  "context": "搜索场景类型（general/learning/programming/documentation/news）",
  "recommendedDomains": ["推荐的权威域名列表，最多5个"],
  "optimizedQuery": "优化后的搜索关键词（移除无用词，保留核心内容）",
  "reasoning": "简短说明你的判断理由"
}

场景说明：
- general: 通用问题，不限制域名
- learning: 学习、教育相关，推荐教育平台
- programming: 编程、代码相关，推荐技术社区和文档
- documentation: 查找官方文档，推荐官方文档站点
- news: 新闻、资讯、最新动态，推荐科技媒体

域名推荐原则：
1. 选择该领域最权威的网站
2. 优先选择官方文档和知名社区
3. 如果是中文查询，可以包含中文网站（如 zhihu.com, juejin.cn）
4. 如果无法确定，返回空数组 []

关键词优化原则：
1. 移除"请"、"帮我"、"如何"、"怎么"等无用词
2. 保留技术名称、版本号等关键信息
3. 如果是中文，保持中文；如果是英文，保持英文
4. 长度控制在 100 字符以内

只返回 JSON，不要其他内容。`

  try {
    const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // 低温度，更确定性的输出
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error('AI 分析失败')
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }

    const content = data.choices?.[0]?.message?.content || ''
    
    // 提取 JSON（可能被包裹在 markdown 代码块中）
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应')
    }

    const strategy = JSON.parse(jsonMatch[0]) as SearchStrategy
    
    return strategy
  } catch (error) {
    // 降级：使用简单的关键词提取
    return {
      context: 'general',
      recommendedDomains: [],
      optimizedQuery: extractSearchQuerySimple(query),
      reasoning: 'AI 分析失败，使用默认策略'
    }
  }
}

/**
 * 简单的关键词提取（降级方案）
 */
function extractSearchQuerySimple(userInput: string): string {
  let query = userInput.trim().slice(0, 200)
  
  const stopWords = [
    '请', '帮我', '帮忙', '可以', '能否', '能不能', '怎么', '如何', '什么',
    '为什么', '哪些', '哪个', '告诉我', '我想', '我要', '给我',
    'please', 'help', 'can you', 'could you', 'tell me', 'i want', 'i need'
  ]
  
  stopWords.forEach(word => {
    const regex = new RegExp(`^${word}\\s+|\\s+${word}\\s+|\\s+${word}$`, 'gi')
    query = query.replace(regex, ' ')
  })
  
  query = query.replace(/\s+/g, ' ').trim()
  
  if (query.length < 3) {
    return userInput.trim().slice(0, 200)
  }
  
  return query
}

/**
 * 执行搜索并返回格式化的结果
 */
export async function performSearch(
  query: string,
  config: SearchConfig & { apiKey?: string },
  aiConfig?: { apiKey: string; baseUrl: string; model: string }
): Promise<string> {
  try {
    let strategy: SearchStrategy
    
    // 如果提供了 AI 配置，使用 AI 分析
    if (aiConfig) {
      strategy = await analyzeQueryWithAI(query, aiConfig)
    } else {
      // 降级：使用简单的关键词提取
      strategy = {
        context: 'general',
        recommendedDomains: [],
        optimizedQuery: extractSearchQuerySimple(query),
        reasoning: '未提供 AI 配置，使用简单提取'
      }
    }

    const options: TavilySearchOptions = {
      query: strategy.optimizedQuery,
      maxResults: config.resultCount,
      searchDepth: 'advanced',
      includeAnswer: true,
      includeRawContent: true,
      includeDomains: strategy.recommendedDomains.length > 0 ? strategy.recommendedDomains : undefined,
      apiKey: config.apiKey,
    }

    const response = await searchWithTavily(options)
    const formattedResults = formatSearchResultsForPrompt(response)

    return formattedResults
  } catch (error) {
    console.error('[Search Utils] 搜索失败:', error)
    throw error
  }
}

/**
 * 从用户输入中提取搜索关键词（保留用于向后兼容）
 */
export function extractSearchQuery(userInput: string): string {
  return extractSearchQuerySimple(userInput)
}

/**
 * 检查是否应该启用搜索（基于用户输入）
 * 可选功能：自动检测是否需要联网搜索
 */
export function shouldEnableSearch(userInput: string): boolean {
  const keywords = [
    '最新',
    '现在',
    '今天',
    '最近',
    '2024',
    '2025',
    '2026',
    'latest',
    'recent',
    'current',
    'now',
    'today',
  ]

  const lowerInput = userInput.toLowerCase()
  return keywords.some(keyword => lowerInput.includes(keyword))
}
