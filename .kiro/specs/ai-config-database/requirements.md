# 需求文档

## 介绍

本功能旨在将 AI 模型配置从 localStorage 迁移到数据库存储，并支持多厂商独立 API 配置。系统将支持用户为不同的 AI 厂商配置独立的 API Key，同时保留 OpenRouter 统一 API 的方式。当用户选择某个模型时，系统会智能选择使用厂商独立 API 或 OpenRouter API。

## 术语表

- **AI_Config_System**: AI 模型配置管理系统
- **Provider**: AI 厂商（如 OpenAI、DeepSeek、Google Gemini 等）
- **Model**: AI 模型（如 GPT-4、DeepSeek Chat 等）
- **API_Key**: 用于访问 AI 服务的密钥
- **OpenRouter**: 统一的 AI API 聚合服务
- **Database**: 应用的数据库（Drizzle ORM + D1）
- **User**: 使用系统的用户

## 需求

### 需求 1: 数据库配置存储

**用户故事:** 作为用户，我希望我的 AI 配置能够存储在数据库中，这样我可以在不同设备上同步我的配置。

#### 验收标准

1. THE AI_Config_System SHALL 创建 ai_provider_configs 表存储厂商配置
2. THE AI_Config_System SHALL 创建 ai_model_configs 表存储模型配置
3. WHEN 用户保存配置 THEN THE AI_Config_System SHALL 将配置写入数据库
4. WHEN 用户登录 THEN THE AI_Config_System SHALL 从数据库加载用户的配置
5. THE AI_Config_System SHALL 支持每个用户独立的配置数据

### 需求 2: 多厂商独立配置

**用户故事:** 作为用户，我希望能够为不同的 AI 厂商配置独立的 API Key，这样我可以直接使用厂商的 API 而不必通过 OpenRouter。

#### 验收标准

1. THE AI_Config_System SHALL 支持配置 OpenAI 厂商的 API Key 和 Base URL
2. THE AI_Config_System SHALL 支持配置 DeepSeek 厂商的 API Key 和 Base URL
3. THE AI_Config_System SHALL 支持配置 Google Gemini 厂商的 API Key 和 Base URL
4. THE AI_Config_System SHALL 支持配置 Anthropic Claude 厂商的 API Key 和 Base URL
5. THE AI_Config_System SHALL 支持配置 Cloudflare 厂商的 API Key 和 Base URL
6. WHEN 用户配置厂商 THEN THE AI_Config_System SHALL 允许设置是否启用该厂商
7. WHEN 用户配置厂商 THEN THE AI_Config_System SHALL 显示该厂商下的可用模型列表

### 需求 3: API 路由选择

**用户故事:** 作为用户，当我为某个厂商配置了独立 API Key 并启用后，选择该厂商的模型时应该使用我配置的 API，否则使用 OpenRouter。

#### 验收标准

1. WHEN 用户选择模型且该模型所属厂商已配置独立 API Key 且已启用 THEN THE AI_Config_System SHALL 使用厂商独立 API
2. WHEN 用户选择模型且该模型所属厂商未配置或未启用 THEN THE AI_Config_System SHALL 使用 OpenRouter API
3. THE AI_Config_System SHALL 在厂商配置中提供启用/禁用开关
4. WHEN 厂商配置被禁用 THEN THE AI_Config_System SHALL 忽略该厂商的独立 API 配置

### 需求 4: 前端配置页面

**用户故事:** 作为用户，我希望有一个直观的配置页面，让我可以管理所有 AI 厂商的配置。

#### 验收标准

1. THE AI_Config_System SHALL 显示所有支持的 AI 厂商列表
2. WHEN 用户点击厂商 THEN THE AI_Config_System SHALL 展开该厂商的配置表单
3. WHEN 用户输入 API Key THEN THE AI_Config_System SHALL 提供测试连接功能
4. WHEN 测试连接成功 THEN THE AI_Config_System SHALL 显示该厂商下的可用模型
5. WHEN 用户保存配置 THEN THE AI_Config_System SHALL 验证必填字段并提示错误
6. THE AI_Config_System SHALL 支持启用/禁用单个厂商
7. THE AI_Config_System SHALL 显示每个厂商的配置状态（已配置/未配置/已启用/已禁用）

### 需求 5: 后端 API 改造

**用户故事:** 作为开发者，我需要后端 API 支持从数据库读取配置，并根据配置选择合适的 AI API。

#### 验收标准

1. THE AI_Config_System SHALL 提供 GET /api/ai/providers API 获取用户的厂商配置列表
2. THE AI_Config_System SHALL 提供 POST /api/ai/providers API 创建或更新厂商配置
3. THE AI_Config_System SHALL 提供 DELETE /api/ai/providers/:id API 删除厂商配置
4. THE AI_Config_System SHALL 提供 GET /api/ai/models API 获取可用模型列表（根据配置过滤）
5. WHEN AI 调用发生 THEN THE AI_Config_System SHALL 从数据库读取配置
6. WHEN 环境变量中存在 API Key THEN THE AI_Config_System SHALL 优先使用环境变量配置
7. THE AI_Config_System SHALL 在服务器端安全存储 API Key（不暴露给前端）

### 需求 6: 向后兼容

**用户故事:** 作为现有用户，我希望系统升级后我的现有配置仍然可用，不会丢失数据。

#### 验收标准

1. WHEN 系统首次启动且数据库为空 THEN THE AI_Config_System SHALL 尝试从 localStorage 迁移配置
2. WHEN 环境变量中存在 OPENROUTER_API_KEY THEN THE AI_Config_System SHALL 自动创建 OpenRouter 配置
3. THE AI_Config_System SHALL 保持现有 API 接口的兼容性
4. WHEN 数据库配置不存在 THEN THE AI_Config_System SHALL 回退到环境变量配置

### 需求 7: 安全性

**用户故事:** 作为用户，我希望我的 API Key 能够安全存储，不会被泄露。

#### 验收标准

1. THE AI_Config_System SHALL 仅在服务器端存储 API Key
2. THE AI_Config_System SHALL 不在前端代码中暴露完整的 API Key
3. WHEN 前端显示 API Key THEN THE AI_Config_System SHALL 仅显示部分字符（如 sk-***abc）
4. THE AI_Config_System SHALL 使用 HTTPS 传输 API Key
5. THE AI_Config_System SHALL 验证用户身份后才允许访问配置 API
