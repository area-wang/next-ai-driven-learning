import { NextRequest, NextResponse } from "next/server"
import MarkdownIt from 'markdown-it'
import { type AIClient } from '@/lib/ai/client'
import { getAIConfig, createAIClientFromConfig } from '@/lib/ai/get-ai-config'
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

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true, // 允许 HTML 标签
  linkify: true, // 自动转换 URL 为链接
  typographer: true, // 启用智能引号和其他排版优化
  breaks: true, // 将换行符转换为 <br>
})

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

      aiClient = createAIClientFromConfig(config)
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
    })

    // 使用 markdown-it 将 Markdown 转换为 HTML（支持表格、GFM 等）
    const htmlContent = md.render(generatedContent)

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
