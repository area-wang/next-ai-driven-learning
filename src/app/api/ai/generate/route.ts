import { NextRequest, NextResponse } from "next/server"
import { type AIClient, OpenAIClient } from '@/lib/ai/client'
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { getCurrentUserId } from '@/lib/auth/get-user'

interface GenerateRequest {
  prompt: string
  context?: string
  learningPlanTitle?: string
  modelId?: string // 指定使用的模型ID
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
    const { prompt, context, learningPlanTitle, modelId } = body

    console.log('[API] AI generate request:', {
      hasPrompt: !!prompt,
      hasContext: !!context,
      learningPlanTitle,
      modelId,
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

    // 构建完整的提示词，包含上下文
    const fullPrompt = `
你是一个专业的教育内容生成助手。

学习计划标题: ${learningPlanTitle || "未指定"}

当前编辑器内容: ${context || "无"}

用户请求: ${prompt}

请生成高质量的教育内容，符合以下要求：
1. 内容应该清晰、结构化、易于理解
2. 使用适当的标题、列表和格式
3. 包含具体的例子和解释
4. 内容应该与学习计划相关
5. 使用 Markdown 格式

请直接返回生成的内容，不需要额外的说明。
    `.trim()

    // 调用 AI 生成内容
    console.log('[API] Calling AI...')
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

    console.log('[API] AI response received, length:', generatedContent.length)

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
