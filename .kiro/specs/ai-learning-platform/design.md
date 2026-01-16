# 设计文档 - AI驱动学习平台

## 概述

AI驱动学习平台是一个基于Next.js 15和Cloudflare基础设施的现代化学习系统。平台采用边缘计算架构，利用Cloudflare D1数据库、R2存储和Workers提供全球低延迟访问。系统集成AI能力生成个性化学习内容，并通过多种学习方法和交互式工具帮助用户高效学习。

**核心技术栈：**
- 前端框架：Next.js 15 (App Router)
- 运行时：Cloudflare Workers
- 数据库：Cloudflare D1 (SQLite)
- ORM：Drizzle ORM
- 存储：Cloudflare R2 (文件/媒体)
- 认证：NextAuth.js v5
- UI组件：Shadcn/ui + Tailwind CSS
- 富文本：Tiptap Editor
- 代码编辑：Monaco Editor
- AI集成：OpenAI API / Cloudflare AI
- PWA：next-pwa

**设计原则：**
- 边缘优先：利用Cloudflare全球网络实现低延迟
- 渐进增强：核心功能离线可用（PWA）
- 类型安全：TypeScript + Drizzle ORM
- 组件化：可复用的UI组件
- 响应式：移动优先设计
- 可访问性：WCAG 2.1 AA标准

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户设备                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   浏览器     │  │   PWA应用    │  │  移动设备    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Cloudflare CDN │
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────┐              ┌───────────▼──────────┐
│  Next.js App      │              │  Cloudflare Workers  │
│  (SSR/SSG)        │              │  (Edge Functions)    │
│                   │              │                      │
│  - App Router     │              │  - API Routes        │
│  - Server Actions │              │  - AI Processing     │
│  - Streaming      │              │  - File Upload       │
└─────────┬─────────┘              └───────────┬──────────┘
          │                                    │
          └────────────────┬───────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼─────────┐          ┌───────────▼──────────┐
│  Cloudflare D1    │          │  Cloudflare R2       │
│  (SQLite)         │          │  (Object Storage)    │
│                   │          │                      │
│  - 用户数据       │          │  - 图片/视频         │
│  - 学习内容       │          │  - 文件上传          │
│  - 进度追踪       │          │  - 媒体资源          │
└───────────────────┘          └──────────────────────┘
```


### 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    表现层 (Presentation)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  页面组件    │  │  UI组件库    │  │  布局组件    │  │
│  │  (Pages)     │  │  (Shadcn)    │  │  (Layouts)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    业务逻辑层 (Business)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  学习管理    │  │  AI服务      │  │  用户管理    │  │
│  │  (Learning)  │  │  (AI Gen)    │  │  (Auth)      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    数据访问层 (Data Access)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Drizzle ORM │  │  R2 Client   │  │  Cache Layer │  │
│  │  (Database)  │  │  (Storage)   │  │  (KV Store)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 组件和接口

### 核心模块

#### 1. 认证模块 (Auth Module)

**职责：** 用户注册、登录、会话管理

**接口：**
```typescript
interface AuthService {
  // 用户注册
  register(email: string, password: string): Promise<User>
  
  // 用户登录
  login(email: string, password: string): Promise<Session>
  
  // 第三方登录
  loginWithProvider(provider: 'google' | 'github'): Promise<Session>
  
  // 登出
  logout(): Promise<void>
  
  // 密码重置
  resetPassword(email: string): Promise<void>
  
  // 获取当前用户
  getCurrentUser(): Promise<User | null>
}
```

**组件：**
- `LoginForm`: 登录表单
- `RegisterForm`: 注册表单
- `PasswordResetForm`: 密码重置表单
- `AuthProvider`: 认证上下文提供者


#### 2. AI内容生成模块 (AI Generator Module)

**职责：** 生成学习计划、大纲、知识内容、测试题

**接口：**
```typescript
interface AIGeneratorService {
  // 生成学习计划
  generateLearningPlan(topic: string, goal: string, level: string): Promise<LearningPlan>
  
  // 生成学习大纲
  generateOutline(planId: string): Promise<LearningOutline>
  
  // 生成知识内容
  generateContent(outlineItemId: string): Promise<KnowledgeContent>
  
  // 生成测试题
  generateQuestions(contentId: string, count: number): Promise<TestQuestion[]>
  
  // AI对话
  chat(message: string, context: ChatContext): Promise<ChatResponse>
  
  // 分析费曼讲解
  analyzeFeynmanExplanation(explanation: string, topicId: string): Promise<AnalysisResult>
}
```

**组件：**
- `AIGeneratorPanel`: AI生成控制面板
- `GenerationProgress`: 生成进度显示
- `ChatInterface`: AI对话界面
- `FeynmanAnalyzer`: 费曼讲解分析器

#### 3. 学习内容模块 (Learning Content Module)

**职责：** 管理学习计划、大纲、知识点

**接口：**
```typescript
interface LearningContentService {
  // 创建学习计划
  createPlan(data: CreatePlanInput): Promise<LearningPlan>
  
  // 获取学习计划
  getPlan(planId: string): Promise<LearningPlan>
  
  // 更新学习计划
  updatePlan(planId: string, data: UpdatePlanInput): Promise<LearningPlan>
  
