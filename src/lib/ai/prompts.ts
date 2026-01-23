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

export interface TestQuestionsInput {
  topic: string
  planTopic?: string // 学习计划主题
  planGoal?: string // 学习计划目标
  currentContent?: string // 当前章节内容
  additionalContext?: string // 用户自定义描述
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  questionTypes: string[]
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


/**
 * 生成测试题的提示词（批量生成）
 */
export function generateTestQuestionsPrompt(input: TestQuestionsInput): string {
  const { topic, planTopic, planGoal, currentContent, additionalContext, difficulty, questionCount, questionTypes } = input

  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }

  const typeMap: Record<string, string> = {
    choice: '单选题',
    'multiple-choice': '多选题',
    'true-false': '判断题',
    fill: '填空题',
    short: '简答题',
    essay: '论述题',
    code: '编程题',
    matching: '匹配题',
    ordering: '排序题',
  }

  const typeDescriptions = questionTypes.map(t => typeMap[t] || t).join('、')

  // 构建上下文信息
  let contextInfo = ''
  if (planTopic) {
    contextInfo += `\n学习计划主题：${planTopic}`
  }
  if (planGoal) {
    contextInfo += `\n学习目标：${planGoal}`
  }
  if (currentContent) {
    // 提取纯文本，限制长度
    const plainText = currentContent.replace(/<[^>]*>/g, '').substring(0, 500)
    contextInfo += `\n当前章节内容摘要：${plainText}`
  }
  if (additionalContext) {
    contextInfo += `\n补充说明：${additionalContext}`
  }

  return `你是一位专业的教育评估专家。请为以下主题生成测试题。
${contextInfo}

测试题主题：${topic}
难度级别：${difficultyMap[difficulty]}
题目数量：${questionCount}
题型：${typeDescriptions}

请生成 ${questionCount} 道高质量的测试题，要求：
1. 题目必须紧密围绕"${topic}"这个主题，不要偏离主题
2. 如果提供了学习计划信息，题目应该与学习计划的主题和目标相关
3. 如果提供了当前章节内容，题目应该基于该内容出题
4. ${additionalContext ? `特别注意用户的补充说明："${additionalContext}"，确保生成的题目符合这些要求` : '题目清晰明确，考察核心知识点'}
5. 难度适中，符合指定的难度级别
6. 答案准确无误，包含详细解析
7. **【重要】只能生成以下题型：${typeDescriptions}。严格按照这些题型生成，不要生成其他题型！**
8. **【重要】如果用户选择了多选题（multiple-choice），必须生成多选题，不要全部生成单选题！**
9. 题型分布尽量均匀，每种题型都要有
10. 避免重复或相似的题目

**【重要】题目格式规则：**

1. **题目描述与选项分离**
   - 题目描述中不要包含选项内容
   - 题目描述只包含问题本身
   - 选项单独放在 options 数组中

2. **代码格式处理**
   - 如果题目包含代码，使用 Markdown 代码块格式
   - 格式：\`\`\`语言名\n代码内容\n\`\`\`
   - 代码可以在题目中，也可以在答案或解析中

3. **避免领域偏见**
   - 不要因为示例是某个领域就只生成该领域的题目
   - 根据用户指定的主题生成相关题目
   - 题目应该多样化，覆盖不同知识点

重要：必须返回有效的 JSON 格式，不要包含任何其他文本或说明。

JSON 格式必须如下所示（严格遵循）：
\`\`\`json
{
  "questions": [
    {
      "question": "题目内容",
      "type": "choice",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "正确答案",
      "explanation": "答案解析"
    },
    {
      "question": "题目内容",
      "type": "multiple-choice",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "A, C",
      "explanation": "答案解析（多选题答案用逗号分隔）"
    },
    {
      "question": "题目内容",
      "type": "true-false",
      "options": ["对", "错"],
      "answer": "对",
      "explanation": "答案解析"
    },
    {
      "question": "题目内容",
      "type": "fill",
      "answer": "答案",
      "explanation": "解析"
    },
    {
      "question": "题目内容",
      "type": "short",
      "answer": "答案",
      "explanation": "解析"
    },
    {
      "question": "题目内容",
      "type": "essay",
      "answer": "参考答案",
      "explanation": "评分要点"
    },
    {
      "question": "题目内容",
      "type": "code",
      "answer": "代码答案",
      "explanation": "解析"
    },
    {
      "question": "题目内容",
      "type": "matching",
      "options": ["A. 项目1", "B. 项目2", "C. 项目3", "1. 匹配项1", "2. 匹配项2", "3. 匹配项3"],
      "answer": "A-1, B-3, C-2",
      "explanation": "匹配说明"
    },
    {
      "question": "题目内容",
      "type": "ordering",
      "options": ["A. 步骤1", "B. 步骤2", "C. 步骤3", "D. 步骤4"],
      "answer": "C, A, D, B",
      "explanation": "排序说明"
    }
  ]
}
\`\`\`

题型说明：
- choice: 单选题（只能选一个答案）
- multiple-choice: 多选题（可以选多个答案，答案用逗号分隔）
- true-false: 判断题（对/错）
- fill: 填空题（简短答案）
- short: 简答题（需要简要说明）
- essay: 论述题（需要详细阐述）
- code: 编程题（需要写代码）
- matching: 匹配题（将左侧项目与右侧项目匹配）
- ordering: 排序题（将选项按正确顺序排列）

只返回 JSON，不要返回其他内容。`
}
