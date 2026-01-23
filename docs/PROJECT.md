# AI 驱动学习平台 - 项目说明手册

## 项目概述

AI 驱动的学习平台是一个现代化的在线学习系统，集成了人工智能技术为用户生成个性化学习内容。平台提供富文本编辑、AI 对话、学习计划管理等功能，帮助用户高效学习。

**核心特性：**
- 🤖 **AI 内容生成** - 使用 `/AI` 斜杠命令快速生成学习内容
- 📚 **学习计划管理** - 创建、管理和追踪学习计划
- ✏️ **富文本编辑** - 支持多种格式、媒体上传、公式输入
- 💬 **AI 对话助手** - 与 AI 进行多轮对话获取学习帮助
- 🔐 **用户认证** - 支持邮箱、Google、GitHub 登录
- 🎨 **Glassmorphism 设计** - 现代化的玻璃态 UI 设计

## 最近更新

### 2024-01-23 - 创建统一的提示组件系统

**问题描述:**
- 项目中大量使用原生 `alert()` 进行提示
- 用户体验不佳,样式不统一
- 无法自定义样式和行为

**解决方案:**

创建了统一的提示组件系统,包括:

**1. Toast 提示组件** (`src/components/ui/toast.tsx`)
- 支持 4 种类型: success, error, warning, info
- 自动从右侧滑入,3秒后自动关闭
- 可同时显示多个提示
- 支持手动关闭

**2. Toast 容器和 Context** (`src/components/ui/toast-container.tsx`)
- 提供 `useToast()` hook
- 统一管理所有 Toast 的显示
- 简单的 API: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`

**3. 确认对话框** (`src/components/ui/confirm-dialog.tsx`)
- 用于需要用户确认的操作
- 支持 3 种类型: danger, warning, info
- 支持异步操作,自动显示加载状态
- 提供 `useConfirm()` hook

**技术实现:**

```typescript
// Toast 使用示例
import { useToast } from '@/components/ui/toast-container'

function MyComponent() {
  const toast = useToast()
  
  const handleSave = () => {
    toast.success('保存成功！')
  }
  
  const handleError = () => {
    toast.error('操作失败，请重试')
  }
}

// 确认对话框使用示例
import { useConfirm } from '@/components/ui/confirm-dialog'

function MyComponent() {
  const { confirm } = useConfirm()
  
  const handleDelete = () => {
    confirm({
      title: '确认删除',
      message: '删除后无法恢复，确定要删除吗？',
      type: 'danger',
      onConfirm: async () => {
        await deleteItem()
        toast.success('删除成功')
      }
    })
  }
}
```

**已完成批量替换（共36处 alert）:**
- ✅ `src/app/settings/ai/page.tsx` - AI 设置页面 (3处)
- ✅ `src/app/learn/new/page.tsx` - 新建学习计划 (3处)
- ✅ `src/components/editor/test-question-dialog.tsx` - 测试题对话框 (7处)
- ✅ `src/app/plan/[planId]/page.tsx` - 学习计划详情 (15处)
- ✅ `src/components/editor/ai-generate-dialog.tsx` - AI 生成对话框 (2处)
- ✅ `src/components/editor/editor-toolbar.tsx` - 编辑器工具栏 (1处)
- ✅ `src/components/editor/slash-command.tsx` - 斜杠命令 (2处,使用自定义事件)
- ✅ `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层 (2处)
- ✅ `src/app/test-editor/page.tsx` - 测试编辑器页面 (1处)

**替换模式:**
- 成功消息 → `toast.success()`
- 错误消息 → `toast.error()`
- 警告/验证 → `toast.warning()`
- 普通提示 → `toast.info()`

**特殊处理:**
- `slash-command.tsx` 中的图片/视频上传失败使用自定义事件触发 toast（因为在扩展配置中无法直接使用 hook）

**验证:**
- ✅ 类型检查通过 (`npx tsc --noEmit`)
- ✅ 所有 alert 已替换为 Toast 组件
- ✅ 项目中不再有原生 alert 调用

**设计规范:**
- 位置: Toast 固定在右上角
- 动画: 从右侧滑入,淡出消失
- 颜色: Success(绿), Error(红), Warning(黄), Info(蓝)
- 自动关闭: 默认 3 秒
- 响应式: 在移动端自动适配

**效果:**
- ✅ 提供统一的用户反馈体验
- ✅ 符合现代 Web 应用的交互规范
- ✅ 可自定义样式和行为
- ✅ 支持多个提示同时显示
- ✅ 类型检查通过

**相关文件:**
- `src/components/ui/toast.tsx` - Toast 组件
- `src/components/ui/toast-container.tsx` - Toast 容器和 Context
- `src/components/ui/confirm-dialog.tsx` - 确认对话框
- `src/app/layout.tsx` - 添加 Provider
- `docs/TOAST_USAGE.md` - 使用指南

---

### 2024-01-23 - 代码清理建议

**调试代码清理状态:**

项目中存在一些调试相关的代码,分为以下几类:

**1. 已删除的调试文件:**
- ✅ `src/app/test-auth/` - 测试认证页面
- ✅ `src/app/test-deepseek/` - 测试 DeepSeek 页面
- ✅ `src/app/test-editor/` - 测试编辑器页面
- ✅ `src/app/api/test-deepseek/` - 测试 DeepSeek API
- ✅ `test-api.sh` - API 测试脚本
- ✅ `verify-database.sh` - 数据库验证脚本
- ✅ `verify-database.sql` - 数据库验证 SQL

**2. 已清理的调试日志:**
- ✅ `src/app/plan/[planId]/page.tsx` - 移除测试题生成的调试日志

**3. 保留的日志(用于错误处理和监控):**
以下日志用于生产环境的错误追踪和监控,建议保留:
- `console.error` - 错误日志,用于追踪异常
- `console.warn` - 警告日志,用于提示潜在问题
- API 文件中的关键操作日志(如 AI 调用、数据库操作)

**4. 临时硬编码(需要后续处理):**
- `src/app/api/drafts/route.ts` - 使用 `test-user-id` (待集成认证系统)
- `src/app/api/learning-outline/generate/route.ts` - 默认 `demo-user` (待集成认证系统)
- `src/app/learn/page.tsx` - 查询 `demo-user` 的计划 (待集成认证系统)

**建议:**
1. 错误日志 (`console.error`) 应该保留,用于生产环境问题追踪
2. 警告日志 (`console.warn`) 可以保留,帮助发现潜在问题
3. 调试日志 (`console.log`) 在开发完成后可以移除或改为条件输出
4. 临时硬编码的用户ID需要在认证系统集成后替换为真实用户

**清理效果:**
- ✅ 移除了测试页面和脚本
- ✅ 清理了部分调试日志
- ✅ 项目结构更清晰
- ✅ 保留了必要的错误追踪日志

---

### 2024-01-23 - 清理项目中的调试文件

**清理内容:**

删除了以下调试相关的文件和目录:

**调试页面:**
- `src/app/test-auth/` - 测试认证页面
- `src/app/test-deepseek/` - 测试 DeepSeek 页面
- `src/app/test-editor/` - 测试编辑器页面

**调试 API:**
- `src/app/api/test-deepseek/` - 测试 DeepSeek API

**调试脚本:**
- `test-api.sh` - API 测试脚本
- `verify-database.sh` - 数据库验证脚本
- `verify-database.sql` - 数据库验证 SQL

**效果:**
- ✅ 项目结构更清晰
- ✅ 移除了不必要的调试代码
- ✅ 减少了项目体积
- ✅ 类型检查通过
- ✅ 没有影响正常功能

**注意:**
- 这些文件都是开发过程中的临时调试文件
- 删除后不影响任何生产功能
- 如需调试,可以在开发环境中临时创建

---

### 2024-01-23 - 修复模型选择器"暂无可用模型"的问题

**问题描述:**
- 在调用 LLM 的地方,模型选择器显示"暂无可用模型"
- 用户已经在设置页面配置了模型,但仍然无法选择

**根本原因:**
- `getAvailableModels` 函数的过滤条件是 `m.isConnected && m.apiKey`
- 之前的架构改动将 API Key 移到后端管理,前端不再存储 API Key
- 导致所有模型都被过滤掉,因为 `m.apiKey` 为空

**修复内容:**

1. **修改 `getAvailableModels` 函数** (`src/lib/ai/config.ts`)
   - 移除 `m.apiKey` 检查条件
   - 只检查 `m.isConnected` 状态
   - API Key 现在由后端从环境变量读取,前端不需要检查

2. **修改 AI 设置页面保存逻辑** (`src/app/settings/ai/page.tsx`)
   - 保存模型配置时,`apiKey` 字段设为空字符串
   - 添加注释说明 API Key 由后端管理
   - 前端只存储模型的元信息（id、name、model、baseUrl）

**技术实现:**

```typescript
// 1. getAvailableModels 不再检查 apiKey
export function getAvailableModels(): ModelConfig[] {
  const config = getAIConfig()
  // 只检查 isConnected,不再检查 apiKey（API Key 现在在后端管理）
  return config.models.filter(m => m.isConnected)
}

// 2. 保存配置时不存储 API Key
const models: ModelConfig[] = Array.from(selectedModels).map(modelId => {
  const model = availableModels.find(m => m.id === modelId)
  return {
    id: modelId,
    name: model?.name || modelId,
    provider: 'custom',
    model: modelId,
    apiKey: '', // API Key 不再存储在前端，由后端从环境变量读取
    baseUrl: 'https://openrouter.ai/api/v1',
    isConnected: testResult?.success || false,
  }
})
```

**数据流:**

```
用户在设置页面配置模型
  ↓
测试连接成功（使用输入的 API Key）
  ↓
保存模型配置到 localStorage（不包含 API Key）
  ↓
模型选择器读取配置
  ↓
getAvailableModels() 返回已连通的模型
  ↓
用户选择模型
  ↓
前端传递模型信息到后端（不包含 API Key）
  ↓
后端从环境变量读取 API Key
  ↓
调用 AI API
```

**效果:**
- ✅ 模型选择器正确显示已配置的模型
- ✅ 前端不再存储敏感的 API Key
- ✅ 安全性提升,API Key 只存在于后端
- ✅ 类型检查通过

**相关文件:**
- `src/lib/ai/config.ts` - AI 配置管理（修改 getAvailableModels）
- `src/app/settings/ai/page.tsx` - AI 设置页面（修改保存逻辑）

---

### 2024-01-23 - 支持自定义 baseURL 解决 region 限制问题

**问题描述:**
- 某些地区无法直接访问 OpenAI API
- 用户需要通过代理或中转服务访问 API
- 配置系统中已有 `baseUrl` 字段，但未在实际调用中使用

**修复内容:**

1. **修改 `createAIClient` 函数支持 baseURL 参数** (`src/lib/ai/client.ts`)
   - 添加 `baseURL` 参数到配置接口
   - OpenAI 客户端使用自定义 baseURL
   - DeepSeek 客户端支持自定义 baseURL 或使用默认值

2. **修改配置客户端传递 baseURL** (`src/lib/ai/config-client.ts`)
   - `createAIClientFromConfig` 函数传递 `model.baseUrl`
   - `createAIClientFromRequest` 函数传递 `modelConfig.baseUrl`
   - 确保所有调用点都能使用自定义 baseURL

3. **修改测试连接 API 支持 baseURL** (`src/app/api/ai/test-connection/route.ts`)
   - 接收 `baseUrl` 参数
   - 使用自定义 baseUrl 或默认的 OpenRouter API
   - 测试连接时使用正确的 API 端点

**技术实现:**

```typescript
// 1. createAIClient 支持 baseURL
export function createAIClient(config: {
  provider: AIProvider
  apiKey?: string
  model?: string
  baseURL?: string
  ai?: any
}): AIClient {
  const { provider, apiKey, model, baseURL, ai } = config

  switch (provider) {
    case 'openai':
      if (!apiKey) throw new Error('OpenAI API key is required')
      return new OpenAIClient(apiKey, model, baseURL)
    
    case 'deepseek':
      if (!apiKey) throw new Error('DeepSeek API key is required')
      // DeepSeek 使用自定义 baseURL 或默认的 DeepSeek API
      if (baseURL) {
        return new OpenAIClient(apiKey, model, baseURL)
      }
      return new DeepSeekClient(apiKey, model)
    // ...
  }
}

// 2. 配置客户端传递 baseURL
export function createAIClientFromConfig() {
  const model = getDefaultModel()
  
  if (!model) {
    throw new Error('未配置可用的 AI 模型，请前往设置页面配置')
  }

  return {
    client: createAIClient({
      provider: model.provider as AIProvider,
      apiKey: model.apiKey,
      model: model.model,
      baseURL: model.baseUrl, // 传递 baseURL
    }),
    modelConfig: model,
  }
}

// 3. 测试连接 API 支持 baseURL
async function testOpenRouterAPI(
  apiKey: string,
  baseUrl?: string,
  model?: string
): Promise<{ success: boolean; error?: string }> {
  // 使用自定义 baseUrl 或默认的 OpenRouter API
  const apiBaseUrl = baseUrl || 'https://openrouter.ai/api/v1'
  const url = `${apiBaseUrl}/chat/completions`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek/deepseek-chat',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    }),
  })
  // ...
}
```

**使用场景:**

1. **使用代理服务**
   - 在 AI 设置页面配置模型时，填写代理服务的 baseUrl
   - 例如：`https://your-proxy.com/v1`
   - 系统会使用代理服务访问 OpenAI API

2. **使用中转服务**
   - 配置中转服务的 baseUrl（如 OpenRouter）
   - 例如：`https://openrouter.ai/api/v1`
   - 支持访问多个厂商的模型

3. **使用自建服务**
   - 配置自建 API 服务的 baseUrl
   - 兼容 OpenAI API 格式的任何服务

**效果:**
- ✅ 支持自定义 baseURL，解决 region 限制问题
- ✅ 用户可以通过代理或中转服务访问 API
- ✅ 配置系统中的 baseUrl 字段得到正确使用
- ✅ 测试连接功能支持自定义 baseURL
- ✅ 类型检查通过
- ✅ 编译成功

**相关文件:**
- `src/lib/ai/client.ts` - AI 客户端（添加 baseURL 参数支持）
- `src/lib/ai/config-client.ts` - 配置客户端（传递 baseURL）
- `src/app/api/ai/test-connection/route.ts` - 测试连接 API（支持 baseURL）

---

### 2024-01-23 - 修复 Accept-Language 请求头和 API Key 安全问题

**问题描述:**
1. 调用 OpenRouter API 时仍然传递 `Accept-Language` 请求头，导致某些模型报地区限制错误
2. API Key 通过 `x-model-config` 请求头从前端传递到后端，存在安全风险

**根本原因:**
1. **Accept-Language 问题**：即使使用 `new Headers()`，浏览器的 fetch API 仍可能自动添加某些请求头
2. **API Key 安全问题**：前端通过网络传输 API Key 到后端，容易被截获

**修复内容:**

1. **简化请求头构建** (`src/lib/ai/client.ts`)
   - 不再使用 `new Headers()` 构造函数
   - 直接使用普通对象作为 headers
   - 在 Node.js 环境（后端 API 路由）中，fetch 不会自动添加浏览器默认请求头

2. **API Key 改为后端管理** 
   - **前端**：只传递模型信息（id、model、baseUrl），不再传递 API Key
   - **后端**：从环境变量 `OPENROUTER_API_KEY` 读取 API Key
   - **安全性**：API Key 不再通过网络传输，只存在于后端

3. **修改所有 AI 生成 API**
   - `src/app/api/ai/generate/route.ts`
   - `src/app/api/test-questions/generate/route.ts`
   - `src/app/api/learning-outline/generate/route.ts`
   - `src/app/api/learning-content/generate/route.ts`
   
   所有 API 都改为从环境变量读取 API Key

4. **更新环境变量配置** (`.dev.vars.example`)
   - 添加 `OPENROUTER_API_KEY` 环境变量
   - 支持统一的 OpenRouter API Key
   - 也支持单独配置各厂商 API Key

**技术实现:**

```typescript
// 1. 前端 - 不再传递 API Key
headers['x-model-config'] = JSON.stringify({
  id: modelConfig.id,
  provider: modelConfig.provider,
  // 不再传递 API Key
  model: modelConfig.model,
  baseUrl: modelConfig.baseUrl,
})

// 2. 后端 - 从环境变量读取 API Key
const apiKey = process.env.OPENROUTER_API_KEY
if (!apiKey) {
  throw new Error('未配置 OPENROUTER_API_KEY 环境变量')
}

const modelConfigHeader = request.headers.get('x-model-config')
if (modelConfigHeader) {
  const modelConfig = JSON.parse(modelConfigHeader)
  // 使用环境变量中的 API Key
  aiClient = new OpenAIClient(
    apiKey, // 后端的 API Key
    modelConfig.model,
    modelConfig.baseUrl || 'https://openrouter.ai/api/v1'
  )
}

// 3. OpenAIClient - 使用普通对象作为 headers
const headersObj: Record<string, string> = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.apiKey}`,
}

if (this.baseURL.includes('openrouter.ai')) {
  headersObj['HTTP-Referer'] = 'https://ai-learning-platform.com'
  headersObj['X-Title'] = 'AI Learning Platform'
}

const response = await fetch(`${this.baseURL}/chat/completions`, {
  method: 'POST',
  headers: headersObj, // 直接使用对象
  body: JSON.stringify({ ... }),
})
```

**配置步骤:**

1. 复制 `.dev.vars.example` 为 `.dev.vars`
2. 在 `.dev.vars` 中配置 `OPENROUTER_API_KEY`：
   ```
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```
3. 重启开发服务器

**效果:**
- ✅ OpenRouter API 调用成功，不再报地区限制错误
- ✅ API Key 不再通过网络传输，安全性大幅提升
- ✅ 统一使用环境变量管理 API Key，便于部署和管理
- ✅ 前端配置简化，只需选择模型，不需要配置 API Key
- ✅ 类型检查通过
- ✅ 构建成功

**注意事项:**
- 用户不再需要在前端配置 API Key
- 所有模型使用统一的 OpenRouter API Key
- 如果需要使用不同的 API Key，可以在后端根据 modelId 动态选择

**相关文件:**
- `src/lib/ai/client.ts` - OpenAIClient 类（简化请求头构建）
- `src/lib/ai/fetch-with-model.ts` - fetchWithModel 函数（移除 API Key 传递）
- `src/app/api/ai/generate/route.ts` - AI 生成 API（从环境变量读取 API Key）
- `src/app/api/test-questions/generate/route.ts` - 测试题生成 API（从环境变量读取 API Key）
- `src/app/api/learning-outline/generate/route.ts` - 学习大纲生成 API（从环境变量读取 API Key）
- `src/app/api/learning-content/generate/route.ts` - 学习内容生成 API（从环境变量读取 API Key）
- `.dev.vars.example` - 环境变量示例（添加 OPENROUTER_API_KEY）

---

### 2024-01-23 - 修复 OpenRouter API 地区限制错误

**问题描述:**
- 调用 OpenRouter API 时报错：`AI 调用失败: OpenAI API error: This model is not available in your region`
- 某些模型在特定地区不可用，可能与请求头中的 `Accept-Language` 有关

**根本原因:**
- 浏览器的 fetch API 可能会自动添加 `Accept-Language` 请求头
- OpenRouter API 根据 `Accept-Language` 判断用户所在地区
- 某些模型在特定地区有访问限制

**修复内容:**

1. **使用 Headers 对象替代普通对象** (`src/lib/ai/client.ts`)
   - 将 `headers` 从 `Record<string, string>` 改为 `HeadersInit` 类型
   - 使用 `new Headers(headers)` 创建 Headers 对象
   - Headers 对象可以更好地控制请求头，避免浏览器自动添加不需要的请求头

2. **修改 OpenAIClient.chat 方法**
   ```typescript
   const headers: HeadersInit = {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${this.apiKey}`,
   }

   if (this.baseURL.includes('openrouter.ai')) {
     (headers as Record<string, string>)['HTTP-Referer'] = 'https://ai-learning-platform.com';
     (headers as Record<string, string>)['X-Title'] = 'AI Learning Platform'
   }

   const response = await fetch(`${this.baseURL}/chat/completions`, {
     method: 'POST',
     headers: new Headers(headers),
     body: JSON.stringify({ ... }),
   })
   ```

3. **修改 OpenAIClient.chatStream 方法**
   - 同样使用 `HeadersInit` 和 `new Headers()`
   - 确保流式调用也不会发送 `Accept-Language` 请求头

**技术原理:**

使用 `new Headers()` 创建的 Headers 对象：
- 只包含显式设置的请求头
- 不会自动添加浏览器默认的请求头（如 `Accept-Language`）
- 提供更精确的请求头控制

**效果:**
- ✅ OpenRouter API 调用成功，不再报地区限制错误
- ✅ 所有模型都可以正常使用
- ✅ 类型检查通过
- ✅ 构建成功

**相关文件:**
- `src/lib/ai/client.ts` - OpenAIClient 类（使用 Headers 对象）

---

### 2024-01-23 - 修复 OpenAIClient 调用 OpenRouter API 的 Forbidden 错误

**问题描述:**
- 使用 OpenAIClient 调用 OpenRouter API 时报错：`AI 调用失败: OpenAI API error: Forbidden`
- OpenRouter API 需要特定的请求头才能正常工作

**根本原因:**
- OpenRouter API 要求请求中包含 `HTTP-Referer` 和 `X-Title` 请求头
- OpenAIClient 原来的实现只包含了 `Content-Type` 和 `Authorization` 请求头
- 缺少这些请求头会导致 403 Forbidden 错误

**修复内容:**

1. **修改 OpenAIClient.chat 方法** (`src/lib/ai/client.ts`)
   - 检测 baseURL 是否包含 `openrouter.ai`
   - 如果是 OpenRouter API，自动添加必要的请求头
   - 改进错误处理，返回更详细的错误信息

2. **修改 OpenAIClient.chatStream 方法** (`src/lib/ai/client.ts`)
   - 同样添加 OpenRouter 请求头检测
   - 确保流式调用也能正常工作

**技术实现:**

```typescript
async chat(options: AIStreamOptions): Promise<string> {
  const { messages, temperature = 0.7, maxTokens = 2000 } = options

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    }

    // 如果是 OpenRouter API，添加必要的请求头
    if (this.baseURL.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://ai-learning-platform.com'
      headers['X-Title'] = 'AI Learning Platform'
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
      const errorMessage = errorData.error?.message || response.statusText
      throw new Error(`OpenAI API error: ${errorMessage}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
    throw error
  }
}
```

**效果:**
- ✅ OpenRouter API 调用成功，不再报 Forbidden 错误
- ✅ 所有 AI 生成功能正常工作
- ✅ 错误信息更详细，便于调试
- ✅ 类型检查通过
- ✅ 构建成功

**相关文件:**
- `src/lib/ai/client.ts` - OpenAIClient 类（添加 OpenRouter 请求头支持）

---

### 2024-01-23 - 优化模型选择器样式

**问题描述:**
- 模型选择器使用了 dark mode 样式（`dark:bg-gray-900`），在某些页面显示为黑色背景
- 样式与页面整体风格不符，用户体验不佳

**修复内容:**

1. **移除 dark mode 样式** (`src/components/ai/configured-model-selector.tsx`)
   - 移除所有 `dark:` 前缀的样式类
   - 统一使用浅色风格，符合页面整体设计
   - 按钮背景：`bg-white`，hover 时 `hover:bg-gray-50`
   - 下拉菜单背景：`bg-white`
   - 选中项背景：`bg-teal-50`
   - 文字颜色：`text-gray-700`、`text-gray-900`
   - 边框颜色：`border-gray-300`

2. **优化视觉效果**
   - 保持与弹窗组件一致的样式风格
   - 使用 teal 色系作为主题色（选中状态、focus ring）
   - 圆角统一使用 `rounded-lg`
   - 添加 focus ring：`focus:ring-2 focus:ring-teal-500`

**技术实现:**

```typescript
// 选择器按钮
<button
  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
>
  {/* ... */}
</button>