  // 获取大纲
  getOutline(planId: string): Promise<LearningOutline>
  
  // 获取知识内容
  getContent(contentId: string): Promise<KnowledgeContent>
  
  // 标记完成
  markAsCompleted(contentId: string): Promise<void>
}
```

**组件：**
- `LearningPlanCard`: 学习计划卡片
- `OutlineTree`: 大纲树形结构
- `ContentViewer`: 内容查看器
- `ProgressIndicator`: 进度指示器


#### 4. 测试评估模块 (Assessment Module)

**职责：** 测试题管理、答题、评分

**接口：**
```typescript
interface AssessmentService {
  // 获取测试题
  getQuestions(contentId: string): Promise<TestQuestion[]>
  
  // 提交答案
  submitAnswer(questionId: string, answer: Answer): Promise<AnswerResult>
  
  // 完成测试
  completeTest(testId: string): Promise<TestReport>
  
  // 获取测试历史
  getTestHistory(userId: string): Promise<TestHistory[]>
}
```

**组件：**
- `QuestionCard`: 题目卡片
- `AnswerInput`: 答案输入组件
- `TestReport`: 测试报告
- `ProgressChart`: 进步趋势图

#### 5. 富文本编辑器模块（含媒体上传）(Rich Text Editor Module)

**职责：** 笔记编辑、内容格式化、媒体文件上传和管理

**接口：**
```typescript
interface RichTextEditorService {
  // 创建编辑器实例
  createEditor(config: EditorConfig): Editor
  
  // 保存内容
  saveContent(editorId: string, content: JSONContent): Promise<void>
  
  // 加载内容
  loadContent(noteId: string): Promise<JSONContent>
  
  // 上传图片
  uploadImage(file: File): Promise<string>
  
  // 上传视频
  uploadVideo(file: File): Promise<{ url: string; thumbnailUrl: string }>
  
  // 上传音频
  uploadAudio(file: File): Promise<string>
  
  // 插入媒体
  insertMedia(url: string, type: 'image' | 'video' | 'audio'): void
  
  // 嵌入外部视频
  embedExternalVideo(url: string): void // YouTube, Vimeo
  
  // 调整媒体尺寸
  resizeMedia(nodeId: string, width: number, height: number): void
  
  // 设置媒体对齐
  alignMedia(nodeId: string, alignment: 'left' | 'center' | 'right'): void
  
  // 删除媒体
  deleteMedia(nodeId: string): Promise<void>
  
  // 获取上传进度
  getUploadProgress(uploadId: string): number
}
```

**组件：**
- `TiptapEditor`: Tiptap编辑器封装
- `EditorToolbar`: 编辑器工具栏（含媒体上传按钮）
- `MediaUploader`: 媒体上传器（支持拖拽、粘贴、点击上传）
- `ImageNode`: 图片节点组件（支持调整尺寸和对齐）
- `VideoNode`: 视频节点组件（支持播放器和缩略图）
- `AudioNode`: 音频节点组件（支持播放器）
- `FormulaInput`: 数学公式输入
- `UploadProgress`: 上传进度显示


#### 6. 代码编辑器模块 (Code Editor Module)

**职责：** 代码编辑、语法高亮、代码执行

**接口：**
```typescript
interface CodeEditorService {
  // 创建编辑器
  createEditor(language: string, theme: string): CodeEditor
  
  // 执行代码
  executeCode(code: string, language: string): Promise<ExecutionResult>
  
  // 格式化代码
  formatCode(code: string, language: string): Promise<string>
  
  // 保存代码
  saveCode(projectId: string, files: CodeFile[]): Promise<void>
}
```

**组件：**
- `MonacoEditor`: Monaco编辑器封装
- `CodeExecutor`: 代码执行器
- `FileTree`: 文件树
- `OutputPanel`: 输出面板

#### 7. 虚拟终端模块 (Virtual Terminal Module)

**职责：** 终端模拟、命令执行

**接口：**
```typescript
interface VirtualTerminalService {
  // 创建终端
  createTerminal(config: TerminalConfig): Terminal
  
  // 执行命令
  executeCommand(command: string): Promise<CommandResult>
  
  // 获取命令历史
  getHistory(): string[]
  
  // 清屏
  clear(): void
}
```

**组件：**
- `XTerminal`: xterm.js终端封装
- `CommandInput`: 命令输入
- `TerminalTabs`: 终端标签页

#### 8. 浏览器沙盒模块 (Browser Sandbox Module)

**职责：** HTML/CSS/JS预览、安全隔离

**接口：**
```typescript
interface BrowserSandboxService {
  // 创建沙盒
  createSandbox(config: SandboxConfig): Sandbox
  
  // 更新预览
  updatePreview(html: string, css: string, js: string): void
  
  // 获取控制台日志
  getConsoleLogs(): ConsoleLog[]
  
  // 切换视图
  switchView(viewport: 'desktop' | 'tablet' | 'mobile'): void
}
```

**组件：**
- `SandboxPreview`: 沙盒预览iframe
- `ConsolePanel`: 控制台面板
- `ViewportSwitcher`: 视口切换器


#### 9. 学习方法模块 (Learning Methods Module)

**职责：** 实现各种学习方法

**接口：**
```typescript
interface LearningMethodsService {
  // 费曼学习法
  startFeynmanSession(topicId: string): Promise<FeynmanSession>
  
