import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// 生成唯一ID的辅助函数
function createId(): string {
  return crypto.randomUUID()
}

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  avatar: text('avatar'),
  provider: text('provider'), // 'email' | 'google' | 'github'
  providerId: text('provider_id'),
  // 联网搜索配置
  searchResultCount: integer('search_result_count').default(5), // 搜索结果数量
  searchLanguage: text('search_language').default('auto'), // 搜索语言: 'auto' | 'zh' | 'en'
  tavilyApiKey: text('tavily_api_key'), // Tavily API Key（加密存储）
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 学习计划表
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

// 学习大纲表
export const learningOutlines = sqliteTable('learning_outlines', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  planId: text('plan_id').notNull().references(() => learningPlans.id),
  parentId: text('parent_id'),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  level: integer('level').default(0),
  estimatedTime: integer('estimated_time'),
  isTestDocument: integer('is_test_document', { mode: 'boolean' }).default(false), // 标记是否为测试题文档
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})


// 知识内容表
export const knowledgeContents = sqliteTable('knowledge_contents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  outlineId: text('outline_id').notNull().references(() => learningOutlines.id),
  content: text('content').notNull(), // 存储 HTML 格式内容
  summary: text('summary'), // 文档摘要，用于 AI 上下文
  contentType: text('content_type').default('rich_text'),
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 测试题表
export const testQuestions = sqliteTable('test_questions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  questionIndex: integer('question_index').notNull(), // 题目序号（第几题）
  questionType: text('question_type').notNull(), // 'choice' | 'multiple-choice' | 'true-false' | 'fill' | 'short' | 'essay' | 'code' | 'matching' | 'ordering'
  question: text('question').notNull(),
  options: text('options'), // JSON数组
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  difficulty: text('difficulty').default('medium'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 用户答题记录表
export const userAnswers = sqliteTable('user_answers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  questionId: text('question_id').notNull().references(() => testQuestions.id),
  answer: text('answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  timeSpent: integer('time_spent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 学习进度表
export const learningProgress = sqliteTable('learning_progress', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  status: text('status').default('not_started'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  timeSpent: integer('time_spent').default(0),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 笔记表
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').references(() => knowledgeContents.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 费曼讲解表
export const feynmanExplanations = sqliteTable('feynman_explanations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  concept: text('concept').notNull(), // 要解释的概念
  explanation: text('explanation').notNull(),
  aiFeedback: text('ai_feedback'), // JSON: { gaps: [], suggestions: [], score: 0-100 }
  version: integer('version').default(1), // 解释版本
  createdAt: integer('created_at', { mode: 'timestamp' }), // 移除 $defaultFn，让字段保持 null
  updatedAt: integer('updated_at', { mode: 'timestamp' }), // 移除 $onUpdate，让字段保持 null
})

// 学习方法配置表
export const learningMethods = sqliteTable('learning_methods', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  planId: text('plan_id').notNull().references(() => learningPlans.id),
  methodType: text('method_type').notNull(), // 'feynman' | 'ebbinghaus' | 'zettelkasten' | 'cornell' | 'pomodoro' | 'spaced_repetition'
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
  config: text('config'), // JSON: 方法特定配置
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 复习计划表
export const reviewSchedules = sqliteTable('review_schedules', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  reviewRound: integer('review_round').notNull(), // 第几轮复习 (1-7)
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(), // 计划复习时间
  completedAt: integer('completed_at', { mode: 'timestamp' }), // 实际完成时间
  effectiveness: integer('effectiveness'), // 复习效果评分 (1-5)
  nextReviewAt: integer('next_review_at', { mode: 'timestamp' }), // 下次复习时间
  status: text('status').default('pending'), // 'pending' | 'completed' | 'skipped'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 卡片盒笔记表
export const zettelkastenNotes = sqliteTable('zettelkasten_notes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags'), // JSON: ['tag1', 'tag2']
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 笔记链接表
export const noteLinks = sqliteTable('note_links', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  fromNoteId: text('from_note_id').notNull().references(() => zettelkastenNotes.id, { onDelete: 'cascade' }),
  toNoteId: text('to_note_id').notNull().references(() => zettelkastenNotes.id, { onDelete: 'cascade' }),
  linkType: text('link_type').default('related'), // 'related' | 'parent' | 'child' | 'reference'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 康奈尔笔记表
export const cornellNotes = sqliteTable('cornell_notes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  mainNotes: text('main_notes').notNull(), // 笔记区
  cues: text('cues'), // 线索区（关键词、问题）
  summary: text('summary'), // 总结区
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 番茄钟记录表
export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').references(() => knowledgeContents.id), // 可选：关联的学习内容
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: integer('duration').notNull(), // 计划时长（秒）
  actualDuration: integer('actual_duration'), // 实际时长（秒）
  status: text('status').default('in_progress'), // 'in_progress' | 'completed' | 'interrupted'
  sessionType: text('session_type').default('work'), // 'work' | 'short_break' | 'long_break'
  notes: text('notes'), // 本次番茄钟的学习笔记
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 闪卡表
export const flashcards = sqliteTable('flashcards', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').references(() => knowledgeContents.id), // 可选：关联的学习内容
  front: text('front').notNull(), // 正面（问题）
  back: text('back').notNull(), // 背面（答案）
  tags: text('tags'), // JSON
  // SM-2 算法参数
  easinessFactor: integer('easiness_factor').default(2500), // 难度因子 * 1000 (1.3-2.5)
  repetitions: integer('repetitions').default(0), // 重复次数
  interval: integer('interval').default(0), // 复习间隔（天）
  nextReviewAt: integer('next_review_at', { mode: 'timestamp' }), // 下次复习时间
  lastReviewedAt: integer('last_reviewed_at', { mode: 'timestamp' }), // 上次复习时间
  createdAt: integer('created_at', { mode: 'timestamp' }), // 移除 $defaultFn，允许为 null
  updatedAt: integer('updated_at', { mode: 'timestamp' }), // 移除 $defaultFn 和 $onUpdate，允许为 null
})

// 闪卡复习记录表
export const flashcardReviews = sqliteTable('flashcard_reviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  flashcardId: text('flashcard_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  quality: integer('quality').notNull(), // 回忆质量 (0-5)
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }).notNull(),
  timeSpent: integer('time_spent'), // 花费时间（秒）
})

// 文件表
export const files = sqliteTable('files', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// 草稿表
export const drafts = sqliteTable('drafts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').default('document'), // 'document' | 'note' | 'explanation'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// AI对话历史表
export const chatHistory = sqliteTable('chat_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').references(() => knowledgeContents.id),
  role: text('role').notNull(),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// AI 提供商配置表
export const aiProviders = sqliteTable('ai_providers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull(), // 'openai' | 'deepseek' | 'anthropic' | 'google' 等
  apiKey: text('api_key'), // 该厂商的 API Key
  baseUrl: text('base_url'), // 该厂商的 API 地址
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(false), // 是否启用
  selectedModels: text('selected_models'), // JSON 数组，存储该厂商选中的模型 ID
  customModels: text('custom_models'), // JSON 数组，存储自定义模型列表（用于"其他"厂商）
  customProviderName: text('custom_provider_name'), // 自定义厂商名称（用于"其他"厂商）
  messageFormat: text('message_format').default('openai'), // 消息格式：'openai' | 'anthropic'（用于"其他"厂商）
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// AI 模型配置表
export const aiModels = sqliteTable('ai_models', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  modelId: text('model_id').notNull(), // 模型 ID
  modelName: text('model_name').notNull(), // 模型显示名称
  provider: text('provider').notNull(), // 所属厂商
  configMode: text('config_mode').default('openrouter'), // 'openrouter' | 'independent' - 所属配置模式
  isSelected: integer('is_selected', { mode: 'boolean' }).default(false), // 是否选中
  isDefault: integer('is_default', { mode: 'boolean' }).default(false), // 是否为默认模型
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// AI 厂商配置表
export const aiProviderConfigs = sqliteTable('ai_provider_configs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull(), // 'openai' | 'deepseek' | 'gemini' | 'claude' | 'cloudflare' | 'openrouter'
  apiKey: text('api_key').notNull(),
  baseUrl: text('base_url'), // 可选的自定义 Base URL
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// NextAuth 相关表
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
})

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  learningPlans: many(learningPlans),
  userAnswers: many(userAnswers),
  learningProgress: many(learningProgress),
  notes: many(notes),
  feynmanExplanations: many(feynmanExplanations),
  files: many(files),
  drafts: many(drafts),
  chatHistory: many(chatHistory),
  aiProviderConfigs: many(aiProviderConfigs),
  accounts: many(accounts),
  sessions: many(sessions),
  learningMethods: many(learningMethods),
  reviewSchedules: many(reviewSchedules),
  zettelkastenNotes: many(zettelkastenNotes),
  cornellNotes: many(cornellNotes),
  pomodoroSessions: many(pomodoroSessions),
  flashcards: many(flashcards),
  flashcardReviews: many(flashcardReviews),
  aiProviders: many(aiProviders),
  aiModels: many(aiModels),
}))

export const learningPlansRelations = relations(learningPlans, ({ one, many }) => ({
  user: one(users, { fields: [learningPlans.userId], references: [users.id] }),
  outlines: many(learningOutlines),
  learningMethods: many(learningMethods),
}))

export const learningOutlinesRelations = relations(learningOutlines, ({ one, many }) => ({
  plan: one(learningPlans, { fields: [learningOutlines.planId], references: [learningPlans.id] }),
  contents: many(knowledgeContents),
}))

export const knowledgeContentsRelations = relations(knowledgeContents, ({ one, many }) => ({
  outline: one(learningOutlines, { fields: [knowledgeContents.outlineId], references: [learningOutlines.id] }),
  questions: many(testQuestions),
  progress: many(learningProgress),
  notes: many(notes),
  feynmanExplanations: many(feynmanExplanations),
  chatHistory: many(chatHistory),
  reviewSchedules: many(reviewSchedules),
  cornellNotes: many(cornellNotes),
  pomodoroSessions: many(pomodoroSessions),
  flashcards: many(flashcards),
}))

export const learningMethodsRelations = relations(learningMethods, ({ one }) => ({
  user: one(users, { fields: [learningMethods.userId], references: [users.id] }),
  plan: one(learningPlans, { fields: [learningMethods.planId], references: [learningPlans.id] }),
}))

export const reviewSchedulesRelations = relations(reviewSchedules, ({ one }) => ({
  user: one(users, { fields: [reviewSchedules.userId], references: [users.id] }),
  content: one(knowledgeContents, { fields: [reviewSchedules.contentId], references: [knowledgeContents.id] }),
}))

export const zettelkastenNotesRelations = relations(zettelkastenNotes, ({ one, many }) => ({
  user: one(users, { fields: [zettelkastenNotes.userId], references: [users.id] }),
  linksFrom: many(noteLinks, { relationName: 'from' }),
  linksTo: many(noteLinks, { relationName: 'to' }),
}))

export const noteLinksRelations = relations(noteLinks, ({ one }) => ({
  fromNote: one(zettelkastenNotes, { fields: [noteLinks.fromNoteId], references: [zettelkastenNotes.id], relationName: 'from' }),
  toNote: one(zettelkastenNotes, { fields: [noteLinks.toNoteId], references: [zettelkastenNotes.id], relationName: 'to' }),
}))

export const cornellNotesRelations = relations(cornellNotes, ({ one }) => ({
  user: one(users, { fields: [cornellNotes.userId], references: [users.id] }),
  content: one(knowledgeContents, { fields: [cornellNotes.contentId], references: [knowledgeContents.id] }),
}))

export const pomodoroSessionsRelations = relations(pomodoroSessions, ({ one }) => ({
  user: one(users, { fields: [pomodoroSessions.userId], references: [users.id] }),
  content: one(knowledgeContents, { fields: [pomodoroSessions.contentId], references: [knowledgeContents.id] }),
}))

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  user: one(users, { fields: [flashcards.userId], references: [users.id] }),
  content: one(knowledgeContents, { fields: [flashcards.contentId], references: [knowledgeContents.id] }),
  reviews: many(flashcardReviews),
}))

export const flashcardReviewsRelations = relations(flashcardReviews, ({ one }) => ({
  flashcard: one(flashcards, { fields: [flashcardReviews.flashcardId], references: [flashcards.id] }),
  user: one(users, { fields: [flashcardReviews.userId], references: [users.id] }),
}))

export const aiProvidersRelations = relations(aiProviders, ({ one }) => ({
  user: one(users, { fields: [aiProviders.userId], references: [users.id] }),
}))

export const aiModelsRelations = relations(aiModels, ({ one }) => ({
  user: one(users, { fields: [aiModels.userId], references: [users.id] }),
}))

export const aiProviderConfigsRelations = relations(aiProviderConfigs, ({ one }) => ({
  user: one(users, { fields: [aiProviderConfigs.userId], references: [users.id] }),
}))
