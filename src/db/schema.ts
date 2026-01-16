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
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})


// 知识内容表
export const knowledgeContents = sqliteTable('knowledge_contents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  outlineId: text('outline_id').notNull().references(() => learningOutlines.id),
  content: text('content').notNull(),
  contentType: text('content_type').default('rich_text'),
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$onUpdate(() => new Date()),
})

// 测试题表
export const testQuestions = sqliteTable('test_questions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  contentId: text('content_id').notNull().references(() => knowledgeContents.id),
  questionType: text('question_type').notNull(), // 'multiple_choice' | 'fill_blank' | 'coding' | 'essay'
  question: text('question').notNull(),
  options: text('options'), // JSON数组
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  difficulty: text('difficulty').default('medium'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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
  explanation: text('explanation').notNull(),
  aiAnalysis: text('ai_analysis'),
  score: integer('score'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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

// AI对话历史表
export const chatHistory = sqliteTable('chat_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id),
  contentId: text('content_id').references(() => knowledgeContents.id),
  role: text('role').notNull(),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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
  chatHistory: many(chatHistory),
  accounts: many(accounts),
  sessions: many(sessions),
}))

export const learningPlansRelations = relations(learningPlans, ({ one, many }) => ({
  user: one(users, { fields: [learningPlans.userId], references: [users.id] }),
  outlines: many(learningOutlines),
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
}))
