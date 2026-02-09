# 数据库配置与迁移

## 数据库概述

项目使用 Cloudflare D1（SQLite）作为数据库，通过 Drizzle ORM 进行管理。

## 数据库初始化

### 本地开发

#### 1. 执行迁移

```bash
# 执行第一个迁移
npm run db:migrate:local

# 执行第二个迁移
npx wrangler d1 execute ai-learning-platform --local --file=./drizzle/0001_amusing_wallow.sql
```

#### 2. 验证数据库

```bash
# 查看所有表
npx wrangler d1 execute ai-learning-platform --local --command "SELECT name FROM sqlite_master WHERE type='table';"

# 运行验证脚本
bash verify-database.sh
```

## 数据库表结构

### 用户相关表（4 个）
- `users` - 用户信息
- `accounts` - OAuth 账户
- `sessions` - 会话
- `verification_tokens` - 验证令牌

### 学习相关表（3 个）
- `learning_plans` - 学习计划
- `learning_outlines` - 学习大纲
- `knowledge_contents` - 知识内容

### 进度相关表（1 个）
- `learning_progress` - 学习进度

### 测试相关表（2 个）
- `test_questions` - 测试题目
- `user_answers` - 用户答案

### 其他表（5 个）
- `feynman_explanations` - Feynman 学习法
- `cornell_notes` - 康奈尔笔记
- `chat_history` - 聊天历史
- `notes` - 笔记
- `files` - 文件
- `drafts` - 草稿

**总计：** 16 个表

## 数据库操作

### 生成新迁移

```bash
npm run db:generate
```

### 本地迁移

```bash
npm run db:migrate:local
```

### 远程迁移

```bash
npm run db:migrate:remote
```

### 查看本地数据库

```bash
npx wrangler d1 execute ai-learning-platform --local --command "SELECT * FROM users LIMIT 10;"
```

### 查看远程数据库

```bash
npx wrangler d1 execute ai-learning-platform --remote --command "SELECT * FROM users LIMIT 10;"
```

## Drizzle ORM 配置

### 配置文件

**drizzle.config.ts**
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config
```

### 数据库客户端

**src/db/client.ts**
```typescript
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function getDB(env: CloudflareEnv) {
  return drizzle(env.DB, { schema })
}
```

## 环境变量

### 本地开发

`.env.local` 中的配置（可选，本地开发时自动使用 `.wrangler/state/v3/d1`）：

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
CLOUDFLARE_D1_TOKEN=your_token
```

### 生产环境

在 Cloudflare Workers 环境中自动配置。

## 常用命令

```bash
# 生成迁移文件
npm run db:generate

# 执行本地单个迁移
npm run db:migrate:local

# 执行本地所有迁移
npm run db:migrate:all:local

# 执行远程单个迁移
npm run db:migrate:remote

# 执行远程所有迁移
npm run db:migrate:all:remote

# 验证数据库
bash verify-database.sh
```

## 故障排除

### Q: 迁移执行失败

**A:**
1. 检查 `.wrangler/state/v3/d1` 目录是否存在
2. 确保迁移文件路径正确
3. 查看错误信息中的具体 SQL 错误

### Q: 本地数据库不存在

**A:**
1. 运行 `npm run dev` 启动开发服务器
2. Wrangler 会自动创建本地数据库
3. 然后执行迁移命令

### Q: 无法连接到数据库

**A:**
1. 检查 `src/db/client.ts` 中的配置
2. 确保环境变量正确设置
3. 检查 Cloudflare 账户权限

## 数据库安全

### 已实现的安全措施

1. **外键约束** - 所有关联表都有外键约束
2. **唯一索引** - 确保数据唯一性
3. **数据类型** - 使用规范的数据类型
4. **默认值** - 设置合理的默认值

## 备份和恢复

### 导出数据

```bash
npx wrangler d1 execute ai-learning-platform --local --command ".dump" > backup.sql
```

### 导入数据