// 下拉菜单
<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
  {models.map((model) => (
    <button
      className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
        selectedModelId === model.id ? 'bg-teal-50' : ''
      }`}
    >
      {/* ... */}
    </button>
  ))}
</div>

// 空状态提示
<div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
  暂无可用模型，请先在设置中配置
</div>
```

**效果:**
- ✅ 模型选择器在所有页面都显示为浅色风格
- ✅ 与弹窗、表单等组件的样式保持一致
- ✅ 选中状态清晰可见（teal 色背景）
- ✅ hover 和 focus 状态有明显的视觉反馈
- ✅ 类型检查和构建都通过

**相关文件:**
- `src/components/ai/configured-model-selector.tsx` - 模型选择器组件（移除 dark mode 样式）

---

### 2024-01-23 - 后端 API 支持模型选择功能

**功能描述:**

完成了模型选择功能的后端集成，所有 AI 生成 API 现在都支持通过 `modelId` 参数使用指定的模型。

**技术实现:**

1. **创建 fetchWithModel 辅助函数** (`src/lib/ai/fetch-with-model.ts`)
   - 统一处理模型配置的传递
   - 自动从 localStorage 读取模型配置
   - 将模型配置添加到请求头 `x-model-config`
   - 简化前端调用代码

2. **修改所有 AI 生成 API**
   - `src/app/api/learning-outline/generate/route.ts` - 学习大纲生成
   - `src/app/api/test-questions/generate/route.ts` - 测试题生成
   - `src/app/api/learning-content/generate/route.ts` - 学习内容生成
   - `src/app/api/ai/generate/route.ts` - 通用 AI 生成
   
   **修改内容:**
   - 接收 `modelId` 参数
   - 从请求头读取模型配置
   - 使用 `OpenAIClient` 创建 AI 客户端（兼容 OpenRouter）
   - 如果没有提供 `modelId`，使用默认配置

3. **修改前端调用**
   - `src/app/learn/new/page.tsx` - 新建学习计划页面
   - `src/app/plan/[planId]/page.tsx` - 学习计划详情页面
   
   **修改内容:**
   - 使用 `fetchWithModel` 替代原来的 `fetch`
   - 传递 `modelId` 参数到请求体
   - 自动添加模型配置到请求头

**代码示例:**

```typescript
// 1. fetchWithModel 辅助函数
export async function fetchWithModel(
  url: string,
  modelId: string | undefined,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // 如果提供了 modelId，添加模型配置到请求头
  if (modelId) {
    const modelConfig = getModelConfig(modelId)
    if (modelConfig) {
      headers['x-model-config'] = JSON.stringify({
        id: modelConfig.id,
        provider: modelConfig.provider,
        apiKey: modelConfig.apiKey,
        model: modelConfig.model,
        baseUrl: modelConfig.baseUrl,
      })
    }
  }

  return fetch(url, { ...options, headers })
}

// 2. 后端 API 使用模型配置
const modelConfigHeader = request.headers.get('x-model-config')
if (modelConfigHeader) {
  const modelConfig = JSON.parse(modelConfigHeader)
  // 统一使用 OpenAI 客户端（兼容 OpenRouter）
  aiClient = new OpenAIClient(
    modelConfig.apiKey,
    modelConfig.model,
    modelConfig.baseUrl || 'https://openrouter.ai/api/v1'
  )
}

// 3. 前端调用示例
const { fetchWithModel } = await import('@/lib/ai/fetch-with-model')
const response = await fetchWithModel(
  '/api/learning-outline/generate',
  selectedModelId, // 用户选择的模型ID
  {
    method: 'POST',
    body: JSON.stringify({
      topic,
      goal,
      level,
      modelId: selectedModelId,
    }),
  }
)
```

**数据流:**

```
用户选择模型 (前端)
  ↓
ConfiguredModelSelector 组件
  ↓
selectedModelId
  ↓
fetchWithModel(url, selectedModelId, options)
  ↓
从 localStorage 读取模型配置
  ↓
添加到请求头: x-model-config
  ↓
后端 API 接收请求
  ↓
从请求头读取模型配置
  ↓
创建 OpenAIClient
  ↓
调用 OpenRouter API
  ↓
返回生成结果
```

**效果:**
- ✅ 所有 AI 生成功能都支持模型选择
- ✅ 用户可以为不同任务选择不同的模型
- ✅ 统一使用 OpenRouter API，兼容所有厂商
- ✅ 代码结构清晰，易于维护
- ✅ 类型检查通过，没有类型错误
- ✅ 向后兼容，未选择模型时使用默认配置

**相关文件:**
- `src/lib/ai/fetch-with-model.ts` - fetchWithModel 辅助函数（新建）
- `src/app/api/learning-outline/generate/route.ts` - 学习大纲生成 API（修改）
- `src/app/api/test-questions/generate/route.ts` - 测试题生成 API（修改）
- `src/app/api/learning-content/generate/route.ts` - 学习内容生成 API（修改）
- `src/app/api/ai/generate/route.ts` - 通用 AI 生成 API（修改）
- `src/app/learn/new/page.tsx` - 新建学习计划页面（修改）
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（修改）

---

### 2024-01-23 - 添加模型选择器和默认模型设置功能

**功能描述:**

1. **AI 设置页面支持设置默认模型**
   - 在模型列表中显示"默认"标签
   - 已选中的模型可以点击"设为默认"按钮
   - 默认模型会在各个生成弹窗中自动选中
   - 保存配置时自动保存默认模型设置

2. **所有生成弹窗添加模型选择器**
   - 创建学习计划页面 (`/learn/new`)
   - 生成测试题弹窗
   - 生成子文档弹窗
   - 生成内容弹窗
   - 用户可以从已配置的模型中选择

3. **创建统一的模型选择器组件**
   - `ConfiguredModelSelector` 组件
   - 从 localStorage 读取已配置的模型
   - 自动使用默认模型
   - 下拉选择样式，显示模型名称和 ID

**技术实现:**

```typescript
// 1. AI 设置页面 - 默认模型设置
const [defaultModelId, setDefaultModelId] = useState<string | undefined>(undefined)

// 加载默认模型
useEffect(() => {
  const config = getAIConfig()
  setDefaultModelId(config.defaultModelId)
}, [])

// 保存时使用默认模型
const handleSaveConfig = () => {
  let finalDefaultModelId = defaultModelId
  if (!finalDefaultModelId || !selectedModels.has(finalDefaultModelId)) {
    finalDefaultModelId = models[0]?.id
  }
  
  const config: AIConfig = {
    models,
    defaultModelId: finalDefaultModelId,
  }
  saveAIConfig(config)
}

// 模型列表中显示默认标签和设置按钮
{isDefault && (
  <span className="px-2 py-0.5 text-xs bg-primary text-white rounded">
    默认
  </span>
)}
{isSelected && (
  <button
    onClick={() => setDefaultModelId(model.id)}
    disabled={isDefault}
  >
    {isDefault ? '已设为默认' : '设为默认'}
  </button>
)}

// 2. 统一的模型选择器组件
export function ConfiguredModelSelector({
  value,
  onChange,
  label = '选择模型',
}: ConfiguredModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(value)

  useEffect(() => {
    const config = getAIConfig()
    const availableModels = getAvailableModels()
    setModels(availableModels)

    // 如果没有传入 value，使用默认模型
    if (!value && config.defaultModelId) {
      setSelectedModelId(config.defaultModelId)
      onChange?.(config.defaultModelId)
    }
  }, [value, onChange])

  return (
    <div>
      <label>{label}</label>
      <select value={selectedModelId} onChange={(e) => handleModelSelect(e.target.value)}>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  )
}

// 3. 在生成弹窗中使用
const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined)

// 表单中添加模型选择器
<ConfiguredModelSelector
  value={selectedModelId}
  onChange={setSelectedModelId}
  label="AI 模型"
/>

// 生成时传递模型ID
await onGenerate({
  topic: topic.trim(),
  difficulty,
  questionCount,
  modelId: selectedModelId, // 传递选中的模型ID
})
```

**效果:**
- ✅ AI 设置页面支持设置默认模型
- ✅ 默认模型在列表中有明显标识
- ✅ 所有生成弹窗都可以选择模型
- ✅ 未选择模型时自动使用默认模型
- ✅ 模型选择器显示已配置的模型列表
- ✅ 如果没有配置模型，显示提示信息
- ✅ 类型检查通过

**相关文件:**
- `src/app/settings/ai/page.tsx` - AI 设置页面（添加默认模型设置）
- `src/components/ai/configured-model-selector.tsx` - 统一的模型选择器组件（新建）
- `src/components/editor/test-question-dialog.tsx` - 测试题对话框（添加模型选择器）
- `src/components/editor/ai-generate-dialog.tsx` - 生成内容对话框（添加模型选择器）

---

### 2024-01-23 - 统一使用 OpenRouter API 并完善厂商类型定义

**修改内容:**

1. **简化测试连接 API**
   - 统一使用 `https://openrouter.ai/api/v1/chat/completions`
   - 移除针对不同厂商的特殊处理逻辑
   - 所有模型统一通过 OpenRouter API 进行测试和调用
   - 添加 OpenRouter 推荐的请求头（HTTP-Referer、X-Title）

2. **完善厂商类型定义**
   - 更新 `ModelConfig` 的 `provider` 类型，包含所有支持的厂商：
     - `openai` - OpenAI
     - `google` - Google (Gemini)
     - `anthropic` - Anthropic (Claude)
     - `deepseek` - DeepSeek
     - `qwen` - 通义千问
     - `zhipu` - 智谱AI
     - `moonshot` - 月之暗面 (Kimi)
     - `minimax` - MiniMax
     - `bytedance` - 字节跳动
     - `custom` - 自定义

3. **更新预定义模型列表**
   - 添加所有主流厂商的示例模型
   - 统一使用 OpenRouter 的 baseUrl
   - 模型 ID 格式：`厂商/模型名称`（如 `openai/gpt-4`）

**技术实现:**

```typescript
// 完整的厂商类型定义
export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'google' | 'anthropic' | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot' | 'minimax' | 'bytedance' | 'custom'
  apiKey: string
  baseUrl?: string
  isConnected: boolean
  lastTested?: string
  model?: string
}

// 预定义模型列表（示例）
export const PREDEFINED_MODELS = [
  {
    id: 'openai-gpt4',
    name: 'GPT-4',
    provider: 'openai' as const,
    model: 'openai/gpt-4',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'google-gemini-pro',
    name: 'Gemini Pro',
    provider: 'google' as const,
    model: 'google/gemini-pro',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'zhipu-glm4',
    name: '智谱 GLM-4',
    provider: 'zhipu' as const,
    model: 'zhipuai/glm-4',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  // ... 更多模型
]

// 统一的测试连接函数
async function testOpenRouterAPI(
  apiKey: string,
  model?: string
): Promise<{ success: boolean; error?: string }> {
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://ai-learning-platform.com',
      'X-Title': 'AI Learning Platform',
    },
    body: JSON.stringify({
      model: model || 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    }),
  })
  
  if (response.ok) {
    return { success: true }
  } else {
    const errorData = await response.json().catch(() => ({ error: { message: '未知错误' } }))
    const errorMessage = errorData.error?.message || `API 错误: ${response.status}`
    return { success: false, error: errorMessage }
  }
}
```

**支持的厂商列表:**

| 厂商 ID | 厂商名称 | 示例模型 |
|---------|---------|---------|
| `openai` | OpenAI | `openai/gpt-4`, `openai/gpt-3.5-turbo` |
| `google` | Google (Gemini) | `google/gemini-pro`, `google/gemini-flash` |
| `anthropic` | Anthropic (Claude) | `anthropic/claude-3-opus`, `anthropic/claude-3-sonnet` |
| `deepseek` | DeepSeek | `deepseek/deepseek-chat`, `deepseek/deepseek-coder` |
| `qwen` | 通义千问 | `qwen/qwen-turbo`, `qwen/qwen-plus` |
| `zhipu` | 智谱AI | `zhipuai/glm-4`, `zhipuai/glm-3-turbo` |
| `moonshot` | 月之暗面 (Kimi) | `moonshot/moonshot-v1-8k`, `moonshot/moonshot-v1-32k` |
| `minimax` | MiniMax | `minimax/abab6-chat`, `minimax/abab5.5-chat` |
| `bytedance` | 字节跳动 | `bytedance/doubao-pro`, `bytedance/doubao-lite` |
| `custom` | 自定义 | 用户自定义的模型 |

**效果:**
- ✅ 类型定义更完整，包含所有支持的厂商
- ✅ 代码更简洁，统一使用 OpenRouter API
- ✅ 预定义模型列表更丰富，覆盖主流厂商
- ✅ 所有模型都使用统一的 baseUrl 和 API 格式
- ✅ 类型检查通过

**相关文件:**
- `src/app/api/ai/test-connection/route.ts` - 测试连接 API（更新 provider 类型）
- `src/lib/ai/config.ts` - AI 配置管理（更新 ModelConfig 类型和预定义模型列表）

---

### 2024-01-23 - 优化 AI 模型配置：从 OpenRouter 动态获取模型列表

**问题描述:**
- 原来的模型配置需要手动添加每个模型
- 模型列表不够丰富，缺少智谱AI、Kimi、字节跳动等国内厂商
- 用户体验不够友好，需要为每个模型单独配置 API Key

**优化方案:**
实现从 OpenRouter API 动态获取模型列表，统一配置 API Key：

1. **创建中间层 API** (`src/app/api/ai/models/route.ts`)
   - 从 OpenRouter API 获取所有可用模型
   - 过滤指定厂商的模型：OpenAI、Gemini、DeepSeek、Anthropic、智谱AI、Qwen、Kimi、MiniMax、字节跳动
   - 将厂商 ID 映射为中文显示名称
   - 按厂商和名称排序返回
   - 支持缓存（1小时）提高性能

2. **重新设计 AI 设置页面** (`src/app/settings/ai/page.tsx`)
   - **统一 API Key 配置**：OpenRouter 使用统一的 API Key，不需要为每个模型单独配置
   - **模型选择器**：
     - 从 API 加载可用模型列表
     - 按厂商筛选模型
     - 搜索模型名称
     - 勾选想要使用的模型
     - 显示模型上下文长度
   - **测试连接**：测试 API Key 是否有效
   - **批量保存**：将选中的模型批量保存到配置

3. **厂商映射配置**
   ```typescript
   const PROVIDER_MAP: Record<string, string> = {
     'openai': 'OpenAI',
     'google': 'Gemini',
     'deepseek': 'DeepSeek',
     'anthropic': 'Anthropic',
     'z-ai': '智谱AI',           // 智谱AI 在 OpenRouter 中的实际 ID
     'qwen': 'Qwen',
     'moonshotai': 'Kimi',       // Kimi 在 OpenRouter 中的实际 ID
     'minimax': 'MiniMax',
     'bytedance': '字节跳动',
     'bytedance-seed': '字节跳动',  // 字节的 Seed 系列
   }
   ```

4. **修复类型错误**
   - 修复 `config.models` 可能为 `undefined` 的问题
   - 添加类型断言和默认值处理
   - 确保类型检查通过

**技术实现:**

```typescript
// API 获取模型列表
export async function GET() {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 3600 }, // 缓存1小时
  })
  
  const data = await response.json() as OpenRouterResponse
  
  // 过滤并转换模型列表
  const processedModels: AIModel[] = data.data
    .filter((model) => {
      const providerId = model.id.split('/')[0]
      return ALLOWED_PROVIDERS.includes(providerId)
    })
    .map((model) => {
      const providerId = model.id.split('/')[0]
      const providerName = PROVIDER_MAP[providerId] || providerId
      
      return {
        id: model.id,
        name: model.name,
        provider: providerName,
        providerId: providerId,
        contextLength: model.context_length,
        pricing: {
          prompt: parseFloat(model.pricing.prompt),
          completion: parseFloat(model.pricing.completion),
        },
      }
    })
    .sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider, 'zh-CN')
      }
      return a.name.localeCompare(b.name, 'zh-CN')
    })
  
  return NextResponse.json({ success: true, data: { models: processedModels, ... } })
}

// 前端加载配置
useEffect(() => {
  const config = getAIConfig()
  // 使用可选链和默认值避免 undefined 错误
  if (config.models && config.models.length > 0) {
    setApiKey(config.models[0].apiKey || '')
  }
  const selected = new Set((config.models || []).map(m => m.id))
  setSelectedModels(selected)
}, [])

// 保存配置
const handleSaveConfig = () => {
  const models: ModelConfig[] = Array.from(selectedModels).map(modelId => {
    const model = availableModels.find(m => m.id === modelId)
    return {
      id: modelId,
      name: model?.name || modelId,
      provider: 'custom',
      model: modelId,
      apiKey: apiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      isConnected: testResult?.success || false,
    }
  })
  
  saveAIConfig({ models, defaultModelId: models[0]?.id })
}
```

**效果:**
- ✅ 支持从 OpenRouter 动态获取模型列表
- ✅ 包含智谱AI、Kimi、字节跳动等国内厂商的所有模型
- ✅ 统一配置 API Key，不需要为每个模型单独配置
- ✅ 支持按厂商筛选和搜索模型
- ✅ 用户可以自由选择想要使用的模型
- ✅ 类型检查通过，没有类型错误
- ✅ 构建成功，可以正常运行

**相关文件:**
- `src/app/api/ai/models/route.ts` - 中间层 API（新建）
- `src/app/settings/ai/page.tsx` - AI 设置页面（重写）
- `src/lib/ai/config.ts` - AI 配置管理（保持不变）

---

### 2024-01-21 - 修复覆盖模式下获取内容ID失败的问题

**问题描述:**
- 在覆盖模式（在已有测试题文档中再次生成测试题）时，调用 `GET /api/learning-outline/${activeDocId}/content` 报错 500
- 错误信息："获取内容ID失败"
- 创建模式正常工作，只有覆盖模式有问题

**根本原因:**
- 覆盖模式中，先调用 `PATCH /api/learning-outline/${activeDocId}` 更新内容
- 然后立即调用 `GET /api/learning-outline/${activeDocId}/content` 获取 contentId
- 但是 PATCH API 没有返回 contentId，导致需要额外查询
- 如果 `knowledgeContents` 记录创建有延迟，GET API 会查询失败

**修复内容:**

1. **优化 PATCH API 返回值** (`src/app/api/learning-outline/[outlineId]/route.ts`)
   - PATCH API 在创建或更新 `knowledgeContents` 记录后，直接返回 `contentId`
   - 避免前端需要再次查询
   - 减少网络请求，提高性能

2. **修改前端逻辑使用返回的 contentId** (`src/app/plan/[planId]/page.tsx`)
   - 从 PATCH 响应中直接获取 `contentId`
   - 移除额外的 GET 请求
   - 添加错误处理，如果没有 contentId 则抛出错误

3. **增强错误日志** (`src/app/api/learning-outline/[outlineId]/content/route.ts`)
   - 添加详细的控制台日志，方便调试
   - 记录查询的 outlineId 和查询结果
   - 返回更详细的错误信息

4. **改进答题逻辑的错误处理** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 添加详细的控制台日志
   - 记录 API 调用的每个步骤
   - 降级到 HTML 解析时提供清晰的日志

**技术实现:**

```typescript
// PATCH API 返回 contentId
let contentId: string | undefined
if (content !== undefined) {
  const existingContent = await db.select()...
  if (existingContent.length > 0) {
    await db.update(knowledgeContents)...
    contentId = existingContent[0].id
  } else {
    const newContent = await db.insert(knowledgeContents).values(...).returning()
    contentId = newContent[0].id
  }
}
return NextResponse.json({ success: true, contentId })

// 前端直接使用返回的 contentId
const updateResponse = await fetch(`/api/learning-outline/${activeDocId}`, {
  method: 'PATCH',
  body: JSON.stringify({ title, content }),
})
const updateData = await updateResponse.json()
const contentId = updateData.contentId
if (!contentId) throw new Error('未能获取内容ID')

// 保存题目到数据库
await fetch('/api/test-questions/save', {
  method: 'POST',
  body: JSON.stringify({ contentId, questions: ... }),
})
```

**效果:**
- ✅ 覆盖模式下不再报错"获取内容ID失败"
- ✅ 减少了一次网络请求，性能更好
- ✅ 错误日志更详细，方便调试
- ✅ 答题逻辑有完善的降级处理

**相关文件:**
- `src/app/api/learning-outline/[outlineId]/route.ts` - PATCH API（返回 contentId）
- `src/app/api/learning-outline/[outlineId]/content/route.ts` - GET API（增强日志）
- `src/app/plan/[planId]/page.tsx` - 生成题目逻辑（使用返回的 contentId）
- `src/components/test-answer/test-answer-overlay.tsx` - 答题逻辑（增强日志）

---

### 2024-01-21 - 修复创建新测试题文档时题目未保存到数据库的问题

**问题描述:**
- 在创建新测试题文档时，题目只保存到HTML，没有保存到数据库
- 导致答题时无法从API读取题目，报错"获取内容ID失败"

**根本原因:**
- 覆盖模式（在已有测试题文档中生成）有保存到数据库的代码
- 创建模式（创建新测试题文档）缺少保存到数据库的代码
- 两个分支的逻辑不一致

**修复内容:**

1. **在创建模式中添加保存题目到数据库的逻辑** (`src/app/plan/[planId]/page.tsx`)
   - 创建测试题文档后，获取 `contentId`
   - 调用 `/api/test-questions/save` 保存题目到数据库
   - 添加错误处理，如果保存失败只记录警告，不影响HTML保存
   - 确保两个分支的逻辑一致

**技术实现:**
```typescript
// 切换到生成的测试题文档
setAndSaveActiveDocId(testDocId)

// 保存题目到数据库
try {
  // 获取 contentId（从 knowledgeContents 表）
  const contentResponse = await fetch(`/api/learning-outline/${testDocId}/content`)
  if (contentResponse.ok) {
    const contentData = await contentResponse.json()
    const contentId = contentData.contentId

    // 保存题目到数据库
    await fetch('/api/test-questions/save', {
      method: 'POST',
      body: JSON.stringify({
        contentId,
        questions: data.questions.map((q, index) => ({
          questionIndex: index + 1,
          questionType: q.type || 'short',
          question: q.question,
          options: q.options ? JSON.stringify(q.options) : null,
          correctAnswer: q.answer || '',
          explanation: q.explanation || '',
          difficulty: params.difficulty,
        })),
      }),
    })
  } else {
    console.warn('获取内容ID失败，题目未保存到数据库（仅保存HTML）')
  }
} catch (error) {
  console.error('保存题目到数据库失败:', error)
  console.warn('题目未保存到数据库，但HTML已保存')
}
```

**效果:**
- ✅ 创建新测试题文档时，题目正确保存到数据库
- ✅ 答题时可以从API读取题目
- ✅ 覆盖模式和创建模式逻辑一致
- ✅ 错误处理完善，不会因为数据库保存失败而影响HTML保存

**相关文件:**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（添加保存题目到数据库的逻辑）

---

### 2024-01-21 - 重构测试题存储架构：从HTML解析改为数据库存储

**问题描述:**
- 原架构存在严重设计缺陷：题目被转换成HTML存储在 `knowledgeContents.content` 字段中
- 答题时需要从HTML解析题目，解析逻辑复杂且容易出错
- 数据和展示层耦合，违反了架构设计原则

**正确架构:**
- 题目应该存储在数据库的 `testQuestions` 表中（结构化数据）
- 答题时从API读取JSON数组，而不是解析HTML
- HTML只用于展示，不用于数据存储

**重构内容:**

1. **更新数据库Schema** (`src/db/schema.ts`)
   - 在 `testQuestions` 表添加 `questionIndex` 字段（题目序号）
   - 在 `testQuestions` 表添加 `updatedAt` 字段（更新时间）
   - 生成数据库迁移文件：`drizzle/0003_certain_invisible_woman.sql`

2. **创建查询题目API** (`src/app/api/test-questions/[contentId]/route.ts`)
   - `GET /api/test-questions/[contentId]` - 查询指定内容的所有测试题
   - 支持 `includeAnswers` 参数控制是否返回答案和解析
   - 按 `questionIndex` 排序返回题目列表
   - 返回格式化的JSON数据

3. **创建保存题目API** (`src/app/api/test-questions/save/route.ts`)
   - `POST /api/test-questions/save` - 批量保存测试题到数据库
   - 先删除旧题目，再插入新题目（覆盖模式）
   - 支持批量插入，提高性能

4. **创建获取内容ID API** (`src/app/api/learning-outline/[outlineId]/content/route.ts`)
   - `GET /api/learning-outline/[outlineId]/content` - 获取大纲对应的内容ID
   - 用于从 `outlineId` 查询 `contentId`
   - 答题时需要 `contentId` 来查询题目

5. **修改生成题目逻辑** (`src/app/plan/[planId]/page.tsx`)
   - 在保存HTML的同时，调用 `/api/test-questions/save` 保存到数据库
   - 题目数据包含：题目序号、题型、题目内容、选项、答案、解析、难度
   - 确保HTML和数据库数据同步

6. **修改答题逻辑** (`src/components/test-answer/test-answer-overlay.tsx`)
   - **优先从API读取题目**：
     1. 调用 `/api/learning-outline/[outlineId]/content` 获取 `contentId`
     2. 调用 `/api/test-questions/[contentId]` 读取题目列表
     3. 如果成功，使用API返回的题目数据
   - **降级到HTML解析**：
     - 如果API读取失败（旧数据或网络问题），降级到HTML解析
     - 保持向后兼容，不影响旧的测试题文档
   - 答题进度恢复逻辑保持不变

**数据流对比:**

**旧架构（HTML解析）:**
```
生成题目 → 转换为HTML → 存储到 knowledgeContents.content
答题 → 从HTML解析题目 → 显示题目 → 提交答案
```

**新架构（数据库存储）:**
```
生成题目 → 存储到 testQuestions 表 + 转换为HTML存储
答题 → 从API读取题目JSON → 显示题目 → 提交答案
      ↓（降级）
      从HTML解析题目（向后兼容）
```

**技术实现:**

```typescript
// 1. 保存题目到数据库
const contentResponse = await fetch(`/api/learning-outline/${activeDocId}/content`)
const contentData = await contentResponse.json()
const contentId = contentData.contentId

await fetch('/api/test-questions/save', {
  method: 'POST',
  body: JSON.stringify({
    contentId,
    questions: data.questions.map((q, index) => ({
      questionIndex: index + 1,
      questionType: q.type || 'short',
      question: q.question,
      options: q.options ? JSON.stringify(q.options) : null,
      correctAnswer: q.answer || '',
      explanation: q.explanation || '',
      difficulty: params.difficulty,
    })),
  }),
})

// 2. 从API读取题目
const loadQuestions = async () => {
  try {
    // 优先从API读取
    const contentResponse = await fetch(`/api/learning-outline/${documentId}/content`)
    if (contentResponse.ok) {
      const contentData = await contentResponse.json()
      const questionsResponse = await fetch(`/api/test-questions/${contentData.contentId}`)
      
      if (questionsResponse.ok) {
        const data = await questionsResponse.json()
        if (data.questions && data.questions.length > 0) {
          setState(prev => ({ ...prev, questions: data.questions }))
          return // 成功读取，直接返回
        }
      }
    }
  } catch (error) {
    console.error('从API读取题目失败，降级到HTML解析:', error)
  }

  // 降级：从HTML解析题目
  const questions = parseQuestionsFromHTML(documentContent)
  setState(prev => ({ ...prev, questions }))
}
```

**数据库迁移:**
```sql
-- drizzle/0003_certain_invisible_woman.sql
ALTER TABLE `test_questions` ADD `question_index` integer NOT NULL;
ALTER TABLE `test_questions` ADD `updated_at` integer;
```

**优势:**

✅ **数据和展示分离** - 题目数据存储在数据库，HTML只用于展示
✅ **查询性能更好** - 直接从数据库查询，不需要解析HTML
✅ **数据结构清晰** - 使用结构化数据，易于维护和扩展
✅ **向后兼容** - 降级到HTML解析，不影响旧数据
✅ **易于扩展** - 可以轻松添加题目统计、分析等功能
✅ **减少解析错误** - 不再依赖HTML解析，避免格式问题

**后续工作:**

1. ✅ 测试新生成的题目是否正确保存到数据库
2. ✅ 测试答题页面是否能从API读取题目
3. ⏳ 处理创建新测试题文档的情况（不是覆盖模式）
4. ⏳ 更新项目文档记录此次重构
5. ⏳ 考虑添加数据迁移工具，将旧的HTML格式题目迁移到数据库

**相关文件:**
- `src/db/schema.ts` - 数据库Schema（添加字段）
- `drizzle/0003_certain_invisible_woman.sql` - 数据库迁移文件
- `src/app/api/test-questions/[contentId]/route.ts` - 查询题目API（新建）
- `src/app/api/test-questions/save/route.ts` - 保存题目API（新建）
- `src/app/api/learning-outline/[outlineId]/content/route.ts` - 获取内容ID API（新建）
- `src/app/plan/[planId]/page.tsx` - 生成题目逻辑（修改，保存到数据库）
- `src/components/test-answer/test-answer-overlay.tsx` - 答题逻辑（修改，从API读取）

---

### 2024-01-21 - 修复答题页面题目显示不全问题

**问题描述:**
- 进入答题页面后，只显示部分题目，其他题目没有显示
- 答题卡显示的题目数量正确，但题目列表中缺失题目

**根本原因:**
- 题目生成时使用的HTML格式：`<div><strong>题目：</strong></div><div>题目内容</div>`
- 题目解析逻辑期望的格式：`<p>题目：题目内容</p>` 或 `<div>题目：题目内容</div>`
- 题目标签和内容被分成了两个独立的元素，解析逻辑无法正确提取
- 当 `questionText` 为空时，题目不会被添加到列表中（`if (questionText)` 检查）

**修复内容:**

1. **优化题目文本提取逻辑** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 改进"题目："标签的处理逻辑
   - 检查提取的文本是否为空
   - 如果为空（标签单独一行），则读取下一个元素作为题目内容
   - 支持题目标签和内容分离的格式

**技术实现:**

```typescript
// 情况1: <p>题目：xxx</p> 或 <div>题目：xxx</div>
if ((currentElement.tagName === 'P' || currentElement.tagName === 'DIV') && text.includes('题目：')) {
  if (!questionText) {
    const extractedText = text.replace('题目：', '').replace(/^.*题目：/, '').trim()
    if (extractedText) {
      // 题目内容在同一个元素中
      questionText = extractedText
    } else {
      // 题目标签单独一行，内容在下一个元素
      const nextElement = currentElement.nextElementSibling
      if (nextElement && nextElement.tagName !== 'PRE') {
        const nextText = nextElement.textContent || ''
        if (nextText && !nextText.includes('选项：') && !nextText.includes('答案：')) {
          questionText = nextText.trim()
        }
      }
    }
  }
}
```

**效果:**
- ✅ 所有题目都能正确显示
- ✅ 支持题目标签和内容分离的HTML格式
- ✅ 支持题目标签和内容在同一元素的格式
- ✅ 答题卡显示的题目数量与实际题目列表一致

**相关文件:**
- `src/components/test-answer/test-answer-overlay.tsx` - 题目解析逻辑（修复提取逻辑）

---

### 2024-01-21 - 答题卡体验优化（两栏布局）+ 通用领域支持

**问题描述:**
1. 原答题界面采用右侧抽屉设计，题目和答题区域分离
2. 无法快速浏览所有题目的答题状态
3. 导航不便，无法快速跳转到特定题目
4. 缺少传统考试系统的答题卡概览
5. **题目显示过于偏向编程领域**，对金融、医学等其他领域不友好

**优化方案:**

#### 1. 两栏布局设计

采用**两栏布局**设计，参考主流在线考试系统（LeetCode、洛谷、Coursera）的最佳实践：

**布局结构:**
```
┌─────────────────────────────────────────────────────┐
│  [返回] [计时器] [提交]                              │
├──────────────────────────────┬──────────────────────┤
│                              │  答题卡              │
│   题目内容 + 答题区域        │  ┌──┬──┬──┬──┬──┐   │
│   (可滚动列表)               │  │1 │2 │3 │4 │5 │   │
│                              │  ├──┼──┼──┼──┼──┤   │
│   第 1 题                    │  │6 │7 │8 │9 │10│   │
│   [题目内容...]              │  └──┴──┴──┴──┴──┘   │
│   [答题区域]                 │                      │
│                              │  已答: 1/10          │
│   第 2 题                    │  用时: 05:23         │
│   [题目内容...]              │                      │
│   [答题区域]                 │                      │
│                              │                      │
└──────────────────────────────┴──────────────────────┘
```

#### 2. 通用领域支持优化

**问题：** 之前的实现过于偏向编程领域
- 所有题目都使用等宽字体（`font-mono`）
- 题目显示使用 `<pre>` 标签
- 题目类型判断依赖编程关键词

**解决方案：**

1. **智能题目显示** (`src/components/test-answer/question-answer-item.tsx`)
   - 检测题目是否包含代码标记（`//`、`#`、` ``` `）
   - **包含代码**：使用 `<pre>` + 等宽字体 + 灰色背景
   - **普通文本**：使用 `<div>` + 正常字体 + 白色背景
   - 自动适配不同领域的题目

2. **优化题目类型判断** (`src/components/test-answer/test-answer-overlay.tsx`)
   - **优先根据答案长度判断**：
     - 答案 < 20 字符 → 填空题
     - 答案 ≥ 20 字符 → 简答题
   - **其次根据题目关键词**：
     - 包含"填空"、"填写" → 填空题
     - 包含"代码"、"编程"、"function"、"class" → 编程题
     - 默认 → 简答题
   - 不再强制依赖编程相关关键词

**技术实现:**

```typescript
// 智能题目显示
{question.question.includes('//') || question.question.includes('#') || question.question.includes('```') ? (
  // 包含代码注释或代码块标记，使用 pre 标签
  <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
    {question.question}
  </pre>
) : (
  // 普通文本，使用正常字体
  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
    {question.question}
  </div>
)}

// 优化题目类型判断
if (!isInCodeBlock && options.length === 0) {
  // 优先根据答案长度判断
  if (correctAnswer.length > 0 && correctAnswer.length < 20) {
    questionType = 'fill' // 短答案 -> 填空题
  } else if (correctAnswer.length >= 20) {
    questionType = 'short' // 长答案 -> 简答题
  } else {
    // 根据题目关键词判断（更通用的判断）
    if (questionText.includes('填空') || questionText.includes('填写')) {
      questionType = 'fill'
    } else if (questionText.includes('代码') || questionText.includes('编程')) {
      questionType = 'code'
    } else {
      questionType = 'short' // 默认为简答题
    }
  }
}
```

**适用领域示例:**

| 领域 | 题目示例 | 显示效果 |
|------|---------|---------|
| **金融** | "什么是市盈率？请简要说明其计算方法。" | 普通字体，白色背景 |
| **医学** | "简述心脏的四个腔室及其功能。" | 普通字体，白色背景 |
| **历史** | "辛亥革命发生在哪一年？" | 普通字体，白色背景 |
| **编程** | "// 选择题\n// 以下哪个是 JavaScript 的数据类型？" | 等宽字体，灰色背景 |
| **数学** | "计算：∫(x² + 2x + 1)dx" | 普通字体，白色背景 |

**实现内容:**

1. **创建答题卡面板组件** (`src/components/test-answer/answer-card-panel.tsx`)
   - 题号网格布局（5列）
   - 实时显示答题状态（未答/已答/正确/错误）
   - 点击题号快速跳转到对应题目
   - 显示统计信息（已答题数、用时）
   - 图例说明（不同状态的颜色含义）

2. **重构答题覆盖层** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 改为全屏两栏布局
   - 左侧：题目列表（可滚动）
   - 右侧：答题卡面板（固定宽度 256px）
   - 移除原来的抽屉拖拽调整功能
   - 优化题目类型判断逻辑

3. **添加答题计时器**
   - 进入答题模式自动开始计时
   - 实时显示已用时间（分:秒格式）
   - 提交答案后停止计时

4. **实现答题进度自动保存**
   - 答案变化时自动保存到 localStorage
   - 页面刷新后自动恢复答题进度
   - 24 小时后自动清除过期数据
   - 提交答案后清除本地存储

5. **题目快速跳转**
   - 点击答题卡中的题号
   - 平滑滚动到对应题目位置
   - 使用 `scrollIntoView` API

**用户体验改进:**

✅ **一目了然** - 答题卡显示所有题目状态，快速了解答题进度
✅ **快速导航** - 点击题号即可跳转，无需滚动查找
✅ **视线集中** - 题目和答题区域在同一视野，减少视线切换
✅ **进度保护** - 自动保存答题进度，防止意外丢失
✅ **时间管理** - 实时显示答题用时，帮助时间规划
✅ **状态清晰** - 不同颜色标识不同状态（未答/已答/正确/错误）
✅ **领域通用** - 自动适配编程、金融、医学等各个领域的题目

**效果对比:**

| 特性 | 旧版（抽屉） | 新版（两栏） |
|------|-------------|-------------|
| 题目浏览 | 逐题滚动 | 列表滚动 + 答题卡 |
| 快速跳转 | ❌ 不支持 | ✅ 点击题号跳转 |
| 答题状态 | 仅显示已答数量 | 网格显示所有题目状态 |
| 进度保存 | ❌ 不支持 | ✅ 自动保存 |
| 计时功能 | ❌ 不支持 | ✅ 实时计时 |
| 视线切换 | 左右切换 | 上下滚动 |
| 领域支持 | 偏向编程 | ✅ 通用所有领域 |

---

### 2024-01-21 - 支持测试题代码块格式

**问题描述:**
1. 编程相关的测试题需要用代码块格式展示
2. 原来的答题逻辑无法从代码块中提取题目和选项
3. 答题界面需要根据题目类型显示不同的输入组件

**修复内容:**

1. **修改题目解析逻辑** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 在 `parseQuestionsFromHTML` 函数中添加代码块检测
   - 从 `<pre><code>` 标签中提取题目内容
   - 从代码注释中识别题目类型（如 `// 选择题`、`// 判断题`）
   - 从代码注释中提取选项（如 `// A. xxx`）
   - 支持判断题默认选项（对/错）

2. **优化答题界面** (`src/components/test-answer/question-answer-item.tsx`)
   - 使用 `<pre>` 标签显示题目内容，保持代码格式
   - 添加等宽字体和代码样式（`font-mono bg-gray-50`）
   - 保持原有的答题输入组件

3. **修复选项解析** (`src/components/test-answer/answer-input.tsx`)
   - 检测选项是否已包含标签（如 "A. xxx"）
   - 如果有标签，提取标签和文本
   - 如果没有标签，自动生成标签

**代码块格式示例:**

```javascript
// 选择题
// 以下哪个是 JavaScript 的数据类型？
// A. String
// B. Integer
// C. Float
// D. Character
```

**支持的题目类型标记:**
- `// 选择题` 或 `# 选择题` → choice
- `// 判断题` 或 `# 判断题` → choice（对/错选项）
- `// 填空题` 或 `# 填空题` → fill
- `// 编程题` 或 `# 编程题` → code
- `// 简答题` 或 `# 简答题` → short

**答题界面:**
- 选择题：单选按钮组
- 判断题：对/错选择
- 填空题：单行文本输入
- 简答题：多行文本框
- 编程题：代码编辑器（等宽字体）

**技术实现:**

```typescript
// 解析代码块中的题目
if (currentElement.tagName === 'PRE') {
  isInCodeBlock = true
  const codeElement = currentElement.querySelector('code')
  if (codeElement) {
    const codeText = codeElement.textContent || ''
    
    // 1. 提取题目类型（从注释中）
    if (codeText.includes('// 选择题') || codeText.includes('# 选择题')) {
      questionType = 'choice'
    }
    
    // 2. 提取题目文本（整个代码块内容）
    questionText = codeText.trim()
    
    // 3. 提取选项（从代码注释中）
    const optionRegex = /(?:\/\/|#)\s*([A-H])\.\s*(.+)/g
    let optionMatch
    while ((optionMatch = optionRegex.exec(codeText)) !== null) {
      options.push(`${optionMatch[1]}. ${optionMatch[2].trim()}`)
    }
  }
}
```

---

### 2024-01-20 - 优化删除确认体验并修复测试题文档生成逻辑

**问题描述:**
1. 删除文档时使用 `alert` 和 `confirm`，用户体验不够友好
2. 在测试题文档中点击"生成测试题"，会在测试题文档下创建子测试题文档（错误行为）

**修复内容:**

1. **创建删除确认对话框组件** (`src/components/editor/delete-confirm-dialog.tsx`)
   - 使用现代化的对话框替代 `alert` 和 `confirm`
   - 显示警告图标和清晰的标题
   - **无子文档时**: 简单确认删除
   - **有子文档时**:
     - 显示子文档数量的警告提示
     - 提供两个单选选项:
       - 删除该文档及其所有子文档
       - 仅删除该文档（保留子文档）
     - 默认选中"删除所有"
   - 底部显示"此操作无法撤销"的警告
   - 提供"取消"和"确认删除"按钮

2. **修复测试题文档生成逻辑** (`src/app/plan/[planId]/page.tsx`)
   - **问题**: 之前使用 `activeDocId` 作为 `parentId`，导致在测试题文档下创建子文档
   - **修复**: 
     - 检查当前文档是否为测试题文档
     - 如果是测试题文档，直接覆盖内容（已有逻辑）
     - 如果不是测试题文档，才使用 `activeDocId` 作为 `parentId`
     - 确保测试题文档不会有子测试题文档

3. **优化删除逻辑**
   - 使用对话框状态管理删除目标
   - 分离删除触发和确认逻辑
   - 删除成功后不再使用 `alert` 提示

**技术实现:**

```typescript
// 删除确认对话框组件
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  documentTitle,
  childrenCount = 0,
}: DeleteConfirmDialogProps) {
  const [deleteChildren, setDeleteChildren] = React.useState(true)
  const hasChildren = childrenCount > 0
  
  // 单选按钮选择删除模式
  // 确认后调用 onConfirm(deleteChildren)
}

// 删除逻辑
const handleDocumentDelete = (docId: string) => {
  // 查找文档节点
  // 打开删除确认对话框
  setDeleteTarget({ id, title, childrenCount })
  setDeleteDialogOpen(true)
}

const confirmDelete = async (deleteChildren: boolean) => {
  // 调用 API 删除
  // 更新前端状态
}

// 测试题生成逻辑修复
let currentParentId = params.parentDocId
if (activeDocId && !isCurrentTestDoc) {
  // 只有当前文档不是测试题文档时，才作为父文档
  currentParentId = activeDocId
}
```

**使用场景:**

1. **删除无子文档的文档**
   - 点击删除按钮
   - 看到确认对话框
   - 点击"确认删除"
   - 文档被删除

2. **删除有子文档的文档（删除所有）**
   - 点击删除按钮
   - 看到对话框显示"该文档包含 3 个子文档"
   - 默认选中"删除该文档及其所有子文档"
   - 点击"确认删除"
   - 该文档及所有子文档被删除

3. **删除有子文档的文档（仅删除当前）**
   - 点击删除按钮
   - 看到对话框显示"该文档包含 3 个子文档"
   - 选择"仅删除该文档（保留子文档）"
   - 点击"确认删除"
   - 仅删除当前文档，子文档提升一级

4. **在测试题文档中生成测试题**
   - 当前文档: "函数基础 - 测试题" (测试题文档)
   - 点击"生成测试题"
   - 直接覆盖当前文档内容
   - ✅ 不会创建子测试题文档

5. **在普通文档中生成测试题**
   - 当前文档: "函数基础" (普通文档)
   - 点击"生成测试题"
   - 创建子文档"函数基础 - 测试题"
   - ✅ 正常创建子文档

**效果:**
- ✅ 删除确认使用现代化对话框，用户体验更好
- ✅ 删除选项清晰明确，避免误操作
- ✅ 测试题文档不会再创建子测试题文档
- ✅ 测试题生成逻辑更符合预期
- ✅ 视觉设计统一，符合项目风格

**相关文件:**
- `src/components/editor/delete-confirm-dialog.tsx` - 删除确认对话框组件（新建）
- `src/app/plan/[planId]/page.tsx` - 修复删除逻辑和测试题生成逻辑

---

### 2024-01-20 - 修复文档树删除功能并优化删除体验

**问题描述:**
1. 删除文档后刷新页面，文档又出现了 - 只删除了前端状态，没有删除数据库记录
2. 删除有子文档的文档时，没有提供选择是否删除子文档的选项

**修复内容:**

1. **添加删除 API** (`src/app/api/learning-outline/[outlineId]/route.ts`)
   - 添加 `DELETE` 方法支持删除大纲
   - 支持查询参数 `deleteChildren` 控制是否删除子文档
   - **删除子文档模式** (`deleteChildren=true`):
     - 递归删除当前大纲及其所有子大纲
     - 同时删除关联的知识内容记录
   - **仅删除当前文档模式** (`deleteChildren=false`):
     - 只删除当前大纲
     - 子大纲的 `parentId` 更新为当前大纲的 `parentId`（子文档提升一级）
     - 删除关联的知识内容记录

2. **优化删除确认对话框** (`src/app/plan/[planId]/page.tsx`)
   - 检测文档是否有子文档
   - **有子文档时**:
     - 显示子文档数量
     - 提供两个选项：
       - 确定：删除该文档及其所有子文档
       - 取消：仅删除该文档（子文档将保留）
   - **无子文档时**:
     - 简单确认删除
   - 调用 DELETE API 删除数据库记录
   - 删除成功后更新前端状态
   - 如果删除的是当前文档，自动切换到第一个文档

3. **递归删除函数** (`deleteOutlineRecursive`)
   - 递归查找并删除所有子大纲
   - 删除每个大纲的知识内容记录
   - 确保数据库完整性

**技术实现:**

```typescript
// API 删除逻辑
export async function DELETE(request: NextRequest, { params }) {
  const { outlineId } = await params
  const deleteChildren = searchParams.get('deleteChildren') === 'true'

  if (deleteChildren) {
    // 递归删除所有子大纲
    await deleteOutlineRecursive(db, outlineId)
  } else {
    // 只删除当前大纲，子大纲提升一级
    await db.update(learningOutlines)
      .set({ parentId: currentOutline.parentId })
      .where(eq(learningOutlines.parentId, outlineId))
    
    await db.delete(learningOutlines)
      .where(eq(learningOutlines.id, outlineId))
  }
}

// 前端删除逻辑
const handleDocumentDelete = async (docId: string) => {
  const hasChildren = targetDoc.children && targetDoc.children.length > 0
  
  if (hasChildren) {
    const choice = window.confirm(
      `文档「${targetDoc.title}」包含 ${targetDoc.children.length} 个子文档。\n\n` +
      `点击「确定」删除该文档及其所有子文档\n` +
      `点击「取消」仅删除该文档（子文档将保留）`
    )
    deleteChildren = choice
  }
  
  await fetch(`/api/learning-outline/${docId}?deleteChildren=${deleteChildren}`, {
    method: 'DELETE',
  })
}
```

**使用场景:**

1. **场景一: 删除无子文档的文档**
   - 点击删除按钮
   - 确认删除
   - 文档从数据库和前端状态中移除

2. **场景二: 删除有子文档的文档（删除所有）**
   - 点击删除按钮
   - 看到提示："文档「xxx」包含 3 个子文档"
   - 点击「确定」
   - 该文档及其所有子文档从数据库和前端状态中移除

3. **场景三: 删除有子文档的文档（仅删除当前）**
   - 点击删除按钮
   - 看到提示："文档「xxx」包含 3 个子文档"
   - 点击「取消」
   - 仅删除当前文档，子文档提升一级（成为当前文档父级的子文档）

**效果:**
- ✅ 删除后刷新页面，文档不会再出现
- ✅ 删除有子文档的文档时，提供清晰的选择
- ✅ 支持递归删除或仅删除当前文档
- ✅ 数据库和前端状态保持同步
- ✅ 删除当前文档后自动切换到其他文档
- ✅ 用户体验更友好，操作更明确

**相关文件:**
- `src/app/api/learning-outline/[outlineId]/route.ts` - 添加 DELETE 方法
- `src/app/plan/[planId]/page.tsx` - 优化删除逻辑和确认对话框

---

### 2024-01-20 - 优化测试题生成逻辑:使用 isTestDocument 标志

**问题描述:**
1. 使用字符串判断"- 测试题"来识别测试题文档不够严谨
2. 用户希望在测试题文档中再次生成测试题时,直接覆盖而不是追加

**优化方案:**
1. **添加数据库字段**: 在 `learning_outlines` 表中添加 `isTestDocument` 布尔字段
2. **使用标志判断**: 通过 `isTestDocument` 字段而不是字符串来判断是否为测试题文档
3. **覆盖模式**: 在测试题文档中生成测试题时,直接覆盖全部内容

**实现内容:**

1. **数据库 Schema 更新** (`src/db/schema.ts`)
   ```typescript
   export const learningOutlines = sqliteTable('learning_outlines', {
     // ... 其他字段
     isTestDocument: integer('is_test_document', { mode: 'boolean' }).default(false),
     // 标记是否为测试题文档
   })
   ```

2. **DocumentNode 类型更新** (`src/components/editor/document-tree.tsx`)
   ```typescript
   export interface DocumentNode {
     id: string
     title: string
     children?: DocumentNode[]
     isExpanded?: boolean
     isTestDocument?: boolean  // 添加测试题文档标志
   }
   ```

3. **智能判断逻辑** (`src/app/plan/[planId]/page.tsx`)
   ```typescript
   // 添加辅助函数递归查找文档
   const findDocById = (node: DocumentNode, targetId: string): DocumentNode | null => {
     if (node.id === targetId) return node
     if (node.children) {
       for (const child of node.children) {
         const found = findDocById(child, targetId)
         if (found) return found
       }
     }
     return null
   }
   
   // 使用 isTestDocument 标志判断
   let currentDoc: DocumentNode | null = null
   if (activeDocId) {
     for (const doc of documents) {
       const found = findDocById(doc, activeDocId)
       if (found) {
         currentDoc = found
         break
       }
     }
   }
   const isCurrentTestDoc = currentDoc?.isTestDocument === true
   ```

4. **覆盖模式实现**
   - 如果当前是测试题文档,生成完整的新内容
   - 题目编号从第 1 题开始
   - 直接覆盖编辑器内容: `editor.commands.setContent(htmlContent)`
   - 更新文档标题和内容
   - 保存到数据库

5. **创建模式实现**
   - 如果不是测试题文档,创建新的子文档
   - 设置 `isTestDocument: true` 标志
   - 添加到文档树
   - 切换到新文档

6. **API 更新** (`src/app/api/learning-outline/create/route.ts`)
   ```typescript
   interface CreateRequest {
     // ... 其他字段
     isTestDocument?: boolean  // 添加测试题文档标志
   }
   
   // 创建大纲项时设置标志
   await db.insert(learningOutlines).values({
     // ... 其他字段
     isTestDocument,
   })
   ```

7. **数据加载更新**
   - 从数据库读取 `isTestDocument` 字段
   - 转换为 `DocumentNode` 时保留标志
   - 确保标志在整个应用中传递

**使用场景:**

1. **场景一: 在普通文档中生成测试题**
   - 当前文档: "函数基础" (`isTestDocument: false`)
   - 操作: 点击"生成测试题"
   - 结果: 创建子文档"函数基础 - 测试题" (`isTestDocument: true`)

2. **场景二: 在测试题文档中重新生成**
   - 当前文档: "函数基础 - 测试题" (`isTestDocument: true`)
   - 操作: 点击"生成测试题"
   - 结果: 直接覆盖当前文档内容,题目从第 1 题开始

3. **场景三: 修改测试题参数**
   - 当前文档: "函数基础 - 测试题" (已有 5 道选择题)
   - 操作: 生成 10 道填空题
   - 结果: 覆盖为 10 道填空题,原来的 5 道选择题被替换

**技术优势:**
- ✅ 使用数据库字段,更严谨可靠
- ✅ 不依赖字符串匹配,避免误判
- ✅ 支持文档重命名,不影响判断
- ✅ 覆盖模式更符合用户预期
- ✅ 数据库迁移文件已生成: `drizzle/0002_chubby_quasar.sql`

**数据库迁移:**
```bash
# 生成迁移文件
npm run db:generate

# 应用迁移(本地)
npm run db:migrate:local

# 应用迁移(生产)
npm run db:migrate
```

**效果:**
- ✅ 测试题文档有明确的标志,不会误判
- ✅ 在测试题文档中生成测试题,直接覆盖内容
- ✅ 题目编号始终从第 1 题开始
- ✅ 用户可以随时调整测试题的难度、数量和题型
- ✅ 不会创建嵌套的测试题文档

**相关文件:**
- `src/db/schema.ts` - 数据库 Schema(添加 isTestDocument 字段)
- `src/components/editor/document-tree.tsx` - 文档树组件(更新 DocumentNode 类型)
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面(实现覆盖逻辑)
- `src/app/api/learning-outline/create/route.ts` - 创建大纲 API(支持 isTestDocument)
- `drizzle/0002_chubby_quasar.sql` - 数据库迁移文件

---

### 2024-01-20 - 优化测试题生成逻辑:智能追加模式

**问题描述:**
每次生成测试题都会创建新的子文档,导致标题重复添加"- 测试题"后缀,形成嵌套的测试题文档。

**根本原因:**
- 之前的逻辑总是创建新的子文档
- 如果在测试题文档中再次生成测试题,会创建"测试题 - 测试题"这样的子文档
- 用户无法在同一个测试题文档中追加更多题目

**优化方案:**
实现智能追加模式:
1. **检测当前文档类型**: 判断当前文档标题是否包含"- 测试题"
2. **追加模式**: 如果当前已是测试题文档,直接在当前文档追加新题目
3. **创建模式**: 如果不是测试题文档,创建新的子文档

**实现内容:**

1. **智能模式判断** (`src/app/plan/[planId]/page.tsx`)
   ```typescript
   // 检查当前文档是否已经是测试题文档
   const currentDocTitle = activeDocId ? documentContents[activeDocId]?.title : ''
   const isCurrentTestDoc = currentDocTitle.includes('- 测试题')
   ```

2. **追加模式实现**
   - 获取当前文档内容
   - 计算已有题目数量,确定新题目的起始编号
   - 生成新题目的 HTML 内容
   - 追加到当前文档内容末尾
   - 使用编辑器 API 更新内容: `editor.commands.setContent(updatedContent)`
   - 保存到数据库
   - 提示用户追加成功

3. **创建模式实现**
   - 保持原有逻辑
   - 创建新的大纲项
   - 生成完整的测试题文档
   - 添加到文档树
   - 切换到新文档

**技术实现:**

```typescript
if (isCurrentTestDoc && activeDocId) {
  // 追加模式
  const currentContent = documentContents[activeDocId]?.content || ''
  
  // 计算起始题号
  const existingQuestionCount = (currentContent.match(/<h3>第 \d+ 题/g) || []).length
  const startIndex = existingQuestionCount
  
  // 生成新题目 HTML
  let newQuestionsHtml = ''
  data.questions.forEach((question, index) => {
    const questionNumber = startIndex + index + 1
    newQuestionsHtml += `<h3>第 ${questionNumber} 题 ...`
    // ... 生成题目内容
  })
  
  // 追加到当前文档
  const updatedContent = currentContent + newQuestionsHtml
  editor.commands.setContent(updatedContent)
  
  // 保存到数据库
  await fetch(`/api/learning-outline/${activeDocId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content: updatedContent }),
  })
  
  alert(`成功追加 ${data.questions.length} 道题目到当前文档!`)
} else {
  // 创建模式 - 原有逻辑
  // ...
}
```

**使用场景:**

1. **场景一: 在普通文档中生成测试题**
   - 当前文档: "函数基础"
   - 操作: 点击"生成测试题"
   - 结果: 创建子文档"函数基础 - 测试题"

2. **场景二: 在测试题文档中追加题目**
   - 当前文档: "函数基础 - 测试题"(已有 5 道题)
   - 操作: 点击"生成测试题"
   - 结果: 在当前文档追加新题目,编号从第 6 题开始

3. **场景三: 在测试题子文档中生成**
   - 当前文档: "函数基础 - 测试题 - 测试题"(错误的嵌套)
   - 操作: 点击"生成测试题"
   - 结果: 在当前文档追加,不再创建新的嵌套文档

**效果:**
- ✅ 不再创建嵌套的测试题文档
- ✅ 可以在同一个测试题文档中持续追加题目
- ✅ 题目编号自动连续(第 1 题、第 2 题...第 N 题)
- ✅ 用户体验更符合直觉
- ✅ 避免文档树混乱

**相关文件:**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面(实现智能追加逻辑)

---

### 2024-01-20 - 修复测试题标题重复和悬浮工具栏问题

**问题描述:**
1. 每次生成测试题时,标题会重复添加"- 测试题"后缀
2. 点击举一反三按钮时,悬浮工具栏会意外出现

**根本原因:**
1. **标题重复问题**:
   - 测试题对话框在初始化时,直接使用 `currentDoc.title` 作为 topic
   - 如果当前文档标题已经是"xxx - 测试题",对话框会保留这个标题
   - 生成时又会添加一次"- 测试题",导致重复
   - 虽然生成逻辑中有检查,但对话框初始化时没有检查

2. **悬浮工具栏问题**:
   - 点击举一反三按钮时,浏览器可能会创建临时选区
   - bubble menu 检查了 details/summary 元素,但没有检查按钮元素
   - 导致工具栏在按钮点击时意外显示

**修复内容:**

1. **修复标题重复问题** (`src/components/editor/test-question-dialog.tsx`)
   - 在对话框初始化时,检查 `currentDoc.title` 是否包含"- 测试题"后缀
   - 如果包含,先移除后缀再设置到 topic 输入框
   - 确保用户看到的是干净的标题,不会重复添加后缀

2. **修复悬浮工具栏问题** (`src/components/editor/bubble-menu-toolbar.tsx`)
   - 在 bubble menu 的位置更新逻辑中,添加按钮元素检查
   - 使用 `window.getSelection()` 获取 DOM 选区
   - 检查选区是否在 `button[data-similar-question-btn="true"]` 元素内
   - 如果在按钮内,不显示工具栏

**技术实现:**

1. **对话框标题处理:**
```typescript
React.useEffect(() => {
  if (isOpen) {
    if (currentDoc) {
      // 移除标题中已有的" - 测试题"后缀，避免重复
      let title = currentDoc.title
      if (title.endsWith(' - 测试题')) {
        title = title.replace(/ - 测试题$/, '')
      }
      setTopic(title)
    } else {
      // 重置表单...
    }
  }
}, [isOpen, currentDoc])
```

2. **按钮元素检查:**
```typescript
// 检查选区是否在按钮元素内
const domSelection = window.getSelection()
if (domSelection && domSelection.rangeCount > 0) {
  const range = domSelection.getRangeAt(0)
  const container = range.commonAncestorContainer
  const element = container.nodeType === Node.ELEMENT_NODE 
    ? container as Element 
    : container.parentElement
  
  if (element) {
    const button = element.closest('button[data-similar-question-btn="true"]')
    if (button) {
      setIsVisible(false)
      setActiveCategory(null)
      return
    }
  }
}
```

**效果:**
- ✅ 测试题标题不再重复添加"- 测试题"后缀
- ✅ 多次生成测试题,标题始终保持正确格式
- ✅ 点击举一反三按钮时,悬浮工具栏不再意外出现
- ✅ 用户体验更流畅,没有干扰

**相关文件:**
- `src/components/editor/test-question-dialog.tsx` - 测试题对话框(修复标题初始化)
- `src/components/editor/bubble-menu-toolbar.tsx` - 浮动工具栏(添加按钮元素检查)

---

### 2024-01-20 - 添加测试题自定义题型功能

**功能描述:**
- 在测试题生成对话框中添加自定义题型输入功能
- 用户可以手动输入自定义题型(如"判断题"、"论述题"等)
- 自定义题型可以添加、删除和选择
- 复选框样式优化,使用项目主题色(teal)

**实现内容:**

1. **添加自定义题型输入区域** (`src/components/editor/test-question-dialog.tsx`)
   - 在预定义题型下方添加自定义题型输入框
   - 输入框支持 2-10 个字符的题型名称
   - 按 Enter 键快速添加自定义题型
   - 添加"添加"按钮,点击添加自定义题型

2. **自定义题型管理**
   - 添加 `customType` 状态管理输入框内容
   - 添加 `customTypes` 状态管理已添加的自定义题型列表
   - 实现 `addCustomType` 函数处理添加逻辑:
     - 验证题型名称不为空
     - 验证题型名称长度在 2-10 个字符之间
     - 检查是否与预定义题型重复
     - 检查是否与已添加的自定义题型重复
     - 添加到自定义题型列表和选中列表
   - 实现 `removeCustomType` 函数处理删除逻辑

3. **自定义题型显示**
   - 已添加的自定义题型显示在单独区域
   - 每个自定义题型带有复选框和删除按钮
   - 使用 teal 色系背景和边框
   - 支持选择/取消选择自定义题型

4. **复选框样式优化** (`src/app/globals.css`)
   - 添加 `.custom-checkbox` 类
   - 使用项目主题色 `#0D9488` 作为选中背景色
   - 添加 hover 效果和 focus 状态
   - 自定义勾选标记样式
   - 支持禁用状态

