# 测试题答题系统 - 设计文档

## Overview

实现一个沉浸式的答题系统，让用户可以在测试题文档中直接答题、提交、获得评分和反馈。系统支持多种题型，提供 AI 评估，并包含举一反三功能帮助用户深化学习。

## Architecture

### 组件架构

```
TestAnswerOverlay (答题覆盖层)
├── AnswerModeHeader (答题模式头部)
│   ├── Progress Display (进度显示)
│   ├── Start/Exit Button (开始/退出按钮)
│   └── Submit Button (提交按钮)
├── QuestionAnswerItem (题目答题项)
│   ├── Question Display (题目显示)
│   ├── Answer Input (答题输入)
│   ├── Result Display (结果显示)
│   └── Similar Question Button (举一反三按钮)
└── ResultSummary (结果汇总)
    ├── Score Display (分数显示)
    ├── Statistics (统计信息)
    └── Retry Button (重新答题按钮)
```

### 数据流

1. **进入答题模式**：解析文档内容 → 提取题目数据 → 初始化答题状态
2. **用户答题**：输入答案 → 更新本地状态 → 更新进度显示
3. **提交评估**：收集答案 → 客观题自动评分 → 主观题 AI 评估 → 保存记录 → 显示结果
4. **举一反三**：提取题目信息 → 调用 AI 生成 → 插入新题目块

## Components and Interfaces

### 1. TestAnswerOverlay 组件

**职责**：管理答题模式的整体状态和交互（右侧抽屉式）

**Props**:
```typescript
interface TestAnswerOverlayProps {
  documentContent: string  // 测试题文档的 HTML 内容
  documentId: string       // 文档 ID
  planId: string           // 学习计划 ID
  onClose: () => void      // 关闭回调
  onUpdateContent: (content: string) => void  // 内容更新回调
}
```

**State**:
```typescript
interface AnswerState {
  mode: 'answer' | 'result'            // 当前模式（移除 'view'）
  questions: ParsedQuestion[]          // 解析的题目列表
  userAnswers: Record<number, string>  // 用户答案 {题号: 答案}
  results: Record<number, QuestionResult>  // 评估结果
  isSubmitting: boolean                // 是否正在提交
  score: number                        // 总分
  drawerWidth: number                  // 抽屉宽度（400-1000px）
  isDragging: boolean                  // 是否正在拖拽调整宽度
}

interface ParsedQuestion {
  index: number
  type: 'choice' | 'fill' | 'short' | 'code'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}

interface QuestionResult {
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  score: number
  feedback?: string  // AI 评语
}
```

### 2. QuestionAnswerItem 组件

**职责**：渲染单个题目的答题界面

**Props**:
```typescript
interface QuestionAnswerItemProps {
  question: ParsedQuestion
  mode: 'answer' | 'result'
  userAnswer?: string
  result?: QuestionResult
  onAnswerChange: (answer: string) => void
  // 注意：举一反三按钮不在这里，而是在编辑器中的题目标题旁边
}
```

### 3. AnswerInput 组件

**职责**：根据题型渲染不同的输入控件

**Props**:
```typescript
interface AnswerInputProps {
  type: 'choice' | 'fill' | 'short' | 'code'
  options?: string[]
  value: string
  onChange: (value: string) => void
  disabled: boolean
}
```

**实现细节**：
- **选择题**：单选按钮组，选中时高亮显示（teal 色系），保存选项标识（A/B/C/D）
- **填空题**：单行文本输入框
- **简答题**：多行文本框（6行）
- **编程题**：代码编辑器（等宽字体，12行）

### 4. AnswerModeHeader 组件

**职责**：显示答题模式头部信息和操作按钮

**Props**:
```typescript
interface AnswerModeHeaderProps {
  mode: 'answer' | 'result'
  progress: { answered: number; total: number }
  score?: number
  correctRate?: number
  onSubmit: () => void
  onRetry: () => void
  onClose: () => void
  isSubmitting: boolean
}
```

**布局**：
- **答题模式**：进度条、已答题数、提交按钮、关闭按钮（垂直布局）
- **结果模式**：总分、正确率、通过/未通过标记、重新答题按钮、关闭按钮（垂直布局）
- 渐变背景色：答题模式（青绿色）、结果模式（绿色/红色）

### 5. SimilarQuestionButton 扩展

