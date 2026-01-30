# 旧配置系统使用情况报告

## 概述

项目中仍有多个文件使用旧的 localStorage 配置系统，需要迁移到新的数据库配置系统。

## 旧配置系统文件

### 1. `src/hooks/use-ai-config.ts`
- **功能**: 从 localStorage 读取和保存 AI 配置
- **使用场景**: 8 个组件使用此 hook
- **建议**: 重构为从数据库 API 读取配置

### 2. `src/lib/ai/config-sync.ts`
- **功能**: 同步读取 localStorage 缓存的模型配置
- **使用场景**: 3 个文件使用
- **建议**: 废弃此文件，使用新的 API

## 使用旧配置的组件列表

### 使用 `useAIConfig` hook 的组件（8个）

1. **`src/app/test-editor/page.tsx`**
   - 用途: 获取 API Key 用于 AI 生成
   - 影响: 测试编辑器的 AI 功能

2. **`src/app/plan/[planId]/page.tsx`**
   - 用途: 获取 API Key 用于 AI 生成和闪卡生成
   - 影响: 学习计划页面的 AI 功能

3. **`src/components/ai/chat-interface.tsx`**
   - 用途: 检查是否配置 API Key
   - 影响: AI 聊天界面

4. **`src/components/test-answer/test-answer-overlay.tsx`**
   - 用途: 获取 API Key 用于答案评分
   - 影响: 测试答题功能

5. **`src/components/ai/model-selector.tsx`**
   - 用途: 选择 AI 模型和提供商
   - 影响: 模型选择器组件

6. **`src/components/ai/api-key-config.tsx`**
   - 用途: 配置各厂商的 API Key
   - 影响: API Key 配置界面

7. **`src/components/learning/learning-plan-generator.tsx`**
   - 用途: 检查是否配置 API Key
   - 影响: 学习计划生成器

8. **`src/components/learning/outline-generator.tsx`**
   - 用途: 检查是否配置 API Key
   - 影响: 大纲生成器

### 使用 `config-sync` 的文件（3个）

1. **`src/app/learn/new/page.tsx`**
   - 用途: 同步读取模型配置
   - 影响: 新建学习内容页面

2. **`src/lib/ai/config-client.ts`**
   - 用途: 创建 AI 客户端时读取默认模型
   - 影响: AI 客户端初始化

3. **`src/lib/ai/fetch-with-model.ts`**
   - 用途: 根据模型 ID 获取配置
   - 影响: 带模型的 fetch 请求

## 迁移策略

### 阶段 1: 重构 `useAIConfig` hook ✅ 推荐优先
1. 修改 `useAIConfig` 从 API 读取配置而不是 localStorage
2. 保持相同的接口，减少对现有组件的影响
3. 添加加载状态和错误处理

### 阶段 2: 废弃 `config-sync.ts`
1. 创建新的异步配置读取函数
2. 更新使用 `config-sync` 的 3 个文件
3. 删除 `config-sync.ts`

### 阶段 3: 测试和验证
1. 测试所有使用 AI 功能的页面
2. 确保配置正确从数据库读取
3. 验证 OpenRouter 和独立厂商两种模式

## 优先级

### 高优先级（影响核心功能）
- ✅ `src/components/ai/ai-chat-drawer.tsx` - 已修复
- `src/app/plan/[planId]/page.tsx` - 学习计划页面
- `src/components/test-answer/test-answer-overlay.tsx` - 答题功能

### 中优先级（影响辅助功能）
- `src/app/test-editor/page.tsx` - 测试编辑器
- `src/components/learning/learning-plan-generator.tsx` - 学习计划生成
- `src/components/learning/outline-generator.tsx` - 大纲生成

### 低优先级（配置界面）
- `src/components/ai/model-selector.tsx` - 旧的模型选择器
- `src/components/ai/api-key-config.tsx` - 旧的 API Key 配置
- `src/components/ai/chat-interface.tsx` - 旧的聊天界面

## 注意事项

1. **向后兼容**: 迁移过程中保持 API 接口兼容
2. **错误处理**: 添加完善的错误处理和用户提示
3. **性能优化**: 考虑缓存策略，避免频繁请求数据库
4. **测试覆盖**: 确保所有功能都经过测试

## 下一步行动

1. 重构 `useAIConfig` hook，从 API 读取配置
2. 更新高优先级组件
3. 逐步迁移其他组件
4. 删除旧的配置文件

---

**更新时间**: 2026-01-29
**状态**: 进行中
