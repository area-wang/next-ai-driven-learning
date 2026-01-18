/**
 * AI 提示词模板
 * 用于生成学习计划、大纲、内容和测试题
 */

export interface LearningPlanInput {
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
}

export interface OutlineInput {
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

export interface ContentInput {
  topic: string
  outlineItem: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

export interface QuestionInput {
  topic: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'multiple_choice' | 'fill_blank' | 'coding' | 'essay'
}

/**
 * 生成学习计划的提示词
 */
export function generateLearningPlanPrompt(input: LearningPlanInput): string {
  const { topic, goal, level, duration } = input

  return `你是一位专业的学习规划师。请为以下主题创建一个详细的学习计划：

主题：${topic}
${goal ? `学习目标：${goal}` : ''}
难度级别：${level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}
${duration ? `预计时长：${duration}` : ''}

请生成一个结构化的学习计划，包括：
1. 学习目标和预期成果
2. 学习路径和阶段划分
3. 每个阶段的重点内容
4. 建议的学习时间分配
5. 学习资源推荐

请以 JSON 格式返回，格式如下：
{
  "title": "学习计划标题",
  "description": "学习计划描述",
  "goals": ["目标1", "目标2"],
  "phases": [
    {
      "title": "阶段标题",
      "duration": "预计时长",
      "topics": ["主题1", "主题2"],
      "resources": ["资源1", "资源2"]
    }
  ]
}`
}

/**
 * 生成学习大纲的提示词
 */
export function generateOutlinePrompt(input: OutlineInput): string {
  const { topic, goal, level } = input

  return `你是一位专业的课程设计师。请为以下主题创建一个详细的学习大纲：

主题：${topic}
${goal ? `学习目标：${goal}` : ''}
难度级别：${level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}

请生成一个层次化的学习大纲，包括：
1. 主要章节和子章节
2. 每个章节的学习要点
3. 预计学习时间
4. 前置知识要求

请以 JSON 格式返回，格式如下：
{
  "outline": [
    {
      "title": "章节标题",
      "description": "章节描述",
      "estimatedTime": "预计时长（分钟）",
      "prerequisites": ["前置知识1"],
      "children": [
        {
          "title": "子章节标题",
          "description": "子章节描述",
          "estimatedTime": "预计时长（分钟）"
        }
      ]
    }
  ]
}`
}

/**
 * 生成知识内容的提示词
 */
export function generateContentPrompt(input: ContentInput): string {
  const { topic, outlineItem, level } = input

  return `你是一位专业的教育内容创作者。请为以下主题创建详细的学习内容：

主题：${topic}
章节：${outlineItem}
难度级别：${level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}

请生成富文本格式的学习内容，包括：
1. 概念解释（清晰易懂）
2. 实例演示（具体案例）
3. 关键要点总结
4. 常见误区提醒
5. 实践建议

内容要求：
- 使用 Markdown 格式
- **代码必须使用代码块格式**：使用三个反引号包裹，并指定语言，例如：
  \`\`\`python
  def hello():
      print("Hello, World!")
  \`\`\`
- **禁止使用行内代码**：不要使用单个反引号包裹多行代码
- 代码块必须指定语言（python, javascript, typescript, java, go, rust 等）
- 使用图表说明（用 Mermaid 语法）
- 循序渐进，由浅入深
- 语言通俗易懂

请直接返回 Markdown 格式的内容。`
}

/**
 * 生成测试题的提示词
 */
export function generateQuestionPrompt(input: QuestionInput): string {
  const { topic, content, difficulty, questionType } = input

  const typeMap = {
    multiple_choice: '选择题',
    fill_blank: '填空题',
    coding: '编程题',
    essay: '简答题',
  }

  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }

  return `你是一位专业的教育评估专家。请基于以下内容生成测试题：

主题：${topic}
内容摘要：${content.slice(0, 500)}...
题型：${typeMap[questionType]}
难度：${difficultyMap[difficulty]}

请生成 3-5 道高质量的测试题，要求：
1. 题目清晰明确
2. 考察核心知识点
3. 难度适中
4. 答案准确无误
5. 包含详细解析

请以 JSON 格式返回，格式如下：
{
  "questions": [
    {
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"], // 仅选择题需要
      "correctAnswer": "正确答案",
      "explanation": "答案解析"
    }
  ]
}`
}

/**
 * 生成费曼讲解分析的提示词
 */
export function generateFeynmanAnalysisPrompt(topic: string, explanation: string): string {
  return `你是一位专业的学习评估专家。请分析以下费曼讲解的质量：

主题：${topic}
学生讲解：
${explanation}

请从以下维度评估：
1. 概念理解准确性（0-25分）
2. 解释清晰度（0-25分）
3. 逻辑连贯性（0-25分）
4. 语言简化程度（0-25分）

请以 JSON 格式返回，格式如下：
{
  "score": 总分（0-100）,
  "analysis": {
    "accuracy": { "score": 分数, "feedback": "反馈" },
    "clarity": { "score": 分数, "feedback": "反馈" },
    "logic": { "score": 分数, "feedback": "反馈" },
    "simplicity": { "score": 分数, "feedback": "反馈" }
  },
  "suggestions": ["改进建议1", "改进建议2"],
  "strengths": ["优点1", "优点2"]
}`
}
