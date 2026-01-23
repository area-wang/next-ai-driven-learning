import { NextRequest, NextResponse } from "next/server"
import { createAIClientFromRequest } from '@/lib/ai/config-client'
import { type AIClient } from '@/lib/ai/client'

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

    // 从配置创建 AI 客户端
    console.log('[API] Creating AI client from config...')
    let aiClient: AIClient
    try {
      // 如果提供了 modelId，使用指定的模型
      if (modelId) {
        const { OpenAIClient } = await import('@/lib/ai/client')
        
        // 从环境变量读取 OpenRouter API Key（安全）
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
          throw new Error('未配置 OPENROUTER_API_KEY 环境变量')
        }
        
        // 从请求头获取模型信息（不包含 API Key）
        const modelConfigHeader = request.headers.get('x-model-config')
        if (modelConfigHeader) {
          const modelConfig = JSON.parse(modelConfigHeader)
          // 使用环境变量中的 API Key，而不是前端传递的
          aiClient = new OpenAIClient(
            apiKey, // 使用后端的 API Key
            modelConfig.model,
            modelConfig.baseUrl || 'https://openrouter.ai/api/v1'
          )
        } else {
          throw new Error('未提供模型配置，请确保客户端正确传递了模型信息')
        }
      } else {
        // 使用默认配置
        aiClient = createAIClientFromRequest(request)
      }
    } catch (clientError) {
      console.error('[API] Failed to create AI client:', clientError)
      return NextResponse.json(
        { error: `${clientError instanceof Error ? clientError.message : '创建 AI 客户端失败'}` },
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
      maxTokens: 2000,
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
