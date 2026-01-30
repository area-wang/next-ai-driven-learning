# 需求文档

## 简介

本功能旨在优化 AI 模型配置流程，让用户明确选择使用 OpenRouter 统一配置还是厂商独立配置模式，并根据选择显示对应的模型列表。当前系统同时支持两种配置方式但缺乏明确的模式选择机制，导致用户困惑和模型 ID 格式不匹配的问题。

## 术语表

- **System**: AI 配置管理系统
- **OpenRouter**: 统一的 AI 模型聚合服务，通过单一 API Key 访问多个厂商模型
- **Provider**: AI 模型厂商（如 OpenAI、DeepSeek、Google 等）
- **Config_Mode**: 配置模式，包括 'openrouter' 和 'independent' 两种
- **Model_ID**: 模型标识符，格式因配置模式而异
- **User**: 使用系统的用户

## 需求

### 需求 1: 配置模式选择

**用户故事:** 作为用户，我想要明确选择使用 OpenRouter 还是厂商独立配置，以便清楚地了解我的配置方式。

#### 验收标准

1. WHEN 用户访问 AI 设置页面 THEN THE System SHALL 显示配置模式选择器（单选按钮组）
2. THE System SHALL 提供两个互斥的配置模式选项：'OpenRouter' 和 '厂商独立配置'
3. WHEN 用户选择配置模式 THEN THE System SHALL 保存用户的选择到数据库
4. WHEN 用户切换配置模式 THEN THE System SHALL 更新 UI 显示对应的配置区域
5. THE System SHALL 为每个用户独立存储配置模式选择

### 需求 2: OpenRouter 模式配置

**用户故事:** 作为用户，我想要使用 OpenRouter 统一配置，以便通过一个 API Key 访问所有支持的模型。

#### 验收标准

1. WHEN 用户选择 OpenRouter 模式 THEN THE System SHALL 显示 OpenRouter API Key 输入框
2. WHEN 用户输入 OpenRouter API Key THEN THE System SHALL 提供测试连接功能
3. WHEN 测试连接成功 THEN THE System SHALL 从 OpenRouter 获取完整的模型列表
4. THE System SHALL 显示 OpenRouter 格式的模型 ID（格式：`provider/model-name`）
5. WHEN 用户选择 OpenRouter 模式 THEN THE System SHALL 忽略所有厂商独立配置

### 需求 3: 厂商独立配置模式

**用户故事:** 作为用户，我想要配置各个厂商的独立 API，以便使用厂商官方 API 或自定义端点。

#### 验收标准

1. WHEN 用户选择厂商独立配置模式 THEN THE System SHALL 显示厂商配置管理界面
2. THE System SHALL 允许用户添加多个厂商配置（DeepSeek、OpenAI、Google、Anthropic、Qwen、Kimi）
3. WHEN 用户添加厂商配置 THEN THE System SHALL 要求输入 API Key、Base URL 和启用状态
4. THE System SHALL 为每个厂商显示该厂商支持的模型列表
5. WHEN 用户选择厂商独立模式 THEN THE System SHALL 只显示已启用厂商的模型
6. THE System SHALL 使用厂商官方格式的模型 ID（如 DeepSeek 的 `deepseek-chat`）

### 需求 4: 模型列表管理

**用户故事:** 作为用户，我想要查看和选择可用的模型，以便配置我需要使用的 AI 模型。

#### 验收标准

1. WHEN 配置模式为 OpenRouter THEN THE System SHALL 显示 OpenRouter 的完整模型列表
2. WHEN 配置模式为厂商独立 THEN THE System SHALL 只显示已配置且启用的厂商的模型
3. THE System SHALL 允许用户选择多个模型并保存到 `ai_models` 表
4. THE System SHALL 允许用户设置一个默认模型
5. WHEN 用户未选择默认模型 THEN THE System SHALL 自动将第一个选中的模型设为默认

### 需求 5: 模型 ID 格式管理

**用户故事:** 作为系统，我需要根据配置模式使用正确的模型 ID 格式，以避免 "Model Not Exist" 错误。

#### 验收标准

1. WHEN 配置模式为 OpenRouter THEN THE System SHALL 使用 OpenRouter 格式的模型 ID（`provider/model-name`）
2. WHEN 配置模式为厂商独立 THEN THE System SHALL 使用厂商官方格式的模型 ID
3. WHEN 调用 LLM API THEN THE System SHALL 根据配置模式选择对应的 API Key 和 Base URL
4. THE System SHALL 确保模型 ID 与 API 端点匹配

### 需求 6: 配置优先级

**用户故事:** 作为系统，我需要根据配置模式确定使用哪个 API 配置，以确保正确的 API 调用。

