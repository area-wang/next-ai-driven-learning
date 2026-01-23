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
}

export interface AIClient {
  chat(options: AIStreamOptions): Promise<string>
  chatStream(options: AIStreamOptions): Promise<ReadableStream<string>>
}

export type AIProvider = 'openai' | 'deepseek' | 'gemini' | 'claude' | 'cloudflare'

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
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

    try {
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

      // 使用 fetch 的 headers 选项，不使用 Headers 构造函数
      // 这样可以避免浏览器自动添加某些请求头
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: headersObj,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
        const errorMessage = errorData.error?.message || response.statusText
        throw new Error(`OpenAI API error: ${errorMessage}`)
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
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

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

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: headersObj,
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || response.statusText
      throw new Error(`OpenAI API error: ${errorMessage}`)
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
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

    try {
      // 转换消息格式
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))

      const systemInstruction = messages.find(m => m.role === 'system')?.content

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
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
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
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const systemInstruction = messages.find(m => m.role === 'system')?.content

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
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
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
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

    try {
      // 提取 system 消息
      const systemMessage = messages.find(m => m.role === 'system')?.content
      const conversationMessages = messages.filter(m => m.role !== 'system')

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          messages: conversationMessages,
          system: systemMessage,
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const data = await response.json() as {
        content: Array<{ text: string }>
      }
      return data.content[0].text
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  async chatStream(options: AIStreamOptions): Promise<ReadableStream<string>> {
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

    const systemMessage = messages.find(m => m.role === 'system')?.content
    const conversationMessages = messages.filter(m => m.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        messages: conversationMessages,
        system: systemMessage,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
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
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

    try {
      const response = await this.ai.run(this.model, {
        messages,
        temperature,
        max_tokens: maxTokens,
      })

      return response.response || ''
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  async chatStream(options: AIStreamOptions): Promise<ReadableStream<string>> {
    const { messages, temperature = 0.7, maxTokens = 2000 } = options

    const stream = await this.ai.run(this.model, {
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    })

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
}): AIClient {
  const { provider, apiKey, model, baseURL, ai } = config

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
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}`)
  }
}
