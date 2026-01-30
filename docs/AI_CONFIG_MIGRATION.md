# AI 配置迁移清单

## 需要修改的文件

所有使用 `process.env.OPENROUTER_API_KEY` 的文件都需要改为使用 `getAIConfig()` 函数。

### 已完成 ✅

1. `src/app/api/ai/generate/route.ts` - AI 内容生成
2. `src/app/api/learning-content/generate/route.ts` - 学习内容生成
3. `src/app/api/learning-outline/generate/route.ts` - 学习大纲生成
4. `src/app/api/feynman/explanations/route.ts` - 费曼解释反馈
5. `src/app/api/feynman/generate-concepts/route.ts` - 费曼概念生成
6. `src/app/api/cornell/generate/route.ts` - 康奈尔笔记生成
7. `src/app/api/test-questions/generate/route.ts` - 测试题生成
8. `src/app/api/flashcards/generate/route.ts` - 闪卡生成

### 待修改 ⏳

无 - 所有 API 路由已完成迁移!

## 修改模式

### 旧代码模式

```typescript
// 从环境变量读取 OpenRouter API Key
const apiKey = process.env.OPENROUTER_API_KEY
if (!apiKey) {
  throw new Error('未配置 OPENROUTER_API_KEY 环境变量')
}

const aiClient = new OpenAIClient(
  apiKey,
  'deepseek/deepseek-chat', // 硬编码的模型
  'https://openrouter.ai/api/v1'
)
```

### 新代码模式

```typescript
import { getAIConfig } from '@/lib/ai/get-ai-config'
import { getCurrentUserId } from '@/lib/auth/get-user'
import { OpenAIClient } from '@/lib/ai/client'

// 获取当前用户 ID
const userId = await getCurrentUserId()
if (!userId) {
  return NextResponse.json({ error: '未登录' }, { status: 401 })
}

// 获取 AI 配置（自动处理优先级）
const config = await getAIConfig(
  request as unknown as Request,
  userId,
  modelId // 可选：指定模型 ID
)

const aiClient = new OpenAIClient(
  config.apiKey,
  config.model,
  config.baseUrl
)
```

## 优先级逻辑

`getAIConfig()` 函数会按以下优先级获取配置：

1. **厂商独立配置**（数据库 `ai_providers` 表，`isEnabled = true`）
   - 如果用户为该厂商配置了独立 API Key 并启用
   - 使用该厂商的 API Key 和 Base URL

2. **OpenRouter 统一配置**（环境变量 `OPENROUTER_API_KEY`）
   - 如果没有厂商独立配置
   - 使用 OpenRouter 统一 API

3. **错误**
   - 如果都没有配置，抛出错误

## 注意事项

1. 所有 API 路由都需要添加用户认证检查
2. 移除硬编码的模型 ID，改为从配置获取
3. 移除硬编码的 Base URL，改为从配置获取
4. 添加详细的日志输出，方便调试
5. 处理配置获取失败的情况

## 测试清单

修改完成后，需要测试以下场景：

- [ ] 只配置 OpenRouter API Key（环境变量）
- [ ] 只配置厂商独立 API Key（数据库）
- [ ] 同时配置两者（验证优先级）
- [ ] 都不配置（验证错误提示）
- [ ] 指定不同的模型 ID
- [ ] 未登录用户的错误处理