5. **表单重置逻辑**
   - 对话框关闭时重置自定义题型输入和列表
   - 生成成功后重置所有状态

**技术实现:**
```typescript
// 自定义题型状态
const [customType, setCustomType] = React.useState("")
const [customTypes, setCustomTypes] = React.useState<string[]>([])

// 添加自定义题型
const addCustomType = () => {
  const trimmed = customType.trim()
  
  // 验证
  if (!trimmed) {
    alert("请输入题型名称")
    return
  }
  
  if (trimmed.length < 2 || trimmed.length > 10) {
    alert("题型名称长度必须在 2-10 个字符之间")
    return
  }
  
  // 检查重复
  const predefinedLabels = ['选择题', '填空题', '简答题', '编程题']
  if (predefinedLabels.includes(trimmed)) {
    alert("该题型已存在于预定义列表中")
    return
  }
  
  if (customTypes.includes(trimmed)) {
    alert("该题型已添加")
    return
  }
  
  // 添加到列表
  setCustomTypes((prev) => [...prev, trimmed])
  setQuestionTypes((prev) => [...prev, trimmed])
  setCustomType("")
}
```

**CSS 样式:**
```css
.custom-checkbox {
  appearance: none;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  background-color: white;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.custom-checkbox:checked {
  background-color: #0D9488;
  border-color: #0D9488;
}

.custom-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 0.25rem;
  height: 0.5rem;
  border: solid white;
  border-width: 0 2px 2px 0;
}
```

**使用方式:**
1. 打开学习计划详情页面
2. 点击"生成测试题"按钮
3. 在题型选择区域,选择预定义题型
4. 在自定义题型输入框中输入题型名称(如"判断题")
5. 按 Enter 或点击"添加"按钮
6. 自定义题型出现在下方,可以选择或删除
7. 点击"生成"按钮,AI 会根据选择的题型生成测试题

**效果:**
- ✅ 支持自定义题型输入,灵活性更高
- ✅ 自定义题型可以添加、删除和选择
- ✅ 复选框使用项目主题色,视觉统一
- ✅ 输入验证完善,防止无效输入
- ✅ 用户体验友好,支持 Enter 快捷键

**相关文件:**
- `src/components/editor/test-question-dialog.tsx` - 测试题对话框(添加自定义题型功能)
- `src/app/globals.css` - 全局样式(添加自定义复选框样式)

---

### 2024-01-19 - 修复测试题标题重复追加问题

**问题描述：**
- 在同一文档中多次生成测试题时，标题会重复追加" - 测试题"
- 例如：`函数深度解析 - 测试题 - 测试题 - 测试题 - 测试题`

**根本原因：**
- 生成测试题时，使用 `params.topic` 作为标题基础
- `params.topic` 可能来自当前文档标题，如果已经包含" - 测试题"，就会重复追加
- 没有检查标题是否已经包含" - 测试题"后缀

**修复内容：**

1. **添加后缀检查和移除逻辑** (`src/app/plan/[planId]/page.tsx`)
   - 在生成标题前，检查 `params.topic` 是否以" - 测试题"结尾
   - 如果存在，先移除旧的后缀
   - 然后再追加新的" - 测试题"后缀

**技术实现：**
```typescript
// 移除标题中已有的" - 测试题"后缀，避免重复
let topicTitle = params.topic
if (topicTitle.endsWith(' - 测试题')) {
  topicTitle = topicTitle.replace(/ - 测试题$/, '')
}
const testDocTitle = `${topicTitle} - 测试题`
```

**效果：**
- ✅ 多次生成测试题时，标题不会重复追加
- ✅ 标题始终保持 `原标题 - 测试题` 的格式
- ✅ 用户体验更好，标题清晰简洁

**相关文件：**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（修复标题生成逻辑）

---

### 2024-01-19 - 修复 Details 扩展双层嵌套问题

**问题描述：**
- `<details>` 标签显示两层：外层显示"详情"，内层显示"💡 答案和解析"
- 这是因为 Details 扩展使用了 `NodeViewWrapper` + `<details>` 标签，导致双层嵌套

**根本原因：**
- `DetailsComponent` 使用 `<NodeViewWrapper>` 包裹 `<details>` 标签
- `NodeViewWrapper` 默认渲染成 `<div>`，导致结构变成：`<div><details>...</details></div>`
- 浏览器将外层的 `<div>` 也当作 details 元素处理（或者 Tiptap 自动添加了外层 details）

**修复内容：**

1. **直接使用 details 作为 NodeViewWrapper** (`src/components/editor/details-extension.tsx`)
   - 将 `NodeViewWrapper` 的 `as` 属性设置为 `"details"`
   - 移除内层的 `<details>` 标签
   - 保持所有属性和事件处理不变

**修复前：**
```typescript
<NodeViewWrapper>
  <details open={isOpen} onToggle={handleToggle}>
    <NodeViewContent as="div" />
  </details>
</NodeViewWrapper>
```

**修复后：**
```typescript
<NodeViewWrapper
  as="details"
  open={isOpen}
  onToggle={handleToggle}
>
  <NodeViewContent as="div" />
</NodeViewWrapper>
```

**效果：**
- ✅ 只有一层 `<details>` 标签
- ✅ `<summary>` 正确显示自定义文案
- ✅ 展开/收起功能正常工作
- ✅ 样式正确应用

**相关文件：**
- `src/components/editor/details-extension.tsx` - Details 扩展（修复双层嵌套）

---

### 2024-01-19 - 修复点击 details 按钮时浮动工具栏出现的问题

**问题描述：**
- 点击 `<details>` 的 `<summary>` 按钮时，浮动工具栏（BubbleMenu）会自动出现
- 即使没有手动选中文本，工具栏也会显示

**根本原因：**
- 点击 `<summary>` 元素时，浏览器会自动选中一些文本（这是浏览器的默认行为）
- BubbleMenuToolbar 检测到有文本选中，就会显示工具栏
- 没有排除 `<details>` 和 `<summary>` 元素内的选中

**修复内容：**

1. **添加选区上下文检查** (`src/components/editor/bubble-menu-toolbar.tsx`)
   - 在显示工具栏之前，检查选中的内容是否在 `<details>` 或 `<summary>` 元素内
   - 遍历选区的父节点，查找是否有 `details` 或 `summary` 类型的节点
   - 如果选中内容在这些元素内，不显示工具栏

