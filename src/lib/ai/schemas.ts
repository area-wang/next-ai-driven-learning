/**
 * AI Structured Output Schemas
 * 定义各种 AI 输出的 JSON Schema 和 Tool 定义
 */

/**
 * 学习内容生成的 JSON Schema（用于 OpenAI）
 */
export const learningContentSchema = {
  name: 'learning_content_response',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Markdown 格式的学习内容',
      },
      summary: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: '文档主题',
          },
          userQuery: {
            type: 'string',
            description: '用户的原始问题或需求',
          },
          outline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: '章节标题',
                },
                level: {
                  type: 'number',
                  description: '标题层级（2 表示 ##，3 表示 ###）',
                },
                summary: {
                  type: 'string',
                  description: '该章节的核心内容总结',
                },
                format: {
                  type: 'object',
                  properties: {
                    titleLevel: {
                      type: 'string',
                      description: '标题层级标记（如 "##"）',
                    },
                    hasCodeBlocks: {
                      type: 'boolean',
                      description: '是否包含代码块',
                    },
                    codeLanguages: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      description: '使用的编程语言列表',
                    },
                    hasLists: {
                      type: 'boolean',
                      description: '是否包含列表',
                    },
                    listStyle: {
                      type: 'string',
                      description: '列表格式风格',
                    },
                    hasTables: {
                      type: 'boolean',
                      description: '是否包含表格',
                    },
                    hasImages: {
                      type: 'boolean',
                      description: '是否包含图片',
                    },
                    hasFormulas: {
                      type: 'boolean',
                      description: '是否包含数学公式',
                    },
                  },
                  required: [
                    'titleLevel',
                    'hasCodeBlocks',
                    'codeLanguages',
                    'hasLists',
                    'listStyle',
                    'hasTables',
                    'hasImages',
                    'hasFormulas',
                  ],
                  additionalProperties: false,
                },
              },
              required: ['title', 'level', 'summary', 'format'],
              additionalProperties: false,
            },
          },
        },
        required: ['topic', 'userQuery', 'outline'],
        additionalProperties: false,
      },
    },
    required: ['content', 'summary'],
    additionalProperties: false,
  },
}

/**
 * 学习内容生成的 Tool 定义（用于 Anthropic）
 */
export const learningContentTool = {
  name: 'generate_learning_content',
  description: '生成结构化的学习内容，包含 Markdown 格式的内容和文档摘要',
  input_schema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Markdown 格式的学习内容',
      },
      summary: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: '文档主题',
          },
          userQuery: {
            type: 'string',
            description: '用户的原始问题或需求',
          },
          outline: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: '章节标题',
                },
                level: {
                  type: 'number',
                  description: '标题层级（2 表示 ##，3 表示 ###）',
                },
                summary: {
                  type: 'string',
                  description: '该章节的核心内容总结',
                },
                format: {
                  type: 'object',
                  properties: {
                    titleLevel: {
                      type: 'string',
                      description: '标题层级标记（如 "##"）',
                    },
                    hasCodeBlocks: {
                      type: 'boolean',
                      description: '是否包含代码块',
                    },
                    codeLanguages: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      description: '使用的编程语言列表',
                    },
                    hasLists: {
                      type: 'boolean',
                      description: '是否包含列表',
                    },
                    listStyle: {
                      type: 'string',
                      description: '列表格式风格',
                    },
                    hasTables: {
                      type: 'boolean',
                      description: '是否包含表格',
                    },
                    hasImages: {
                      type: 'boolean',
                      description: '是否包含图片',
                    },
                    hasFormulas: {
                      type: 'boolean',
                      description: '是否包含数学公式',
                    },
                  },
                  required: [
                    'titleLevel',
                    'hasCodeBlocks',
                    'codeLanguages',
                    'hasLists',
                    'listStyle',
                    'hasTables',
                    'hasImages',
                    'hasFormulas',
                  ],
                },
              },
              required: ['title', 'level', 'summary', 'format'],
            },
          },
        },
        required: ['topic', 'userQuery', 'outline'],
      },
    },
    required: ['content', 'summary'],
  },
}
