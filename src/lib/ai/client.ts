/**
 * AI 服务客户端
 * 支持 OpenAI、DeepSeek、Gemini、Claude 和 Cloudflare AI
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIStreamOptions {
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  onChunk?: (chunk: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
  // Structured output 支持
  responseFormat?: {
    type: 'json_object' | 'json_schema'
    schema?: Record<string, unknown> // JSON Schema
  }
  // Tool/Function call 支持（用于 Anthropic）
  tools?: Array<{
    name: string
    description: string
    input_schema: Record<string, unknown>
  }>
}

export interface AIClient {
  chat(options: AIStreamOptions): Promise<string>
  chatStream(options: AIStreamOptions): Promise<ReadableStream<string>>
  // 获取消息格式类型
  getMessageFormat(): 'openai' | 'anthropic'
}

export type AIProvider = 'openai' | 'deepseek' | 'gemini' | 'claude' | 'cloudflare' | 'custom'

/**
 * OpenAI 客户端（支持 ChatGPT）
 */
export class OpenAIClient implements AIClient {
  private apiKey: string
  private model: string
  private baseURL: string

  constructor(apiKey: string, model: string = 'gpt-4o-mini', baseURL: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.model = model
    this.baseURL = baseURL
  }

  async chat(options: AIStreamOptions): Promise<string> {
    const { messages, temperature = 0.7, maxTokens, responseFormat } = options

    try {
      // 检查是否是 OpenRouter
      const isOpenRouter = this.baseURL.includes('openrouter.ai')
      // 检查是否支持 response_format（只有 OpenAI 官方支持）
      const supportsResponseFormat = this.baseURL.includes('api.openai.com')

      // 构建请求头对象
      const headersObj: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      }

      // 如果是 OpenRouter API，添加必要的请求头
      if (isOpenRouter) {
        headersObj['HTTP-Referer'] = 'https://ai-learning-platform.com'
        headersObj['X-Title'] = 'AI Learning Platform'
      }

      // 构建请求体
      const requestBody: Record<string, unknown> = {
        model: this.model,
        messages,
        temperature,
      }

      // 只在明确指定 maxTokens 时才添加
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens
      }

      // 添加 response_format（仅 OpenAI 官方支持）
      if (responseFormat && supportsResponseFormat) {
        if (responseFormat.type === 'json_schema' && responseFormat.schema) {
          requestBody.response_format = {
            type: 'json_schema',
            json_schema: responseFormat.schema,
          }
        } else if (responseFormat.type === 'json_object') {
          requestBody.response_format = { type: 'json_object' }
        }
      }

