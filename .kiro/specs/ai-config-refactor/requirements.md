# 需求文档：AI 模型配置重构

## 介绍

重构 AI 模型配置系统，将其整合到统一的设置页面中，添加连通性测试功能，并确保所有 LLM 调用都从配置中读取。

## 术语表

- **Settings_Page**: 设置主页面，包含多个设置子页面的导航
- **AI_Config_Page**: AI 模型配置子页面
- **Model_Config**: 模型配置，包含模型名称、API Key、Base URL 等信息
- **Connectivity_Test**: 连通性测试，验证模型配置是否可用
- **Available_Models**: 可用模型列表，仅包含已连通的模型

## 需求

### 需求 1：设置页面结构

**用户故事：** 作为用户，我想要一个统一的设置页面，这样我可以管理所有系统设置。

#### 验收标准

1. THE System SHALL 提供设置主页面 `/settings`
2. THE Settings_Page SHALL 显示左侧导航菜单
3. THE Settings_Page SHALL 支持多个设置子页面
4. THE Settings_Page SHALL 当前包含"AI 模型"子页面
5. THE Settings_Page SHALL 使用项目统一的设计风格

### 需求 2：AI 配置页面重构

**用户故事：** 作为用户，我想要在设置页面中配置 AI 模型，这样我可以集中管理所有设置。

#### 验收标准

1. THE AI_Config_Page SHALL 位于 `/settings/ai` 路径
2. THE AI_Config_Page SHALL 使用项目统一的设计风格（白色卡片、teal 主题色）
3. THE AI_Config_Page SHALL 显示所有支持的 AI 模型
4. THE AI_Config_Page SHALL 允许用户配置每个模型的 API Key 和 Base URL
5. THE AI_Config_Page SHALL 保存配置到浏览器 localStorage

### 需求 3：连通性测试

**用户故事：** 作为用户，我想要测试 AI 模型配置是否可用，这样我可以确保配置正确。

#### 验收标准

1. WHEN 用户配置模型后 THEN THE System SHALL 提供"测试连接"按钮
2. WHEN 用户点击"测试连接" THEN THE System SHALL 发送测试请求到 AI 模型
3. IF 连接成功 THEN THE System SHALL 显示成功提示并标记模型为"已连通"
4. IF 连接失败 THEN THE System SHALL 显示错误信息
5. THE System SHALL 保存连通状态到配置中
6. THE System SHALL 显示每个模型的连通状态（已连通/未连通/未配置）

### 需求 4：配置管理系统

**用户故事：** 作为开发者，我想要一个统一的配置管理系统，这样所有 LLM 调用都可以从配置中读取。

#### 验收标准

1. THE System SHALL 提供配置管理模块 `@/lib/ai/config`
2. THE System SHALL 提供 `getAIConfig()` 函数读取所有配置
3. THE System SHALL 提供 `getAvailableModels()` 函数获取已连通的模型列表
4. THE System SHALL 提供 `getDefaultModel()` 函数获取默认模型
5. THE System SHALL 提供 `testModelConnection()` 函数测试模型连通性
6. THE System SHALL 提供 `saveModelConfig()` 函数保存模型配置

### 需求 5：LLM 调用重构

**用户故事：** 作为开发者，我想要所有 LLM 调用都从配置中读取，这样用户可以自由选择模型。

#### 验收标准

1. THE System SHALL 修改所有 LLM 调用点从配置读取模型信息
2. WHEN 用户可以选择模型时 THEN THE System SHALL 显示已连通的模型列表
3. THE System SHALL 使用配置中的 API Key 和 Base URL
4. THE System SHALL 在配置缺失时显示友好的错误提示
5. THE System SHALL 提供默认模型作为后备选项

### 需求 6：模型选择器

**用户故事：** 作为用户，我想要在使用 AI 功能时选择模型，这样我可以根据需求选择合适的模型。

#### 验收标准

1. THE System SHALL 在 AI 功能中提供模型选择下拉框
2. THE Model_Selector SHALL 仅显示已连通的模型
3. THE Model_Selector SHALL 显示模型名称和提供商
4. THE Model_Selector SHALL 记住用户的选择
5. THE Model_Selector SHALL 在没有可用模型时显示配置提示

### 需求 7：配置数据结构

**用户故事：** 作为开发者，我想要清晰的配置数据结构，这样易于维护和扩展。

#### 验收标准

1. THE Model_Config SHALL 包含以下字段：
   - `id`: 模型唯一标识
   - `name`: 模型显示名称
   - `provider`: 提供商（OpenAI、Anthropic、DeepSeek 等）
   - `apiKey`: API 密钥
   - `baseUrl`: API 基础 URL（可选）
   - `isConnected`: 连通状态
   - `lastTested`: 最后测试时间
2. THE System SHALL 支持多个模型配置
3. THE System SHALL 支持自定义模型添加

### 需求 8：错误处理

**用户故事：** 作为用户，我想要清晰的错误提示，这样我可以快速解决配置问题。

#### 验收标准

1. IF API Key 缺失 THEN THE System SHALL 提示"请配置 API Key"
2. IF 连接测试失败 THEN THE System SHALL 显示具体错误信息
3. IF 没有可用模型 THEN THE System SHALL 引导用户到配置页面
4. THE System SHALL 在 LLM 调用失败时显示友好的错误提示
5. THE System SHALL 提供配置页面的快速链接

### 需求 9：用户体验

**用户故事：** 作为用户，我想要流畅的配置体验，这样我可以快速完成设置。

#### 验收标准

1. THE AI_Config_Page SHALL 使用卡片布局展示每个模型
2. THE AI_Config_Page SHALL 支持展开/折叠模型配置
3. THE AI_Config_Page SHALL 在保存时显示加载状态
4. THE AI_Config_Page SHALL 在测试连接时显示加载状态
5. THE AI_Config_Page SHALL 使用图标和颜色标识连通状态
6. THE AI_Config_Page SHALL 提供清晰的操作按钮

### 需求 10：安全性

**用户故事：** 作为用户，我想要我的 API Key 安全存储，这样不会泄露。

#### 验收标准

1. THE System SHALL 将 API Key 存储在浏览器 localStorage
2. THE System SHALL 在显示时隐藏 API Key（显示为 `***`）
3. THE System SHALL 提供"显示/隐藏"按钮切换 API Key 可见性
4. THE System SHALL 不在日志中输出 API Key
5. THE System SHALL 不在 URL 中传递 API Key