```bash
npx wrangler d1 execute ai-learning-platform --local --file=backup.sql
```

## 问题排查记录

### 康奈尔笔记保存失败（已修复）

**问题描述：** 康奈尔笔记保存时失败

**排查过程：**

1. **检查数据库表** - 确认 `cornell_notes` 表存在且结构正确
   ```bash
   npx wrangler d1 execute ai-learning-platform --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name='cornell_notes';"
   npx wrangler d1 execute ai-learning-platform --local --command "PRAGMA table_info(cornell_notes);"
   ```

2. **检查 API 路由** - 确认 `/api/cornell/notes` 路由实现正确

3. **添加详细日志** - 在 POST 和 PUT 方法中添加详细日志

4. **发现根本原因** - 外键约束失败 + contentId 参数理解错误
   - 错误信息：`Failed query: insert into "cornell_notes"...`
   - 原因1：前端传递的 `contentId` 实际上是 `outlineId`（learning_outlines 表的 ID）
   - 原因2：需要先根据 `outlineId` 查找对应的 `knowledge_contents` 记录
   - 解决：参考闪卡 API 的实现，添加 outlineId 到 contentId 的转换逻辑

**解决方案：**

1. 修改 `src/app/api/cornell/notes/route.ts`：

```typescript
// 导入 knowledgeContents
import { cornellNotes, knowledgeContents } from '@/db/schema'

// POST 方法：根据 outlineId 查找 contentId
const { contentId: outlineId, mainNotes, cues, summary } = body

// 根据 outlineId 查找对应的 knowledge_contents
const content = await db
  .select()
  .from(knowledgeContents)
  .where(eq(knowledgeContents.outlineId, outlineId))
  .limit(1)

if (content.length === 0) {
  return NextResponse.json({ 
    error: '未找到对应的学习内容',
    details: `outlineId: ${outlineId} 对应的 knowledge_contents 不存在`
  }, { status: 400 })
}

const actualContentId = content[0].id

// 插入数据（不需要手动设置 createdAt 和 updatedAt）
const result = await db.insert(cornellNotes).values({
  userId,
  contentId: actualContentId,
  mainNotes,
  cues: cues || null,
  summary: summary || null,
}).returning()

// PUT 方法：手动设置 updatedAt
const updateData: any = {
  updatedAt: new Date(),
}
if (mainNotes !== undefined) updateData.mainNotes = mainNotes
if (cues !== undefined) updateData.cues = cues
if (summary !== undefined) updateData.summary = summary

// GET 方法：也需要根据 outlineId 查找 contentId
const outlineId = searchParams.get('contentId') // 实际上是 outlineId
if (outlineId) {
  const content = await db
    .select()
    .from(knowledgeContents)
    .where(eq(knowledgeContents.outlineId, outlineId))
    .limit(1)
  
  if (content.length > 0) {
    conditions.push(eq(cornellNotes.contentId, content[0].id))
  }
}
```

2. 时间戳处理说明：
   - **INSERT 时**：不需要手动设置 `createdAt` 和 `updatedAt`，Drizzle 会通过 schema 中的 `$defaultFn` 自动处理
   - **UPDATE 时**：需要手动设置 `updatedAt: new Date()`
   - Drizzle 的 `{ mode: 'timestamp' }` 在 Cloudflare D1 中会将 `Date` 对象转换为秒级时间戳
   - 数据库中存储的是秒级时间戳（如 `1770603023`）

**验证方法：**

1. 运行类型检查：`npx tsc --noEmit`
2. 启动开发服务器：`npm run dev`
3. 测试保存功能

**相关文件：**
- `src/app/api/cornell/notes/route.ts` - API 路由
- `src/components/cornell/cornell-note-dialog.tsx` - 前端对话框
- `src/components/cornell/cornell-note-editor.tsx` - 前端编辑器
- `src/db/schema.ts` - 数据库 schema
- `drizzle/0004_amazing_patch.sql` - 创建表的迁移文件


