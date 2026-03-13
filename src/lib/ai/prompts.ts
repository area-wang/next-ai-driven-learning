/**
 * AI 提示词模板
 * 用于生成学习计划、大纲、内容和测试题
 */

export interface LearningPlanInput {
  topic: string
  goal?: string
  level?: 'beginner' | 'intermediate' | 'advanced' // 改为可选
  additionalContext?: string // 添加补充描述
  duration?: string
}

export interface OutlineInput {
  topic: string
  goal?: string
  level?: 'beginner' | 'intermediate' | 'advanced' // 改为可选
  additionalContext?: string // 添加补充描述
  depth?: number // 新增：大纲层级深度（1-3）
}

export interface ContentInput {
  topic: string
  outlineItem: string
  level?: 'beginner' | 'intermediate' | 'advanced' // 改为可选
}

export interface TestQuestionsInput {
  topic: string
  planTopic?: string // 学习计划主题
  planGoal?: string // 学习计划目标
  currentContent?: string // 当前章节内容
  additionalContext?: string // 用户自定义描述
  difficulty?: 'easy' | 'medium' | 'hard' // 改为可选
  questionCount: number
  questionTypes: string[]
}

/**
 * 生成学习计划的提示词
 */
export function generateLearningPlanPrompt(input: LearningPlanInput): string {
  const { topic, goal, level, additionalContext, duration } = input

  // 构建难度级别说明（如果提供了）
  const levelText = level 
    ? `难度级别：${level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}`
    : ''

  return `你是一位专业的学习规划师。请为以下主题创建一个详细的学习计划：

主题：${topic}
${goal ? `学习目标：${goal}` : ''}
${levelText}
${additionalContext ? `补充要求：${additionalContext}` : ''}
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
  const { topic, goal, level, additionalContext, depth = 2 } = input

  // 根据层级深度生成不同的说明
  let depthInstruction = ''
  if (depth === 1) {
    depthInstruction = `
**【层级要求】**
- 只生成 1 级大纲（主章节）
- 不要生成 children 子章节
- 每个章节应该是独立的主题模块`
  } else if (depth === 2) {
    depthInstruction = `
**【层级要求】**
- 生成 2 级大纲（主章节 + 子章节）
- 每个主章节下可以有多个子章节
- 子章节不再有 children`
  } else if (depth === 3) {
    depthInstruction = `
**【层级要求】**
- 生成 3 级大纲（主章节 + 子章节 + 细节章节）
- 主章节下有子章节，子章节下可以有细节章节
- 最多 3 层嵌套`
  }

  // 构建难度级别说明（如果提供了）
  const levelText = level 
    ? `难度级别：${level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}`
    : ''

  return `你是一位专业的课程设计师。请为以下主题创建一个详细的学习大纲：

主题：${topic}
${goal ? `学习目标：${goal}` : ''}
${levelText}
${additionalContext ? `补充要求：${additionalContext}` : ''}
${depthInstruction}

请生成一个层次化的学习大纲，包括：
1. 主要章节和子章节
2. 每个章节的学习要点
3. 预计学习时间
4. 前置知识要求
5. **【必须】在大纲的最后添加一个"学习指南"章节**

**【学习指南章节要求】**
- 标题必须是："学习指南"
- 描述：简要说明这是一个学习路径和资源指南
- 必须包含以下子章节：
  1. **学习路径规划**：
     - 描述：详细的学习路径，从入门到精通的完整路线
     - 包含：推荐的学习顺序、每个阶段的重点、学习建议
  2. **学习资源推荐**：
     - 描述：精选的学习资源列表
     - 包含：官方文档、在线课程、书籍推荐、实战项目、社区资源等
     - 每个资源需要说明适合的学习阶段和推荐理由
  3. **学习方法建议**：
     - 描述：高效的学习方法和技巧
     - 包含：如何做笔记、如何实践、如何解决问题、如何保持学习动力等

**【重要】JSON 格式要求：**
1. 必须返回有效的 JSON 格式，不要包含任何其他文本
2. 不要使用 Markdown 代码块标记（\`\`\`json）
3. 字符串中的特殊字符必须转义：
   - 双引号使用 \\" 转义
   - 反斜杠使用 \\\\ 转义
   - 换行符使用 \\n 转义
4. 所有字符串值必须用双引号包裹
5. 数组最后一个元素后不要有逗号
6. 对象最后一个属性后不要有逗号

请严格按照以下 JSON 格式返回：
{
  "outline": [
    {
      "title": "章节标题",
      "description": "章节描述",
      "estimatedTime": "60",
      "prerequisites": ["前置知识1"],
      "children": [
        {
          "title": "子章节标题",
          "description": "子章节描述",
          "estimatedTime": "30"
        }
      ]
    },
    {
      "title": "学习指南",
      "description": "学习路径规划和资源推荐",
      "estimatedTime": "30",
      "children": [
        {
          "title": "学习路径规划",
          "description": "从入门到精通的完整学习路线",
          "estimatedTime": "10"
        },
        {
          "title": "学习资源推荐",
          "description": "精选的学习资源列表，包含官方文档、课程、书籍等",
          "estimatedTime": "10"
        },
        {
          "title": "学习方法建议",
          "description": "高效的学习方法和技巧",
          "estimatedTime": "10"
        }
      ]
    }
  ]
}

注意：
- estimatedTime 必须是纯数字字符串（如 "60"），不要包含单位
- 如果没有前置知识，prerequisites 可以是空数组 []
- 如果没有子章节，children 可以省略或为空数组 []
- 严格遵守层级要求，不要超过指定的层级深度
- **【必须】"学习指南"章节必须放在大纲的最后**`
}