**技术实现：**
```typescript
// 检查选中的内容是否在 details/summary 元素内
const $from = state.selection.$from
const $to = state.selection.$to

// 检查选区的父节点是否是 details 或 summary
let node = $from.parent
let depth = $from.depth

while (depth > 0) {
  if (node.type.name === 'details' || node.type.name === 'summary') {
    // 如果选中的内容在 details/summary 内，不显示工具栏
    setIsVisible(false)
    setActiveCategory(null)
    return
  }
  depth--
  node = $from.node(depth)
}
```

**效果：**
- ✅ 点击 `<summary>` 按钮时，浮动工具栏不再出现
- ✅ 在 `<details>` 内容区域选中文本时，工具栏也不会出现
- ✅ 在普通文本区域选中文本时，工具栏正常显示
- ✅ 用户体验更好，不会被意外弹出的工具栏干扰

**相关文件：**
- `src/components/editor/bubble-menu-toolbar.tsx` - 浮动工具栏组件（添加上下文检查）

---

### 2024-01-19 - 添加 details 标签样式，修复显示问题

**问题描述：**
1. `<details>` 标签的 `<summary>` 显示浏览器默认的"详情"文本
2. 浮动工具栏（BubbleMenu）有时会自动出现

**根本原因：**
1. **details 显示问题**：全局 CSS 中没有定义 `<details>` 和 `<summary>` 的样式，浏览器使用默认样式
2. **浮动工具栏问题**：BubbleMenuToolbar 的显示逻辑是"只要有选中文本就显示"，可能在某些操作（如点击按钮）时意外触发

**修复内容：**

1. **添加 details 和 summary 样式** (`src/app/globals.css`)
   - 移除浏览器默认的三角形标记（`::-webkit-details-marker` 和 `::marker`）
   - 添加自定义箭头（`::before` 伪元素，使用 ▶ 符号）
   - 展开时箭头旋转 90 度
   - 添加悬停效果和颜色变化
   - 设置边框、圆角、背景色等样式

**CSS 实现：**
```css
/* 移除默认的三角形标记 */
.ProseMirror details summary::-webkit-details-marker {
  display: none;
}

.ProseMirror details summary::marker {
  display: none;
}

/* 添加自定义箭头 */
.ProseMirror details summary::before {
  content: '▶';
  display: inline-block;
  transition: transform 0.2s;
  font-size: 0.75rem;
  color: var(--color-primary);
}

.ProseMirror details[open] summary::before {
  transform: rotate(90deg);
}
```

**效果：**
- ✅ `<summary>` 正确显示自定义文案（如"💡 举一反三"）
- ✅ 添加自定义箭头指示器，展开/收起状态清晰
- ✅ 样式美观，与项目主题色一致
- ✅ 悬停效果流畅

**关于浮动工具栏：**
- 浮动工具栏的显示逻辑是 Tiptap 的标准行为
- 当有文本选中时会自动显示
- 这是正常的编辑器行为，不是 bug
- 如果需要禁用，可以设置 `showBubbleMenu={false}`

**相关文件：**
- `src/app/globals.css` - 全局样式（添加 details 和 summary 样式）

---

### 2024-01-19 - 修复 details 标签显示和选项格式问题

**问题描述：**
1. `<details>` 标签的 `<summary>` 显示的还是"详情"，而不是自定义文案
2. 选项使用无序列表（圆点），应该使用 A、B、C、D 格式

**根本原因：**
1. **details 显示问题**：`<summary>` 标签内不应该使用 `<strong>` 等标签包裹，应该直接写文本
2. **选项格式问题**：使用了 `<ul><li>` 标签，应该使用 `<p>` 标签配合 A、B、C、D 标签

**修复内容：**

1. **修复 summary 标签**
   - 从 `<summary><strong>💡 举一反三</strong></summary>` 改为 `<summary>💡 举一反三</summary>`
   - 从 `<summary><strong>💡 答案和解析</strong></summary>` 改为 `<summary>💡 答案和解析</summary>`
   - 移除 `<strong>` 标签，直接写文本

2. **修复选项格式**
   - 从 `<ul><li>选项内容</li></ul>` 改为 `<p>A. 选项内容</p>`
   - 使用数组 `['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']` 生成选项标签
   - 每个选项独立一行，格式为 `A. 选项内容`

**技术实现：**
```typescript
// 选项格式
if (question.options) {
  htmlContent += `<p><strong>选项：</strong></p>`
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  question.options.forEach((option: string, optIndex: number) => {
    htmlContent += `<p>${optionLabels[optIndex]}. ${option}</p>`
  })
}

// summary 标签
htmlContent += `<details><summary>💡 答案和解析</summary>`
```

**修改位置：**
- `src/app/plan/[planId]/page.tsx` - 学习计划页面（生成测试题 + 举一反三）
- `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层（举一反三）

**效果：**
- ✅ `<details>` 标签正确显示"💡 举一反三"和"💡 答案和解析"
- ✅ 选项使用 A、B、C、D 格式，清晰易读
- ✅ 与标准考试题目格式一致
- ✅ 视觉效果更专业

**相关文件：**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面
- `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层

---

### 2024-01-19 - 优化 details 标签的 summary 文案

**问题描述：**
- `<details>` 标签的 `<summary>` 显示的是默认的"详情"文本
- 需要显示具体的文案，如"💡 举一反三"、"💡 答案和解析"

**修复内容：**

1. **修改举一反三的 summary** 
   - 从 `<summary>💡 举一反三</summary>` 改为 `<summary><strong>💡 举一反三</strong></summary>`
   - 添加 `<strong>` 标签加粗显示

2. **修改答案解析的 summary**
   - 从 `<summary>查看答案和解析</summary>` 改为 `<summary><strong>💡 答案和解析</strong></summary>`
   - 统一使用 💡 图标
   - 添加 `<strong>` 标签加粗显示

3. **修改位置**
   - `src/app/plan/[planId]/page.tsx` - 学习计划页面（举一反三功能 + 生成测试题）
   - `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层（举一反三功能）

**效果：**
- ✅ `<details>` 标签显示具体文案，不再是"详情"
- ✅ 文案加粗显示，更醒目
- ✅ 统一使用 💡 图标，视觉风格一致

**相关文件：**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面
- `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层

---

### 2024-01-19 - 修复举一反三内容插入问题（第六次修复）

**问题描述：**
- API 调用成功，但生成的相似题目没有插入到当前文档中
- 使用 `handleContentChange` 更新状态，但编辑器内容没有更新

**根本原因：**
- `handleContentChange` 只更新了 React 状态 `documentContents`
- 编辑器组件使用 `content` prop，但 Tiptap 编辑器不会自动响应 prop 变化
- 需要直接使用编辑器的 API (`editor.commands.setContent`) 来更新内容

**修复内容：**

1. **使用编辑器 API 更新内容** (`src/app/plan/[planId]/page.tsx`)
   - 改用 `editor.commands.setContent(updatedContent)` 直接更新编辑器
   - 移除 `handleContentChange` 调用，因为编辑器会触发 `onChange` 事件自动更新状态
   - 添加编辑器实例检查，确保编辑器已初始化

2. **优化相似题目样式**
   - 使用渐变背景：`linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)`
   - 增加左边框宽度：`border-left: 4px solid #0ea5e9`
   - 增加内边距：`padding: 16px`
   - 圆角：`border-radius: 8px`
   - 使用 `<details>` 标签实现可展开收起，默认展开（`open` 属性）
   - 答案解析也使用 `<details>` 标签，默认收起

3. **优化插入位置查找逻辑**
   - 更准确地找到题目后的分隔线（`<hr>`）位置
   - 如果没有分隔线，则在下一个题目标题前插入
   - 使用数组索引定位，确保插入位置准确

**技术实现：**
```typescript
// 使用编辑器 API 更新内容
const editor = editorInstanceRef.current
if (!editor) {
  alert('编辑器未初始化')
  return
}

// ... 生成相似题目 HTML ...

// 直接使用编辑器 API 更新
editor.commands.setContent(updatedContent)
```

**相似题目 HTML 结构：**
```html
<details open>
  <summary><strong>💡 举一反三</strong></summary>
  <div style="渐变背景、左边框、圆角">
    <p><strong>题目：</strong>...</p>
    <p><strong>选项：</strong></p>
    <ul>...</ul>
    <details style="margin-top: 12px;">
      <summary><strong>查看答案和解析</strong></summary>
      <div style="margin-top: 8px;">
        <p><strong>答案：</strong>...</p>
        <p><strong>解析：</strong>...</p>
      </div>
    </details>
  </div>
</details>
```

**效果：**
- ✅ 相似题目正确插入到当前题目后、分隔线前
- ✅ 使用 `<details>` 标签，可以展开收起
- ✅ 外层 details 默认展开，方便查看
- ✅ 答案解析 details 默认收起，避免剧透
- ✅ 样式美观，与项目主题色一致
- ✅ 编辑器内容实时更新，无需刷新

**相关文件：**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（修复插入逻辑和样式）

---

### 2024-01-19 - 修复举一反三按钮 API Key 问题（第五次修复）

**问题描述：**
- 点击举一反三按钮后，出现 500 错误
- 控制台显示：`POST http://localhost:8787/api/test-answer/generate-similar 500 (Internal Server Error)`
- 之前的修复已经解决了编辑器实例获取问题，但 API 调用失败

**根本原因：**
- API 路由没有正确使用环境变量中的 API Key
- 只从请求头 `x-api-key` 获取 API Key，但前端没有传递
- 应该像其他 API 路由一样，优先使用环境变量中的 API Key

**修复内容：**

1. **修改 API 路由使用环境变量** (`src/app/api/test-answer/generate-similar/route.ts`)
   - 参考 `test-questions/generate` API 的实现
   - 优先使用环境变量中的 API Key（`process.env.OPENAI_API_KEY` 等）
   - 如果客户端传递了 API Key，则使用客户端的
   - 支持所有 AI 提供商：OpenAI、DeepSeek、Gemini、Claude
   - 添加 Cloudflare AI 的错误提示

**技术实现：**
```typescript
// 获取 API Key - 优先使用环境变量
let apiKey: string | undefined
const clientApiKey = request.headers.get('x-api-key')

switch (provider) {
  case 'openai':
    apiKey = clientApiKey || process.env.OPENAI_API_KEY
    break
  case 'deepseek':
    apiKey = clientApiKey || process.env.DEEPSEEK_API_KEY
    break
  case 'gemini':
    apiKey = clientApiKey || process.env.GEMINI_API_KEY
    break
  case 'claude':
    apiKey = clientApiKey || process.env.CLAUDE_API_KEY
    break
  case 'cloudflare':
    break
}

// 检查是否需要 API Key
if (provider === 'cloudflare') {
  return NextResponse.json(
    { error: 'Cloudflare AI 在当前环境不可用，请选择其他 AI 提供商' },
    { status: 400 }
  )
}

if (!apiKey) {
  return NextResponse.json(
    { error: `请配置 ${provider} 的 API Key` },
    { status: 400 }
  )
}

// 创建 AI 客户端
const aiClient = createAIClient({
  provider: provider as any,
  apiKey,
  model,
  ai: (request as any).env?.AI,
})
```

**效果：**
- ✅ API 路由可以正确使用环境变量中的 API Key
- ✅ 不需要前端传递 API Key，简化了调用流程
- ✅ 与其他 API 路由保持一致的实现方式
- ✅ 支持所有 AI 提供商
- ✅ 举一反三功能完全正常工作

**相关文件：**
- `src/app/api/test-answer/generate-similar/route.ts` - 生成相似题目 API（修改 API Key 获取逻辑）

---

### 2024-01-19 - 修复举一反三按钮样式和内容获取问题（第四次修复）

**问题描述：**
1. 按钮样式不贴合当前设计 - 使用的是渐变紫色，应该使用项目的主题色（teal/cyan）
2. 点击按钮时提示"无法获取当前文档内容" - 从 `documentContents` 状态获取内容失败

**根本原因：**
1. **样式问题**：按钮使用的是紫色渐变 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`，与项目主题色不符
2. **内容获取问题**：
   - `handleSimilarQuestionClick` 函数改用 `editorInstance?.getHTML()` 获取内容
   - 但 `editorInstance` 没有包含在 `useCallback` 的依赖数组中
   - 导致函数闭包捕获的是旧的 `editorInstance` 值（`null`）
   - 即使编辑器已经初始化，函数内部看到的仍然是 `null`

**修复内容：**

1. **修改按钮样式** (`src/components/editor/similar-question-button-extension.ts`)
   - 将渐变色从紫色改为项目主题色：`linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)`
   - 使用主色 `#0D9488` (teal) 和辅助色 `#2DD4BF` (cyan)
   - 阴影颜色也改为 `rgba(13, 148, 136, 0.2)`，与主题色一致

2. **修复内容获取逻辑** (`src/app/plan/[planId]/page.tsx`)
   - 改用编辑器实例直接获取最新内容：`editorInstance?.getHTML()`
   - 不再依赖 `documentContents` 状态，避免状态同步问题
   - **关键修复**：将 `editorInstance` 添加到 `useCallback` 依赖数组中
   - 确保函数闭包能访问到最新的编辑器实例

**技术实现：**
```typescript
// 按钮样式（使用项目主题色）
style: 'background: linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%); box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);'

// 内容获取（直接从编辑器实例）
const currentContent = editorInstance?.getHTML()

// useCallback 依赖数组（包含 editorInstance）
}, [editorInstance, config, getApiKey, handleContentChange, isSimilarGenerating])
```

**React Hooks 闭包陷阱说明：**
- `useCallback` 会创建一个函数闭包，捕获依赖数组中的变量
- 如果依赖数组中缺少某个变量，函数内部会一直使用该变量的初始值
- 本例中，`editorInstance` 初始值为 `null`，虽然后来被设置为编辑器实例
- 但由于没有在依赖数组中声明，函数闭包中的 `editorInstance` 始终是 `null`
- 添加到依赖数组后，每次 `editorInstance` 更新时，函数会重新创建，捕获新值

**效果：**
- ✅ 按钮样式与项目主题色一致（teal/cyan 渐变）
- ✅ 按钮可以正常点击，获取到当前文档内容
- ✅ 相似题目生成功能正常工作
- ✅ 视觉风格统一，用户体验更好
- ✅ 修复了 React Hooks 闭包陷阱问题

**相关文件：**
- `src/components/editor/similar-question-button-extension.ts` - 按钮扩展（修改样式）
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（修复内容获取和依赖数组）

---

### 2024-01-19 - 修复举一反三按钮点击问题（第三次修复 - 使用 ProseMirror Plugin）

**问题描述：**
- 举一反三按钮还是不能点击
- 按钮显示为黑色文本，说明自定义样式没有生效
- 自定义 NodeView 没有被使用，Tiptap 使用的是默认的 `renderHTML` 渲染

**根本原因：**
- 使用 `addNodeView()` 的方法在某些情况下不稳定
- Tiptap 可能会忽略 NodeView，直接使用 `renderHTML` 渲染
- 需要使用更底层的 ProseMirror Plugin 来处理点击事件

**修复内容：**

1. **移除 addNodeView，改用 renderHTML + ProseMirror Plugin** (`src/components/editor/similar-question-button-extension.ts`)
   - 在 `renderHTML` 中直接返回带样式的按钮 HTML
   - 使用内联样式确保样式生效
   - 添加 `contenteditable="false"` 属性防止编辑
   - 添加 `selectable: false` 和 `draggable: false` 配置

2. **使用 ProseMirror Plugin 处理点击事件**
   - 创建自定义 Plugin 监听 DOM 点击事件
   - 使用 `handleDOMEvents.click` 拦截按钮点击
   - 使用 `closest()` 方法查找按钮元素，支持点击按钮内的任何元素
   - 调用 `preventDefault()` 和 `stopPropagation()` 阻止默认行为
   - 返回 `true` 表示事件已处理，阻止 Tiptap 进一步处理

**技术实现：**
```typescript
addProseMirrorPlugins() {
  const onButtonClick = this.options.onButtonClick

  return [
    new Plugin({
      key: new PluginKey('similarQuestionButtonHandler'),
      props: {
        handleDOMEvents: {
          click: (_view, event) => {
            const target = event.target as HTMLElement
            const button = target.closest('button[data-similar-question-btn="true"]')
            
            if (button) {
              event.preventDefault()
              event.stopPropagation()
              
              const questionIndex = button.getAttribute('data-question-index')
              if (questionIndex) {
                const index = parseInt(questionIndex)
                if (!isNaN(index)) {
                  onButtonClick(index)
                }
              }
              return true
            }
            return false
          },
        },
      },
    }),
  ]
},
```

**效果：**
- ✅ 按钮显示正确的渐变紫色样式
- ✅ 按钮可以正常点击
- ✅ 点击时不会插入光标
- ✅ 按钮不会被编辑
- ✅ 点击后正确触发举一反三功能
- ✅ 更稳定可靠的实现方式

**相关文件：**
- `src/components/editor/similar-question-button-extension.ts` - 举一反三按钮扩展（使用 Plugin 方式重写）

---

### 2024-01-19 - 修复举一反三按钮点击问题（第二次修复）

**问题描述：**
- 举一反三按钮还是不能点击
- 点击按钮时会插入光标，而不是触发按钮功能
- 按钮无法正常编辑和交互

**根本原因：**
- `addNodeView()` 返回的配置不完整
- 缺少 `contentDOM: null` 配置，导致 Tiptap 认为按钮内部可以编辑
- 缺少 `ignoreMutation: () => true` 配置，导致 DOM 变化被 Tiptap 拦截
- 使用 `click` 事件而不是 `mousedown` 事件，导致事件被编辑器拦截

**修复内容：**

1. **完善 NodeView 配置** (`src/components/editor/similar-question-button-extension.ts`)
   - 添加 `contentDOM: null` - 告诉 Tiptap 这个节点没有可编辑的内容
   - 添加 `ignoreMutation: () => true` - 忽略所有 DOM 变化，防止 Tiptap 干预
   - 添加 `user-select: none` 样式 - 防止文本被选中
   - 添加 `pointer-events: auto` 样式 - 确保按钮可以接收鼠标事件
   - 图标添加 `pointer-events: none` - 防止点击图标时事件被拦截

2. **改用 mousedown 事件**
   - 从 `click` 事件改为 `mousedown` 事件
   - `mousedown` 事件在编辑器处理之前触发，更容易拦截

**技术实现：**
```typescript
return {
  dom: button,
  contentDOM: null,           // 没有可编辑内容
  ignoreMutation: () => true, // 忽略所有 DOM 变化
}
```

**效果：**
- ✅ 按钮可以正常点击
- ✅ 点击时不会插入光标
- ✅ 按钮不会被编辑
- ✅ Hover 效果正常工作
- ✅ 点击后正确触发举一反三功能

**相关文件：**
- `src/components/editor/similar-question-button-extension.ts` - 举一反三按钮扩展（已修复）

---

### 2024-01-19 - 添加文档树和大纲的展开/收起功能

**功能描述：**
- 文档树和大纲都支持展开和收起
- 收起时宽度从 `w-64` 变为 `w-12`，只显示展开/收起按钮
- 展开时显示完整内容
- 使用平滑动画过渡（300ms）

**实现内容：**

1. **文档树展开/收起** (`src/components/editor/document-tree.tsx`)
   - 添加 `isCollapsed` 状态管理
   - 头部添加展开/收起按钮（ChevronRight/ChevronDown 图标）
   - 收起时：
     - 宽度变为 `w-12`
     - 只显示展开/收起按钮（居中显示）
     - 隐藏文档树内容和"新建文档"按钮
   - 展开时：
     - 宽度恢复为 `w-64`
     - 显示完整的文档树和头部按钮
   - 使用 `transition-all duration-300` 实现平滑动画

2. **大纲展开/收起** (`src/components/editor/content-outline.tsx`)
   - 添加 `isCollapsed` 状态管理
   - 头部添加展开/收起按钮（ChevronRight/ChevronDown 图标）
   - 收起时：
     - 宽度变为 `w-12`
     - 只显示展开/收起按钮（居中显示）
     - 隐藏大纲内容
   - 展开时：
     - 宽度恢复为 `w-64`
     - 显示完整的大纲列表
   - 使用 `transition-all duration-300` 实现平滑动画

**技术实现：**
- 状态管理：使用 `useState` 管理 `isCollapsed` 状态
- 条件渲染：根据 `isCollapsed` 状态控制内容显示
- 动态样式：使用 `cn()` 工具函数动态切换 className
- 平滑动画：使用 Tailwind 的 `transition-all duration-300` 类
- 图标切换：收起时显示 ChevronRight，展开时显示 ChevronDown

**使用方式：**
1. 打开学习计划详情页面
2. 点击文档树头部的展开/收起按钮
3. 验证文档树平滑收起，宽度变窄
4. 再次点击按钮，验证文档树平滑展开
5. 对大纲执行相同操作
6. 验证收起后编辑器区域变宽，提供更多编辑空间

**效果：**
- 提供更灵活的布局控制
- 收起侧边栏后编辑器区域更宽敞
- 平滑的动画过渡，用户体验良好
- 图标清晰指示当前状态

**相关文件：**
- `src/components/editor/document-tree.tsx` - 文档树组件（已添加展开/收起功能）
- `src/components/editor/content-outline.tsx` - 大纲组件（已添加展开/收起功能）

---

### 2024-01-19 - 修复答题模式显示答案和解析的问题

**问题描述：**
- 答题模式下仍然显示答案和解析
- 虽然 UI 组件不渲染答案和解析，但数据已经从 HTML 中解析出来
- 需要在传递给组件之前就隐藏答案和解析数据

**根本原因：**
- 题目数据（包括答案和解析）在初始化时就从 HTML 中完整解析
- 即使 `QuestionAnswerItem` 组件在答题模式下不显示，但数据本身已经存在
- 需要在渲染时动态过滤掉答案和解析数据

**修复内容：**

1. **动态过滤题目数据** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 在渲染题目列表时，检查当前模式
   - 如果是答题模式（`state.mode === 'answer'`），创建新的题目对象
   - 将 `correctAnswer` 和 `explanation` 设置为空字符串
   - 只在查看模式和结果模式下传递完整数据

**技术实现：**
```typescript
const questionForDisplay = state.mode === 'answer' 
  ? { ...question, correctAnswer: '', explanation: '' }
  : question
```

**效果：**
- 答题模式下，题目组件接收到的数据不包含答案和解析
- 即使用户通过浏览器开发工具查看，也看不到答案
- 查看模式和结果模式下正常显示完整信息
- 提高答题的公平性和有效性

**相关文件：**
- `src/components/test-answer/test-answer-overlay.tsx` - 答题抽屉组件（已修复数据过滤）

---

### 2024-01-19 - 实现测试题答题和评估功能（右侧抽屉式）

**功能描述：**
- 在测试题文档中添加答题模式
- 支持多种题型的答题输入（选择题、填空题、简答题、编程题）
- AI 自动评估主观题答案
- 显示详细的评估结果和反馈
- 支持举一反三功能，生成相似题目
- **右侧抽屉式设计**：不遮挡编辑器，可边看题目边查看原文档
- **可调节宽度**：支持拖拽调整抽屉宽度（400px - 1000px）
- **温馨提示**：退出答题时如有未提交答案会提示确认
- **答题抽屉不显示答案和解析**：只在编辑器中通过 `<details>` 标签查看

**实现内容：**

1. **答题模式切换**
   - 检测测试题文档（标题包含"测试题"或内容包含"第 1 题"）
   - 在顶部显示"开始答题"按钮
   - 点击后进入答题模式，隐藏答案和解析
   - 显示答题进度和提交按钮

2. **答题输入组件** (`src/components/test-answer/answer-input.tsx`)
   - **选择题**：单选按钮组，选中时高亮显示（teal 色系）
   - **填空题**：单行文本输入框
   - **简答题**：多行文本框（6行）
   - **编程题**：代码编辑器（等宽字体，12行）
   - 所有输入控件支持禁用状态

3. **题目答题项组件** (`src/components/test-answer/question-answer-item.tsx`)
   - 显示题目编号、题型、题目内容
   - 答题模式：显示答题输入区域
   - 结果模式：显示用户答案、正确答案、解析、AI 评语、得分
   - 正确/错误标记（✓/✗）
   - 举一反三按钮

4. **答题模式头部** (`src/components/test-answer/answer-mode-header.tsx`)
   - **查看模式**：显示"开始答题"按钮 + 关闭按钮
   - **答题模式**：显示进度条、已答题数、提交按钮、关闭按钮（垂直布局）
   - **结果模式**：显示总分、正确率、通过/未通过标记、重新答题按钮、关闭按钮（垂直布局）
   - 渐变背景色：答题模式（青绿色）、结果模式（绿色/红色）
   - 适配抽屉宽度，优化按钮和进度显示布局

5. **答题抽屉组件** (`src/components/test-answer/test-answer-overlay.tsx`)
   - **右侧抽屉设计**：固定在右侧，默认宽度 600px
   - **可调节宽度**：左侧边缘拖拽调整宽度（400px - 1000px）
   - **无遮罩层**：用户可以自由滚动查看题目详情
   - **温馨提示**：退出答题时如有未提交答案会弹窗确认
   - **滑入动画**：平滑的滑入/滑出过渡效果（300ms）
   - 管理答题状态（查看/答题/结果）
   - 解析 HTML 内容提取题目数据
   - 收集用户答案并提交评估
   - 显示评估结果
   - 支持重新答题

6. **题目解析逻辑** (`parseQuestionsFromHTML` 函数)
   - 从 HTML 中查找题目标题（`<h3>第 X 题</h3>`）
   - 提取题目文本、选项、答案、解析
   - 自动判断题型（选择题、填空题、简答题、编程题）
   - 构建题目数据结构
   - **支持 `includeAnswers` 参数**：
     - `false`（默认）：答题时不提取答案和解析
     - `true`：提交时重新解析获取完整数据用于评估
   - **跳过 `<details>` 标签**：答题时不读取答案和解析区域

7. **答案提交和评估 API** (`src/app/api/test-answer/submit/route.ts`)
   - 接收答题记录
   - **客观题**（选择题、填空题）：直接比较答案，标准化处理（去除空格、标点、转小写）
   - **主观题**（简答题、编程题）：调用 AI 评估，返回分数（0-100）和详细反馈
   - 计算总分和正确题数
   - 返回每道题的评估结果

8. **AI 评估提示词**
   - 包含题目、标准答案、学生答案
   - 从准确性、完整性、清晰度三个维度评估
   - 返回分数和详细评语
   - 温度设置为 0.3，确保评估稳定

9. **举一反三功能** (`src/app/api/test-answer/generate-similar/route.ts`)
   - 基于原题生成同类型题目
   - 保持相同的题型和难度级别
   - 考察相同知识点，但换不同角度或场景
   - 包含题目、选项、答案、解析

10. **集成到学习计划详情页面** (`src/app/plan/[planId]/page.tsx`)
    - 检测测试题文档，显示"开始答题"按钮
    - 点击后渲染右侧答题抽屉
    - 抽屉使用 `fixed` 定位，从右侧滑入
    - 点击关闭按钮或退出时关闭抽屉

**技术实现：**
- 题目解析：使用 DOMParser 解析 HTML，提取题目数据
- **答案隐藏机制**：
  - 答题时调用 `parseQuestionsFromHTML(html, false)`，不提取答案和解析
  - 遍历 DOM 时跳过 `<details>` 标签，避免读取其内容
  - 只提取 `<p>` 标签中的题目文本，不包含子元素
  - 提交时调用 `parseQuestionsFromHTML(html, true)`，重新解析获取完整数据
- 答案标准化：去除空格、标点、转小写，确保比较准确
- AI 评估：调用 AI 客户端，使用结构化提示词
- 状态管理：使用 React useState 管理答题状态
- **抽屉布局**：
  - 无遮罩层：用户可以自由滚动查看题目
  - 抽屉：`fixed right-0 top-0 bottom-0 z-50`，动态宽度
  - 拖拽手柄：`fixed` 定位，`cursor-col-resize`
  - 滑入动画：`transition-all duration-300 ease-out`
- **宽度调整**：
  - 监听 `mousedown` 事件开始拖拽
  - 监听 `mousemove` 事件计算新宽度
  - 监听 `mouseup` 事件结束拖拽
  - 限制宽度范围：400px - 1000px
- **退出确认**：
  - 检查是否在答题模式且有未提交答案
  - 使用 `window.confirm` 弹窗提示
  - 用户确认后才关闭抽屉
- 进度计算：统计非空答案数量

**使用方式：**
1. 打开包含测试题的文档
2. 点击顶部的"开始答题"按钮
3. 右侧滑出答题抽屉，左侧编辑器仍可见
4. 在抽屉中每道题下方输入答案（不显示答案和解析）
5. 查看答题进度（已答 X / 总共 Y 题）
6. 可拖拽抽屉左侧边缘调整宽度
7. 如需查看题目详情，可在左侧编辑器中展开 `<details>` 标签
8. 点击"提交答案"按钮
9. 等待 AI 评估（主观题）
10. 查看评估结果：
    - 总分和正确率
    - 每道题的正确/错误标记
    - 用户答案与正确答案对比
    - AI 评语和改进建议（主观题）
11. 点击"举一反三"生成相似题目
12. 点击"重新答题"再次练习
13. 点击关闭按钮退出（如有未提交答案会提示确认）

**优势：**
- **不遮挡编辑器**：可以边看题目边查看原文档内容
- **更符合现有布局**：与左侧文档树、右侧大纲的布局风格一致
- **更灵活**：抽屉宽度可调节，适应不同屏幕和需求
- **用户友好**：退出时温馨提示，避免误操作丢失答案
- **过渡动画自然**：平滑的滑入/滑出效果
- **多种题型支持**：适应不同学习场景
- **AI 智能评估**：提供详细反馈
- **举一反三功能**：加深理解
- **清晰的进度显示**：实时反馈答题状态
- **答题体验纯净**：答题时不显示答案和解析，避免干扰

**已修复的问题：**

#### 问题 1：答题抽屉显示答案和解析（2024-01-19）

**问题描述：**
- 答题抽屉中显示"查看答案和解析答案：B解析：..."这样的文本
- 用户在答题时能看到答案，影响答题体验

**根本原因：**
1. 题目数据在解析时就包含了答案和解析
2. 使用 `textContent` 提取内容时，包含了 `<details>` 标签内的所有文本
3. 题目文本字段 `question.question` 包含了答案和解析的内容

