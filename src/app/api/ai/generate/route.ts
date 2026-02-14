import { NextRequest, NextResponse } from "next/server"
import { type AIClient, OpenAIClient } from '@/lib/ai/client'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { performSearch } from '@/lib/search/utils'
import { getSearchConfig } from '@/lib/search/get-search-config'
import { generateAICommandPrompt } from '@/lib/ai/prompts'

interface GenerateRequest {
  prompt: string
  context?: string
  documentTitle?: string // 当前文档标题
  planTopic?: string // 学习计划主题
  modelId?: string // 指定使用的模型ID
  enableWebSearch?: boolean // 是否启用联网搜索
}

// 简单的 Markdown 转 HTML 转换
function markdownToHtml(markdown: string): string {
  let html = markdown
  
  // 用占位符保存代码块，防止被其他规则破坏
  const codeBlocks: string[] = []
  const codeBlockPlaceholder = '___CODE_BLOCK_PLACEHOLDER_'
  
  // 首先提取代码块（三个反引号）
  html = html.replace(/```([\w]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text'
    const escapedCode = code.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
    const codeBlockHtml = `<pre><code class="language-${language}">${escapedCode}</code></pre>`
    codeBlocks.push(codeBlockHtml)
    return `${codeBlockPlaceholder}${codeBlocks.length - 1}___`
  })
  
  // 处理标题（必须在其他处理之前）
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  
  // 处理行内代码（单个反引号）
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // 处理粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 处理斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 处理列表项
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>')
  
  // 处理段落 - 保留已处理的 HTML 标签
  const lines = html.split('\n')
  const result: string[] = []
  let paragraphLines: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // 如果是 HTML 标签或占位符或空行
    if (trimmed.startsWith('<') || trimmed.startsWith(codeBlockPlaceholder) || trimmed === '') {
      // 先输出之前积累的段落
      if (paragraphLines.length > 0) {
        result.push('<p>' + paragraphLines.join(' ') + '</p>')
        paragraphLines = []
      }
      // 输出 HTML 标签或占位符或空行
      if (trimmed !== '') {
        result.push(trimmed)
      }
    } else {
      // 普通文本行，积累到段落中
      paragraphLines.push(trimmed)
    }
  }
  
  // 输出最后的段落
  if (paragraphLines.length > 0) {
    result.push('<p>' + paragraphLines.join(' ') + '</p>')
  }
  
  let finalHtml = result.join('\n').trim()
  
  // 恢复代码块
  codeBlocks.forEach((codeBlock, index) => {
    finalHtml = finalHtml.replace(`${codeBlockPlaceholder}${index}___`, codeBlock)
  })
  
  return finalHtml
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GenerateRequest
    const { prompt, context, documentTitle, planTopic, modelId, enableWebSearch = false } = body

    console.log('[API] AI generate request:', {
      hasPrompt: !!prompt,
      hasContext: !!context,
      documentTitle,
      planTopic,
      modelId,
      enableWebSearch,
    })

    if (!prompt) {
      return NextResponse.json(
        { error: "提示词不能为空" },
        { status: 400 }
      )
    }

    // 获取当前用户 ID
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      )
    }

    // 处理联网搜索
    let searchResults = ''
    if (enableWebSearch) {
      try {
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
          // 无法获取 AI 配置，将使用简单提取
        }
        
        // 获取用户的搜索配置
        const searchConfig = await getSearchConfig(request as unknown as Request, userId)
        
        // 执行搜索（传递 AI 配置用于智能分析）
        searchResults = await performSearch(prompt, searchConfig, aiConfig)
      } catch (searchError) {
        console.error('[AI Generate API] 搜索失败，降级到普通模式:', searchError)
        // 搜索失败不影响主流程
      }
    }

    // 获取 AI 配置
    console.log('[API] Getting AI config...')
    let aiClient: AIClient
    try {
      const config = await getAIConfig(request as unknown as Request, userId, modelId)

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

    // 构建完整的提示词，包含文档摘要和搜索结果
    let documentSummary = null
    if (context) {
      try {
        documentSummary = JSON.parse(context)
      } catch {
        // 不是 JSON，作为普通文本处理
      }
    }
    
    // 使用统一的 prompt 函数
    let fullPrompt = generateAICommandPrompt({
      prompt,
      context: documentSummary ? undefined : context,
      documentTitle,
      planTopic,
      documentSummary,
    })
    
    // 如果有搜索结果，添加到 prompt
    if (searchResults) {
      fullPrompt = `${searchResults}\n\n${fullPrompt}`
    }

    // 调用 AI 生成内容
    const generatedContent = await aiClient.chat({
      messages: [
        {
          role: 'system',
          content: '你是一个专业的教育内容生成助手，生成高质量的学习材料。',
        },
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
      maxTokens: 100000,
    })

    // 将 Markdown 转换为 HTML
    const htmlContent = markdownToHtml(generatedContent)

    return NextResponse.json({
      content: htmlContent,
    })
  } catch (error) {
    console.error("生成内容错误:", error)
    return NextResponse.json(
      { error: "生成内容失败，请稍后重试" },
      { status: 500 }
    )
  }
}
