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
- `chat_history` - 聊天历史
- `notes` - 笔记
- `files` - 文件
- `drafts` - 草稿

**总计：** 15 个表

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

# 执行本地迁移
npm run db:migrate:local

# 执行远程迁移
npm run db:migrate:remote

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