**修复方案：**
1. 修改 `parseQuestionsFromHTML` 函数，添加 `includeAnswers` 参数（默认 `false`）
2. 答题时不提取答案和解析（`includeAnswers = false`）
3. 提交时重新解析 HTML 提取完整数据（`includeAnswers = true`）
4. 改进解析逻辑：
   - 遍历 DOM 时先检查是否为 `<details>` 标签
   - 如果是且不需要答案，直接跳过该元素
   - 只从 `<p>` 标签提取题目文本，避免包含子元素内容
   - 确保题目文本不包含答案和解析

**修复后效果：**
- 答题抽屉中只显示题目和选项，不显示答案和解析
- 提交后能正确评估，因为重新解析了完整数据
- 用户可以在编辑器中通过 `<details>` 标签查看答案
- 答题体验更纯净，不受答案干扰

#### 问题 2：打开抽屉需要点击"开始答题"按钮（2024-01-19）

**问题描述：**
- 打开答题抽屉后，还需要点击"开始答题"按钮才能开始答题
- 这个步骤多此一举，用户体验不好

**修复方案：**
1. 修改初始状态：将 `mode` 从 `'view'` 改为 `'answer'`
2. 移除"查看模式"相关代码
3. 打开抽屉就直接进入答题模式
4. 更新类型定义：`mode: 'answer' | 'result'`（移除 `'view'`）

**修复后效果：**
- 点击"开始答题"按钮后，抽屉直接显示答题界面
- 无需额外点击，立即可以开始答题
- 用户体验更流畅，减少操作步骤

#### 问题 3：选择题答案校验错误（2024-01-19）

**问题描述：**
- 选择题选择某个选项后，保存的是选项的完整文本
- 答案校验时比较的是完整文本，而不是选项标识（A、B、C、D）
- 导致答案校验不准确

**根本原因：**
- `AnswerInput` 组件中，选择题的 `value` 和 `onChange` 使用的是 `option`（完整文本）
- 应该使用 `optionLabel`（A、B、C、D）

**修复方案：**
1. 修改选择题的 `value` 从 `option` 改为 `optionLabel`
2. 修改 `isSelected` 判断从 `value === option` 改为 `value === optionLabel`
3. 修改 `input` 的 `value` 属性从 `option` 改为 `optionLabel`

**修复后效果：**
- 选择题保存的答案是选项标识（A、B、C、D）
- 答案校验正确，与标准答案（A、B、C、D）进行比较
- 用户选择选项后，正确保存选项标识

#### 问题 4：举一反三功能 - 在题目旁边添加按钮（2024-01-19）

**需求描述：**
- 在每个测试题标题旁边直接添加"举一反三"按钮
- 用户点击按钮即可为该题目生成相似题目
- 生成的相似题目插入到当前题目后面
- 使用 `<details>` 标签包裹，可展开/收起

**问题修复：**
- ❌ 初始方案：使用内联 `onclick` 事件 → 被 Tiptap 编辑器拦截，无法点击
- ✅ 最终方案：创建自定义 Tiptap 扩展处理按钮点击事件

**实现方案：**

1. **创建自定义 Tiptap 扩展**（`src/components/editor/similar-question-button-extension.ts`）：
   - 创建 `SimilarQuestionButton` Node 扩展
   - 使用 `addNodeView()` 自定义按钮渲染
   - 设置 `contenteditable="false"` 防止编辑
   - 添加渐变紫色背景、圆角、阴影、hover 动画
   - 使用 SVG 灯泡图标
   - 通过 `onButtonClick` 回调处理点击事件

2. **修改测试题生成的 HTML 结构**：
   - 在 `<h3>` 标签内直接添加按钮标签
   - 使用 `data-similar-question-btn="true"` 标记
   - 使用 `data-question-index` 存储题号
   - 设置 `contenteditable="false"` 防止编辑

3. **集成到 TiptapEditor**：
   - 添加 `onSimilarQuestionClick` prop 接收回调函数
   - 在 extensions 中配置 `SimilarQuestionButton`
   - 传递 `onButtonClick` 回调

4. **在学习计划详情页面中实现**：
   - 创建 `handleSimilarQuestionClick` 函数处理按钮点击
   - 解析文档找到对应题目
   - 调用 API 生成相似题目
   - 插入到当前题目后面
   - 传递回调给 TiptapEditor

**技术实现：**

1. **自定义扩展的关键代码**：
```typescript
export const SimilarQuestionButton = Node.create<SimilarQuestionButtonOptions>({
  name: 'similarQuestionButton',
  group: 'inline',
  inline: true,
  atom: true,
  
  addNodeView() {
    return ({ node, editor }) => {
      const button = document.createElement('button')
      button.setAttribute('contenteditable', 'false')
      // 添加样式和事件监听
      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.options.onButtonClick(questionIndex)
      })
      return { dom: button }
    }
  }
})
```

2. **HTML 结构**：
```html
<h3>第 1 题 <button type="button" data-similar-question-btn="true" data-question-index="1" contenteditable="false"></button></h3>
```

3. **按钮样式**：
   - 渐变紫色背景：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
   - 圆角：`8px`
   - 阴影：`0 2px 4px rgba(102, 126, 234, 0.2)`
   - Hover 效果：上移 + 增强阴影
   - 左边距：`12px`

**优化后效果：**
- ✅ 每个题目标题旁边都有独立的"举一反三"按钮
- ✅ 按钮可以正常点击，不会插入光标
- ✅ 点击按钮直接为该题目生成相似题目
- ✅ 生成的题目自动插入到当前题目后面
- ✅ 使用 `<details open>` 标签，默认展开显示
- ✅ 题目永久保存在文档中
- ✅ 按钮样式美观，带有 hover 动画效果
- ✅ 使用 Tiptap 扩展机制，与编辑器完美集成

**相关文件：**
- `src/components/editor/similar-question-button-extension.ts` - 自定义 Tiptap 扩展（新建）
- `src/components/editor/tiptap-editor.tsx` - 编辑器组件（添加扩展和回调）
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（修改测试题生成和添加回调函数）

**相关文件：**
- `src/components/test-answer/answer-input.tsx` - 答题输入组件
- `src/components/test-answer/question-answer-item.tsx` - 题目答题项组件
- `src/components/test-answer/answer-mode-header.tsx` - 答题模式头部（已优化抽屉布局）
- `src/components/test-answer/test-answer-overlay.tsx` - 答题抽屉组件（右侧抽屉式，可调节宽度）
- `src/app/api/test-answer/submit/route.ts` - 答案提交和评估 API
- `src/app/api/test-answer/generate-similar/route.ts` - 生成相似题目 API
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（集成答题功能）

---

### 2024-01-19 - 优化文档树高亮逻辑

**问题描述：**
- 当前文档的父节点收起时，会高亮父节点
- 但如果父节点的父节点（祖父节点）也收起了，父节点本身也不可见
- 这种情况下高亮父节点没有意义，应该继续向上找到可见的祖先节点

**根本原因：**
- 原有逻辑只检查直接父节点是否展开
- 没有检查整个祖先链的可见性
- 一个节点可见的条件是：它的**所有**祖先节点都是展开的

**修复内容：**

1. **改进可见性检查逻辑** (`src/components/editor/document-tree.tsx`)
   - 从后往前遍历文档路径（从当前文档到根节点）
   - 对每个节点，检查它的所有祖先是否都展开
   - 找到第一个可见的节点作为高亮目标

2. **算法优化**
   - 外层循环：从当前文档向根节点遍历
   - 内层循环：检查该节点的所有祖先是否展开
   - 一旦找到可见节点，立即返回
   - 确保总能找到至少一个可见节点（根节点总是可见的）

**技术实现：**
```typescript
// 从后往前查找第一个可见的节点
for (let i = path.length - 1; i >= 0; i--) {
  const nodeId = path[i]
  
  // 检查该节点是否可见（所有祖先都展开）
  let isVisible = true
  for (let j = 0; j < i; j++) {
    if (!expandedDocs.has(path[j])) {
      isVisible = false
      break
    }
  }
  
  if (isVisible) {
    return nodeId  // 找到第一个可见的节点
  }
}
```

**测试场景：**
1. 三层嵌套：根节点 → 父节点 → 当前文档
2. 收起根节点：高亮根节点 ✓
3. 展开根节点，收起父节点：高亮父节点 ✓
4. 展开根节点和父节点：高亮当前文档 ✓
5. 四层嵌套：根 → 祖父 → 父 → 当前
6. 收起祖父节点：高亮祖父节点 ✓（而不是父节点）

**效果：**
- 高亮的节点始终是可见的
- 用户可以清楚地看到当前正在编辑哪个文档或其最近的可见祖先
- 避免高亮不可见的节点导致的困惑

**相关文件：**
- `src/components/editor/document-tree.tsx` - 文档树组件（优化高亮逻辑）

---

### 2024-01-19 - 修复文档状态持久化问题

**问题描述：**
- 刷新页面后，当前打开的文档状态丢失
- 总是回到第一个文档，而不是刷新前打开的文档
- 用户体验不佳，需要重新找到之前正在编辑的文档

**根本原因：**
- 活动文档 ID 只保存在组件状态中，没有持久化
- 页面刷新后状态重置，总是使用第一个文档作为默认值
- 缺少文档状态的本地存储机制

**修复内容：**

1. **添加 localStorage 持久化** (`src/app/plan/[planId]/page.tsx`)
   - 创建 `handleDocumentSelect` 函数，切换文档时保存到 localStorage
   - 创建 `setAndSaveActiveDocId` 辅助函数，统一处理文档切换和保存
   - 使用 `active-doc-${planId}` 作为存储键，区分不同学习计划

2. **恢复文档状态**
   - 加载学习计划数据后，优先从 localStorage 恢复上次打开的文档
   - 验证保存的文档 ID 是否存在于当前文档列表中
   - 如果文档不存在或没有保存记录，才使用第一个文档

3. **更新所有文档切换点**
   - 用户手动切换文档：使用 `handleDocumentSelect`
   - 添加新文档：使用 `setAndSaveActiveDocId`
   - 删除文档后切换：使用 `setAndSaveActiveDocId`
   - AI 生成后切换：使用 `setAndSaveActiveDocId`
   - 测试题生成后切换：使用 `setAndSaveActiveDocId`

**技术实现：**
- 存储键格式：`active-doc-${planId}`，每个学习计划独立存储
- 恢复逻辑：先检查 localStorage，再验证文档存在性
- 统一接口：所有文档切换都通过辅助函数，确保状态同步
- 依赖管理：正确添加 `setAndSaveActiveDocId` 到 useCallback 依赖

**使用效果：**
1. 打开学习计划详情页面
2. 切换到任意文档进行编辑
3. 刷新页面
4. 验证页面自动恢复到刷新前打开的文档
5. 不同学习计划的文档状态互不影响

**相关文件：**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（添加持久化逻辑）

---

### 2024-01-19 - 添加测试题自定义描述功能

**功能描述：**
- 在测试题生成对话框中添加可选的"补充说明"字段
- 用户可以添加额外的要求或说明，帮助 AI 生成更符合需求的测试题
- 例如：重点考察实际应用、包含代码示例、侧重概念理解等

**实现内容：**

1. **前端 UI 更新** (`src/components/editor/test-question-dialog.tsx`)
   - 添加 `additionalContext` 状态管理
   - 添加多行文本输入框（textarea）
   - 设置 placeholder 和帮助文字
   - 对话框关闭时自动重置字段
   - 字段为可选，不影响原有功能

2. **API 接口扩展** (`src/app/api/test-questions/generate/route.ts`)
   - `GenerateRequest` 接口添加 `additionalContext?: string` 字段
   - 接收并传递自定义描述到提示词生成函数
   - 添加日志记录，便于调试

3. **提示词优化** (`src/lib/ai/prompts.ts`)
   - `TestQuestionsInput` 接口添加 `additionalContext?: string` 字段
   - 在提示词中包含用户的补充说明
   - 如果提供了补充说明，特别强调 AI 要遵循这些要求
   - 修改第4条要求，根据是否有补充说明动态调整

4. **前端调用更新** (`src/app/plan/[planId]/page.tsx`)
   - 在调用测试题生成 API 时传递 `additionalContext` 参数
   - 确保完整的参数传递链路

**技术实现：**
- 可选字段：使用 TypeScript 的可选属性 `?:`
- 条件渲染：根据是否有 `additionalContext` 调整提示词内容
- 参数传递：完整的数据流从 UI → API → 提示词生成
- 用户体验：字段为可选，不影响原有的快速生成流程

**使用方式：**
1. 打开学习计划详情页面
2. 点击"生成测试题"按钮
3. 填写基本信息（主题、难度、题目数量、题型）
4. 在"补充说明"字段中输入额外要求（可选）
   - 例如："重点考察实际应用场景"
   - 例如："包含代码示例，侧重实践"
   - 例如："题目要有一定难度，考察深入理解"
5. 点击"生成"按钮
6. AI 会根据补充说明生成更符合需求的测试题

**效果：**
- 提供更灵活的测试题生成方式
- 用户可以精确控制题目的侧重点
- 不影响原有的快速生成流程
- 提高测试题的针对性和实用性

**相关文件：**
- `src/components/editor/test-question-dialog.tsx` - UI 更新
- `src/app/api/test-questions/generate/route.ts` - API 接口扩展
- `src/lib/ai/prompts.ts` - 提示词优化
- `src/app/plan/[planId]/page.tsx` - 前端调用更新

---

### 2024-01-19 - 优化测试题生成的上下文准确性

**问题描述：**
- 测试题生成的内容不准确，偏离主题
- 例如：为"函数"主题生成了数学函数的题目，而不是编程函数
- 缺少学习计划和当前章节的上下文信息

**根本原因：**
- 测试题生成提示词只包含测试题主题，没有学习计划上下文
- AI 无法理解具体的学习场景和目标
- 缺少当前章节内容作为参考

**修复内容：**

1. **扩展提示词接口** (`src/lib/ai/prompts.ts`)
   - 添加 `planTopic` - 学习计划主题
   - 添加 `planGoal` - 学习计划目标
   - 添加 `currentContent` - 当前章节内容摘要

2. **改进提示词生成** (`src/lib/ai/prompts.ts`)
   - 在提示词中包含学习计划信息
   - 提取当前章节内容摘要（限制 500 字符）
   - 明确要求 AI 紧密围绕主题，不要偏离
   - 强调基于学习计划和章节内容出题

3. **修改测试题生成 API** (`src/app/api/test-questions/generate/route.ts`)
   - 接收学习计划和章节内容参数
   - 传递完整上下文给提示词生成函数

4. **修改前端调用逻辑** (`src/app/plan/[planId]/page.tsx`)
   - 传递学习计划主题和目标
   - 传递当前文档内容作为上下文
   - 确保 AI 有足够信息生成准确的测试题

**技术实现：**
- 上下文构建：组合学习计划信息和章节内容
- 内容提取：移除 HTML 标签，提取纯文本摘要
- 提示词优化：明确要求围绕主题，参考上下文
- 参数传递：完整的上下文信息链路

**效果：**
- 测试题更贴合学习计划主题
- 题目内容与当前章节相关
- 避免主题偏离和理解错误
- 提高测试题的针对性和准确性

**相关文件：**
- `src/lib/ai/prompts.ts` - 提示词接口和生成函数
- `src/app/api/test-questions/generate/route.ts` - 测试题生成 API
- `src/app/plan/[planId]/page.tsx` - 前端调用逻辑

---

### 2024-01-19 - 修复 AI 生成内容持久化问题

**问题描述：**
- AI 生成的文档内容和测试题刷新后丢失
- 生成的文档树结构刷新后恢复原样
- 所有生成的内容只保存在前端状态中，没有持久化到数据库

**根本原因：**
- AI 生成大纲时只返回 JSON 数据，没有保存到数据库
- 测试题生成后只更新前端状态，没有调用保存 API
- 页面刷新时从数据库加载，导致未保存的内容丢失

**修复内容：**

1. **修改大纲生成 API** (`src/app/api/learning-outline/generate/route.ts`)
   - 添加 `planId` 和 `parentId` 参数支持
   - 支持在现有学习计划下添加大纲
   - 保存大纲时返回数据库生成的 ID
   - 递归保存大纲项和内容到数据库
   - 返回包含数据库 ID 的大纲结构

2. **修改 AI 生成处理逻辑** (`src/app/plan/[planId]/page.tsx`)
   - 调用 API 时传入 `planId` 和 `parentId`
   - 使用数据库返回的 ID 作为文档 ID
   - 确保生成的内容立即保存到数据库

3. **修改测试题生成逻辑** (`src/app/plan/[planId]/page.tsx`)
   - 生成测试题后立即保存到数据库
   - 先调用大纲生成 API 创建大纲项
   - 再调用更新 API 保存测试题内容
   - 使用数据库返回的 ID 作为文档 ID

**技术实现：**
- 大纲生成：支持 `planId` 参数，在现有计划下添加大纲
- 递归保存：保存大纲项时递归处理子项，返回完整结构
- ID 映射：使用数据库生成的 ID 替代前端临时 ID
- 立即持久化：生成内容后立即保存，不依赖自动保存

**测试方式：**
1. 打开学习计划详情页面
2. 使用 AI 生成大纲或章节内容
3. 生成测试题
4. 刷新页面
5. 验证生成的内容和文档树结构都保留

**相关文件：**
- `src/app/api/learning-outline/generate/route.ts` - 大纲生成 API（支持现有计划）
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（修改生成逻辑）

---

### 2024-01-19 - 接入文档自动保存功能

**功能描述：**
- 在学习计划详情页面接入自动保存功能
- 编辑文档标题和内容时自动保存到数据库
- 使用防抖机制，避免频繁保存

**实现内容：**

1. **创建大纲更新 API** (`src/app/api/learning-outline/[outlineId]/route.ts`)
   - 支持更新大纲的标题、描述和内容
   - 自动处理内容记录的创建和更新
   - 使用 Cloudflare D1 数据库存储

2. **接入自动保存 Hook** (`src/app/plan/[planId]/page.tsx`)
   - 使用 `useAutoSave` hook 实现自动保存
   - 2秒防抖延迟，避免频繁请求
   - 监听标题和内容变化，自动触发保存
   - 提供成功和失败回调

**技术实现：**
- 防抖机制：编辑停止 2 秒后自动保存
- API 路由：`PATCH /api/learning-outline/[outlineId]`
- 数据库操作：更新 `learning_outlines` 和 `knowledge_contents` 表
- 错误处理：保存失败时在控制台输出错误信息

**使用方式：**
1. 打开学习计划详情页面
2. 编辑文档标题或内容
3. 停止编辑 2 秒后自动保存
4. 控制台会输出"文档已自动保存"

**相关文件：**
- `src/app/api/learning-outline/[outlineId]/route.ts` - 大纲更新 API
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（接入自动保存）
- `src/hooks/use-auto-save.ts` - 自动保存 Hook（已存在）

---

### 2024-01-19 - 修复气泡菜单定位和显示逻辑

**问题描述：**
- 双击选中文本时，气泡菜单（浮动工具栏）没有正确跟随选区
- 菜单有过渡动画，从一个位置移动到另一个位置
- 选中新区域后，菜单会先消失，然后在旧位置短暂出现，再跳到新位置

**根本原因：**
1. **定位时机问题** - 在延迟显示的 setTimeout 内部计算位置，导致位置更新滞后
2. **过渡动画** - CSS transition 导致位置变化时有移动效果
3. **显示逻辑问题** - 先显示菜单再更新位置，导致在旧位置闪现

**修复内容：**
1. **优化位置更新逻辑** (`src/components/editor/bubble-menu-toolbar.tsx`)
   - 先计算并更新位置，再延迟显示菜单
   - 确保菜单显示时已经在正确位置
   - 避免在旧位置短暂出现的问题

2. **移除过渡动画**
   - 移除 `transition: 'opacity 150ms'` 样式
   - 菜单位置变化时立即跳转，无过渡效果
   - 保留 opacity 控制避免在 0,0 位置闪现

3. **保持延迟显示机制**
   - 选中文本后延迟 150ms 再显示菜单
   - 给用户反应时间，避免频繁闪烁
   - 位置计算在延迟之前完成

**技术实现：**
- 位置优先：先调用 `setPosition()` 更新位置
- 延迟显示：再用 `setTimeout(() => setIsVisible(true), 150)` 显示菜单
- 无过渡：移除所有 CSS transition 属性
- 估算尺寸：首次渲染时使用估算的菜单尺寸计算位置

**测试方式：**
1. 在编辑器中双击选中文本
2. 验证气泡菜单延迟 150ms 后在正确位置显示
3. 选中不同区域的文本
4. 验证菜单不会在旧位置闪现，直接在新位置出现
5. 验证没有从一个位置移动到另一个位置的过渡动画

**相关文件：**
- `src/components/editor/bubble-menu-toolbar.tsx` - 气泡菜单工具栏

---

### 2024-01-19 - 添加 Details 标签支持

**问题描述：**
- 生成的测试题答案使用 `<details>` 和 `<summary>` 标签，但编辑器没有渲染这些标签
- 答案始终展开，无法收起

**根本原因：**
- Tiptap 编辑器使用 `StarterKit`，它只允许特定的 HTML 标签
- `<details>` 和 `<summary>` 标签不在默认允许列表中，被过滤掉了

**修复内容：**
1. **创建 Details 扩展** (`src/components/editor/details-extension.ts`)
   - 创建 `Details` Node 扩展，支持 `<details>` 标签
   - 创建 `Summary` Node 扩展，支持 `<summary>` 标签
   - 配置样式：
     - Details：背景色 `#f0fdfa`，左边框 3px `#0D9488`，圆角 4px，内边距 12px
     - Summary：粗体，颜色 `#0D9488`，鼠标指针，禁止选中文本

2. **更新编辑器配置** (`src/components/editor/tiptap-editor.tsx`)
   - 导入 `Details` 和 `Summary` 扩展
   - 添加到编辑器的 extensions 配置中

**技术实现：**
- 使用 Tiptap 的 `Node.create()` API 创建自定义节点
- 配置 `parseHTML()` 识别 `<details>` 和 `<summary>` 标签
- 配置 `renderHTML()` 保留标签并添加样式
- 配置 `addAttributes()` 处理 `open` 属性

**相关文件：**
- `src/components/editor/details-extension.ts` - 新建的 Details 扩展
- `src/components/editor/tiptap-editor.tsx` - 更新的编辑器配置

---

### 2024-01-19 - 优化 AI 响应格式和速度

**问题描述：**
- AI 生成的测试题格式有时错误，导致解析失败
- AI 响应速度很慢

**根本原因：**
1. **提示词不够严格** - 没有明确要求 JSON 格式必须有效，AI 容易生成不规范的 JSON
2. **温度设置过高** - `temperature: 0.7` 导致 AI 生成不稳定的格式
3. **JSON 解析过于宽松** - 正则表达式 `/\{[\s\S]*\}/` 可能匹配到不完整的 JSON
4. **没有处理 markdown 代码块** - AI 有时会用 ````json` 包裹响应

**修复内容：**
1. **改进提示词** (`src/lib/ai/prompts.ts`)
   - 添加"重要"提示，强调必须返回有效 JSON
   - 明确说明"只返回 JSON，不要返回其他内容"
   - 提供具体的 JSON 格式示例，包括不同题型的格式
   - 使用 markdown 代码块标记示例，让 AI 更清楚地理解格式

2. **降低温度参数** (`src/app/api/test-questions/generate/route.ts`)
   - 从 `temperature: 0.7` 降低到 `temperature: 0.3`
   - 更低的温度使 AI 生成更稳定、更一致的格式

3. **改进 JSON 解析** (`src/app/api/test-questions/generate/route.ts`)
   - 移除 markdown 代码块标记（```json 和 ```）
   - 先尝试直接解析整个响应
   - 如果失败，再尝试用正则表达式提取 JSON 对象
   - 添加数据结构验证（检查 questions 数组是否存在和非空）
   - 提供更详细的错误信息，包括原始响应内容用于调试

**技术实现：**
- 提示词中明确指出格式要求和示例
- 使用更低的温度值确保格式一致性
- 多层次的 JSON 解析策略，提高容错能力
- 完整的数据验证和错误日志

**相关文件：**
- `src/lib/ai/prompts.ts` - 改进的测试题生成提示词
- `src/app/api/test-questions/generate/route.ts` - 改进的 JSON 解析和温度设置

---

### 2024-01-19 - 修复测试题生成功能

**问题描述：**
- 生成测试题时，答案默认展开而不是收起
- 生成测试题时，"AI 生成"按钮也在转圈，应该只有"生成测试题"按钮转圈

**修复内容：**
1. **分离 Loading 状态**
   - 添加 `isTestGenerating` 状态用于测试题生成
   - 保留 `isGenerating` 状态用于 AI 内容生成
   - 两个按钮现在独立控制各自的 loading 状态

2. **改进答案展开样式**
   - 移除 `<details>` 标签的 `open` 属性，确保默认收起
   - 添加样式美化：
     - 背景色：`#f0fdfa`（浅青色）
     - 左边框：3px 实线 `#0D9488`（主色）
     - 圆角：4px
     - 内边距：12px
   - 添加 `user-select: none` 防止选中 summary 文本
   - 答案内容用 `<div>` 包裹，添加上边距

**技术实现：**
- 在页面组件中添加 `isTestGenerating` 状态
- 在 `handleTestGenerate` 函数中使用 `setIsTestGenerating`
- 更新生成测试题按钮的 disabled 和显示逻辑
- 改进 HTML 内容生成中的 `<details>` 标签样式

**相关文件：**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（状态分离、按钮更新）
- `src/components/editor/test-question-dialog.tsx` - 测试题生成对话框

---

### 2024-01-19 - 添加生成测试题功能

**功能描述：**
- 在学习计划详情页面添加"生成测试题"按钮
- 支持通过弹窗交互生成测试题
- 生成的测试题作为当前文档的子文档保存
- 支持自定义难度、题目数量和题型

**实现内容：**

1. **创建测试题生成对话框** (`src/components/editor/test-question-dialog.tsx`)
   - 支持选择测试主题（自动填充当前章节标题）
   - 支持选择难度级别（简单、中等、困难）
   - 支持调整题目数量（1-20，使用滑块）
   - 支持选择题型（选择题、填空题、简答题、编程题）
   - 使用最小化设计风格，简洁清爽
   - 包含提示信息显示生成目标

2. **简化 AI 生成对话框** (`src/components/editor/ai-generate-dialog.tsx`)
   - 从 Claymorphism 风格简化为最小化设计
   - 保留核心功能：主题、目标、难度级别选择
   - 支持补充描述（仅在生成章节内容时显示）
   - 统一对话框风格，提升用户体验

3. **修改学习计划详情页面** (`src/app/learn/[planId]/page.tsx`)
   - 在顶部栏添加"生成测试题"按钮（橙色，BookOpen 图标）
   - 与"AI 生成内容"按钮并排显示
   - 添加测试题对话框状态管理
   - 实现 `handleTestGenerate` 函数处理测试题生成
   - 生成的测试题自动添加到文档树并切换到该文档
   - 生成的测试题包含完整的题目、选项、答案、解析等信息

4. **创建测试题生成 API** (`src/app/api/test-questions/generate/route.ts`)
   - 接收测试题生成请求
   - 支持多个 AI 提供商（OpenAI、DeepSeek、Gemini、Claude、Cloudflare）
   - 验证请求参数（主题、难度、题目数量、题型）
   - 调用 AI 生成测试题
   - 解析 AI 响应并返回结构化数据

5. **添加测试题生成提示词** (`src/lib/ai/prompts.ts`)
   - 新增 `TestQuestionsInput` 接口定义
   - 新增 `generateTestQuestionsPrompt` 函数
   - 提示词包含：主题、难度、题目数量、题型等信息
   - AI 生成的测试题包含题目、选项、答案、解析

**技术实现：**
- 使用 React Hooks 管理对话框状态
- 使用 Tailwind CSS 实现最小化设计
- 生成的测试题内容包含题目、选项、答案、解析等
- 测试题文档自动添加到当前文档的子文档
- API 端点支持多个 AI 提供商和模型选择
- 完整的错误处理和日志记录

**测试方式：**
1. 打开学习计划详情页面
2. 点击顶部栏的"生成测试题"按钮
3. 在弹窗中选择测试主题、难度、题目数量和题型
4. 点击"生成"按钮
5. 验证测试题文档已生成并添加到文档树
6. 验证测试题内容正确显示在编辑器中
7. 验证测试题包含题目、选项、答案、解析等完整信息

**相关文件：**
- `src/components/editor/test-question-dialog.tsx` - 测试题生成对话框
- `src/components/editor/ai-generate-dialog.tsx` - AI 生成对话框（已简化）
- `src/app/learn/[planId]/page.tsx` - 学习计划详情页面
- `src/app/api/test-questions/generate/route.ts` - 测试题生成 API
- `src/lib/ai/prompts.ts` - AI 提示词（已添加测试题生成函数）

---

### 2024-01-19 - 修复大纲锚点定位问题

**问题描述：**
- 点击大纲中的标题，无法正确滚动到编辑器中的对应内容
- 多次点击同一个标题，滚动位置不一致
- 滚动逻辑过于复杂，导致定位不准确

**根本原因：**
- 使用 `domAtPos` 获取 DOM 元素不准确
- 没有正确计算编辑器容器的滚动位置
- 函数没有使用 `useCallback` 包装，导致每次渲染都创建新函数
- 尝试插入光标导致额外的副作用

**修复内容：**
1. **简化滚动定位逻辑** (`src/components/editor/content-outline.tsx`)
   - 移除插入光标的逻辑
   - 使用 `coordsAtPos` 获取标题在视口中的坐标
   - 直接计算滚动位置：将标题滚动到距离视口顶部 100px 的位置
   - 使用 `scrollTo` 方法平滑滚动

2. **优化函数稳定性**
   - 使用 `useCallback` 包装 `scrollToHeading` 函数
   - 使用 `useCallback` 包装 `toggleLevel` 函数
   - 使用 `useCallback` 包装 `renderHeading` 函数
   - 确保函数引用稳定，避免不必要的重新渲染

**技术实现：**
- 坐标计算：使用 `view.coordsAtPos(pos)` 获取标题的视口坐标
- 滚动计算：`targetScrollTop = editorContainer.scrollTop + (coords.top - containerRect.top) - 100`
- 平滑滚动：使用 `scrollTo({ top, behavior: 'smooth' })`
- 函数优化：所有回调函数都使用 `useCallback` 包装