      // 使用 fetch 的 headers 选项，不使用 Headers 构造函数
      // 这样可以避免浏览器自动添加某些请求头
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: headersObj,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
        const errorMessage = errorData.error?.message || response.statusText
        console.error('[AI Client] API 调用失败:', {
          baseURL: this.baseURL,
          model: this.model,
          status: response.status,
          error: errorMessage,
        })
        throw new Error(`AI API 错误 (${this.model}): ${errorMessage}`)
      }

      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string
          }
        }>
      }
      return data.choices[0].message.content
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  async chatStream(options: AIStreamOptions): Promise<ReadableStream<string>> {
    const { messages, temperature = 0.7, maxTokens } = options

    // 构建请求头对象
    const headersObj: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    }

    // 如果是 OpenRouter API，添加必要的请求头
    if (this.baseURL.includes('openrouter.ai')) {
      headersObj['HTTP-Referer'] = 'https://ai-learning-platform.com'
      headersObj['X-Title'] = 'AI Learning Platform'
    }

    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature,
      stream: true,
    }

    // 只在明确指定 maxTokens 时才添加
    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: headersObj,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || response.statusText
      console.error('[AI Client] Stream API 调用失败:', {
        baseURL: this.baseURL,
        model: this.model,
        status: response.status,
        error: errorMessage,
      })
      throw new Error(`AI API 错误 (${this.model}): ${errorMessage}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              options.onComplete?.(fullText)
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  continue
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  
                  if (content) {
                    fullText += content
                    options.onChunk?.(content)
                    controller.enqueue(content)
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          options.onError?.(error instanceof Error ? error : new Error('Stream error'))
          controller.error(error)
        }
      },
    })
  }

  getMessageFormat(): 'openai' | 'anthropic' {
    return 'openai'
  }
}

/**
 * DeepSeek 客户端（兼容 OpenAI API）
 */
export class DeepSeekClient extends OpenAIClient {
  constructor(apiKey: string, model: string = 'deepseek-chat') {
    super(apiKey, model, 'https://api.deepseek.com/v1')
  }
}

/**
 * Gemini 客户端
 */
export class GeminiClient implements AIClient {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    this.apiKey = apiKey
    this.model = model
  }

  async chat(options: AIStreamOptions): Promise<string> {
    const { messages, temperature = 0.7, maxTokens } = options

    try {
      // 转换消息格式
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))

      const systemInstruction = messages.find(m => m.role === 'system')?.content

      const generationConfig: Record<string, unknown> = {
        temperature,
      }

      // 只在明确指定 maxTokens 时才添加
      if (maxTokens !== undefined) {
        generationConfig.maxOutputTokens = maxTokens
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            generationConfig,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json() as {
        candidates: Array<{
          content: {
            parts: Array<{ text: string }>
          }
        }>
      }
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  async chatStream(options: AIStreamOptions): Promise<ReadableStream<string>> {
    const { messages, temperature = 0.7, maxTokens } = options

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const systemInstruction = messages.find(m => m.role === 'system')?.content

    const generationConfig: Record<string, unknown> = {
      temperature,
    }

    // 只在明确指定 maxTokens 时才添加
    if (maxTokens !== undefined) {
      generationConfig.maxOutputTokens = maxTokens
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              options.onComplete?.(fullText)
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line)
                const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
                
                if (content) {
                  fullText += content
                  options.onChunk?.(content)
                  controller.enqueue(content)
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        } catch (error) {
          options.onError?.(error instanceof Error ? error : new Error('Stream error'))
          controller.error(error)
        }
      },
    })
  }

  getMessageFormat(): 'openai' | 'anthropic' {
    return 'openai'
  }
}

/**
 * Claude 客户端
 */
export class ClaudeClient implements AIClient {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey
    this.model = model
  }

  async chat(options: AIStreamOptions): Promise<string> {
    const { messages, temperature = 0.7, maxTokens, tools } = options

    try {
      // 提取 system 消息
      const systemMessage = messages.find(m => m.role === 'system')?.content
      const conversationMessages = messages.filter(m => m.role !== 'system')

      // 构建请求体
      const requestBody: Record<string, unknown> = {
        model: this.model,
        messages: conversationMessages,
        system: systemMessage,
        temperature,
      }

      // 只在明确指定 maxTokens 时才添加
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens
      }

      // 添加 tools（用于约束输出格式）
      if (tools && tools.length > 0) {
        requestBody.tools = tools
        // 强制使用第一个 tool
        requestBody.tool_choice = { type: 'tool', name: tools[0].name }
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const data = await response.json() as {
        content: Array<{
          type: string
          text?: string
          name?: string
          input?: Record<string, unknown>
        }>
      }

      // 如果使用了 tool call，返回 tool 的 input（JSON 格式）
      if (tools && tools.length > 0) {
        const toolUse = data.content.find(c => c.type === 'tool_use')
        if (toolUse && toolUse.input) {
          return JSON.stringify(toolUse.input)
        }
      }

      // 否则返回普通文本
      const textContent = data.content.find(c => c.type === 'text')
      return textContent?.text || ''
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  async chatStream(options: AIStreamOptions): Promise<ReadableStream<string>> {
    const { messages, temperature = 0.7, maxTokens } = options

    const systemMessage = messages.find(m => m.role === 'system')?.content
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages: conversationMessages,
      system: systemMessage,
      temperature,
      stream: true,
    }

    // 只在明确指定 maxTokens 时才添加
    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              options.onComplete?.(fullText)
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                try {
                  const parsed = JSON.parse(data)
                  
                  if (parsed.type === 'content_block_delta') {
                    const content = parsed.delta?.text || ''
                    
                    if (content) {
                      fullText += content
                      options.onChunk?.(content)
                      controller.enqueue(content)
                    }
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          options.onError?.(error instanceof Error ? error : new Error('Stream error'))
          controller.error(error)
        }
      },
    })
  }

  getMessageFormat(): 'openai' | 'anthropic' {
    return 'anthropic'
  }
}

/**
 * Cloudflare AI 客户端
 */
export class CloudflareAIClient implements AIClient {
  private ai: any // Cloudflare AI binding
  private model: string

  constructor(ai: any, model: string = '@cf/meta/llama-3.1-8b-instruct') {
    this.ai = ai
    this.model = model
  }

  async chat(options: AIStreamOptions): Promise<string> {
    const { messages, temperature = 0.7, maxTokens } = options

    try {
      const config: Record<string, unknown> = {
        messages,
        temperature,
      }

      // 只在明确指定 maxTokens 时才添加
      if (maxTokens !== undefined) {
        config.max_tokens = maxTokens
      }

      const response = await this.ai.run(this.model, config)

      return response.response || ''
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  async chatStream(options: AIStreamOptions): Promise<ReadableStream<string>> {
    const { messages, temperature = 0.7, maxTokens } = options

    const config: Record<string, unknown> = {
      messages,
      temperature,
      stream: true,
    }

    // 只在明确指定 maxTokens 时才添加
    if (maxTokens !== undefined) {
      config.max_tokens = maxTokens
    }

    const stream = await this.ai.run(this.model, config)

    let fullText = ''

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.response || ''
            
            if (content) {
              fullText += content
              options.onChunk?.(content)
              controller.enqueue(content)
            }
          }

          options.onComplete?.(fullText)
          controller.close()
        } catch (error) {
          options.onError?.(error instanceof Error ? error : new Error('Stream error'))
          controller.error(error)
        }
      },
    })
  }

  getMessageFormat(): 'openai' | 'anthropic' {
    return 'openai'
  }
}

/**
 * 自定义厂商客户端（支持 OpenAI 和 Anthropic 消息格式）
 */
export class CustomProviderClient implements AIClient {
  private apiKey: string
  private model: string
  private baseURL: string
  private messageFormat: 'openai' | 'anthropic'

  constructor(
    apiKey: string,
    model: string,
    baseURL: string,
    messageFormat: 'openai' | 'anthropic' = 'openai'
  ) {
    this.apiKey = apiKey
    this.model = model
    this.baseURL = baseURL
    this.messageFormat = messageFormat
  }

  async chat(options: AIStreamOptions): Promise<string> {
    const { messages, temperature = 0.7, maxTokens } = options

    if (this.messageFormat === 'anthropic') {
      // 使用 Anthropic 消息格式
      return this.chatAnthropic(messages, temperature, maxTokens, options)
    } else {
      // 使用 OpenAI 消息格式
      return this.chatOpenAI(messages, temperature, maxTokens, options)
    }
  }

  private async chatOpenAI(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number | undefined,
    options: AIStreamOptions
  ): Promise<string> {
    try {
      // 检查是否是 OpenRouter
      const isOpenRouter = this.baseURL.includes('openrouter.ai')
      // 检查是否支持 response_format（只有 OpenAI 官方支持）
      const supportsResponseFormat = this.baseURL.includes('api.openai.com')

      // 构建请求体
      const requestBody: Record<string, unknown> = {
        model: this.model,
        messages,
        temperature,
      }

      // 只在明确指定 maxTokens 时才添加
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens
      }

      // 添加 response_format（仅 OpenAI 官方支持）
      if (options.responseFormat && supportsResponseFormat) {
        if (options.responseFormat.type === 'json_schema' && options.responseFormat.schema) {
          requestBody.response_format = {
            type: 'json_schema',
            json_schema: options.responseFormat.schema,
          }
        } else if (options.responseFormat.type === 'json_object') {
          requestBody.response_format = { type: 'json_object' }
        }
      }

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      }

      // OpenRouter 需要特殊的请求头
      if (isOpenRouter) {
        headers['HTTP-Referer'] = 'https://ai-learning-platform.com'
        headers['X-Title'] = 'AI Learning Platform'
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
        const errorMessage = errorData.error?.message || response.statusText
        throw new Error(`AI API 错误 (${this.model}): ${errorMessage}`)
      }

      const data = await response.json() as {
        choices: Array<{
          message: {
            content: string
          }
        }>
      }
      return data.choices[0].message.content
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  private async chatAnthropic(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number | undefined,
    options: AIStreamOptions
  ): Promise<string> {
    try {
      // 提取 system 消息
      const systemMessage = messages.find(m => m.role === 'system')?.content
      const conversationMessages = messages.filter(m => m.role !== 'system')

      // 构建请求体
      const requestBody: Record<string, unknown> = {
        model: this.model,
        messages: conversationMessages,
        system: systemMessage,
        temperature,
      }

      // 只在明确指定 maxTokens 时才添加
      if (maxTokens !== undefined) {
        requestBody.max_tokens = maxTokens
      }

      // 添加 tools（用于约束输出格式）
      if (options.tools && options.tools.length > 0) {
        requestBody.tools = options.tools
        requestBody.tool_choice = { type: 'tool', name: options.tools[0].name }
      }

      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
        const errorMessage = errorData.error?.message || response.statusText
        throw new Error(`AI API 错误 (${this.model}): ${errorMessage}`)
      }

      const data = await response.json() as {
        content: Array<{
          type: string
          text?: string
          name?: string
          input?: Record<string, unknown>
        }>
      }

      // 如果使用了 tool call，返回 tool 的 input（JSON 格式）
      if (options.tools && options.tools.length > 0) {
        const toolUse = data.content.find(c => c.type === 'tool_use')
        if (toolUse && toolUse.input) {
          return JSON.stringify(toolUse.input)
        }
      }

      // 否则返回普通文本
      const textContent = data.content.find(c => c.type === 'text')
      return textContent?.text || ''
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  async chatStream(options: AIStreamOptions): Promise<ReadableStream<string>> {
    const { messages, temperature = 0.7, maxTokens } = options

    if (this.messageFormat === 'anthropic') {
      // 使用 Anthropic 消息格式
      return this.chatStreamAnthropic(messages, temperature, maxTokens, options)
    } else {
      // 使用 OpenAI 消息格式
      return this.chatStreamOpenAI(messages, temperature, maxTokens, options)
    }
  }

  private async chatStreamOpenAI(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number | undefined,
    options: AIStreamOptions
  ): Promise<ReadableStream<string>> {
    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature,
      stream: true,
    }

    // 只在明确指定 maxTokens 时才添加
    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || response.statusText
      throw new Error(`AI API 错误 (${this.model}): ${errorMessage}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              options.onComplete?.(fullText)
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  continue
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices[0]?.delta?.content || ''
                  
                  if (content) {
                    fullText += content
                    options.onChunk?.(content)
                    controller.enqueue(content)
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          options.onError?.(error instanceof Error ? error : new Error('Stream error'))
          controller.error(error)
        }
      },
    })
  }

  private async chatStreamAnthropic(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number | undefined,
    options: AIStreamOptions
  ): Promise<ReadableStream<string>> {
    const systemMessage = messages.find(m => m.role === 'system')?.content
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages: conversationMessages,
      system: systemMessage,
      temperature,
      stream: true,
    }

    // 只在明确指定 maxTokens 时才添加
    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens
    }

    const response = await fetch(`${this.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || response.statusText
      throw new Error(`AI API 错误 (${this.model}): ${errorMessage}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let fullText = ''

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              options.onComplete?.(fullText)
              controller.close()
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                try {
                  const parsed = JSON.parse(data)
                  
                  if (parsed.type === 'content_block_delta') {
                    const content = parsed.delta?.text || ''
                    
                    if (content) {
                      fullText += content
                      options.onChunk?.(content)
                      controller.enqueue(content)
                    }
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          options.onError?.(error instanceof Error ? error : new Error('Stream error'))
          controller.error(error)
        }
      },
    })
  }

  getMessageFormat(): 'openai' | 'anthropic' {
    return this.messageFormat
  }
}