**职责**：Tiptap 自定义扩展，处理举一反三按钮

**配置**:
```typescript
interface SimilarQuestionButtonOptions {
  onButtonClick: (questionIndex: number) => void
}
```

**实现**：
- 使用 `addNodeView()` 自定义渲染
- 设置 `contenteditable="false"` 防止编辑
- 添加样式和 hover 动画
- 通过回调处理点击事件

## Data Models

### 题目数据结构

```typescript
interface Question {
  index: number
  type: 'choice' | 'fill' | 'short' | 'code'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}
```

### 答题记录数据结构

```typescript
interface AnswerRecord {
  id: string
  userId: string
  documentId: string
  questionIndex: number
  questionText: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  score: number
  aiFeedback?: string
  timeSpent?: number
  createdAt: Date
}
```

## Correctness Properties

### Property 1: 题目解析完整性
*For any* 测试题文档，解析后的题目数量应该等于文档中实际的题目数量
**Validates: Requirements 1.3**

### Property 2: 答案提交完整性
*For any* 答题记录，提交的答案数量应该等于或小于题目总数
**Validates: Requirements 3.1**

### Property 3: 客观题评分准确性
*For any* 选择题或填空题，如果用户答案与正确答案完全匹配，则 isCorrect 应为 true
**Validates: Requirements 3.2**

### Property 4: 进度计算准确性
*For any* 答题状态，已答题数应该等于非空答案的数量
**Validates: Requirements 5.2**

### Property 5: 举一反三题目类型一致性
*For any* 生成的相似题目，其题型应该与原题目相同
**Validates: Requirements 4.5**

## Error Handling

### 1. 题目解析失败
- **场景**：文档格式不符合预期
- **处理**：显示错误提示，禁用答题功能，提供查看原文档选项

### 2. AI 评估失败
- **场景**：API 调用失败或超时
- **处理**：显示错误提示，允许重试，提供手动评分选项

### 3. 答题记录保存失败
- **场景**：数据库连接失败
- **处理**：显示错误提示，保留用户答案在本地，提供重新保存选项

### 4. 举一反三生成失败
- **场景**：AI 生成失败或返回格式错误
- **处理**：显示错误提示，允许重试，不影响原题目显示

### 5. 选择题答案校验错误
- **场景**：保存的是选项完整文本而不是选项标识
- **修复**：修改 `AnswerInput` 组件，使用 `optionLabel`（A/B/C/D）而不是 `option`（完整文本）
- **效果**：答案校验正确，与标准答案（A/B/C/D）进行比较

### 6. 答题抽屉显示答案和解析
- **场景**：答题时能看到答案和解析
- **修复**：
  - 答题时调用 `parseQuestionsFromHTML(html, false)`，不提取答案
  - 遍历 DOM 时跳过 `<details>` 标签
  - 提交时调用 `parseQuestionsFromHTML(html, true)`，重新解析获取完整数据
- **效果**：答题时不显示答案和解析，提交后能正确评估

### 7. 打开抽屉需要点击"开始答题"按钮
- **场景**：打开答题抽屉后还需要额外点击才能开始答题
- **修复**：将初始状态从 `'view'` 改为 `'answer'`，移除查看模式
- **效果**：点击"开始答题"按钮后直接进入答题模式

## Testing Strategy

### Unit Tests
- 题目解析函数测试
- 答案匹配逻辑测试
- 进度计算函数测试
- 分数计算函数测试

### Integration Tests
- 答题流程端到端测试
- AI 评估集成测试
- 数据库保存和读取测试

### Property-Based Tests
- 题目解析属性测试（100+ 随机文档）
- 答案评分属性测试（100+ 随机答案）
- 进度计算属性测试（100+ 随机状态）

## Implementation Notes

### 题目解析策略

从 HTML 内容中解析题目：
1. 使用 DOM 解析器解析 HTML
2. 查找题目标记（`<h3>第 X 题</h3>`）
3. 提取题目文本、选项
4. **答题时不提取答案和解析**（跳过 `<details>` 标签）
5. **提交时重新解析获取完整数据**（包含答案和解析）
6. 构建题目数据结构

**解析函数签名**：
```typescript
function parseQuestionsFromHTML(
  html: string, 
  includeAnswers: boolean = false
): ParsedQuestion[]
```