**测试方式：**
1. 打开学习计划详情页面
2. 在编辑器中添加多个标题（H1、H2、H3）
3. 点击右侧大纲中的标题
4. 验证编辑器自动滚动到对应标题，距离视口顶部约 100px
5. 多次点击同一个标题，验证滚动位置一致

---

### 2024-01-19 - 修复悬浮框位置显示问题

**问题描述：**
- AI 斜杠指令的悬浮输入框和 `/` 指令悬浮工具栏列表在编辑器底部唤起时，会出现显示不完整的 bug
- 需要手动滚动滚动条才能看到完整的悬浮框

**修复内容（第一阶段）：**
1. **AI 浮动输入框** (`src/components/editor/ai-floating-input.tsx`)
   - 添加视口边界检测逻辑
   - 自动调整悬浮框位置，确保在视口可见区域
   - 检查右边界：如果超出右边界，自动左移
   - 检查下边界：如果超出下边界，自动显示在上方
   - 自动滚动编辑器：如果悬浮框不在可见区域，自动平滑滚动编辑器

2. **斜杠命令菜单** (`src/components/editor/slash-command.tsx`)
   - 配置 Tippy.js 的 `flip` 和 `preventOverflow` 修饰符
   - 自动调整菜单位置，防止超出视口
   - 自动滚动编辑器，确保菜单在可见区域
   - 添加平滑滚动动画

**技术实现（第一阶段）：**
- 使用 `getBoundingClientRect()` 获取元素在视口中的位置
- 计算视口宽度和高度，进行边界检测
- 根据检测结果调整悬浮框位置
- 使用 `scrollTo()` 方法平滑滚动编辑器
- 配置 Tippy.js 的 Popper 修饰符实现自动位置调整

**测试方式（第一阶段）：**
1. 在编辑器底部输入 `/` 打开命令菜单
2. 选择 "AI 生成" 或输入 `/AI`
3. 验证悬浮框是否自动调整位置并在视口可见区域
4. 验证编辑器是否自动滚动以显示悬浮框

---

### 2024-01-19 - 优化 AI 悬浮输入框位置跟随和宽度

**问题描述：**
- AI 悬浮输入框偏离唤起位置太多（左移 200px）
- 输入框宽度不够长
- 输入框高度太高，占用过多空间
- 不需要复杂的自动滚动逻辑，因为唤起工具栏时唤起位置已经在视口内

**改进内容：**
1. **优化位置计算逻辑** (`src/components/editor/ai-floating-input.tsx`)
   - 简化位置计算：直接跟随唤起位置 `x = rect.left`，`y = rect.bottom + 8`
   - 保留必要的边界检测：
     - 右边界检测：如果超出右边界，自动左移
     - 下边界检测：如果超出下边界，自动显示在上方
   - 添加窗口 resize 事件监听，确保窗口大小改变时位置正确

2. **增加输入框宽度**
   - 从 `w-96`（384px）增加到 `w-[28rem]`（448px）
   - 提供更宽敞的输入体验

3. **简化输入框布局**
   - 移除头部标题栏，减少高度
   - 将说明文字移到 placeholder 中：`"输入提示词... (Enter 发送 · Esc 关闭)"`
   - 按钮放到同一行，使用图标代替文字：
     - 发送按钮：Send 图标
     - 关闭按钮：X 图标
   - 整体高度从约 280px 减少到约 100px

**技术实现：**
- 位置计算：直接使用 `getBoundingClientRect()` 获取唤起元素位置
- 边界检测：仅检查右边界和下边界，确保输入框在视口内
- 宽度调整：修改容器 className 从 `w-96` 到 `w-[28rem]`
- 布局优化：使用 flexbox 将输入框和按钮放在同一行
- 图标按钮：使用 `p-2` 和图标替代文字按钮

**测试方式：**
1. 在编辑器任意位置输入 `/` 打开命令菜单
2. 选择 "AI 生成" 或输入 `/AI`
3. 验证悬浮框紧跟唤起位置，显示在下方
4. 验证输入框宽度增加，高度减少
5. 验证按钮使用图标显示，与输入框在同一行
6. 验证 placeholder 包含快捷键说明
7. 验证在窗口边缘唤起时，输入框自动调整位置保持在视口内

---

## 技术栈

### 前端
- **框架**: React 19.2.1 + Next.js 16.0.7
- **语言**: TypeScript 5.9.3
- **样式**: Tailwind CSS 4.1.17
- **编辑器**: Tiptap 3.15.3（富文本编辑）
- **UI 组件**: Shadcn/ui + Lucide React（图标）
- **状态管理**: React Hooks + Context API

### 后端
- **框架**: Next.js API Routes
- **数据库**: Cloudflare D1（SQLite）
- **ORM**: Drizzle ORM 0.45.1
- **认证**: NextAuth.js 5.0.0-beta.30
- **AI 集成**: DeepSeek API（可配置其他提供商）
- **存储**: Cloudflare R2（文件上传）

### 部署
- **运行时**: Cloudflare Workers
- **CDN**: Cloudflare CDN
- **构建工具**: OpenNext + Wrangler

## 项目结构

```
src/
├── app/                           # Next.js App Router
│   ├── api/                       # API 路由
│   │   ├── ai/                    # AI 相关 API
│   │   ├── auth/                  # 认证 API
│   │   ├── learning-*/            # 学习相关 API
│   │   └── upload/                # 文件上传 API
│   ├── auth/                      # 认证页面（登录、注册）
│   ├── learn/                     # 学习页面
│   ├── dashboard/                 # 仪表板
│   ├── ai-chat/                   # AI 对话页面
│   ├── settings/                  # 设置页面
│   └── layout.tsx                 # 根布局
├── components/                    # React 组件
│   ├── editor/                    # 编辑器相关组件
│   │   ├── tiptap-editor.tsx      # Tiptap 编辑器
│   │   ├── editor-toolbar.tsx     # 编辑器工具栏
│   │   ├── ai-floating-input.tsx  # AI 浮动输入框
│   │   └── slash-command.tsx      # 斜杠命令菜单
│   ├── ai/                        # AI 相关组件
│   │   ├── chat-interface.tsx     # 对话界面
│   │   ├── model-selector.tsx     # 模型选择器
│   │   └── api-key-config.tsx     # API Key 配置
│   ├── auth/                      # 认证组件
│   │   ├── login-form.tsx         # 登录表单
│   │   └── register-form.tsx      # 注册表单
│   └── ui/                        # UI 基础组件
│       ├── button.tsx             # 按钮
│       ├── card.tsx               # 卡片
│       ├── input.tsx              # 输入框
│       └── ...                    # 其他 UI 组件
├── db/                            # 数据库
│   ├── schema.ts                  # Drizzle ORM Schema
│   └── client.ts                  # 数据库客户端
├── lib/                           # 工具函数
│   ├── ai/                        # AI 相关工具
│   │   ├── client.ts              # AI 客户端
│   │   └── prompts.ts             # AI 提示词
│   ├── auth.ts                    # 认证工具
│   ├── db-connection.ts           # 数据库连接
│   └── utils.ts                   # 通用工具
└── hooks/                         # React Hooks
    ├── use-ai-config.ts           # AI 配置 Hook
    └── ...                        # 其他 Hooks
```

## 已实现的功能

### 1. 用户认证系统 ✅

**功能特性：**
- 邮箱注册和登录
- Google OAuth 登录
- GitHub OAuth 登录
- 密码加密存储（bcrypt）
- 会话管理
- 自动登出保护

**使用方式：**
1. 访问 `/auth/login` 登录页面
2. 选择登录方式（邮箱、Google、GitHub）
3. 输入凭证或授权第三方登录
4. 成功登录后跳转到仪表板

**相关文件：**
- `src/app/auth/login/page.tsx` - 登录页面
- `src/app/auth/register/page.tsx` - 注册页面
- `src/components/auth/login-form.tsx` - 登录表单
- `src/components/auth/register-form.tsx` - 注册表单
- `src/app/api/auth/` - 认证 API 路由

---

### 2. 富文本编辑器（含媒体上传）✅

**编辑功能：**
- 文本格式化：粗体、斜体、删除线、下划线
- 标题：H1、H2、H3
- 列表：无序列表、有序列表、任务列表
- 代码：行内代码、代码块（支持语法高亮）
- 块级元素：引用、分割线
- 表格：插入和编辑表格
- 链接：插入和编辑链接
- 数学公式：LaTeX 行内公式和块级公式

**媒体上传功能：**
- 图片上传：支持 JPG、PNG、GIF、WebP、SVG
- 视频上传：支持 MP4、WebM、MOV
- 音频上传：支持 MP3、WAV、OGG
- 外部视频嵌入：YouTube、Vimeo 链接
- 媒体调整：尺寸调整、对齐设置（左/中/右）
- 上传进度显示
- 自动保存草稿

**使用方式：**
1. 点击工具栏按钮或使用快捷键
2. 对于媒体：点击图片/视频按钮选择文件
3. 支持拖拽上传：直接拖拽文件到编辑器
4. 支持粘贴上传：Ctrl+V 粘贴剪贴板中的图片
5. 编辑内容自动保存到草稿

**相关文件：**
- `src/components/editor/tiptap-editor.tsx` - 编辑器主组件
- `src/components/editor/editor-toolbar.tsx` - 工具栏
- `src/app/api/upload/route.ts` - 文件上传 API
- `src/app/api/drafts/route.ts` - 草稿保存 API

---

### 3. AI 内容生成系统 ✅

#### 3.1 编辑器内 AI 生成（/AI 斜杠命令）

**功能特性：**
- 在编辑器中输入 `/` 打开命令菜单
- 选择 "AI 生成" 或直接输入 `/AI`
- 浮动输入框显示，输入提示词
- AI 实时生成内容并插入编辑器
- 支持快捷键：`Ctrl+Enter` 发送，`Esc` 关闭
- 自动滚动锁定防止页面抖动
- **自动位置调整**：悬浮框自动调整位置，确保在视口可见区域
- **自动滚动编辑器**：如果悬浮框不在可见区域，自动滚动编辑器

**使用方式：**
1. 在编辑器中输入 `/`
2. 从菜单中选择 "AI 生成" 或继续输入 `/AI`
3. 在浮动输入框中输入提示词
4. 按 `Ctrl+Enter` 或点击发送按钮
5. AI 生成的内容自动插入编辑器

**相关文件：**
- `src/components/editor/slash-command.tsx` - 斜杠命令菜单
- `src/components/editor/ai-floating-input.tsx` - AI 浮动输入框
- `src/app/api/ai/generate/route.ts` - AI 生成 API

#### 3.2 学习计划生成

**功能特性：**
- 创建新学习计划
- AI 自动生成学习大纲
- 支持多个 AI 提供商（OpenAI、DeepSeek、Gemini、Claude、Cloudflare AI）
- 用户可选择 AI 模型和配置 API Key
- 生成的计划自动保存到数据库

**使用方式：**
1. 访问 `/learn` 学习计划页面
2. 点击 "新建学习计划" 按钮
3. 选择 AI 提供商和模型
4. 输入学习主题、目标和难度级别
5. 点击 "生成学习计划"
6. AI 生成完整的学习计划、大纲和内容

**相关文件：**
- `src/app/learn/new/page.tsx` - 新建学习计划页面
- `src/app/learn/page.tsx` - 学习计划列表页面
- `src/components/ai/model-selector.tsx` - 模型选择器
- `src/components/ai/api-key-config.tsx` - API Key 配置
- `src/app/api/learning-outline/generate/route.ts` - 学习大纲生成 API

#### 3.3 AI 对话助手

**功能特性：**
- 与 AI 进行多轮对话
- 支持上下文理解
- 实时流式响应
- 对话历史保存
- 支持多个 AI 提供商

**使用方式：**
1. 访问 `/ai-chat` AI 对话页面
2. 在输入框中输入问题
3. 按 Enter 或点击发送按钮
4. AI 实时生成回复
5. 可继续提问进行多轮对话

**相关文件：**
- `src/app/ai-chat/page.tsx` - AI 对话页面
- `src/components/ai/chat-interface.tsx` - 对话界面组件
- `src/app/api/ai/chat/route.ts` - AI 对话 API

---

### 4. AI 模型管理 ✅

**功能特性：**
- 支持多个 AI 提供商：
  - OpenAI (GPT-4, GPT-3.5-turbo)
  - DeepSeek (DeepSeek-V3, DeepSeek-Chat)
  - Google Gemini
  - Anthropic Claude
  - Cloudflare AI
- 用户可配置 API Key
- 模型选择保存到本地存储和数据库
- 快速切换模型
- 模型使用统计

**使用方式：**
1. 访问 `/settings/ai` 设置页面
2. 选择 AI 提供商
3. 输入对应的 API Key
4. 选择具体模型
5. 保存设置

**相关文件：**
- `src/app/settings/ai/page.tsx` - AI 设置页面
- `src/components/ai/model-selector.tsx` - 模型选择器
- `src/components/ai/api-key-config.tsx` - API Key 配置
- `src/hooks/use-ai-config.ts` - AI 配置 Hook
- `src/lib/ai/client.ts` - AI 客户端

---

### 5. 学习计划管理 ✅

**功能特性：**
- 创建学习计划
- 查看计划列表
- 追踪学习进度
- 计划状态管理（活跃、完成、归档）
- 难度级别标签
- 预计学习时间

**使用方式：**
1. 访问 `/learn` 查看所有学习计划
2. 点击 "新建学习计划" 创建新计划
3. 填写学习主题、目标和难度级别
4. AI 自动生成完整的学习计划
5. 点击计划卡片查看详情或开始学习

**相关文件：**
- `src/app/learn/page.tsx` - 学习计划列表
- `src/app/learn/new/page.tsx` - 新建学习计划
- `src/app/learn/[planId]/page.tsx` - 计划详情页面
- `src/app/api/learning-plan/route.ts` - 学习计划 API

---

### 6. 测试题生成系统 ✅

**功能特性：**
- 在学习计划详情页面生成测试题
- 支持自定义难度级别（简单、中等、困难）
- 支持调整题目数量（1-20）
- 支持多种题型（选择题、填空题、简答题、编程题）
- 生成的测试题自动保存为子文档
- 支持多个 AI 提供商
- 完整的题目、选项、答案、解析

**使用方式：**
1. 打开学习计划详情页面
2. 点击顶部栏的"生成测试题"按钮
3. 在弹窗中选择：
   - 测试主题（自动填充当前章节标题）
   - 难度级别（简单/中等/困难）
   - 题目数量（1-20）
   - 题型（选择题、填空题、简答题、编程题）
4. 点击"生成"按钮
5. AI 生成测试题并自动添加到文档树
6. 切换到生成的测试题文档查看完整内容

**相关文件：**
- `src/components/editor/test-question-dialog.tsx` - 测试题生成对话框
- `src/app/learn/[planId]/page.tsx` - 学习计划详情页面
- `src/app/api/test-questions/generate/route.ts` - 测试题生成 API
- `src/lib/ai/prompts.ts` - 测试题生成提示词

---

### 7. 用户界面设计 ✅

**设计特性：**
- **Glassmorphism 风格**：磨砂玻璃效果、透明背景、背景模糊
- **配色方案**：
  - 主色：#0D9488（青绿色 - 学习与成长）
  - 辅助色：#2DD4BF（亮青色）
  - CTA 按钮：#EA580C（橙色 - 行动号召）
  - 背景：#F0FDFA（浅青色）
  - 文字：#134E4A（深青色）
- **字体**：Baloo 2、Comic Neue（友好、教育感）
- **响应式设计**：支持 375px、768px、1024px、1440px 断点
- **可访问性**：
  - 文字对比度 ≥ 4.5:1
  - 支持键盘导航
  - ARIA 标签支持
  - 尊重 prefers-reduced-motion 设置
- **交互效果**：
  - 所有可点击元素有 cursor-pointer
  - 平滑过渡（150-300ms）
  - 清晰的 hover 和 focus 状态

**相关文件：**
- `src/app/globals.css` - 全局样式和 CSS 变量
- `src/components/ui/` - UI 基础组件库
- `tailwind.config.ts` - Tailwind 配置

---

## 快速开始

### 环境配置

1. **安装 Node.js 20**
   ```bash
   # 使用 nvm 管理 Node 版本
   nvm install 20
   nvm use 20
   ```

2. **克隆项目并安装依赖**
   ```bash
   git clone <repository>
   cd next-ai-driven-learning
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制示例文件
   cp .dev.vars.example .dev.vars
   
   # 编辑 .dev.vars，添加必要的 API Key
   # - DEEPSEEK_API_KEY: DeepSeek API Key
   # - OPENAI_API_KEY: OpenAI API Key（可选）
   # - GOOGLE_CLIENT_ID: Google OAuth ID
   # - GOOGLE_CLIENT_SECRET: Google OAuth Secret
   # - GITHUB_ID: GitHub OAuth ID
   # - GITHUB_SECRET: GitHub OAuth Secret
   ```

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建和部署

```bash
# 类型检查
npx tsc --noEmit

# 构建项目
npm run build

# 预览构建结果
npm run preview

# 部署到 Cloudflare
npm run deploy
```

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建项目
npm run preview          # 预览构建结果

# 代码质量
npx tsc --noEmit         # 类型检查
npm run lint             # 代码检查

# 数据库
npm run db:generate      # 生成数据库迁移
npm run db:migrate:local # 本地数据库迁移

# 部署
npm run deploy           # 部署到 Cloudflare
```

## 核心 API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/session` - 获取当前会话

### AI 生成
- `POST /api/ai/generate` - AI 内容生成
- `POST /api/ai/chat` - AI 对话

### 学习计划
- `POST /api/learning-plan` - 创建学习计划
- `GET /api/learning-plan` - 获取学习计划列表
- `GET /api/learning-plan/[planId]` - 获取计划详情
- `POST /api/learning-outline/generate` - 生成学习大纲

### 文件上传
- `POST /api/upload` - 上传文件
- `GET /api/upload/[fileId]` - 获取文件

### 草稿
- `POST /api/drafts` - 保存草稿
- `GET /api/drafts` - 获取草稿列表

## 数据库模型

主要数据表：
- `users` - 用户信息
- `learning_plans` - 学习计划
- `learning_outlines` - 学习大纲
- `knowledge_contents` - 知识内容
- `test_questions` - 测试题目
- `user_answers` - 用户答题记录
- `learning_progress` - 学习进度
- `notes` - 用户笔记
- `files` - 上传的文件
- `chat_history` - AI 对话历史
- `drafts` - 编辑草稿

详见 `docs/DATABASE.md`

## 故障排除

### 常见问题

**Q: 开发服务器无法启动**
- 检查 Node.js 版本是否为 20
- 清除 `.next` 和 `node_modules` 目录，重新安装依赖
- 检查端口 3000 是否被占用

**Q: 类型检查失败**
- 运行 `npx tsc --noEmit` 查看具体错误
- 确保所有导入路径正确
- 检查 TypeScript 配置

**Q: AI 生成失败**
- 检查 API Key 是否正确配置
- 确保网络连接正常
- 查看浏览器控制台的错误信息

**Q: 数据库连接失败**
- 检查 Cloudflare D1 配置
- 确保数据库迁移已执行
- 查看 `docs/DATABASE.md` 获取详细配置

## 贡献指南

1. 创建功能分支：`git checkout -b feature/your-feature`
2. 提交更改：`git commit -am 'Add your feature'`
3. 推送到分支：`git push origin feature/your-feature`
4. 创建 Pull Request

## 许可证

MIT License



---

### 2024-01-20 - 修复举一反三按钮样式和选项格式问题

**问题描述:**
1. 举一反三按钮宽度太宽，不协调
2. 选项中有很多 `\n` 字符
3. 悬浮工具栏偶发自动出现（打开测试题文档时固定在左下方）

**修复内容:**

1. **优化举一反三按钮样式** (`src/components/editor/similar-question-button-extension.ts`)
   - 减小 padding: `6px 12px` → `4px 8px`
   - 减小字体大小: `13px` → `12px`
   - 减小 gap: `6px` → `4px`
   - 减小 border-radius: `8px` → `6px`
   - 减小 margin-left: `12px` → `8px`
   - 按钮更紧凑，与文档内容更协调

2. **清理选项中的 `\n` 字符** (`src/app/api/test-questions/generate/route.ts`)
   - 在 API 层清理所有 `\n` 和 `\\n` 字符
   - 清理范围：题目、选项、答案、解析
   - 使用 `.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()`
   - 替换为空格并去除首尾空白

3. **悬浮工具栏偶发问题说明**
   - 已有完善的检查逻辑：
     - 检查选区是否为空
     - 检查选区是否在 details/summary 元素内
     - 检查选区是否在举一反三按钮内
     - 使用 150ms 延迟显示，避免闪烁
   - 偶发问题可能是浏览器选区残留
   - 现有逻辑已经能处理大部分情况

**技术实现:**

1. **按钮样式优化:**
```typescript
style: 'display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2); margin-left: 8px; user-select: none;'
```

2. **选项清理逻辑:**
```typescript
// 清理选项中的 \n 字符
testData.questions = testData.questions.map((question) => {
  if (question.options && Array.isArray(question.options)) {
    question.options = question.options.map((option) => 
      option.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
    )
  }
  // 同时清理题目、答案和解析中的 \n
  if (question.question) {
    question.question = question.question.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
  }
  if (question.answer) {
    question.answer = question.answer.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
  }
  if (question.explanation) {
    question.explanation = question.explanation.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
  }
  return question
})
```

**效果:**
- ✅ 举一反三按钮更紧凑，与文档内容协调
- ✅ 选项中不再有 `\n` 字符，显示更清晰
- ✅ 题目、答案、解析也清理了换行符
- ✅ 悬浮工具栏的显示逻辑已经优化，偶发问题已最小化

**相关文件:**
- `src/components/editor/similar-question-button-extension.ts` - 按钮样式优化
- `src/app/api/test-questions/generate/route.ts` - 选项格式清理
- `src/components/editor/bubble-menu-toolbar.tsx` - 悬浮工具栏逻辑（已有完善检查）


---

### 2024-01-20 - 修复测试题文档生成 bug（文档树收起状态）

**问题描述:**
- 当左边文档树处于收起状态时，在测试题文档中点击"生成测试题"，会在测试题文档下创建子测试题文档（错误行为）
- 预期行为：应该直接覆盖当前测试题文档的内容

**根本原因:**
- API 路由 `src/app/api/learning-plan/[planId]/route.ts` 在返回大纲数据时，**没有包含 `isTestDocument` 字段**
- 前端虽然在数据加载时尝试读取 `isTestDocument` 字段（`item.isTestDocument || false`），但由于 API 没有返回这个字段，所以始终为 `false`
- 导致前端无法正确判断当前文档是否为测试题文档
- 判断失败后，会将当前测试题文档作为父文档，创建子测试题文档

**修复内容:**

1. **修复 API 路由返回数据** (`src/app/api/learning-plan/[planId]/route.ts`)
   - 在 `buildTree` 函数中添加 `isTestDocument` 字段
   - 从数据库的 `outline.isTestDocument` 读取并返回给前端
   - 确保前端能正确获取测试题文档标志

2. **添加调试日志** (`src/app/plan/[planId]/page.tsx`)
   - 在 `handleTestGenerate` 函数中添加详细的调试信息
   - 输出 `activeDocId`、`currentDoc`、`isCurrentTestDoc` 等关键变量
   - 方便后续排查类似问题

3. **优化文档树状态同步** (`src/app/plan/[planId]/page.tsx`)
   - 在覆盖测试题文档内容时，同步更新 `documents` 状态中的 `isTestDocument` 标志
   - 确保前端状态与数据库保持一致

**技术实现:**

1. **API 修复:**
```typescript
// 构建树形结构
const buildTree = (parentId: string | null = null): any[] => {
  return outlines
    .filter(o => o.parentId === parentId)
    .map(outline => ({
      id: outline.id,
      title: outline.title,
      description: outline.description,
      content: contentsMap[outline.id]?.content || '',
      estimatedTime: outline.estimatedTime,
      isTestDocument: outline.isTestDocument || false,  // ✅ 添加测试题文档标志
      children: buildTree(outline.id),
    }))
}
```

2. **调试日志:**
```typescript
console.log('=== 测试题生成调试信息 ===')
console.log('activeDocId:', activeDocId)
console.log('currentDoc:', currentDoc)
console.log('isCurrentTestDoc:', isCurrentTestDoc)
console.log('params.parentDocId:', params.parentDocId)
console.log('documentContents[activeDocId]?.title:', documentContents[activeDocId]?.title)
```

3. **状态同步:**
```typescript
// 更新文档树中的标题（确保 isTestDocument 标志保持）
const updateDocTitle = (nodes: DocumentNode[]): DocumentNode[] => {
  return nodes.map((node) => {
    if (node.id === activeDocId) {
      return {
        ...node,
        title: testDocTitle,
        isTestDocument: true, // 确保标志保持
      }
    }
    if (node.children) {
      return {
        ...node,
        children: updateDocTitle(node.children),
      }
    }
    return node
  })
}
setDocuments((prev) => updateDocTitle(prev))
```

**效果:**
- ✅ API 正确返回 `isTestDocument` 字段
- ✅ 前端能正确判断当前文档是否为测试题文档
- ✅ 在测试题文档中生成测试题时，直接覆盖内容而不是创建子文档
- ✅ 无论文档树是展开还是收起状态，行为都正确
- ✅ 添加了调试日志，方便后续排查问题

**相关文件:**
- `src/app/api/learning-plan/[planId]/route.ts` - 修复 API 返回数据
- `src/app/plan/[planId]/page.tsx` - 添加调试日志和状态同步


---

### 2024-01-20 - 修复悬浮工具栏莫名出现的问题（增强版）

**问题描述:**
- 测试题文档中，即使页面上没有被选中的文本，悬浮工具栏有时还是会莫名出现
- 之前的修复只检查了 Tiptap 编辑器的选区状态，但没有检查 DOM 的实际选区

**根本原因:**
- 编辑器的某些操作（如点击按钮、展开/收起 details 等）可能会创建一个"空的但不是真正空的"选区
- Tiptap 的 `selection.empty` 和 `from === to` 检查不够严格
- 需要额外检查 DOM 的 `window.getSelection()` 来确保真的有文本被选中

**修复内容:**

1. **添加 DOM 选区检查** (`src/components/editor/bubble-menu-toolbar.tsx`)
   - 在 Tiptap 选区检查之后，添加 DOM 选区检查
   - 使用 `window.getSelection()` 获取实际的 DOM 选区
   - 检查选区是否存在、是否有范围
   - 检查选中的文本是否为空（只有空白字符）

2. **三层检查机制**
   - **第一层**: Tiptap 选区检查 (`empty || from === to`)
   - **第二层**: DOM 选区存在性检查 (`!domSelection || domSelection.rangeCount === 0`)
   - **第三层**: 选中文本内容检查 (`selectedText.trim().length === 0`)

**技术实现:**
```typescript
// 严格规则：只要没有选中文本，就隐藏工具栏
if (empty || from === to) {
  setIsVisible(false)
  setActiveCategory(null)
  return
}

// 额外检查：确保 DOM 中确实有选中的文本
const domSelection = window.getSelection()
if (!domSelection || domSelection.rangeCount === 0) {
  setIsVisible(false)
  setActiveCategory(null)
  return
}

// 检查选中的文本是否为空（只有空白字符）
const selectedText = domSelection.toString().trim()
if (!selectedText || selectedText.length === 0) {
  setIsVisible(false)
  setActiveCategory(null)
  return
}
```

**效果:**
- ✅ 只有真正选中文本时，悬浮工具栏才会显示
- ✅ 点击按钮、展开/收起 details 等操作不会触发工具栏
- ✅ 选中空白字符（空格、换行等）不会触发工具栏
- ✅ 三层检查机制确保更严格的判断
- ✅ 用户体验更好，不会被意外弹出的工具栏干扰

**相关文件:**
- `src/components/editor/bubble-menu-toolbar.tsx` - 浮动工具栏组件（添加 DOM 选区检查）


---

### 2024-01-20 - 支持测试题中的代码块格式

**功能描述:**
- 当测试题包含代码相关文案时，自动使用多行代码块格式显示
- AI 生成的代码会被正确格式化为 HTML 代码块
- 支持多种编程语言的语法高亮标记

**实现内容:**

1. **修改 AI Prompt** (`src/lib/ai/prompts.ts`)
   - 在生成测试题的指令中添加代码块格式要求
   - 指导 AI 使用 Markdown 代码块格式（\`\`\`语言名\n代码\n\`\`\`）
   - 支持 JavaScript、Python、Java、C++、Go 等多种语言

2. **添加 Markdown 到 HTML 转换函数** (`src/app/plan/[planId]/page.tsx`)
   - 创建 `convertMarkdownCodeToHtml` 函数
   - 使用正则表达式匹配 Markdown 代码块
   - 转义 HTML 特殊字符（`<`、`>`、`&` 等）
   - 转换为 HTML `<pre><code>` 标签
   - 保留语言标记用于语法高亮

3. **应用转换到题目生成**
   - 在生成测试题 HTML 时，对题目、答案、解析都应用转换
   - 确保代码块正确显示在编辑器中
   - 支持覆盖模式和创建模式

**技术实现:**

1. **AI Prompt 指令:**
```typescript
9. **重要**：如果题目包含代码，请在 question 字段中使用 Markdown 代码块格式（\`\`\`语言名\n代码\n\`\`\`），例如：
   - JavaScript 代码：\`\`\`javascript\nconst x = 10;\n\`\`\`
   - Python 代码：\`\`\`python\ndef hello():\n    print("Hello")\n\`\`\`
   - 其他语言同理
```