/**
 * 创建 AI 客户端
 */
export function createAIClient(config: {
  provider: AIProvider
  apiKey?: string
  model?: string
  baseURL?: string
  ai?: any
  messageFormat?: 'openai' | 'anthropic' // 消息格式（用于自定义厂商）
}): AIClient {
  const { provider, apiKey, model, baseURL, ai, messageFormat = 'openai' } = config

  switch (provider) {
    case 'openai':
      if (!apiKey) throw new Error('OpenAI API key is required')
      return new OpenAIClient(apiKey, model, baseURL)
    
    case 'deepseek':
      if (!apiKey) throw new Error('DeepSeek API key is required')
      // DeepSeek 使用自定义 baseURL 或默认的 DeepSeek API
      if (baseURL) {
        return new OpenAIClient(apiKey, model, baseURL)
      }
      return new DeepSeekClient(apiKey, model)
    
    case 'gemini':
      if (!apiKey) throw new Error('Gemini API key is required')
      return new GeminiClient(apiKey, model)
    
    case 'claude':
      if (!apiKey) throw new Error('Claude API key is required')
      return new ClaudeClient(apiKey, model)
    
    case 'cloudflare':
      if (!ai) throw new Error('Cloudflare AI binding is required')
      return new CloudflareAIClient(ai, model)
    
    case 'custom':
      // 自定义厂商：使用 CustomProviderClient，支持不同的消息格式
      if (!apiKey) throw new Error('API key is required for custom provider')
      if (!baseURL) throw new Error('Base URL is required for custom provider')
      return new CustomProviderClient(apiKey, model || 'default', baseURL, messageFormat)
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }
}
