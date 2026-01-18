# AI 学习平台 - 环境配置指南

## 功能概述

已完成的功能：
1. ✅ **LLM 模型选择器** - 支持多个 AI 提供商（OpenAI、DeepSeek、Gemini、Claude、Cloudflare AI）
2. ✅ **API Key 配置界面** - 安全地在浏览器本地存储 API Keys
3. ✅ **AI 对话助手** - 支持流式响应和模型切换
4. ✅ **学习计划生成器** - AI 生成个性化学习计划
5. ✅ **学习大纲生成器** - AI 生成详细的学习大纲

## 环境变量配置

### 1. 开发环境配置文件

项目使用两个配置文件：
- `.dev.vars` - Cloudflare Workers 本地开发环境变量
- `.env.local` - Next.js 本地开发环境变量

### 2. 必需的环境变量

在 `.dev.vars` 文件中添加以下配置：

```bash
# NextAuth 配置（已配置）
AUTH_SECRET=PMF1RzbEJD4AhM3fLx+5uMuWaRl9Q7J7uCGS0W9+CwQ=
NEXTAUTH_URL=http://localhost:3000

# AI 提供商 API Keys（根据需要配置）

# OpenAI (ChatGPT) - 可选
# 获取地址：https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here

# DeepSeek - 可选
# 获取地址：https://platform.deepseek.com/api_keys
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# Google Gemini - 可选
# 获取地址：https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# Anthropic Claude - 可选
# 获取地址：https://console.anthropic.com/settings/keys
CLAUDE_API_KEY=your-claude-api-key-here

# Cloudflare R2 配置（用于文件上传）- 可选
# R2_ACCOUNT_ID=your-account-id
# R2_ACCESS_KEY_ID=your-access-key-id
# R2_SECRET_ACCESS_KEY=your-secret-access-key
# R2_BUCKET_NAME=your-bucket-name
# R2_PUBLIC_URL=https://your-bucket.r2.dev

# Google OAuth（可选）
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth（可选）
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. 配置说明

#### 免费选项（无需 API Key）
- **Cloudflare AI** - 完全免费，无需配置 API Key
- 默认使用 Llama 3.1 8B 模型
- 适合测试和轻量级使用

#### 付费选项（需要 API Key）

**OpenAI (ChatGPT)**
- 模型：GPT-4o, GPT-4o Mini, GPT-4 Turbo
- 特点：业界领先，功能强大
- 成本：$0.00015 - $0.01 / 1k tokens
- 获取：https://platform.openai.com/api-keys

**DeepSeek**
- 模型：DeepSeek Chat, DeepSeek Coder
- 特点：高性价比，中文友好
- 成本：$0.0001 / 1k tokens
- 获取：https://platform.deepseek.com/api_keys

**Google Gemini**
- 模型：Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 2.0 Flash
- 特点：超大上下文窗口（最高 200 万 tokens）
- 成本：$0.000075 - $0.00125 / 1k tokens
- 获取：https://aistudio.google.com/app/apikey

**Anthropic Claude**
- 模型：Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- 特点：推理能力强，长文本理解
- 成本：$0.0008 - $0.015 / 1k tokens
- 获取：https://console.anthropic.com/settings/keys

## 使用方式

### 方式一：在设置页面配置（推荐）

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 AI 设置页面：
   ```
   http://localhost:3000/settings/ai
   ```

3. 在页面中：
   - 选择 AI 提供商
   - 选择具体模型
   - 输入对应的 API Key
   - API Key 会安全地保存在浏览器本地存储中

### 方式二：在环境变量中配置

1. 在 `.dev.vars` 文件中添加 API Keys
2. 重启开发服务器
3. 系统会自动使用环境变量中的 API Keys

**注意：** 用户在设置页面配置的 API Key 优先级高于环境变量

## 功能页面

访问以下页面体验功能：

- **首页** - http://localhost:3000
- **AI 设置** - http://localhost:3000/settings/ai
- **AI 对话** - http://localhost:3000/ai-chat
- **学习计划列表** - http://localhost:3000/learning-plan
- **学习大纲生成** - http://localhost:3000/learning-outline
- **学习页面（整合编辑器+AI）** - http://localhost:3000/learn/1

### 学习页面功能

学习页面（`/learn/[planId]`）整合了以下功能：

**布局结构：**
- **左侧边栏**：学习大纲树形结构，可展开/折叠章节
- **中间主区域**：
  - **学习笔记标签**：富文本编辑器，支持代码、公式、图片、视频等
  - **AI 助手标签**：实时对话，解答学习问题
- **顶部导航**：显示学习进度条，一键保存笔记

**交互特性：**
- 点击大纲项自动切换到对应章节
- 支持侧边栏展开/收起
- 标签页切换（笔记 ↔ AI 助手）
- 自动保存学习进度
- 响应式设计，支持移动设备

## 安全说明

1. **API Key 存储**
   - 用户配置的 API Keys 仅保存在浏览器本地存储（localStorage）
   - 不会上传到服务器或数据库
   - 每次 API 调用时通过请求头传递

2. **环境变量**
   - `.dev.vars` 和 `.env.local` 已添加到 `.gitignore`
   - 不会被提交到代码仓库
   - 仅在本地开发环境使用

3. **生产环境**
   - 部署到 Cloudflare Pages 时，在 Cloudflare 控制台配置环境变量
   - 不要在代码中硬编码 API Keys

## 常见问题

### Q: 我没有任何 API Key，能使用吗？
A: 可以！默认使用免费的 Cloudflare AI，无需配置任何 API Key。

### Q: 如何切换模型？
A: 
1. 在设置页面选择提供商和模型
2. 或在 AI 对话界面点击右上角设置图标快速切换

### Q: API Key 安全吗？
A: 用户配置的 API Keys 仅保存在浏览器本地，不会上传到服务器。但建议定期更换 API Keys。

### Q: 哪个模型最便宜？
A: 
- 免费：Cloudflare AI
- 付费最便宜：DeepSeek ($0.0001/1k tokens)
- 性价比高：Gemini 1.5 Flash ($0.000075/1k tokens)

### Q: 哪个模型最强大？
A: 
- 综合能力：GPT-4o, Claude 3.5 Sonnet
- 代码能力：DeepSeek Coder, GPT-4o
- 长文本：Gemini 1.5 Pro (200万 tokens 上下文)

## 下一步

现在你可以：
1. 配置你喜欢的 AI 模型
2. 开始使用 AI 对话助手
3. 生成个性化学习计划
4. 创建详细的学习大纲

祝学习愉快！🎉