/**
 * 生成知识内容的提示词
 */
export function generateContentPrompt(input: ContentInput): string {
  const { topic, outlineItem, level } = input

  // 构建难度级别说明（如果提供了）
  const levelText = level 
    ? `难度级别：${level === 'beginner' ? '初级' : level === 'intermediate' ? '中级' : '高级'}`
    : ''

  return `你是一位专业的教育内容创作者,你精通各种领域的知识，请为以下主题创建详细的学习内容：

主题：${topic}
章节：${outlineItem}
${levelText}

**【重要】返回格式要求：**

你必须严格按照以下格式返回，否则系统无法解析：

1. **直接返回纯 JSON 对象**
2. **第一个字符必须是 {**
3. **最后一个字符必须是 }**
4. **绝对不要使用 \`\`\`json 或 \`\`\` 包裹**
5. **不要添加任何解释性文字**

JSON 对象必须包含两个字段：
- content: 完整的学习内容（Markdown 格式字符串）
- summary: 结构化的文档摘要（JSON 对象）

正确的输出示例（直接从 { 开始）：

{
  "content": "完整的 Markdown 格式学习内容",
  "summary": {
    "topic": "文档主题",
    "userQuery": "用户的原始问题或需求",
    "outline": [
      {
        "title": "章节标题",
        "level": 2,
        "summary": "该章节的核心内容总结（50-100字）",
        "format": {
          "titleLevel": "##",
          "hasCodeBlocks": true,
          "codeLanguages": ["python"],
          "hasLists": true,
          "listStyle": "使用 - 开头，标题加粗",
          "hasTables": false,
          "hasImages": false,
          "hasFormulas": false
        }
      },
      ......
    ]
  }
}


**【学习内容要求】**
1. 概念解释（清晰易懂）
2. 实例演示（具体案例）
3. 关键要点总结
4. 常见误区提醒
5. 实践建议

**【摘要要求】**
摘要必须是结构化的 JSON 对象，包含以下字段：

1. **topic**（字符串）：文档的主题
2. **userQuery**（字符串）：用户的原始问题或需求
3. **outline**（数组）：文档大纲，每个章节包含：
   - title: 章节标题
   - level: 标题层级（2 表示 ##，3 表示 ###）
   - summary: 该章节的核心内容总结（50-100字）
   - format: 该章节使用的格式（对象）
     * titleLevel: 该章节的标题层级（如 "##"）
     * hasCodeBlocks: 该章节是否包含代码块
     * codeLanguages: 该章节使用的编程语言（如 ["python"]）
     * hasLists: 该章节是否包含列表
     * listStyle: 该章节列表的格式风格（如"使用 - 开头，标题加粗"）
     * hasTables: 该章节是否包含表格
     * hasImages: 该章节是否包含图片
     * hasFormulas: 该章节是否包含数学公式

**【摘要的作用】**
这个摘要将用于后续的 AI 斜杠指令（/ai），AI 会根据每个章节的 format 信息生成格式一致的内容，确保整篇文档的风格统一。

**【重要】内容格式要求：**

**第一步：判断主题类型**
- 请先判断这个主题是否属于编程、开发、技术类主题
- 如果是编程/技术类主题（如编程语言、框架、算法、数据库等），使用"编程主题格式"
- 如果不是编程/技术类主题（如历史、文学、艺术、商业、语言学习等），使用"通用主题格式"

**编程主题格式（仅编程/技术类主题使用）：**

1. **代码块格式规则（三个反引号）**
   - **只用于完整的代码示例**，必须是多行的、可运行的代码
   - 代码块必须指定语言：\`\`\`python、\`\`\`javascript、\`\`\`typescript 等
   - 代码块必须独立成段，前后要有空行
   - **绝对禁止在以下场景使用代码块：**
     * 列表项中（无论是标题还是内容）
     * 标题中
     * 段落文本中
     * 表格单元格中
   
   ✅ 正确示例（完整代码）：
   \`\`\`python
   def calculate_sum(a, b):
       return a + b
   
   result = calculate_sum(5, 3)
   print(result)
   \`\`\`
   
   ❌ 错误示例：
   - \`\`\`局部作用域(Local)\`\`\`：这是错误的！
   - \`\`\`def hello()\`\`\`：这也是错误的！

2. **行内代码格式规则（单个反引号）**
   - 用于变量名、函数名、关键字、API 名称等
   - 用于列表项中的技术术语
   - 用于段落中的代码片段（单个词或短语）
   
   ✅ 正确示例：
   - **局部作用域(Local)**：在函数内部使用 \`let\` 或 \`const\` 定义的变量
   - **全局作用域(Global)**：在函数外部定义的变量，使用 \`var\` 关键字
   - 使用 \`print()\` 函数输出内容
   - Python 中的 \`list\` 和 \`tuple\` 是常用的数据结构
   
   ❌ 错误示例：
   - \`\`\`局部作用域(Local)\`\`\`：不要用代码块！
   - \`\`\`print()\`\`\`：不要用代码块！

3. **列表格式规则**
   - 列表项使用 - 或 * 开头
   - 列表项标题使用 **粗体** 强调
   - 列表项中的技术术语使用 \`行内代码\`（单个反引号）
   - **绝对不要在列表项中使用代码块（三个反引号）**
   
   ✅ 正确示例：
   - **变量声明**：使用 \`let\` 声明块级作用域变量
   - **函数定义**：使用 \`function\` 关键字或箭头函数 \`=>\`
   - **数据类型**：JavaScript 有 \`string\`、\`number\`、\`boolean\` 等基本类型
   
   ❌ 错误示例：
   - \`\`\`变量声明\`\`\`：使用 let 声明变量
   - **函数定义**：\`\`\`function hello() {}\`\`\`

**【格式检查清单（编程主题）】**
在生成内容前，请确认：
- [ ] 列表项中没有使用代码块（三个反引号）
- [ ] 标题中没有使用任何代码格式
- [ ] 代码块只用于完整的、多行的代码示例
- [ ] 技术术语使用行内代码（单个反引号）
- [ ] 代码块前后都有空行

**通用主题格式（非编程/技术类主题使用）：**

1. **强调格式**
   - 使用 **文本** 表示加粗（用于重要概念、术语、关键点）
   - 使用 *文本* 表示斜体（用于强调、引用）
   - 可以适度使用 \`术语\` 表示专业术语或关键词（但不要过度使用）

2. **列表格式规则**
   - 列表项使用 - 或 * 开头
   - 列表项标题使用 **粗体** 强调
   - 保持列表简洁清晰
   
   ✅ 正确示例：
   - **核心概念**：这是一个重要的理论基础
   - **实践方法**：通过具体案例来理解概念
   - **注意事项**：需要特别关注的要点

3. **避免过度使用代码格式**
   - **不要使用代码块（三个反引号）**
   - 只在必要时使用行内代码格式标记专业术语
   - 普通文本、概念、理论不需要代码格式

**【通用格式要求（所有主题）】**

1. **标题层级**
   - 使用 ## 作为主标题
   - 使用 ### 作为子标题
   - 不要使用 # 一级标题
   - 标题中不要使用任何代码格式
   
   ✅ 正确示例：
   ## 核心概念
   ### 基本原理
   
   ❌ 错误示例：
   ## \`核心概念\`

2. **段落格式**
   - 段落之间用空行分隔
   - 不要使用过多的空行
   - 语言通俗易懂，循序渐进

3. **内容组织**
   - 由浅入深，循序渐进
   - 每个概念都要有实例说明
   - 理论与实践相结合
   - 提供具体的应用场景



`
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
 * 生成 /AI 指令的提示词
 */
export interface AIGenerateInput {
  prompt: string
  context?: string
  documentTitle?: string // 当前文档标题
  planTopic?: string // 学习计划主题
  documentSummary?: any // 结构化的文档摘要（JSON）
}

export function generateAICommandPrompt(input: AIGenerateInput): string {
  const { prompt, context, documentTitle, planTopic, documentSummary } = input
  
  if (documentSummary) {
    // 使用结构化摘要
    return `你是一个专业的教育内容生成助手。

${planTopic ? `学习计划主题: ${planTopic}` : ''}
当前文档标题: ${documentTitle || "未指定"}

**【当前文档摘要】**
以下是当前文档的结构化摘要（JSON 格式），包含文档主题、大纲和每个章节的格式信息：

${JSON.stringify(documentSummary, null, 2)}

**【重要说明】**
- 上述摘要描述了当前文档的结构和格式风格
- 每个章节的 format 字段记录了该章节使用的格式（标题层级、代码块、列表等）
- 生成新内容时，请参考摘要中的格式信息，保持与现有内容的风格一致
${planTopic ? `- 生成的内容应该与学习计划主题"${planTopic}"相关，确保内容的连贯性和关联性` : ''}

用户请求: ${prompt}

请生成高质量的教育内容，符合以下要求：
1. 内容应该清晰、结构化、易于理解
2. 参考文档摘要中的格式信息，保持格式风格一致
3. 包含具体的例子和解释
4. 内容应该与当前文档主题相关${planTopic ? `，并与学习计划主题"${planTopic}"保持关联` : ''}
5. 使用 Markdown 格式

请直接返回生成的内容，不需要额外的说明。`
  } else {
    // 使用普通文本上下文
    return `你是一个专业的教育内容生成助手。

${planTopic ? `学习计划主题: ${planTopic}` : ''}
当前文档标题: ${documentTitle || "未指定"}

当前编辑器内容: ${context || "无"}

用户请求: ${prompt}

请生成高质量的教育内容，符合以下要求：
1. 内容应该清晰、结构化、易于理解
2. 使用适当的标题、列表和其他符合内容的排版格式
3. 有些内容可以包含具体的例子和解释
4. 内容应该与当前文档相关${planTopic ? `，并与学习计划主题"${planTopic}"保持关联` : ''}
5. 使用 Markdown 格式

请直接返回生成的内容，不需要额外的说明。`
  }
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

  // 构建难度说明（如果提供了）
  const difficultyText = difficulty ? `难度级别：${difficultyMap[difficulty]}` : ''

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
    // 尝试解析为 JSON 摘要
    try {
      const summary = JSON.parse(currentContent)
      contextInfo += `\n当前文档摘要（JSON格式）：\n${JSON.stringify(summary, null, 2)}`
    } catch {
      // 如果不是 JSON，提取纯文本，限制长度
      const plainText = currentContent.replace(/<[^>]*>/g, '').substring(0, 500)
      contextInfo += `\n当前章节内容摘要：${plainText}`
    }
  }
  if (additionalContext) {
    contextInfo += `\n补充说明：${additionalContext}`
  }

  return `你是一位专业的教育评估专家。请为以下主题生成测试题。
${contextInfo}

测试题主题：${topic}
${difficultyText}
题目数量：${questionCount}
题型：${typeDescriptions}

请生成 ${questionCount} 道高质量的测试题，要求：
1. 题目必须紧密围绕"${topic}"这个主题，不要偏离主题
2. 如果提供了学习计划信息，题目应该与学习计划的主题和目标相关
3. 如果提供了当前章节内容，题目应该基于该内容出题
4. ${additionalContext ? `特别注意用户的补充说明："${additionalContext}"，确保生成的题目符合这些要求` : '题目清晰明确，考察核心知识点'}
5. 答案准确无误，包含详细解析
6. **【重要】只能生成以下题型：${typeDescriptions}。严格按照这些题型生成，不要生成其他题型！**
7. **【重要】如果用户选择了多选题（multiple-choice），必须生成多选题，不要全部生成单选题！**
8. 题型分布尽量均匀，每种题型都要有
9. 避免重复或相似的题目

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