  // 间隔重复
  scheduleSpacedRepetition(itemId: string): Promise<ReviewSchedule>
  
  // 主动回忆
  createRecallTest(topicId: string): Promise<RecallTest>
  
  // 番茄工作法
  startPomodoroSession(duration: number): Promise<PomodoroSession>
  
  // 思维导图
  createMindMap(topicId: string): Promise<MindMap>
}
```

**组件：**
- `FeynmanPanel`: 费曼学习面板
- `SpacedRepetitionScheduler`: 间隔重复调度器
- `PomodoroTimer`: 番茄钟
- `MindMapEditor`: 思维导图编辑器


## 数据模型

### 数据库Schema (Drizzle ORM)

#### 用户表 (users)

```typescript
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  avatar: text('avatar'),
  provider: text('provider'), // 'email' | 'google' | 'github'
  providerId: text('provider_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})
```

#### 学习计划表 (learning_plans)

```typescript
export const learningPlans = sqliteTable('learning_plans', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  topic: text('topic').notNull(),
  goal: text('goal'),
  level: text('level'), // 'beginner' | 'intermediate' | 'advanced'
  status: text('status').default('active'), // 'active' | 'completed' | 'archived'
  progress: integer('progress').default(0), // 0-100
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})
```

#### 学习大纲表 (learning_outlines)

```typescript
export const learningOutlines = sqliteTable('learning_outlines', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  planId: text('plan_id').notNull().references(() => learningPlans.id),
  parentId: text('parent_id'), // 用于树形结构
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  level: integer('level').default(0), // 层级深度
  estimatedTime: integer('estimated_time'), // 预计学习时间（分钟）
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

#### 知识内容表 (knowledge_contents)

```typescript
export const knowledgeContents = sqliteTable('knowledge_contents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  outlineId: text('outline_id').notNull().references(() => learningOutlines.id),
  content: text('content').notNull(), // JSON格式的Tiptap内容
  contentType: text('content_type').default('rich_text'), // 'rich_text' | 'video' | 'interactive'
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})
```


#### 测试题表 (test_questions)

```typescript
export const testQuestions = sqliteTable('test_questions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  questionType: text('question_type').notNull(), // 'multiple_choice' | 'fill_blank' | 'coding' | 'essay'
  question: text('question').notNull(),
  options: text('options'), // JSON数组，用于选择题
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  difficulty: text('difficulty').default('medium'), // 'easy' | 'medium' | 'hard'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

#### 用户答题记录表 (user_answers)

```typescript
export const userAnswers = sqliteTable('user_answers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  questionId: text('question_id').notNull().references(() => testQuestions.id),
  answer: text('answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  timeSpent: integer('time_spent'), // 答题用时（秒）
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

#### 学习进度表 (learning_progress)

```typescript
export const learningProgress = sqliteTable('learning_progress', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  status: text('status').default('not_started'), // 'not_started' | 'in_progress' | 'completed'
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  timeSpent: integer('time_spent').default(0), // 学习用时（秒）
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

#### 笔记表 (notes)

```typescript
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').references(() => knowledgeContents.id),
  title: text('title').notNull(),
  content: text('content').notNull(), // JSON格式的Tiptap内容
  tags: text('tags'), // JSON数组
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})
```


#### 费曼讲解表 (feynman_explanations)

```typescript
export const feynmanExplanations = sqliteTable('feynman_explanations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  explanation: text('explanation').notNull(), // JSON格式的Tiptap内容
  aiAnalysis: text('ai_analysis'), // AI分析结果
  score: integer('score'), // 0-100
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

#### 文件表 (files)

```typescript
export const files = sqliteTable('files', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // 字节
  r2Key: text('r2_key').notNull(), // R2存储的key
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'), // 视频缩略图
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

#### AI对话历史表 (chat_history)

```typescript
export const chatHistory = sqliteTable('chat_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').references(() => knowledgeContents.id),
  role: text('role').notNull(), // 'user' | 'assistant'
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
```

### 数据关系图

```
users (用户)
  ├─ learning_plans (学习计划)
  │   └─ learning_outlines (学习大纲)
  │       └─ knowledge_contents (知识内容)
  │           ├─ test_questions (测试题)
  │           │   └─ user_answers (答题记录)
  │           ├─ learning_progress (学习进度)
  │           ├─ feynman_explanations (费曼讲解)
  │           └─ chat_history (AI对话)
  ├─ notes (笔记)
  └─ files (文件)
```


## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: AI生成内容完整性

*对于任何*有效的学习主题和目标输入，AI生成器应该返回包含所有必需字段（标题、描述、大纲）的结构化学习计划，并且能够基于该计划生成详细的学习大纲和知识内容。

**验证需求: 1.1, 1.2, 1.3, 1.4**

### 属性 2: 测试题自动生成

*对于任何*生成的知识内容，系统应该能够自动生成至少一个相关的测试题目，且题目应该与内容主题相关。

**验证需求: 1.5**

### 属性 3: AI生成进度可见性

*对于任何*AI生成操作，系统应该在生成过程中持续更新进度状态，并在完成或失败时提供明确的状态信息。

**验证需求: 1.6, 1.7**

### 属性 4: 答案评估即时性

*对于任何*用户提交的测试答案，系统应该在2秒内返回评估结果，包括正确性判断和详细解析。

**验证需求: 2.2, 2.4**

### 属性 5: 测试报告完整性

*对于任何*完成的测试，系统应该生成包含总分、正确率、错题列表和知识点掌握分析的完整报告。

**验证需求: 2.3**

### 属性 6: 进步趋势计算正确性

*对于任何*用户的多次测试记录，系统计算的进步趋势应该准确反映分数变化，且趋势方向（上升/下降/平稳）应该与实际分数序列一致。

**验证需求: 2.6**


### 属性 7: 费曼讲解分析反馈

*对于任何*用户提交的费曼讲解内容，AI应该分析并返回包含质量评分（0-100）和具体改进建议的反馈。

**验证需求: 3.3, 3.6**

### 属性 8: 费曼讲解持久化

*对于任何*保存的费曼讲解记录，用户应该能够通过讲解ID检索到完整的原始内容，且内容应该与保存时一致。

**验证需求: 3.5**

### 属性 9: 富文本编辑器内容往返一致性

*对于任何*在富文本编辑器中创建的内容（包含文字、图片、视频、代码、公式等），保存后重新加载应该得到等价的内容结构和格式。

**验证需求: 5.1-5.9**

### 属性 10: 编辑器媒体上传功能

*对于任何*通过富文本编辑器上传的媒体文件（拖拽、粘贴或点击上传），系统应该自动上传到R2存储并返回可访问的URL，然后将媒体嵌入到编辑器中。

**验证需求: 5.10, 5.11, 5.12**

### 属性 11: 编辑器自动保存

*对于任何*在富文本编辑器中的编辑操作，系统应该在最后一次编辑后的3秒内自动保存草稿到数据库。

**验证需求: 5.8**

### 属性 12: 媒体文件大小限制

*对于任何*通过编辑器上传的文件，如果图片大小超过10MB或视频大小超过100MB，系统应该拒绝上传并返回明确的错误信息。

**验证需求: 5.17**

### 属性 13: 媒体文件格式验证

*对于任何*通过编辑器上传的文件，系统应该验证文件MIME类型，只接受支持的格式（JPG, PNG, GIF, WebP, SVG, MP4, WebM, MOV, MP3, WAV, OGG），拒绝其他格式并提供错误提示。

**验证需求: 5.13, 5.14, 5.15, 5.19**


### 属性 14: 媒体上传成功返回URL

*对于任何*通过编辑器成功上传的媒体文件，系统应该返回一个可访问的HTTPS URL，且通过该URL应该能够访问到与原始文件内容一致的媒体。

**验证需求: 5.18**

### 属性 15: 图片压缩优化

*对于任何*通过编辑器上传的图片文件，系统压缩后的文件大小应该小于或等于原始文件大小，且压缩后的图片应该保持可识别的视觉质量。

**验证需求: 5.20**

### 属性 16: 视频缩略图生成

*对于任何*通过编辑器成功上传的视频文件，系统应该生成一个缩略图并在编辑器中显示预览，且缩略图应该是有效的图片格式。

**验证需求: 5.22**

### 属性 17: 数据库持久化一致性

*对于任何*用户编辑的内容（笔记、讲解、答案等），保存到D1数据库后，通过相同的ID查询应该返回与保存时一致的数据。

**验证需求: 12.1**

### 属性 18: 离线数据本地存储

*对于任何*在离线状态下的编辑操作，数据应该保存到本地IndexedDB，且在离线期间通过本地查询应该能够访问这些数据。

**验证需求: 12.2**

### 属性 19: 网络恢复自动同步

*对于任何*在离线状态下保存到本地的数据，当网络恢复时，系统应该自动将这些数据同步到D1数据库，且同步后本地和远程数据应该一致。

**验证需求: 12.3**

### 属性 20: 跨设备数据同步

*对于任何*用户，在设备A上保存的学习进度和设置，在设备B上登录后应该能够访问到相同的数据。

**验证需求: 12.7**


### 属性 21: 密码加密存储

*对于任何*用户注册时提供的密码，数据库中存储的应该是密码的哈希值而不是明文，且哈希值应该使用安全的哈希算法（如bcrypt）生成。

**验证需求: 14.5**

### 属性 22: 用户数据导出完整性

*对于任何*用户请求导出个人数据，导出的数据应该包含该用户的所有学习计划、笔记、进度记录、测试历史等相关数据，且数据格式应该是标准的JSON或CSV格式。

**验证需求: 14.8**

### 属性 23: UI响应式布局

*对于任何*页面组件，在375px、768px、1024px、1440px宽度下应该正确显示且不出现水平滚动条，所有交互元素应该可点击且不重叠。

**验证需求: 10.1, 10.15**

### 属性 24: 可访问性标准符合

*对于任何*页面，所有交互元素应该有cursor-pointer样式，文字对比度应该至少为4.5:1，所有图片应该有alt属性，所有表单输入应该有关联的label。

**验证需求: 10.6, 10.9, 10.10, 10.12**

### 属性 25: 键盘导航支持

*对于任何*页面，用户应该能够仅使用键盘（Tab、Enter、Esc等）完成所有主要操作，且焦点状态应该清晰可见。

**验证需求: 10.9, 10.13**

### 属性 26: 动画性能优化

*对于任何*交互动画和过渡效果，持续时间应该在150-300ms之间，且当用户设置prefers-reduced-motion时，应该禁用或简化动画。

**验证需求: 10.7, 10.14**


## 错误处理

### 错误分类

**1. 用户输入错误**
- 无效的邮箱格式
- 密码强度不足
- 文件大小超限
- 不支持的文件格式
- 处理：客户端验证 + 友好的错误提示

**2. AI服务错误**
- API调用失败
- 生成超时
- 配额超限
- 处理：重试机制 + 降级方案 + 用户通知

**3. 数据库错误**
- 连接失败
- 查询超时
- 约束违反
- 处理：事务回滚 + 错误日志 + 用户友好提示

**4. 文件上传错误**
- 网络中断
- 存储空间不足
- 上传超时
- 处理：断点续传 + 进度保存 + 重试选项

**5. 同步冲突**
- 离线编辑冲突
- 并发修改冲突
- 处理：冲突检测 + 用户选择 + 合并策略

### 错误处理策略

```typescript
// 统一错误处理接口
interface AppError {
  code: string
  message: string
  details?: unknown
  retryable: boolean
  userMessage: string
}

// 错误处理中间件
async function handleError(error: unknown): Promise<AppError> {
  if (error instanceof AIServiceError) {
    return {
      code: 'AI_SERVICE_ERROR',
      message: error.message,
      retryable: true,
      userMessage: 'AI服务暂时不可用，请稍后重试'
    }
  }
  
  if (error instanceof DatabaseError) {
    return {
      code: 'DATABASE_ERROR',
      message: error.message,
      retryable: false,
      userMessage: '数据保存失败，请联系支持'
    }
  }
  
  // 默认错误处理
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    retryable: false,
    userMessage: '发生未知错误，请刷新页面重试'
  }
}
```


## 测试策略

### 双重测试方法

本项目采用单元测试和基于属性的测试相结合的方法，以确保全面的代码覆盖和正确性验证。

**单元测试：**
- 验证特定示例和边界情况
- 测试组件集成点
- 测试错误条件和异常处理
- 使用Vitest作为测试框架

**基于属性的测试：**
- 验证跨所有输入的通用属性
- 通过随机化实现全面的输入覆盖
- 每个属性测试最少100次迭代
- 使用fast-check库进行属性测试

### 测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
      ]
    }
  }
})
```

### 属性测试标签格式

每个属性测试必须使用以下格式标记：

```typescript
test('Feature: ai-learning-platform, Property 1: AI生成内容完整性', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        topic: fc.string({ minLength: 1, maxLength: 100 }),
        goal: fc.string({ minLength: 1, maxLength: 200 }),
        level: fc.constantFrom('beginner', 'intermediate', 'advanced')
      }),
      async (input) => {
        const plan = await generateLearningPlan(input)
        
        // 验证必需字段存在
        expect(plan).toHaveProperty('title')
        expect(plan).toHaveProperty('description')
        expect(plan).toHaveProperty('outline')
        
        // 验证能生成大纲
        const outline = await generateOutline(plan.id)
        expect(outline.items.length).toBeGreaterThan(0)
      }
    ),
    { numRuns: 100 }
  )
})
```


### 测试覆盖目标

**单元测试：**
- 组件渲染测试
- API路由测试
- 数据库操作测试
- 工具函数测试
- 目标覆盖率：80%

**属性测试：**
- 所有26个正确性属性
- 每个属性最少100次迭代
- 覆盖边界情况和随机输入

**集成测试：**
- 端到端用户流程
- AI生成完整流程
- 文件上传和检索
- 离线同步流程

**性能测试：**
- 首屏加载时间 < 2秒
- AI响应时间 < 5秒
- 文件上传速度
- 数据库查询性能

### 测试数据生成器

```typescript
// 使用fast-check生成测试数据
import * as fc from 'fast-check'

// 用户数据生成器
export const userArbitrary = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 })
})

// 学习计划数据生成器
export const learningPlanArbitrary = fc.record({
  topic: fc.string({ minLength: 1, maxLength: 100 }),
  goal: fc.string({ minLength: 1, maxLength: 500 }),
  level: fc.constantFrom('beginner', 'intermediate', 'advanced')
})

// 测试题数据生成器
export const testQuestionArbitrary = fc.record({
  questionType: fc.constantFrom('multiple_choice', 'fill_blank', 'coding', 'essay'),
  question: fc.string({ minLength: 10, maxLength: 500 }),
  correctAnswer: fc.string({ minLength: 1, maxLength: 1000 }),
  difficulty: fc.constantFrom('easy', 'medium', 'hard')
})

// 文件数据生成器
export const fileArbitrary = fc.record({
  filename: fc.string({ minLength: 1, maxLength: 255 }),
  mimeType: fc.constantFrom(
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'audio/mp3'
  ),
  size: fc.integer({ min: 1, max: 100 * 1024 * 1024 }) // 最大100MB
})
```


## UI/UX设计规范

### 设计系统

**视觉风格：Glassmorphism（玻璃态）**
- 磨砂玻璃效果：backdrop-blur-md (10-20px)
- 半透明背景：bg-white/80 (亮色) 或 bg-slate-900/80 (暗色)
- 细微边框：border border-white/20
- 光反射效果：subtle gradients
- 多层次深度：z-index分层

**配色方案：**
```css
:root {
  /* 主色调 - 青绿色（学习与成长） */
  --color-primary: #0D9488;      /* teal-600 */
  --color-primary-light: #14B8A6; /* teal-500 */
  --color-primary-dark: #0F766E;  /* teal-700 */
  
  /* 辅助色 - 亮青色 */
  --color-secondary: #2DD4BF;     /* teal-400 */
  
  /* CTA按钮 - 橙色 */
  --color-cta: #EA580C;           /* orange-600 */
  --color-cta-hover: #C2410C;     /* orange-700 */
  
  /* 背景色 */
  --color-bg-light: #F0FDFA;      /* teal-50 */
  --color-bg-dark: #134E4A;       /* teal-900 */
  
  /* 文字色 */
  --color-text-primary: #134E4A;  /* teal-900 */
  --color-text-secondary: #0F766E; /* teal-700 */
  --color-text-muted: #5EEAD4;    /* teal-300 */
}
```

**字体系统：**
```css
/* Google Fonts导入 */
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&family=Comic+Neue:wght@300;400;700&display=swap');

/* 字体应用 */
body {
  font-family: 'Baloo 2', 'Comic Neue', system-ui, sans-serif;
}

/* 标题 */
h1, h2, h3 { font-weight: 700; }
h4, h5, h6 { font-weight: 600; }

/* 正文 */
p, span { font-weight: 400; }

/* 强调 */
strong, b { font-weight: 600; }
```

**间距系统：**
- 基础单位：4px
- 常用间距：8px, 12px, 16px, 24px, 32px, 48px, 64px
- 容器最大宽度：max-w-7xl (1280px)
- 内容区域：max-w-4xl (896px)


### 组件设计规范

**按钮组件：**
```tsx
// 主要按钮
<button className="
  px-6 py-3 rounded-lg
  bg-primary text-white
  hover:bg-primary-dark
  transition-colors duration-200
  cursor-pointer
  font-medium
  shadow-lg shadow-primary/20
">
  开始学习
</button>

// CTA按钮
<button className="
  px-8 py-4 rounded-xl
  bg-cta text-white
  hover:bg-cta-hover
  transition-all duration-200
  cursor-pointer
  font-semibold text-lg
  shadow-xl shadow-cta/30
  hover:shadow-2xl hover:shadow-cta/40
  hover:-translate-y-0.5
">
  立即体验
</button>

// 玻璃态按钮
<button className="
  px-6 py-3 rounded-lg
  bg-white/80 backdrop-blur-md
  border border-white/20
  hover:bg-white/90
  transition-all duration-200
  cursor-pointer
  text-primary font-medium
">
  查看详情
</button>
```

**卡片组件：**
```tsx
<div className="
  p-6 rounded-2xl
  bg-white/80 backdrop-blur-md
  border border-white/20
  shadow-xl
  hover:shadow-2xl
  transition-all duration-300
  cursor-pointer
  hover:-translate-y-1
">
  {/* 卡片内容 */}
</div>
```

**输入框组件：**
```tsx
<input className="
  w-full px-4 py-3 rounded-lg
  bg-white/90 backdrop-blur-sm
  border border-teal-200
  focus:border-primary focus:ring-2 focus:ring-primary/20
  transition-all duration-200
  text-text-primary
  placeholder:text-teal-400
" />
```

### 响应式断点

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'xs': '375px',   // 小手机
      'sm': '640px',   // 大手机
      'md': '768px',   // 平板
      'lg': '1024px',  // 小桌面
      'xl': '1280px',  // 桌面
      '2xl': '1440px', // 大桌面
    }
  }
}
```

**响应式布局示例：**
```tsx
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
  xl:grid-cols-4