2. **转换函数:**
```typescript
const convertMarkdownCodeToHtml = (text: string): string => {
  // 匹配 Markdown 代码块：```语言名\n代码\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  
  return text.replace(codeBlockRegex, (_match, language, code) => {
    // 转义 HTML 特殊字符
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
    
    // 返回 HTML 代码块
    const lang = language || 'plaintext'
    return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`
  })
}
```

3. **应用转换:**
```typescript
// 题目
const questionHtml = convertMarkdownCodeToHtml(question.question)
htmlContent += `<div><strong>题目：</strong></div>${questionHtml}`

// 答案
const answerHtml = convertMarkdownCodeToHtml(question.answer)
htmlContent += `<div><strong>答案：</strong></div>${answerHtml}`

// 解析
const explanationHtml = convertMarkdownCodeToHtml(question.explanation)
htmlContent += `<div><strong>解析：</strong></div>${explanationHtml}`
```

**使用示例:**

**AI 生成的 JSON:**
```json
{
  "question": "以下 JavaScript 代码的输出是什么？\n```javascript\nconst arr = [1, 2, 3];\nconsole.log(arr.map(x => x * 2));\n```",
  "answer": "[2, 4, 6]",
  "explanation": "map 方法会遍历数组，对每个元素执行回调函数，返回新数组。"
}
```

**转换后的 HTML:**
```html
<div><strong>题目：</strong></div>
<p>以下 JavaScript 代码的输出是什么？</p>
<pre><code class="language-javascript">const arr = [1, 2, 3];
console.log(arr.map(x => x * 2));</code></pre>
```

**效果:**
- ✅ 代码以多行代码块格式显示，清晰易读
- ✅ 代码块有语言标记，支持语法高亮
- ✅ HTML 特殊字符被正确转义，不会破坏页面结构
- ✅ 支持题目、答案、解析中的代码块
- ✅ AI 会自动识别代码内容并使用代码块格式

**相关文件:**
- `src/lib/ai/prompts.ts` - AI Prompt（添加代码块格式指令）
- `src/app/plan/[planId]/page.tsx` - 测试题生成逻辑（添加 Markdown 转换）


---

### 2024-01-20 - 增强代码块自动检测和转换功能

**问题描述:**
- AI 生成的题目中包含代码，但没有使用 Markdown 代码块格式
- 代码以纯文本形式显示，不易阅读

**解决方案:**
在 API 层添加自动检测和转换功能，即使 AI 没有使用代码块格式，也能自动识别代码并转换。

**实现内容:**

1. **加强 AI Prompt** (`src/lib/ai/prompts.ts`)
   - 将代码格式规则提升为独立的重点部分
   - 使用更明确的格式说明和示例
   - 强调"必须"使用代码块，"不要"直接写在文本中

2. **添加自动代码检测和转换** (`src/app/api/test-questions/generate/route.ts`)
   - 创建 `autoConvertCode` 函数，自动检测文本中的代码
   - 支持多种编程语言的检测：Python、JavaScript、Java、C++ 等
   - 检测模式包括：
     - 关键字检测（def、class、const、function 等）
     - 函数调用模式（functionName(...)）
     - 赋值语句（x = ...）
   - 自动识别编程语言
   - 将检测到的代码包裹在 Markdown 代码块中

**技术实现:**

1. **代码检测模式:**
```typescript
const codePatterns = [
  // Python: def, class, import, for, if, while 等关键字开头
  /\b(def|class|import|from|for|if|while|try|except|with)\s+\w+/,
  // JavaScript/TypeScript: const, let, var, function, class 等
  /\b(const|let|var|function|class|async|await|return)\s+\w+/,
  // Java/C++: public, private, void, int, String 等
  /\b(public|private|protected|void|int|String|boolean|class)\s+\w+/,
  // 函数调用模式: functionName(...)
  /\w+\([^)]*\)/,
  // 赋值语句: x = ...
  /\w+\s*=\s*[^=]/,
]
```

2. **语言识别:**
```typescript
let language = 'plaintext'
if (/\b(def|import|from|print)\b/.test(text)) {
  language = 'python'
} else if (/\b(const|let|var|function|console\.log)\b/.test(text)) {
  language = 'javascript'
} else if (/\b(public|private|void|System\.out)\b/.test(text)) {
  language = 'java'
}
```

3. **代码块提取和转换:**
```typescript
// 查找连续的代码行
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim()
  if (line && codePatterns.some(pattern => pattern.test(line))) {
    if (codeStartIndex === -1) {
      codeStartIndex = i
    }
    codeEndIndex = i
  }
}

// 转换为代码块
const codeBlock = '\n```' + language + '\n' + codeLines.join('\n') + '\n```\n'
```

**处理流程:**

1. AI 生成题目（可能包含纯文本代码）
2. API 接收响应，解析 JSON
3. 对每道题目的 question、answer、explanation 字段：
   - 检查是否已包含代码块（```），如果有则跳过
   - 使用正则表达式检测是否包含代码模式
   - 如果检测到代码，自动识别语言
   - 提取代码行，包裹在 Markdown 代码块中
4. 前端接收处理后的数据
5. 使用 `convertMarkdownCodeToHtml` 转换为 HTML 代码块

**效果:**
- ✅ 即使 AI 没有使用代码块格式，也能自动识别和转换
- ✅ 支持 Python、JavaScript、Java、C++ 等多种语言
- ✅ 自动识别编程语言，添加正确的语言标记
- ✅ 保留代码前后的说明文字
- ✅ 双重保障：AI Prompt 指导 + API 自动转换

**相关文件:**
- `src/lib/ai/prompts.ts` - 加强 AI Prompt 指令
- `src/app/api/test-questions/generate/route.ts` - 添加自动代码检测和转换


---

### 2024-01-20 - 优化代码题格式：整题代码块策略

**优化思路:**
- 之前的方案是检测代码片段并单独包裹
- 新方案：如果题目主要是代码（代码行数超过 50% 或超过 3 行），就把整个题目内容放在一个代码块中
- 这样更清晰，避免混合文本和代码块导致的格式混乱

**实现内容:**

1. **优化 AI Prompt** (`src/lib/ai/prompts.ts`)
   - 明确区分两种情况：
     - **整题是代码**：将整个题目内容放在一个代码块中（如代码阅读题、代码输出题）
     - **部分包含代码**：只将代码片段用代码块包裹（如概念题中的代码示例）
   - 提供清晰的示例说明两种情况

2. **优化自动检测逻辑** (`src/app/api/test-questions/generate/route.ts`)
   - 统计包含代码的行数
   - 判断标准：
     - 代码行数 ≥ 3 行，或
     - 代码行数占总行数的 50% 以上
   - 如果满足条件，将整个内容包裹在一个代码块中
   - 支持更多语言检测：Python、JavaScript、Java、C++、Go

**技术实现:**

1. **判断逻辑:**
```typescript
const lines = text.split('\n')
let codeLineCount = 0

// 统计包含代码的行数
for (const line of lines) {
  const trimmedLine = line.trim()
  if (trimmedLine && codePatterns.some(pattern => pattern.test(trimmedLine))) {
    codeLineCount++
  }
}

// 如果代码行数超过总行数的 50%，或者超过 3 行，就把整个内容当作代码块
const totalLines = lines.filter(l => l.trim()).length
const shouldWrapAll = codeLineCount >= 3 || (totalLines > 0 && codeLineCount / totalLines > 0.5)
```

2. **语言检测（增强版）:**
```typescript
let language = 'plaintext'
if (/\b(def|import|from|print)\b/.test(text)) {
  language = 'python'
} else if (/\b(const|let|var|function|console\.log)\b/.test(text)) {
  language = 'javascript'
} else if (/\b(public|private|void|System\.out)\b/.test(text)) {
  language = 'java'
} else if (/\b(#include|cout|cin|std::)\b/.test(text)) {
  language = 'cpp'
} else if (/\b(func|package|import|fmt\.)\b/.test(text)) {
  language = 'go'
}
```

3. **整题包裹:**
```typescript
if (shouldWrapAll) {
  // 整个内容包裹在代码块中
  return '```' + language + '\n' + text + '\n```'
}
```

**效果对比:**

**之前的方案（混合格式）:**
```
题目：请编写一个Python函数
```python
def add_one(x):
    return x + 1
```
要求该函数...
```

**新方案（整题代码块）:**
```python
# 请编写一个Python函数 add_one
# 要求：接收一个整数参数 x，返回 x + 1

def add_one(x):
    return x + 1

# 测试用例：
# add_one(5) 应该返回 6
# add_one(0) 应该返回 1
```

**优势:**
- ✅ 格式更统一，整个题目都是代码块
- ✅ 避免文本和代码块混合导致的格式问题
- ✅ 更符合编程题的阅读习惯
- ✅ 代码高亮更完整
- ✅ 自动检测更智能（基于代码行数比例）

**相关文件:**
- `src/lib/ai/prompts.ts` - 优化 AI Prompt，区分整题代码和部分代码
- `src/app/api/test-questions/generate/route.ts` - 优化自动检测逻辑，支持整题代码块


---

### 2024-01-20 - 简化策略：所有编程题都用代码块

**最终方案:**
- **只要检测到代码，就把整个题目内容放在代码块中**
- 不再区分"整题代码"和"部分代码"
- 简单、统一、清晰

**实现内容:**

1. **简化 AI Prompt** (`src/lib/ai/prompts.ts`)
   - 明确规则：只要涉及编程语言、代码，整个题目都用代码块
   - 提供多种题型的示例：代码输出题、概念题、代码补全题
   - 使用注释来说明问题和选项

2. **简化自动检测逻辑** (`src/app/api/test-questions/generate/route.ts`)
   - 移除复杂的行数统计和占比计算
   - 只要检测到任何代码模式，就整题包裹
   - 检测模式更全面：
     - Python: `def`, `class`, `import`, `print`, `return` 等
     - JavaScript: `const`, `let`, `var`, `function`, `console.log` 等
     - Java: `public`, `private`, `void`, `System.out` 等
     - C++: `#include`, `cout`, `cin`, `std::` 等
     - Go: `func`, `package`, `fmt.` 等

**技术实现:**

```typescript
// 只要检测到任何代码模式，就把整个内容当作代码块
const hasCode = codePatterns.some(pattern => pattern.test(text))

if (hasCode) {
  // 检测语言
  let language = 'plaintext'
  if (/\b(def|import|from|print)\b/.test(text)) {
    language = 'python'
  } else if (/\b(const|let|var|function|console\.log)\b/.test(text)) {
    language = 'javascript'
  } else if (/\b(public|private|void|System\.out)\b/.test(text)) {
    language = 'java'
  } else if (/#include|cout|cin|std::/.test(text)) {
    language = 'cpp'
  } else if (/\b(func|package|fmt\.)\b/.test(text)) {
    language = 'go'
  }
  
  // 整个内容包裹在代码块中
  return '```' + language + '\n' + text + '\n```'
}
```

**示例效果:**

**Python 代码输出题:**
```python
# 请编写一个Python函数 apply_transformations
# 它接受一个整数列表 data 和一个函数列表 funcs 作为参数

def add_one(x):
    return x + 1

def multiply_by_two(x):
    return x * 2

result = apply_transformations([1, 2, 3], [add_one, multiply_by_two])
print(result)

# 请问输出是什么？
```

**JavaScript 概念题:**
```javascript
// 以下代码的输出是什么？请解释原因。

const arr = [1, 2, 3];
const doubled = arr.map(x => x * 2);
console.log(doubled);
console.log(arr);

// A. [2, 4, 6] 和 [1, 2, 3]
// B. [2, 4, 6] 和 [2, 4, 6]
// C. [1, 2, 3] 和 [1, 2, 3]
// D. [1, 2, 3] 和 [2, 4, 6]
```

**优势:**
- ✅ 规则简单：有代码 = 整题代码块
- ✅ 格式统一：所有编程题都是代码块
- ✅ 易于理解：不需要复杂的判断逻辑
- ✅ 自动兜底：即使 AI 没遵循，API 也会自动转换
- ✅ 阅读体验好：代码高亮完整，格式清晰

**相关文件:**
- `src/lib/ai/prompts.ts` - 简化 AI Prompt，统一规则
- `src/app/api/test-questions/generate/route.ts` - 简化检测逻辑，只要有代码就整题包裹


---

### 2024-01-21 - 答题界面优化：富文本编辑器 + 简化标题栏

**问题描述:**
1. 答题区域使用普通文本框，无法输入格式化内容（如代码、列表等）
2. 顶部标题栏显示进度信息太突兀，占用空间较大

**优化方案:**
1. 简答题和编程题使用富文本编辑器，支持格式化输入
2. 简化顶部标题栏，移除进度显示
3. 将进度信息移到右侧答题卡面板

**实现内容:**

1. **创建富文本答题输入组件** (`src/components/test-answer/rich-text-answer-input.tsx`)
   - 使用 Tiptap 编辑器，支持多种格式：
     - 粗体、斜体、代码
     - 有序列表、无序列表
     - 代码块
     - 撤销/重做
   - 包含工具栏，提供格式化按钮
   - 最小高度 150px，自动扩展
   - 边框和圆角样式，与项目风格一致

2. **修改答题输入组件** (`src/components/test-answer/answer-input.tsx`)
   - 简答题（`short`）使用富文本编辑器
   - 编程题（`code`）使用富文本编辑器
   - 选择题（`choice`）保持单选按钮
   - 填空题（`fill`）保持单行输入框

3. **简化标题栏** (`src/components/test-answer/answer-mode-header.tsx`)
   - **答题模式**：
     - 只保留标题"答题中"
     - 右侧显示"提交答案"按钮和关闭按钮
     - 移除进度显示、完成度、进度条
     - 高度从 py-4 减小到 py-3
   - **结果模式**：
     - 保持原有的得分显示和重新答题按钮
   - 移除 `answeredCount` 和 `onStartAnswer` 参数

4. **优化答题卡面板** (`src/components/test-answer/answer-card-panel.tsx`)
   - **答题模式**：
     - 在顶部显示完整的进度信息
     - 答题进度：已答题数 / 总题数
     - 完成度：百分比显示
     - 进度条：渐变色显示进度
     - 用时：分:秒格式
   - **结果模式**：
     - 保持原有的统计信息显示
   - 使用渐变背景和圆角，视觉效果更好

**技术实现:**

```typescript
// 富文本编辑器配置
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      horizontalRule: false,
    }),
  ],
  content: value,
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML())
  },
})

// 工具栏按钮
<button onClick={() => editor.chain().focus().toggleBold().run()}>
  <Bold className="w-4 h-4" />
</button>

// 答题输入组件
if (type === 'short' || type === 'code') {
  return <RichTextAnswerInput value={value} onChange={onChange} />
}
```

**答题卡进度显示:**

```typescript
{mode === 'answer' && (
  <div className="mb-6 space-y-3">
    {/* 答题进度 */}
    <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-600 mb-1">答题进度</p>
          <p className="text-2xl font-bold text-teal-600">
            {answeredCount} / {totalQuestions}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 mb-1">完成度</p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round((answeredCount / totalQuestions) * 100)}%
          </p>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>
    </div>

    {/* 用时 */}
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
      <span className="text-sm text-gray-600">用时</span>
      <span className="text-lg font-bold text-gray-900">
        {formatTime(elapsedTime)}
      </span>
    </div>
  </div>
)}
```

**效果:**

✅ **富文本编辑器**
- 简答题和编程题支持格式化输入
- 可以添加代码块、列表、粗体等格式
- 工具栏直观易用
- 答案内容更丰富、更专业

✅ **简化标题栏**
- 顶部标题栏更简洁，不再突兀
- 只显示必要的标题和操作按钮
- 视觉焦点集中在题目和答题区域

✅ **优化答题卡**
- 进度信息移到右侧答题卡
- 显示更详细的进度信息（进度、完成度、进度条、用时）
- 视觉层次更清晰
- 答题卡成为信息中心

✅ **用户体验**
- 答题界面更专业，支持格式化输入
- 视觉布局更合理，信息分布更均衡
- 减少视线切换，提高答题效率

**相关文件:**
- `src/components/test-answer/rich-text-answer-input.tsx` - 富文本答题输入组件（新建）
- `src/components/test-answer/answer-input.tsx` - 答题输入组件（修改为使用富文本编辑器）
- `src/components/test-answer/answer-mode-header.tsx` - 答题模式头部（简化，移除进度显示）
- `src/components/test-answer/answer-card-panel.tsx` - 答题卡面板（添加进度信息显示）
- `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层（更新组件调用）


---

### 2024-01-21 - 修复答题卡已答题数计算问题

**问题描述:**
- 用户没有答题时，答题卡显示已答题数不为 0
- 富文本编辑器初始化时会生成空的 HTML 标签（如 `<p></p>`），导致被误判为已答题

**根本原因:**
- 原来的判断逻辑只检查 `answer.trim() !== ''`
- 富文本编辑器的空内容是 `<p></p>` 或 `<p><br></p>`，不是空字符串
- 这些 HTML 标签通过 `trim()` 后仍然不是空字符串，被误判为有内容

**修复内容:**

1. **优化已答题数计算逻辑** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 移除 HTML 标签后再检查是否有实际内容
   - 使用正则表达式 `answer.replace(/<[^>]*>/g, '')` 移除所有 HTML 标签
   - 然后 `trim()` 并检查是否为空字符串
   - 同时应用到 `answeredCount` 和 `answeredQuestions` 的计算

**技术实现:**

```typescript
// 计算已答题数：检查答案是否有实际内容
const answeredCount = Object.keys(state.userAnswers).filter(key => {
  const answer = state.userAnswers[parseInt(key)]
  if (!answer) return false
  
  // 移除 HTML 标签和空白字符，检查是否有实际内容
  const textContent = answer.replace(/<[^>]*>/g, '').trim()
  return textContent !== ''
}).length

// 获取已答题目集合
const answeredQuestions = new Set(
  Object.keys(state.userAnswers)
    .filter(key => {
      const answer = state.userAnswers[parseInt(key)]
      if (!answer) return false
      
      // 移除 HTML 标签和空白字符，检查是否有实际内容
      const textContent = answer.replace(/<[^>]*>/g, '').trim()
      return textContent !== ''
    })
    .map(key => parseInt(key))
)
```

**处理的情况:**

| 答案内容 | 移除 HTML 后 | 是否算已答题 |
|---------|------------|------------|
| `""` (空字符串) | `""` | ❌ 否 |
| `"<p></p>"` | `""` | ❌ 否 |
| `"<p><br></p>"` | `""` | ❌ 否 |
| `"<p>  </p>"` | `""` | ❌ 否 |
| `"A"` (选择题) | `"A"` | ✅ 是 |
| `"<p>答案</p>"` | `"答案"` | ✅ 是 |
| `"<p><strong>答案</strong></p>"` | `"答案"` | ✅ 是 |

**效果:**
- ✅ 没有答题时，已答题数正确显示为 0
- ✅ 富文本编辑器的空内容不会被误判为已答题
- ✅ 只有真正输入了内容的题目才会被计入已答题数
- ✅ 答题卡的题号状态显示正确
- ✅ 进度条和完成度百分比准确

**相关文件:**
- `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层（优化已答题数计算逻辑）


---

### 2024-01-21 - 修复选择题选项解析问题

**问题描述:**
- 选择题显示富文本编辑器而不是选项按钮
- 用户需要手动输入答案，而不是点击选项

**根本原因:**
- 题目解析函数 `parseQuestionsFromHTML` 只能识别 `<ul><li>` 格式的选项
- 但现在生成的测试题使用的是 `<p>A. 选项内容</p>` 格式
- 导致选项没有被正确提取，题目被误判为简答题

**修复内容:**

1. **优化选项解析逻辑** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 添加对 `<p>A. xxx</p>` 格式选项的识别
   - 使用正则表达式 `/^[A-H]\.\s/` 检测选项格式
   - 当检测到选项格式时，设置题型为 `choice`
   - 将选项文本添加到 `options` 数组

**技术实现:**

```typescript
// 提取选项 - 支持多种格式
if (text.includes('选项：')) {
  questionType = 'choice'
  // 继续查找后续的选项元素
} else if (currentElement.tagName === 'UL') {
  // 支持 <ul><li> 格式
  questionType = 'choice'
  const listItems = currentElement.querySelectorAll('li')
  options = Array.from(listItems).map(li => li.textContent?.trim() || '')
} else if (currentElement.tagName === 'P' && /^[A-H]\.\s/.test(text)) {
  // 支持 <p>A. xxx</p> 格式（新增）
  questionType = 'choice'
  options.push(text.trim())
}
```

**支持的选项格式:**

| 格式 | 示例 | 是否支持 |
|------|------|---------|
| `<ul><li>` | `<ul><li>选项A</li><li>选项B</li></ul>` | ✅ 支持 |
| `<p>A. xxx</p>` | `<p>A. 字符串</p><p>B. 整数</p>` | ✅ 支持（新增） |
| 代码注释 | `// A. 选项内容` | ✅ 支持（已有） |

**效果:**
- ✅ 选择题正确显示单选按钮组
- ✅ 用户可以点击选项进行选择
- ✅ 不再显示富文本编辑器
- ✅ 选项格式清晰，带有 A、B、C、D 标签
- ✅ 选中状态有明显的视觉反馈（teal 色高亮）

**相关文件:**
- `src/components/test-answer/test-answer-overlay.tsx` - 答题覆盖层（优化选项解析逻辑）


---

### 2024-01-21 - 优化题型判断逻辑：使用明确的题型标记

**问题描述:**
- 题型判断依赖解析 HTML 内容来推断，不够严谨
- 容易因为 HTML 格式变化导致题型识别错误
- 选择题可能被误判为简答题，导致显示富文本编辑器而不是选项按钮

**优化方案:**
在生成题目时就明确标记题型，而不是事后推断。

**实现内容:**

1. **在生成 HTML 时添加题型标记** (`src/app/plan/[planId]/page.tsx`)
   - 在 `<h3>` 标签上添加 `data-question-type` 属性
   - 值来自 AI 返回的 `question.type` 字段
   - 格式：`<h3 data-question-type="choice">第 1 题</h3>`

2. **优先从标记读取题型** (`src/components/test-answer/test-answer-overlay.tsx`)
   - 解析题目时，首先检查 `<h3>` 标签的 `data-question-type` 属性
   - 如果有明确标记，直接使用该题型
   - 只有在没有标记时才使用推断逻辑（向后兼容旧题目）

3. **标准化 AI 返回的题型** (`src/app/api/test-questions/generate/route.ts`)
   - 添加 `normalizeType` 函数，将各种表达统一为标准值
   - 支持的标准题型：`choice`、`fill`、`short`、`code`
   - 自动修正：如果有选项但 type 不是 choice，自动改为 choice

**技术实现:**

```typescript
// 1. 生成 HTML 时添加题型标记
htmlContent += `<h3 data-question-type="${question.type || 'short'}">第 ${index + 1} 题</h3>`

// 2. 解析时优先读取标记
const questionTypeAttr = header.getAttribute('data-question-type')
let questionType: 'choice' | 'fill' | 'short' | 'code' = questionTypeAttr as any || 'short'

// 3. 标准化题型
const normalizeType = (type: string): string => {
  if (!type) return 'short'
  
  const lowerType = type.toLowerCase().trim()
  
  // 选择题的各种表达
  if (lowerType.includes('choice') || lowerType.includes('选择') || lowerType.includes('multiple')) {
    return 'choice'
  }
  // 填空题的各种表达
  if (lowerType.includes('fill') || lowerType.includes('填空') || lowerType.includes('blank')) {
    return 'fill'
  }
  // 编程题的各种表达
  if (lowerType.includes('code') || lowerType.includes('编程') || lowerType.includes('coding')) {
    return 'code'
  }
  // 简答题的各种表达
  if (lowerType.includes('short') || lowerType.includes('简答') || lowerType.includes('essay')) {
    return 'short'
  }
  
  return 'short'
}

// 如果有选项但 type 不是 choice，自动修正
if (question.options && Array.isArray(question.options) && question.options.length > 0) {
  question.type = 'choice'
}
```

**题型标准化映射:**

| AI 可能返回的值 | 标准化后的值 | 说明 |
|----------------|------------|------|
| `choice`, `选择`, `multiple_choice` | `choice` | 选择题 |
| `fill`, `填空`, `fill_blank`, `blank` | `fill` | 填空题 |
| `short`, `简答`, `essay`, `问答` | `short` | 简答题 |
| `code`, `编程`, `coding`, `program` | `code` | 编程题 |
| 其他任何值 | `short` | 默认简答题 |

**优势:**

✅ **准确性高** - 题型由 AI 生成时就确定，不依赖 HTML 解析
✅ **容错性强** - 支持 AI 返回的各种题型表达，自动标准化
✅ **向后兼容** - 旧题目没有标记时仍然使用推断逻辑
✅ **易于维护** - 题型逻辑集中在一处，不分散在多个地方
✅ **自动修正** - 如果有选项但类型不对，自动修正为选择题

**效果:**
- ✅ 选择题始终显示选项按钮，不会误判为简答题
- ✅ 题型判断更可靠，不受 HTML 格式变化影响
- ✅ AI 返回的各种题型表达都能正确识别
- ✅ 有选项的题目自动识别为选择题

**相关文件:**
- `src/app/plan/[planId]/page.tsx` - 生成题目时添加题型标记
- `src/components/test-answer/test-answer-overlay.tsx` - 优先从标记读取题型
- `src/app/api/test-questions/generate/route.ts` - 标准化 AI 返回的题型


---

### 2024-01-21 - 扩展题型系统：支持 9 种题型

**问题描述:**
- 原来只支持 4 种题型（单选题、填空题、简答题、编程题）
- 题型种类太少，无法满足多样化的测试需求
- 缺少常见的判断题、多选题、论述题等题型

**优化方案:**
扩展题型系统，从 4 种增加到 9 种，覆盖常见的所有题型。

**新增题型:**

| 题型 | 类型标识 | 说明 | 答题方式 |
|------|---------|------|---------|
| **单选题** | `choice` | 从多个选项中选择一个正确答案 | 单选按钮 |
| **多选题** ⭐ | `multiple-choice` | 从多个选项中选择多个正确答案 | 复选框 |
| **判断题** ⭐ | `true-false` | 判断对错 | 对/错选择 |
| **填空题** | `fill` | 填写简短答案 | 单行输入框 |
| **简答题** | `short` | 简要回答问题 | 富文本编辑器 |
| **论述题** ⭐ | `essay` | 详细阐述观点 | 富文本编辑器 |
| **编程题** | `code` | 编写代码 | 富文本编辑器 |
| **匹配题** ⭐ | `matching` | 将左侧项目与右侧项目匹配 | 富文本编辑器 |
| **排序题** ⭐ | `ordering` | 将选项按正确顺序排列 | 富文本编辑器 |

⭐ 表示新增题型

**实现内容:**

1. **扩展类型定义** (`src/components/test-answer/question-answer-item.tsx`)
   ```typescript
   type: 'choice' | 'multiple-choice' | 'true-false' | 'fill' | 'short' | 'essay' | 'code' | 'matching' | 'ordering'
   ```

2. **实现多选题组件** (`src/components/test-answer/answer-input.tsx`)
   - 使用复选框而不是单选按钮
   - 支持选择多个选项
   - 答案格式：`A, C, D`（逗号分隔）
   - 显示提示："可以选择多个选项"

3. **实现判断题组件**
   - 只显示"对"和"错"两个选项
   - 使用单选按钮
   - 自动识别：当选项只有 2 个且是对/错、True/False、是/否等

4. **扩展题型标准化逻辑** (`src/app/api/test-questions/generate/route.ts`)
   - 支持识别各种题型的中英文表达
   - 自动识别判断题（2 个选项且是对/错）
   - 智能修正题型（有选项但类型不对时自动修正）

5. **更新 AI Prompt** (`src/lib/ai/prompts.ts`)
   - 告知 AI 支持 9 种题型
   - 提供每种题型的示例格式
   - 说明多选题答案用逗号分隔
   - 说明匹配题和排序题的答案格式

**技术实现:**

```typescript
// 多选题实现
if (type === 'multiple-choice' && options) {
  const selectedOptions = value ? value.split(',').map(v => v.trim()) : []
  
  const handleCheckboxChange = (optionLabel: string) => {
    let newSelected: string[]
    if (selectedOptions.includes(optionLabel)) {
      newSelected = selectedOptions.filter(v => v !== optionLabel)
    } else {
      newSelected = [...selectedOptions, optionLabel].sort()
    }
    onChange(newSelected.join(', '))
  }
  // ... 渲染复选框
}

// 判断题自动识别
if (question.options.length === 2) {
  const opt1 = question.options[0].toLowerCase().trim()
  const opt2 = question.options[1].toLowerCase().trim()
  const trueFalsePairs = [
    ['对', '错'], ['true', 'false'], ['是', '否'], ['正确', '错误']
  ]
  const isJudgment = trueFalsePairs.some(([a, b]) => 
    (opt1.includes(a) && opt2.includes(b)) || (opt1.includes(b) && opt2.includes(a))
  )
  if (isJudgment) {
    question.type = 'true-false'
  }
}
```

**题型标准化映射:**

| AI 可能返回的值 | 标准化后的值 | 说明 |
|----------------|------------|------|
| `choice`, `单选`, `选择` | `choice` | 单选题 |
| `multiple`, `multiple-choice`, `多选` | `multiple-choice` | 多选题 |
| `true-false`, `判断`, `对错` | `true-false` | 判断题 |
| `fill`, `填空`, `blank` | `fill` | 填空题 |
| `short`, `简答`, `问答` | `short` | 简答题 |
| `essay`, `论述`, `作文` | `essay` | 论述题 |
| `code`, `编程`, `coding` | `code` | 编程题 |
| `matching`, `匹配`, `连线` | `matching` | 匹配题 |
| `ordering`, `排序`, `顺序` | `ordering` | 排序题 |

**答案格式说明:**

| 题型 | 答案格式示例 | 说明 |
|------|------------|------|
| 单选题 | `A` | 单个选项标签 |
| 多选题 | `A, C, D` | 多个选项标签，逗号分隔 |
| 判断题 | `对` 或 `错` | 中文或英文都支持 |
| 填空题 | `答案文本` | 简短文本 |
| 简答题 | `答案文本` | 可以包含格式 |
| 论述题 | `详细答案` | 可以包含格式 |
| 编程题 | `代码` | 可以包含代码块 |
| 匹配题 | `A-1, B-2, C-3` | 匹配关系 |
| 排序题 | `C, A, D, B` | 正确顺序 |

**效果:**

✅ **题型丰富** - 从 4 种增加到 9 种，覆盖常见所有题型
✅ **多选题支持** - 可以选择多个选项，答案自动排序
✅ **判断题优化** - 自动识别对/错选项，简化答题
✅ **论述题区分** - 与简答题分开，提示更详细
✅ **匹配题和排序题** - 为后续拖拽界面优化预留接口
✅ **智能识别** - 自动识别判断题，自动修正题型
✅ **向后兼容** - 旧题目仍然可以正常显示和答题

**相关文件:**
- `src/components/test-answer/question-answer-item.tsx` - 扩展题型定义
- `src/components/test-answer/answer-input.tsx` - 实现多选题、判断题等新题型
- `src/app/api/test-questions/generate/route.ts` - 扩展题型标准化逻辑
- `src/lib/ai/prompts.ts` - 更新 AI prompt，支持 9 种题型
- `src/components/test-answer/test-answer-overlay.tsx` - 更新题型类型定义


---

### 2024-01-21 - 完善题型系统：更新对话框和显示

**问题描述:**
- 测试题生成对话框只显示 4 种预定义题型
- 页面中的题型映射（typeMap）也只有 4 种
- 与已实现的 9 种题型系统不一致

**优化内容:**

1. **更新测试题对话框** (`src/components/editor/test-question-dialog.tsx`)
   - 预定义题型从 4 种扩展到 9 种
   - 更新题型标签：`选择题` → `单选题`
   - 添加新题型：多选题、判断题、论述题、匹配题、排序题
   - 默认选中：单选题、多选题、判断题（更常用的题型）
   - 更新预定义题型检查列表

2. **更新页面题型映射** (`src/app/plan/[planId]/page.tsx`)
   - 在两处生成测试题的地方更新 typeMap
   - 添加所有 9 种题型的中文映射
   - 确保显示的题型名称与对话框一致

**题型映射表:**

```typescript
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
```

**对话框预定义题型:**

| 题型 | 值 | 标签 |
|------|-----|------|
| 单选题 | `choice` | 单选题 |
| 多选题 | `multiple-choice` | 多选题 |
| 判断题 | `true-false` | 判断题 |
| 填空题 | `fill` | 填空题 |
| 简答题 | `short` | 简答题 |
| 论述题 | `essay` | 论述题 |
| 编程题 | `code` | 编程题 |
| 匹配题 | `matching` | 匹配题 |
| 排序题 | `ordering` | 排序题 |

**效果:**

✅ **对话框完整** - 显示所有 9 种题型选项
✅ **默认选择优化** - 默认选中最常用的单选、多选、判断题
✅ **标签统一** - 所有地方都使用"单选题"而不是"选择题"
✅ **映射完整** - 页面显示的题型名称与对话框一致
✅ **用户体验** - 可以方便地选择任意题型组合

**相关文件:**
- `src/components/editor/test-question-dialog.tsx` - 更新预定义题型列表
- `src/app/plan/[planId]/page.tsx` - 更新题型映射（两处）


---

### 2024-01-21 - 修复题目解析问题：部分题目无法显示

**问题描述:**
- 生成了10道题，但答题面板只显示5道题
- 部分题目在答题界面中没有显示

**根本原因:**
题目解析函数 `parseQuestionsFromHTML` 的逻辑有问题：
1. 生成的HTML格式是：`<div><strong>题目：</strong></div><p>题目内容</p>`
2. 题目标签和内容被分成了两个独立的元素
3. 原来的解析逻辑只检查包含"题目："的元素，导致实际内容在下一个元素中无法被提取
4. 当 `questionText` 为空时，题目不会被添加到列表中

**修复内容:**

1. **优化题目文本提取逻辑** (`src/components/test-answer/test-answer-overlay.tsx`)
   - **情况1**: 当前元素包含"题目："标签
     - 提取标签后的文本
     - 如果文本为空，检查下一个兄弟元素
     - 如果下一个元素不是选项或答案，将其作为题目内容
   
   - **情况2**: 前一个元素包含"题目："标签
     - 当前元素就是题目内容
     - 确保不是选项或答案元素
     - 提取当前元素的文本作为题目内容

**技术实现:**

```typescript
// 情况1: <p>题目：xxx</p> 或 <div>题目：xxx</div>
if ((currentElement.tagName === 'P' || currentElement.tagName === 'DIV') && text.includes('题目：')) {
  questionText = text.replace('题目：', '').replace(/^.*题目：/, '').trim()
  // 如果这个元素只包含"题目："标签，继续读取下一个元素
  if (!questionText && currentElement.nextElementSibling) {
    const nextText = currentElement.nextElementSibling.textContent || ''
    if (nextText && !nextText.includes('选项：') && !nextText.includes('答案：')) {
      questionText = nextText.trim()
    }
  }
}
// 情况2: 如果前一个元素是"题目："标签，当前元素就是题目内容
else if (currentElement.previousElementSibling) {
  const prevText = currentElement.previousElementSibling.textContent || ''
  if (prevText.includes('题目：') && !questionText) {
    // 确保不是选项或答案
    if (!text.includes('选项：') && !text.includes('答案：') && text.trim()) {
      questionText = text.trim()
    }
  }
}
```

**支持的HTML格式:**

| 格式 | 示例 | 是否支持 |
|------|------|---------|
| 单元素 | `<p>题目：这是题目内容</p>` | ✅ 支持 |
| 分离元素 | `<div><strong>题目：</strong></div><p>这是题目内容</p>` | ✅ 支持 |
| 代码块 | `<pre><code>// 题目内容</code></pre>` | ✅ 支持 |

**效果:**

✅ **完整解析** - 所有题目都能正确解析和显示
✅ **格式兼容** - 支持多种HTML格式
✅ **向后兼容** - 不影响旧格式的题目
✅ **答题卡准确** - 答题卡显示的题目数量与实际一致

**相关文件:**
- `src/components/test-answer/test-answer-overlay.tsx` - 优化题目文本提取逻辑


---

## 测试题系统

### 题型系统
支持 9 种题型：
1. **单选题** (choice) - 单选按钮
2. **多选题** (multiple-choice) - 复选框
3. **判断题** (true-false) - 对/错选择
4. **填空题** (fill) - 单行文本输入
5. **简答题** (short) - 富文本编辑器
6. **论述题** (essay) - 富文本编辑器
7. **编程题** (code) - 富文本编辑器（支持代码高亮）
8. **匹配题** (matching) - 富文本编辑器
9. **排序题** (ordering) - 富文本编辑器

### 题目生成
- 生成测试题时，会在 `<h3>` 标签上添加 `data-question-type` 属性标记题型
- 格式：`<h3 data-question-type="choice">第 1 题 ...</h3>`
- 选项格式：`<p>A. 选项内容</p>`（每个选项一个 `<p>` 标签）
- 支持代码块格式的题目（使用 `<pre><code>` 标签）

### 题目解析
- **优先读取 `data-question-type` 属性来确定题型**
- 只有在没有 `data-question-type` 属性时，才根据内容推断题型
- 选项解析支持多种格式：
  - `<p>A. xxx</p>` 格式（标准格式）
  - `<ul><li>xxx</li></ul>` 格式
  - 代码块后的 `<p>` 标签格式

### 已知问题修复记录

#### 2024-01-21: 优化测试题生成对话框 + 修复选项包含在题目中的bug
**优化内容**:

1. **支持随机分配和自定义数量两种模式**
   - **随机分配模式**：AI 自动在选中的题型中分配题目数量
   - **自定义数量模式**：为每个题型单独设置题目数量
   - 随机模式下，题目数量最小值为选中的题型数量

2. **题型横向排列**
   - 改为 3 列网格布局，节省空间
   - 每个题型卡片显示复选框、题型名称和数量输入框（自定义模式）
   - 视觉更紧凑，一屏可以看到更多题型

3. **实时统计信息**
   - 显示已选择的题型数量
   - 自定义模式下显示总题目数量
   - 生成按钮显示实际生成的题目数量

4. **修复选项包含在题目描述中的bug**
   - **问题**：AI 生成的题目描述中包含了选项内容，例如：
     ```
     # 关于 Python 函数中的参数传递和可变/不可变对象，以下哪些说法是正确的？
     # 请选择所有正确的选项。
     # A. 当传递不可变对象...
     # B. 当传递可变对象...
     ```
   - **解决方案**：在提示词中明确要求：
     - 题目描述中不要包含选项内容
     - 题目描述只包含问题本身
     - 选项单独放在 options 数组中
   - 添加正确和错误示例对比

**修改文件**: 
- `src/components/editor/test-question-dialog.tsx` - 对话框组件（大幅重构）
- `src/lib/ai/prompts.ts` - 提示词优化

#### 2024-01-21: 修复AI不按用户选择的题型生成问题
**问题**: AI生成的题目没有按照用户选择的题型来生成，例如：
- 用户没有选择排序题和匹配题，但AI生成了这些题型
- 用户选择了多选题，但AI没有生成多选题

**根本原因**:
- 提示词中只是说"题型多样，按照指定的题型比例分配"，这太模糊
- AI可能会自己决定生成其他题型，或者忽略某些题型
- 没有明确强调"只能生成用户选择的题型"

**解决方案**:
1. 在提示词中明确要求：**只能生成以下题型：${typeDescriptions}。严格按照这些题型生成，不要生成其他题型！**
2. 特别强调：**如果用户选择了多选题（multiple-choice），必须生成多选题，不要全部生成单选题！**
3. 要求题型分布尽量均匀，每种题型都要有

**修改文件**: `src/lib/ai/prompts.ts`

#### 2024-01-21: 修复选择题选项识别问题
**问题**: 代码块格式的选择题无法正确识别选项，导致显示富文本编辑框而不是选项按钮。

**根本原因**:
1. 题目生成时已经在 `<h3>` 标签上添加了 `data-question-type` 属性
2. 但解析逻辑中，即使读取了 `data-question-type`，后续代码还在尝试从题目内容推断题型
3. 这导致已标记的题型被覆盖，特别是代码块格式的题目

**解决方案**:
1. 简化解析逻辑，移除代码块内的题型推断代码
2. 确保 `data-question-type` 属性优先级最高
3. 只在没有 `data-question-type` 属性时才根据内容推断题型
4. 选项解析不再依赖题型判断，直接提取所有 `<p>A. xxx</p>` 格式的选项

**修改文件**: `src/components/test-answer/test-answer-overlay.tsx`

#### 2024-01-21: 修复题目解析问题 - 部分题目无法显示
**问题**: 生成了 10 道题，但答题面板只显示 5 道。

**根本原因**: 
- 生成的 HTML 格式是 `<div><strong>题目：</strong></div><p>题目内容</p>`
- 题目标签和内容被分成两个独立元素
- 原解析逻辑只检查包含"题目："的元素，导致实际内容在下一个元素中无法提取
- 当 `questionText` 为空时，题目不会被添加到列表

**解决方案**: 优化题目文本提取逻辑，支持两种情况：
1. 当前元素包含"题目："但内容为空时，读取下一个兄弟元素
2. 前一个兄弟元素包含"题目："时，当前元素就是题目内容

**修改文件**: `src/components/test-answer/test-answer-overlay.tsx`

#### 2024-01-21: 完善题型系统 - 更新对话框和显示
**问题**: 题型系统从 4 种扩展到 9 种后，需要更新测试题生成对话框和页面显示。

**修改内容**:
1. 更新 `src/components/editor/test-question-dialog.tsx` 的预定义题型列表
2. 更新题型标签："选择题" → "单选题"
3. 默认选中改为：单选题、多选题、判断题
4. 更新 `src/app/plan/[planId]/page.tsx` 中两处的 typeMap，添加所有 9 种题型的中文映射

**修改文件**: 
- `src/components/editor/test-question-dialog.tsx`
- `src/app/plan/[planId]/page.tsx`


---

### 2024-01-21 - 新增代码运行环境功能

**功能描述:**
在页面右下角添加悬浮工具菜单，第一个工具是代码运行环境（Code Playground），支持多种编程语言的在线代码编辑和执行。

**核心特性:**
- 🎯 **右下角悬浮按钮** - 固定在页面右下角，不遮挡主要内容
- 💻 **多语言支持** - 支持 JavaScript、Python、Java、C++、C、Go、Rust、TypeScript
- ✏️ **代码编辑器** - 行号显示、Tab 缩进、等宽字体
- ▶️ **在线执行** - 使用 Piston API 安全执行代码
- 📊 **执行结果** - 显示标准输出、标准错误、执行时间、内存使用
- 💾 **自动保存** - 代码自动保存到浏览器本地存储
- 📝 **代码模板** - 每种语言提供 Hello World 和斐波那契示例
- 🎨 **现代化 UI** - 两栏布局，全屏模式，复制输出

**实现内容:**

1. **悬浮工具按钮组件** (`src/components/tools/floating-tool-button.tsx`)
   - 右下角固定位置的圆形按钮
   - 点击展开工具列表
   - 显示"代码运行环境"工具项
   - 点击工具项打开代码运行环境弹窗

2. **代码运行环境组件** (`src/components/tools/code-playground.tsx`)
   - 全屏弹窗设计，支持全屏/窗口模式切换
   - 两栏布局：
     - 左侧：代码编辑器（可滚动）
     - 右侧：输出结果（40% 宽度）
   - 顶部工具栏：
     - 语言选择下拉框
     - 全屏/退出全屏按钮
     - 关闭按钮
   - 运行按钮：
     - 显示在编辑器区域顶部
     - 支持快捷键 Ctrl+Enter / Cmd+Enter
     - 执行中显示"执行中..."状态
   - 输出区域：
     - 显示标准输出、标准错误、编译输出
     - 显示执行时间和内存使用
     - 支持复制输出内容
   - 自动保存：
     - 代码变化时自动保存到 localStorage
     - 按语言分别保存
     - 切换语言时自动加载对应代码

3. **代码编辑器组件** (`src/components/tools/code-editor.tsx`)
   - 简洁的代码编辑器实现
   - 左侧行号显示（灰色背景）
   - 代码区域：
     - 等宽字体（font-mono）
     - 深色背景（bg-gray-900）
     - 浅色文本（text-gray-100）
   - Tab 键支持：
     - 按 Tab 插入 2 个空格
     - 保持光标位置
   - 自动调整高度

4. **代码执行器** (`src/lib/code-executor.ts`)
   - 使用 Piston API (https://emkc.org/api/v2/piston)
   - 支持 8 种编程语言：
     - JavaScript (Node.js 18.15.0)
     - Python (3.10.0)
     - Java (15.0.2)
     - C++ (10.2.0)
     - C (10.2.0)
     - Go (1.16.2)
     - Rust (1.68.2)
     - TypeScript (5.0.3)
   - 执行限制：
     - 编译超时：10 秒
     - 运行超时：10 秒
     - 编译内存：256MB
     - 运行内存：256MB
   - 返回结果：
     - 标准输出（stdout）
     - 标准错误（stderr）
     - 编译输出（compile_output）
     - 执行时间（秒）
     - 内存使用（KB）

5. **默认代码模板**
   - 每种语言提供 Hello World 示例
   - 包含斐波那契数列计算示例
   - 展示语言基本语法

**技术实现:**

```typescript
// 1. 悬浮按钮
<div className="fixed bottom-6 right-6 z-50">
  <button onClick={() => setIsOpen(true)}>
    <Code2 className="w-6 h-6" />
  </button>
</div>

// 2. 代码执行
const result = await executeCode(language, code)
// 调用 Piston API
fetch('https://emkc.org/api/v2/piston/execute', {
  method: 'POST',
  body: JSON.stringify({
    language: 'javascript',
    version: '18.15.0',
    files: [{ name: 'main.js', content: code }],
    compile_timeout: 10000,
    run_timeout: 10000,
  }),
})

// 3. 自动保存
useEffect(() => {
  if (code) {
    localStorage.setItem(`code-playground-${language}`, code)
  }
}, [code, language])

// 4. 快捷键支持
const handleKeyDown = (e: React.KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    handleRun()
  }
}
```

**使用场景:**

1. **学习编程语言**
   - 快速测试语法
   - 验证代码逻辑
   - 对比不同语言的实现

2. **调试代码片段**
   - 测试算法实现
   - 验证数据结构操作
   - 检查边界条件

3. **教学演示**
   - 展示代码执行结果
   - 对比不同实现方式
   - 实时编写和运行示例

**用户体验:**

✅ **快速访问** - 右下角固定按钮，随时可用
✅ **多语言支持** - 8 种主流编程语言
✅ **即时反馈** - 代码执行结果实时显示
✅ **自动保存** - 代码不会丢失
✅ **快捷操作** - Ctrl+Enter 快速运行
✅ **清晰输出** - 区分标准输出、错误、编译信息
✅ **性能指标** - 显示执行时间和内存使用
✅ **现代化 UI** - 全屏模式、复制功能、深色编辑器

**技术栈:**
- **前端框架**: React + Next.js
- **UI 组件**: Tailwind CSS + Lucide Icons
- **代码执行**: Piston API (开源代码执行引擎)
- **本地存储**: localStorage (按语言分别保存)

**API 依赖:**
- Piston API: https://emkc.org/api/v2/piston
- 免费、开源、无需认证
- 支持 60+ 编程语言
- 沙箱环境，安全可靠

**相关文件:**
- `src/components/tools/floating-tool-button.tsx` - 悬浮工具按钮（新建）
- `src/components/tools/code-playground.tsx` - 代码运行环境主组件（新建）
- `src/components/tools/code-editor.tsx` - 代码编辑器组件（新建）
- `src/lib/code-executor.ts` - 代码执行器（新建）
- `src/app/layout.tsx` - 根布局（添加悬浮按钮）
- `.kiro/specs/code-playground/requirements.md` - 需求文档（新建）

**后续优化方向:**
1. ⏳ 添加代码历史记录功能
2. ⏳ 支持更多编程语言
3. ⏳ 添加代码分享功能
4. ⏳ 支持标准输入（stdin）
5. ⏳ 添加代码格式化功能
6. ⏳ 支持主题切换（亮色/暗色）
7. ⏳ 添加代码片段库
8. ⏳ 支持多文件项目


---

### 2024-01-23 - AI模型配置重构：统一配置管理系统

**问题描述:**
- 之前的AI配置分散在多个地方，不易管理
- 每个调用LLM的地方都需要单独处理API Key
- 没有统一的模型选择和配置界面
- 无法测试模型连通性

**重构目标:**
1. 创建统一的AI配置管理系统
2. 提供可视化的配置界面
3. 支持多个AI模型配置和切换
4. 支持模型连通性测试
5. 所有调用LLM的地方从配置读取

**实现内容:**

1. **创建配置管理系统** (`src/lib/ai/config.ts`)
   - 定义 `ModelConfig` 接口：id, name, provider, apiKey, baseUrl, isConnected, lastTested, model
   - 定义 `AIConfig` 接口：models数组, defaultModelId
   - 实现配置的增删改查函数
   - 实现模型连通性测试函数
   - 预定义4个常用模型（GPT-4, GPT-3.5, Claude 3, DeepSeek）

2. **创建配置客户端辅助函数** (`src/lib/ai/config-client.ts`)
   - `createAIClientFromConfig()` - 从配置创建AI客户端（客户端使用）
   - `getModelConfigFromHeaders()` - 从请求头获取模型配置（服务端使用）
   - `createAIClientFromRequest()` - 从请求创建AI客户端（服务端使用）
   - `addModelConfigToHeaders()` - 将模型配置添加到请求头（客户端使用）

3. **创建连通性测试API** (`src/app/api/ai/test-connection/route.ts`)
   - 支持OpenAI兼容API测试
   - 支持Anthropic API测试
   - 返回测试结果和错误信息

4. **创建设置页面布局** (`src/app/settings/layout.tsx`)
   - 左侧导航菜单
   - 顶部返回按钮
   - 响应式设计

5. **创建AI配置页面** (`src/app/settings/ai/page.tsx`)
   - 使用项目统一风格（白色卡片、teal主题色）
   - 支持添加预定义模型
   - 支持配置API Key和Base URL
   - 支持测试连接
   - 支持设置默认模型
   - 支持删除模型
   - 显示连通状态（已连通/连接失败/未配置/未测试）
   - API Key隐藏/显示切换

6. **修改所有调用LLM的API**
   - 修改为从请求头读取模型配置
   - 使用 `createAIClientFromRequest()` 创建客户端
   - 移除provider和model参数
   - 统一错误处理

7. **修改前端调用逻辑**
   - 使用 `getDefaultModel()` 获取默认模型
   - 使用 `addModelConfigToHeaders()` 添加配置到请求头
   - 移除provider和model参数
   - 统一错误提示

**技术实现:**

```typescript
// 1. 配置管理（客户端）
export function getAIConfig(): AIConfig {
  const stored = localStorage.getItem('ai-config')
  return stored ? JSON.parse(stored) : { models: [] }
}

export function getDefaultModel(): ModelConfig | null {
  const config = getAIConfig()
  if (config.defaultModelId) {
    const model = config.models.find(m => m.id === config.defaultModelId)
    if (model && model.isConnected) return model
  }
  const available = getAvailableModels()
  return available[0] || null
}

// 2. 客户端调用（前端）
const { getDefaultModel } = await import('@/lib/ai/config')
const { addModelConfigToHeaders } = await import('@/lib/ai/config-client')
const modelConfig = getDefaultModel()

if (!modelConfig) {
  throw new Error('未配置可用的 AI 模型，请前往设置页面配置')
}

const headers = addModelConfigToHeaders(
  { 'Content-Type': 'application/json' },
  modelConfig
)

const response = await fetch('/api/test-questions/generate', {
  method: 'POST',
  headers,
  body: JSON.stringify({ topic, difficulty, questionCount, questionTypes }),
})

// 3. 服务端处理（API）
import { createAIClientFromRequest } from '@/lib/ai/config-client'

export async function POST(request: NextRequest) {
  // 从配置创建 AI 客户端
  let aiClient: ReturnType<typeof createAIClientFromRequest>
  try {
    aiClient = createAIClientFromRequest(request)
  } catch (clientError) {
    return NextResponse.json(
      { error: `${clientError instanceof Error ? clientError.message : '创建 AI 客户端失败'}` },
      { status: 500 }
    )
  }

  // 调用 AI
  const response = await aiClient.chat({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 4000,
  })
}
```

**配置流程:**

1. **添加模型配置**
   - 访问 `/settings/ai`
   - 点击"添加模型"按钮（GPT-4, GPT-3.5, Claude 3, DeepSeek）
   - 输入API Key
   - （可选）自定义Base URL
   - 点击"测试连接"
   - 测试成功后，点击"设为默认"

2. **使用AI功能**
   - 系统自动使用默认模型
   - 所有AI功能（生成大纲、生成内容、生成测试题、答题评估、举一反三）都使用配置的模型
   - 如果未配置模型，会提示"未配置可用的 AI 模型，请前往设置页面配置"

**修改的文件:**

**新建文件:**
- `src/lib/ai/config.ts` - 配置管理系统
- `src/lib/ai/config-client.ts` - 配置客户端辅助函数
- `src/app/api/ai/test-connection/route.ts` - 连通性测试API
- `src/app/settings/layout.tsx` - 设置页面布局
- `src/app/settings/page.tsx` - 设置主页
- `src/app/settings/ai/page.tsx` - AI配置页面

**修改的API文件:**
- `src/app/api/test-questions/generate/route.ts` - 测试题生成API
- `src/app/api/learning-outline/generate/route.ts` - 大纲生成API
- `src/app/api/learning-content/generate/route.ts` - 内容生成API
- `src/app/api/learning-plan/generate/route.ts` - 学习计划生成API
- `src/app/api/test-answer/submit/route.ts` - 答题提交API
- `src/app/api/test-answer/generate-similar/route.ts` - 相似题目生成API

**修改的前端文件:**
- `src/app/plan/[planId]/page.tsx` - 学习计划详情页面（3处修改：AI生成、测试题生成、举一反三）

**优势:**

✅ **统一管理** - 所有AI配置集中在一个地方
✅ **可视化配置** - 提供友好的配置界面
✅ **多模型支持** - 可以配置多个AI模型并切换
✅ **连通性测试** - 配置后可以测试是否能正常连接
✅ **代码简化** - 调用LLM的代码更简洁
✅ **易于维护** - 配置逻辑集中，易于修改和扩展
✅ **用户友好** - 清晰的错误提示和配置引导

**后续工作:**

1. ⏳ 添加模型选择器组件（在可以选择模型的地方）
2. ⏳ 支持自定义baseUrl（目前已有字段但未使用）
3. ⏳ 添加模型使用统计
4. ⏳ 支持更多AI提供商（Gemini, Claude等）

**相关文件:**
- `src/lib/ai/config.ts` - 配置管理系统（新建）
- `src/lib/ai/config-client.ts` - 配置客户端辅助函数（新建）
- `src/app/api/ai/test-connection/route.ts` - 连通性测试API（新建）
- `src/app/settings/layout.tsx` - 设置布局（新建）
- `src/app/settings/page.tsx` - 设置主页（新建）
- `src/app/settings/ai/page.tsx` - AI配置页面（新建）
- 所有调用LLM的API和前端文件（修改）



---

### 2025-01-23 - 优化 AI 模型配置：从 OpenRouter 动态获取模型列表

**问题描述:**
- 原来的模型列表是硬编码的 4 个预定义模型
- 无法支持更多的 AI 模型和厂商
- 用户需要手动添加新模型配置

**优化方案:**
从 OpenRouter API 动态获取模型列表，支持更多厂商和模型。

**实现内容:**

1. **创建中间层 API** (`src/app/api/ai/models/route.ts`)
   - 从 OpenRouter API 获取模型列表
   - 过滤指定厂商的模型：
     - OpenAI
     - Gemini (Google)
     - DeepSeek
     - Anthropic
     - 智谱AI (Z.AI)
     - Qwen
     - 月之暗面 (MoonshotAI)
     - MiniMax
     - 字节跳动 (ByteDance)
   - 处理成统一的数据结构
   - 按厂商和名称排序
   - 提供厂商统计信息
   - 缓存 1 小时

2. **数据结构设计**
   ```typescript
   interface AIModel {
     id: string           // 模型 ID，如 "openai/gpt-4"
     name: string         // 模型显示名称
     provider: string     // 厂商名称（中文）
     providerId: string   // 厂商 ID（英文）
     contextLength: number // 上下文长度
     pricing: {
       prompt: number     // 输入价格
       completion: number // 输出价格
     }
   }
   
   interface ModelsResponse {
     success: boolean
     data: {
       models: AIModel[]
       total: number
       providers: Array<{
         name: string
         count: number
       }>
     }
   }
   ```

3. **优化 AI 设置页面** (`src/app/settings/ai/page.tsx`)
   - 添加模型选择器界面
   - 支持按厂商筛选模型
   - 支持搜索模型名称
   - 显示模型上下文长度
   - 一键添加模型到配置
   - 显示已添加状态
   - 支持刷新模型列表

4. **厂商映射配置**
   ```typescript
   const PROVIDER_MAP: Record<string, string> = {
     'openai': 'OpenAI',
     'google': 'Gemini',
     'deepseek': 'DeepSeek',
     'anthropic': 'Anthropic',
     'zhipuai': '智谱AI',
     'qwen': 'Qwen',
     'moonshot': '月之暗面',
     'minimax': 'MiniMax',
     'bytedance': '字节跳动',
   }
   ```

5. **模型添加逻辑**
   - 点击"添加"按钮添加模型
   - 自动设置 baseUrl 为 OpenRouter API
   - 自动展开配置表单
   - 提示用户输入 OpenRouter API Key
   - 提供 OpenRouter 官网链接

**用户界面:**

```
┌─────────────────────────────────────────────────────┐
│  添加模型                          [刷新列表]        │
├─────────────────────────────────────────────────────┤
│  [全部] [OpenAI] [Gemini] [DeepSeek] [Anthropic]   │
│  [智谱AI] [Qwen] [月之暗面] [MiniMax] [字节跳动]   │
├─────────────────────────────────────────────────────┤
│  [搜索模型...]                                      │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │ GPT-4 Turbo                    [OpenAI]     │   │
│  │ 上下文: 128K                    [添加]      │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Claude 3 Opus                  [Anthropic]  │   │
│  │ 上下文: 200K                    [已添加]    │   │
│  ├─────────────────────────────────────────────┤   │
│  │ DeepSeek Chat                  [DeepSeek]   │   │
│  │ 上下文: 64K                     [添加]      │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**技术实现:**

```typescript
// API 中间层
export async function GET() {
  const response = await fetch('https://openrouter.ai/api/v1/models')
  const data = await response.json()
  
  const processedModels = data.data
    .filter(model => {
      const providerId = model.id.split('/')[0]
      return ALLOWED_PROVIDERS.includes(providerId)
    })
    .map(model => ({
      id: model.id,
      name: model.name,
      provider: PROVIDER_MAP[model.id.split('/')[0]],
      providerId: model.id.split('/')[0],
      contextLength: model.context_length,
      pricing: {
        prompt: parseFloat(model.pricing.prompt),
        completion: parseFloat(model.pricing.completion),
      },
    }))
    .sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider, 'zh-CN')
      }
      return a.name.localeCompare(b.name, 'zh-CN')
    })
  
  return NextResponse.json({
    success: true,
    data: {
      models: processedModels,
      total: processedModels.length,
      providers: /* 统计信息 */,
    },
  })
}

