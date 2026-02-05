/**
 * Tavily Search API 集成
 * 文档: https://docs.tavily.com/
 */

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  publishedDate?: string
}

export interface TavilySearchOptions {
  query: string
  maxResults?: number // 默认 5
  searchDepth?: 'basic' | 'advanced' // 默认 basic
  includeAnswer?: boolean // 是否包含 AI 生成的答案摘要
  includeRawContent?: boolean // 是否包含原始网页内容
  includeDomains?: string[] // 域名白名单
  excludeDomains?: string[] // 域名黑名单
  minScore?: number
  apiKey?: string // API Key（优先使用，否则使用环境变量）
}

export interface TavilySearchResponse {
  query: string
  results: TavilySearchResult[]
  answer?: string // AI 生成的答案摘要
  responseTime: number
}

/**
 * 调用 Tavily Search API
 */
export async function searchWithTavily(
  options: TavilySearchOptions
): Promise<TavilySearchResponse> {
  // 优先使用传入的 API Key，否则使用环境变量
  const apiKey = options.apiKey

  if (!apiKey) {
    throw new Error('Tavily API Key 未配置')
  }

  const {
    query,
    maxResults = 5,
    searchDepth = 'advanced',
    includeAnswer = true,
    includeRawContent = true,
    includeDomains,
    excludeDomains,
    minScore = 0.7
  } = options

  const startTime = Date.now()

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: includeAnswer,
        include_raw_content: includeRawContent,
        include_domains: includeDomains,
        exclude_domains: excludeDomains,
        min_score: minScore
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Tavily API 错误: ${response.statusText}`)
    }

    const data = await response.json() as {
      query?: string
      results?: TavilySearchResult[]
      answer?: string
    }
    const responseTime = Date.now() - startTime

    return {
      query: data.query || query,
      results: data.results || [],
      answer: data.answer,
      responseTime,
    }
  } catch (error) {
    console.error('[Tavily Search] 搜索失败:', error)
    throw error
  }
}

/**
 * 格式化搜索结果为文本（用于添加到 LLM prompt）
 */
export function formatSearchResultsForPrompt(
  response: TavilySearchResponse
): string {
  const { results, answer } = response

  if (results.length === 0) {
    return '未找到相关搜索结果。'
  }

  let formatted = '## 联网搜索结果\n\n'

  // 如果有 AI 生成的答案摘要，先显示
  if (answer) {
    formatted += `**AI 搜索摘要**: ${answer}\n\n`
  }

  // 按相关性评分排序（从高到低）
  const sortedResults = [...results].sort((a, b) => (b.score || 0) - (a.score || 0))

  // 显示搜索结果
  formatted += `找到 ${sortedResults.length} 条相关信息（按相关性排序）：\n\n`

  sortedResults.forEach((result, index) => {
    // 添加相关性指示器
    const relevanceEmoji = result.score >= 0.9 ? '🔥' : result.score >= 0.8 ? '⭐' : '📄'
    
    formatted += `${relevanceEmoji} **${index + 1}. ${result.title}**\n`
    formatted += `- **来源**: ${result.url}\n`
    
    if (result.publishedDate) {
      formatted += `- **发布时间**: ${result.publishedDate}\n`
    }
    
    // 显示相关性评分（仅用于调试，可选）
    if (result.score) {
      formatted += `- **相关性**: ${(result.score * 100).toFixed(0)}%\n`
    }
    
    formatted += `- **内容**: ${result.content}\n\n`
  })

  formatted += '---\n\n'
  formatted += '**使用说明**：\n'
  formatted += '1. 以上信息来自互联网搜索，请结合你的知识进行分析\n'
  formatted += '2. 优先参考高相关性（🔥⭐）的结果\n'
  formatted += '3. 在回答中引用具体来源，增强可信度\n'
  formatted += '4. 如果信息有冲突，请说明不同来源的观点\n'

  return formatted
}