">
  {/* 响应式网格内容 */}
</div>
```


### 可访问性实现

**ARIA标签：**
```tsx
// 导航
<nav aria-label="主导航">
  <ul role="list">
    <li><a href="/learn" aria-current="page">学习</a></li>
  </ul>
</nav>

// 按钮
<button aria-label="关闭对话框" aria-pressed="false">
  <XIcon aria-hidden="true" />
</button>

// 表单
<label htmlFor="email" className="sr-only">邮箱地址</label>
<input id="email" type="email" aria-required="true" aria-invalid="false" />
<span id="email-error" role="alert" aria-live="polite"></span>
```

**键盘导航：**
```tsx
// 焦点管理
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal()
  }
  if (e.key === 'Tab') {
    trapFocus(e)
  }
}

// 焦点陷阱（模态框）
function trapFocus(e: KeyboardEvent) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  if (e.shiftKey && document.activeElement === firstElement) {
    e.preventDefault()
    lastElement.focus()
  } else if (!e.shiftKey && document.activeElement === lastElement) {
    e.preventDefault()
    firstElement.focus()
  }
}
```

**动画减少：**
```css
/* 尊重用户偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 图标系统

**使用Lucide React图标库：**
```tsx
import { 
  BookOpen, 
  Brain, 
  Code, 
  Terminal, 
  Upload,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// 使用示例
<BookOpen className="w-6 h-6 text-primary" />
<Brain className="w-8 h-8 text-secondary" />
```

**图标规范：**
- 默认大小：w-6 h-6 (24x24px)
- 大图标：w-8 h-8 (32x32px)
- 小图标：w-4 h-4 (16x16px)
- 颜色：使用主题色变量
- 禁止使用emoji作为功能图标


## 技术实现细节

### Next.js配置

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 使用App Router
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com'
      }
    ]
  },
  
  // 输出配置（Cloudflare Pages）
  output: 'export', // 或使用OpenNext适配器
}

export default nextConfig
```

### Drizzle ORM配置

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: 'ai-learning-platform'
  }
} satisfies Config
```

```typescript
// src/db/client.ts
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function createDbClient(d1: D1Database) {
  return drizzle(d1, { schema })
}

// 在Server Actions中使用
export async function getDb() {
  const d1 = process.env.DB as unknown as D1Database
  return createDbClient(d1)
}
```

### Cloudflare Workers配置

```toml
# wrangler.toml
name = "ai-learning-platform"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "ai-learning-platform"
database_id = "your-database-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "ai-learning-platform-files"

[vars]
AI_API_KEY = "your-api-key"
NEXTAUTH_URL = "https://your-domain.com"
```


### AI集成实现

```typescript
// src/lib/ai/client.ts
import OpenAI from 'openai'

export function createAIClient() {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL // 可选：使用Cloudflare AI
  })
}

// 流式生成
export async function* streamGeneration(prompt: string) {
  const client = createAIClient()
  const stream = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true
  })
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

// Server Action示例
'use server'
export async function generateLearningPlan(input: {
  topic: string
  goal: string
  level: string
}) {
  const prompt = `创建一个关于"${input.topic}"的学习计划...`
  
  let fullResponse = ''
  for await (const chunk of streamGeneration(prompt)) {
    fullResponse += chunk
  }
  
  // 解析AI响应并保存到数据库
  const plan = parseAIResponse(fullResponse)
  const db = await getDb()
  const result = await db.insert(learningPlans).values(plan).returning()
  
  return result[0]
}
```

### 文件上传实现

```typescript
// src/lib/storage/upload.ts
export async function uploadToR2(
  file: File,
  r2: R2Bucket
): Promise<UploadResult> {
  const fileId = createId()
  const ext = file.name.split('.').pop()
  const key = `uploads/${fileId}.${ext}`
  
  // 上传到R2
  await r2.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type
    }
  })
  
  // 生成公开URL
  const url = `https://your-domain.com/files/${key}`
  
  // 如果是图片，进行压缩
  if (file.type.startsWith('image/')) {
    await compressImage(r2, key)
  }
  
  // 如果是视频，生成缩略图
  if (file.type.startsWith('video/')) {
    await generateThumbnail(r2, key)
  }
  
  return { fileId, url, key }
}
```


### PWA配置

```typescript
// next.config.ts (使用next-pwa)
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
        }
      }
    },
    {
      urlPattern: /^https:\/\/.*\.r2\.cloudflarestorage\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'r2-files-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
        }
      }
    },
    {
      urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'ai-api-cache',
        networkTimeoutSeconds: 10
      }
    }
  ]
})

export default config
```

```json
// public/manifest.json
{
  "name": "AI学习平台",
  "short_name": "AI学习",
  "description": "AI驱动的个性化学习平台",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F0FDFA",
  "theme_color": "#0D9488",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```


### 离线同步实现

```typescript
// src/lib/sync/offline-manager.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineDB extends DBSchema {
  'pending-changes': {
    key: string
    value: {
      id: string
      type: 'create' | 'update' | 'delete'
      table: string
      data: unknown
      timestamp: number
    }
  }
  'cached-data': {
    key: string
    value: {
      id: string
      table: string
      data: unknown
      timestamp: number
    }
  }
}

export class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null
  
  async init() {
    this.db = await openDB<OfflineDB>('ai-learning-offline', 1, {
      upgrade(db) {
        db.createObjectStore('pending-changes', { keyPath: 'id' })
        db.createObjectStore('cached-data', { keyPath: 'id' })
      }
    })
  }
  
  // 保存待同步的更改
  async savePendingChange(change: {
    type: 'create' | 'update' | 'delete'
    table: string
    data: unknown
  }) {
    if (!this.db) await this.init()
    
    const id = createId()
    await this.db!.put('pending-changes', {
      id,
      ...change,
      timestamp: Date.now()
    })
  }
  
  // 同步到服务器
  async syncToServer() {
    if (!this.db) await this.init()
    
    const changes = await this.db!.getAll('pending-changes')
    
    for (const change of changes) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(change)
        })
        
        // 同步成功，删除本地记录
        await this.db!.delete('pending-changes', change.id)
      } catch (error) {
        console.error('同步失败:', error)
        // 保留本地记录，等待下次同步
      }
    }
  }
  
  // 监听网络状态
  startNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.syncToServer()
    })
  }
}

// 全局实例
export const offlineManager = new OfflineManager()
```


### 性能优化策略

**1. 代码分割和懒加载**
```typescript
// 动态导入组件
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false // 编辑器不需要SSR
})

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  loading: () => <CodeEditorSkeleton />,
  ssr: false
})

// 路由级别的代码分割（自动）
// app/learn/[id]/page.tsx
// app/test/[id]/page.tsx
```

**2. 图片优化**
```tsx
import Image from 'next/image'

// 使用Next.js Image组件
<Image
  src="/hero.jpg"
  alt="学习平台"
  width={1200}
  height={600}
  priority // 首屏图片
  placeholder="blur"
  blurDataURL="data:image/..." // 模糊占位符
/>

// 响应式图片
<Image
  src="/content.jpg"
  alt="内容"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>
```

**3. 数据预取和缓存**
```typescript
// Server Component中预取数据
export default async function LearnPage({ params }: { params: { id: string } }) {
  // 并行获取数据
  const [plan, progress, questions] = await Promise.all([
    getLearningPlan(params.id),
    getUserProgress(params.id),
    getTestQuestions(params.id)
  ])
  
  return <LearningContent plan={plan} progress={progress} questions={questions} />
}

// 使用React Cache
import { cache } from 'react'

export const getLearningPlan = cache(async (id: string) => {
  const db = await getDb()
  return db.query.learningPlans.findFirst({
    where: eq(learningPlans.id, id)
  })
})
```

**4. 虚拟滚动**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function LongList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 估计每项高度
    overscan: 5 // 预渲染5项
  })
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  )
}
```


## 部署配置

### Cloudflare Pages部署

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 部署到Cloudflare Pages
npx wrangler pages deploy .vercel/output/static

# 或使用Git集成自动部署
# 1. 连接GitHub仓库到Cloudflare Pages
# 2. 设置构建命令: npm run build
# 3. 设置输出目录: .vercel/output/static
```

### 环境变量配置

```bash
# .env.local (本地开发)
DATABASE_URL="file:./local.db"
AI_API_KEY="your-openai-api-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Cloudflare Pages环境变量（生产环境）
# 在Cloudflare Dashboard中设置:
# - AI_API_KEY
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - GITHUB_CLIENT_ID
# - GITHUB_CLIENT_SECRET
```

### 数据库迁移

```bash
# 生成迁移文件
npx drizzle-kit generate:sqlite

# 应用迁移（本地）
npx drizzle-kit push:sqlite

# 应用迁移（生产环境）
npx wrangler d1 migrations apply ai-learning-platform --remote
```

### CI/CD配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ai-learning-platform
          directory: .vercel/output/static
```


## 监控和日志

### 性能监控

```typescript
// src/lib/monitoring/performance.ts
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // 发送到分析服务
  if (metric.label === 'web-vital') {
    console.log(metric.name, metric.value)
    
    // 可以发送到Cloudflare Analytics或其他服务
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        label: metric.label
      })
    })
  }
}

// app/layout.tsx
export { reportWebVitals }
```

### 错误追踪

```typescript
// src/lib/monitoring/error-tracking.ts
export function captureException(error: Error, context?: Record<string, unknown>) {
  console.error('Error captured:', error, context)
  
  // 发送到错误追踪服务（如Sentry）
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  })
}

// 全局错误处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    captureException(event.error, {
      type: 'unhandled-error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    captureException(new Error(event.reason), {
      type: 'unhandled-rejection'
    })
  })
}
```

### 用户行为分析

```typescript
// src/lib/analytics/events.ts
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  // 发送到分析服务
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties)
  }
  
  // 或使用Cloudflare Web Analytics
  fetch('/api/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      event: eventName,
      properties,
      timestamp: Date.now()
    })
  })
}

// 使用示例
trackEvent('learning_plan_created', {
  topic: 'JavaScript',
  level: 'beginner'
})

trackEvent('test_completed', {
  score: 85,
  questionCount: 10
})
```

## 安全考虑

### 数据安全

1. **密码加密**: 使用bcrypt进行密码哈希
2. **SQL注入防护**: 使用Drizzle ORM参数化查询
3. **XSS防护**: React自动转义，Tiptap内容清理
4. **CSRF防护**: NextAuth.js内置CSRF保护
5. **文件上传安全**: 验证文件类型和大小，使用R2隔离存储

### API安全

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 速率限制
  const ip = request.ip ?? 'unknown'
  const rateLimit = checkRateLimit(ip)
  
  if (!rateLimit.allowed) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  
  // CORS设置
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN ?? '*')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: '/api/:path*'
}
```

### 内容安全策略

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.openai.com;
      media-src 'self' https://*.r2.cloudflarestorage.com;
      frame-src 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
]

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ]
  }
}
```

## 总结

本设计文档详细描述了AI驱动学习平台的完整架构、组件设计、数据模型、正确性属性、UI/UX规范和技术实现细节。设计遵循以下核心原则：

1. **边缘优先**: 利用Cloudflare全球网络实现低延迟访问
2. **类型安全**: TypeScript + Drizzle ORM确保类型安全
3. **渐进增强**: PWA支持离线访问和原生应用体验
4. **可测试性**: 26个正确性属性确保系统行为正确
5. **可访问性**: 符合WCAG 2.1 AA标准
6. **性能优化**: 代码分割、图片优化、虚拟滚动等
7. **安全第一**: 多层安全防护机制

设计文档为后续的实现阶段提供了清晰的指导和规范。