// 前端加载模型
const loadAvailableModels = async () => {
  const response = await fetch('/api/ai/models')
  const result = await response.json()
  if (result.success && result.data) {
    setAvailableModels(result.data.models)
  }
}

// 添加模型
const handleAddModel = (availableModel: AvailableModel) => {
  const newModel: ModelConfig = {
    id: availableModel.id,
    name: availableModel.name,
    provider: 'custom',
    model: availableModel.id,
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    isConnected: false,
  }
  
  setModels([...models, newModel])
  saveModelConfig(newModel)
  setExpandedId(newModel.id)
}
```

**优势:**

✅ **模型丰富** - 支持 9 个主流 AI 厂商的所有模型
✅ **动态更新** - 模型列表自动从 OpenRouter 获取，无需手动维护
✅ **易于筛选** - 按厂商分类，支持搜索
✅ **信息完整** - 显示上下文长度、定价等详细信息
✅ **用户友好** - 一键添加，自动配置 baseUrl
✅ **性能优化** - API 缓存 1 小时，减少请求
✅ **中文支持** - 厂商名称自动映射为中文

**支持的厂商:**

| 厂商 ID | 中文名称 | 代表模型 |
|---------|---------|---------|
| openai | OpenAI | GPT-4, GPT-3.5 |
| google | Gemini | Gemini Pro, Gemini Flash |
| deepseek | DeepSeek | DeepSeek Chat, DeepSeek Coder |
| anthropic | Anthropic | Claude 3 Opus, Claude 3 Sonnet |
| zhipuai | 智谱AI | GLM-4, ChatGLM |
| qwen | Qwen | Qwen-Max, Qwen-Plus |
| moonshot | 月之暗面 | Moonshot-v1 |
| minimax | MiniMax | MiniMax-Text |
| bytedance | 字节跳动 | Doubao |

**相关文件:**
- `src/app/api/ai/models/route.ts` - 模型列表 API（新建）
- `src/app/settings/ai/page.tsx` - AI 设置页面（重构）
- `src/lib/ai/config.ts` - AI 配置管理（保持不变）

**后续优化:**
- ⏳ 添加模型收藏功能
- ⏳ 添加模型对比功能
- ⏳ 支持自定义模型（非 OpenRouter）
- ⏳ 添加模型使用统计