**答案隐藏逻辑**：
- 遍历 DOM 时检查是否为 `<details>` 标签
- 如果 `includeAnswers = false`，跳过该元素
- 只从 `<p>` 标签提取题目文本，避免包含子元素内容

### 答题模式实现

**实现方式**：右侧抽屉式设计，不遮挡编辑器

**布局特点**：
1. **右侧抽屉**：固定在右侧，默认宽度 600px
2. **可调节宽度**：左侧边缘拖拽调整（400px - 1000px）
3. **无遮罩层**：用户可以自由滚动查看题目详情
4. **滑入动画**：平滑的滑入/滑出过渡效果（300ms）

**功能实现**：
1. 解析 HTML 提取题目数据（不包含答案和解析）
2. 渲染题目列表和答题输入
3. 管理答题状态（查看/答题/结果）
4. 实时显示答题进度
5. 提交后显示评估结果
6. 退出时温馨提示（如有未提交答案）

**答案隐藏机制**：
- 答题时调用 `parseQuestionsFromHTML(html, false)`，不提取答案
- 遍历 DOM 时跳过 `<details>` 标签
- 只提取 `<p>` 标签中的题目文本
- 提交时调用 `parseQuestionsFromHTML(html, true)`，重新解析获取完整数据

### AI 评估实现

调用 AI API 评估主观题：
1. 构建评估提示词（包含题目、标准答案、用户答案）
2. 调用 AI 生成评分和反馈
3. 解析 AI 响应
4. 返回结构化结果

### 举一反三实现

**实现方式**：在每个题目标题旁边添加"举一反三"按钮

**技术方案**：
1. **自定义 Tiptap 扩展** (`similar-question-button-extension.ts`)
   - 创建 `SimilarQuestionButton` Node 扩展
   - 使用 `addNodeView()` 自定义按钮渲染
   - 设置 `contenteditable="false"` 防止编辑
   - 通过 `onButtonClick` 回调处理点击事件

2. **HTML 结构**：
   ```html
   <h3>第 X 题 <button type="button" data-similar-question-btn="true" data-question-index="X" contenteditable="false"></button></h3>
   ```

3. **按钮样式**：
   - 渐变紫色背景：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
   - 圆角 8px，阴影效果
   - Hover 动画：上移 + 增强阴影
   - 灯泡图标 + "举一反三"文字

4. **生成流程**：
   - 用户点击按钮 → 解析文档找到对应题目
   - 调用 `/api/test-answer/generate-similar` API
   - 生成相似题目（保持题型和难度）
   - 使用 `<details open>` 标签包裹，插入到当前题目后面
   - 默认展开显示，可手动收起

5. **集成到编辑器**：
   - TiptapEditor 添加 `onSimilarQuestionClick` prop
   - 学习计划详情页面实现 `handleSimilarQuestionClick` 函数
   - 完整的数据流：UI → 回调 → API → 文档更新

## API Endpoints

### POST /api/test-answer/submit
提交答题记录并评估

**Request**:
```typescript
{
  documentId: string
  planId: string
  answers: Array<{
    questionIndex: number
    questionText: string
    questionType: 'choice' | 'fill' | 'short' | 'code'
    userAnswer: string
    correctAnswer: string
  }>
  provider: string  // AI 提供商
  model: string     // AI 模型
}
```

**Response**:
```typescript
{
  results: Array<{
    questionIndex: number
    isCorrect: boolean
    score: number
    feedback?: string  // 主观题的 AI 评语
  }>
  totalScore: number
  correctCount: number
}
```

**评估逻辑**：
- **客观题**（选择题、填空题）：直接比较答案，标准化处理（去除空格、标点、转小写）
- **主观题**（简答题、编程题）：调用 AI 评估，返回分数（0-100）和详细反馈

### POST /api/test-answer/generate-similar
生成相似题目（举一反三）

**Request**:
```typescript
{
  originalQuestion: {
    type: 'choice' | 'fill' | 'short' | 'code'
    question: string
    difficulty: 'easy' | 'medium' | 'hard'
    topic: string
  }
  provider: string  // AI 提供商
  model: string     // AI 模型
}
```

**Response**:
```typescript
{
  question: string
  options?: string[]  // 选择题的选项
  answer: string
  explanation: string
}
```

**生成策略**：
- 保持相同的题型和难度级别
- 考察相同知识点，但换不同角度或场景
- 包含完整的题目、选项、答案、解析