#### 验收标准

1. WHEN 配置模式为 OpenRouter THEN THE System SHALL 使用 OpenRouter API Key 和端点
2. WHEN 配置模式为厂商独立 THEN THE System SHALL 使用对应厂商的 API Key 和端点
3. WHEN 厂商独立模式下某厂商未启用 THEN THE System SHALL 不显示该厂商的模型
4. THE System SHALL 在 `getAIConfig()` 函数中实现配置模式逻辑

### 需求 7: 数据库结构

**用户故事:** 作为系统，我需要存储用户的配置模式选择，以便在后续会话中保持用户的配置。

#### 验收标准

1. THE System SHALL 在 `ai_providers` 表中添加 `config_mode` 字段
2. THE `config_mode` 字段 SHALL 支持两个值：'openrouter' 和 'independent'
3. THE `config_mode` 字段 SHALL 默认值为 'openrouter'
4. THE System SHALL 为每个用户独立存储 `config_mode`
5. WHEN 用户首次访问 THEN THE System SHALL 使用默认配置模式 'openrouter'

### 需求 8: 厂商模型列表

**用户故事:** 作为系统，我需要知道每个厂商支持的模型列表，以便在厂商独立模式下正确显示可用模型。

#### 验收标准

1. THE System SHALL 支持 DeepSeek 模型：`deepseek-chat`、`deepseek-reasoner`
2. THE System SHALL 支持 OpenAI 模型：`gpt-4o`、`gpt-4o-mini`、`gpt-4-turbo`、`gpt-3.5-turbo`
3. THE System SHALL 支持 Google 模型：`gemini-1.5-pro`、`gemini-1.5-flash`、`gemini-2.0-flash-exp`
4. THE System SHALL 支持 Anthropic 模型：`claude-3-5-sonnet-20241022`、`claude-3-5-haiku-20241022`、`claude-3-opus-20240229`
5. THE System SHALL 支持 Qwen 模型：`qwen-turbo`、`qwen-plus`、`qwen-max`
6. THE System SHALL 支持 Kimi 模型：`moonshot-v1-8k`、`moonshot-v1-32k`、`moonshot-v1-128k`

### 需求 9: UI 交互流程

**用户故事:** 作为用户，我想要直观的 UI 交互流程，以便轻松完成配置。

#### 验收标准

1. WHEN 用户访问设置页面 THEN THE System SHALL 在页面顶部显示配置模式选择器
2. WHEN 用户选择 OpenRouter THEN THE System SHALL 隐藏厂商独立配置区域
3. WHEN 用户选择厂商独立 THEN THE System SHALL 隐藏 OpenRouter 配置区域
4. THE System SHALL 在模型选择区域显示当前配置模式下可用的所有模型
5. THE System SHALL 提供搜索和筛选功能以帮助用户查找模型

### 需求 10: LLM 调用统一配置逻辑

**用户故事:** 作为系统，我需要在所有调用 LLM 的地方使用统一的配置逻辑，以确保根据用户的配置模式正确选择 API Key 和端点。

#### 验收标准

1. THE System SHALL 在所有 LLM 调用处使用 `getAIConfig()` 函数获取配置
2. WHEN 配置模式为 OpenRouter THEN THE System SHALL 使用 OpenRouter API Key 和端点调用 LLM
3. WHEN 配置模式为厂商独立 THEN THE System SHALL 根据模型 ID 提取厂商 ID，使用对应厂商的 API Key 和端点
4. THE System SHALL 在以下所有 API 路由中应用统一配置逻辑：
   - `/api/ai/generate` - AI 内容生成
   - `/api/ai/chat` - AI 对话
   - `/api/test-questions/generate` - 测试题目生成
   - `/api/test-answer/submit` - 答案评分
   - `/api/flashcards/generate` - 闪卡生成
   - `/api/cornell/generate` - 康奈尔笔记生成
   - `/api/feynman/explanations` - 费曼解释生成
   - `/api/zettelkasten/notes` - 卡片笔记生成
   - `/api/learning-content/generate` - 学习内容生成
   - `/api/learning-outline/generate` - 学习大纲生成
5. WHEN 用户未配置默认模型 THEN THE System SHALL 返回明确的错误提示
6. WHEN 厂商独立模式下某厂商未配置或未启用 THEN THE System SHALL 返回明确的错误提示
7. THE System SHALL 在调用 LLM 前记录配置信息（配置模式、模型 ID、Base URL）用于调试
8. THE System SHALL 确保模型 ID 格式与 API 端点匹配（OpenRouter 格式 vs 厂商官方格式）
