# 移除旧配置系统 - 需求文档

## 1. 概述

### 1.1 背景
项目中存在两套 AI 配置系统：
- **旧系统**：使用 `localStorage` 存储配置，通过 `useAIConfig` hook 读取
- **新系统**：使用数据库存储配置，通过 `getAIConfig` 函数读取

目前已有 11 个文件仍在使用旧配置系统，需要迁移到新系统。

### 1.2 目标
- 移除所有对 `useAIConfig` hook 的依赖
- 移除所有对 `config-sync.ts` 的依赖
- 统一使用数据库配置系统
- 确保所有 AI 功能正常工作

### 1.3 范围
**包含：**
- 8 个使用 `useAIConfig` hook 的组件
- 3 个使用 `config-sync.ts` 的文件
- 相关的 API 路由更新

**不包含：**
- 数据库 schema 修改（已完成）
- 新配置系统的实现（已完成）

## 2. 用户故事

### 2.1 作为开发者
**故事：** 我希望所有组件都使用统一的配置系统  
**目的：** 避免配置不一致和维护困难  
**验收标准：**
- 所有组件都从数据库读取配置
- 不再有 `localStorage` 配置读取
- 配置逻辑统一在后端处理

### 2.2 作为用户
**故事：** 我希望在设置页面配置 AI 模型后，所有功能都能使用该配置  
**目的：** 配置一次，全局生效  
**验收标准：**
- 在设置页面配置模型后，所有 AI 功能都能使用
- 不需要在每个功能中单独配置
- 配置在浏览器刷新后仍然有效

## 3. 功能需求

### 3.1 高优先级组件迁移

#### 3.1.1 学习计划页面 (`src/app/plan/[planId]/page.tsx`)
**当前问题：**
- 使用 `useAIConfig` hook 获取配置
- 使用 `config-sync.ts` 获取模型配置
- 在多个地方调用 AI API（生成内容、生成大纲、生成测试题、生成相似题目）

**需求：**
- 移除 `useAIConfig` hook
- 移除 `config-sync` 导入
- 使用 `ConfiguredModelSelector` 组件选择模型
- 直接传递 `modelId` 给后端 API
- 后端使用 `getAIConfig` 函数获取配置

**验收标准：**
- ✅ 页面显示模型选择器
- ✅ 选择模型后可以生成内容
- ✅ 选择模型后可以生成大纲
- ✅ 选择模型后可以生成测试题
- ✅ 选择模型后可以生成相似题目
- ✅ 不再有 `useAIConfig` 相关的警告

#### 3.1.2 答题功能 (`src/components/test-answer/test-answer-overlay.tsx`)
**当前问题：**
- 使用 `useAIConfig` hook 获取配置
- 提交答案时需要传递 `provider` 和 `model`

**需求：**
- 移除 `useAIConfig` hook
- 使用 `ConfiguredModelSelector` 组件选择模型
- 提交答案时只传递 `modelId`
- 后端使用 `getAIConfig` 函数获取配置

**验收标准：**
- ✅ 答题界面显示模型选择器
- ✅ 选择模型后可以提交答案
- ✅ 答案评分正常工作
- ✅ 不再有 `useAIConfig` 相关的警告

### 3.2 中优先级组件迁移

#### 3.2.1 测试编辑器 (`src/app/test-editor/page.tsx`)
**需求：** 同 3.1.1

#### 3.2.2 学习计划生成器 (`src/components/learning/learning-plan-generator.tsx`)
**需求：** 同 3.1.1

#### 3.2.3 大纲生成器 (`src/components/learning/outline-generator.tsx`)
**需求：** 同 3.1.1

### 3.3 低优先级组件迁移

#### 3.3.1 旧的模型选择器 (`src/components/ai/model-selector.tsx`)
**需求：** 标记为废弃或删除，使用 `ConfiguredModelSelector` 代替

#### 3.3.2 旧的 API Key 配置 (`src/components/ai/api-key-config.tsx`)
**需求：** 标记为废弃或删除，使用设置页面配置

#### 3.3.3 旧的聊天界面 (`src/components/ai/chat-interface.tsx`)
**需求：** 标记为废弃或删除，使用 AI 聊天抽屉

### 3.4 废弃旧文件

#### 3.4.1 `src/lib/ai/config-sync.ts`
**需求：**
- 标记为废弃
- 添加警告注释
- 更新所有使用该文件的地方

#### 3.4.2 `src/hooks/use-ai-config.ts`
**需求：**
- 已标记为废弃 ✅
- 保留空实现以避免破坏现有代码
- 添加迁移指南注释

## 4. 非功能需求

### 4.1 性能
- 配置读取应该快速（< 100ms）
- 避免频繁的数据库查询
- 考虑缓存策略

### 4.2 可维护性
- 代码结构清晰
- 配置逻辑统一
- 易于理解和修改

### 4.3 兼容性
- 向后兼容（旧代码不会立即崩溃）
- 渐进式迁移（可以逐个组件迁移）
- 清晰的迁移路径

### 4.4 测试
- 所有迁移的组件都需要测试
- 确保 AI 功能正常工作
- 类型检查通过

## 5. 约束条件

### 5.1 技术约束
- 使用 Next.js 14 App Router
- 使用 Cloudflare D1 数据库
- 使用 TypeScript

### 5.2 时间约束
- 高优先级组件：1-2 天
- 中优先级组件：2-3 天
- 低优先级组件：1 天
- 总计：4-6 天

### 5.3 资源约束
- 单人开发
- 需要保持现有功能正常运行
- 不能影响用户使用

## 6. 依赖关系

### 6.1 前置条件
- ✅ 数据库 schema 已更新（`config_mode` 字段）
- ✅ `getAIConfig` 函数已实现
- ✅ `ConfiguredModelSelector` 组件已实现
- ✅ 新的配置 API 已实现

### 6.2 后续任务
- 删除旧的配置文件
- 更新文档
- 清理 `localStorage` 中的旧配置

## 7. 风险和缓解措施

### 7.1 风险：破坏现有功能
**缓解措施：**
- 渐进式迁移，逐个组件测试
- 保留旧代码的空实现
- 充分测试后再删除旧代码

### 7.2 风险：配置不一致
**缓解措施：**
- 统一使用 `getAIConfig` 函数
- 添加详细的日志
- 提供清晰的错误消息

### 7.3 风险：用户体验下降
**缓解措施：**
- 保持 UI 一致性
- 提供清晰的配置指引
- 添加加载状态和错误提示

## 8. 成功标准

### 8.1 功能完整性
- ✅ 所有 AI 功能正常工作
- ✅ 配置在所有页面生效
- ✅ 不再有旧配置系统的代码

### 8.2 代码质量
- ✅ 类型检查通过（`npx tsc --noEmit`）
- ✅ 没有 ESLint 错误
- ✅ 代码结构清晰

### 8.3 用户体验
- ✅ 配置流程简单
- ✅ 错误提示清晰
- ✅ 加载状态明确

## 9. 迁移优先级

### 第一阶段（高优先级）
1. `src/app/plan/[planId]/page.tsx` - 学习计划页面
2. `src/components/test-answer/test-answer-overlay.tsx` - 答题功能

### 第二阶段（中优先级）
3. `src/app/test-editor/page.tsx` - 测试编辑器
4. `src/components/learning/learning-plan-generator.tsx` - 学习计划生成器
5. `src/components/learning/outline-generator.tsx` - 大纲生成器

### 第三阶段（低优先级）
6. `src/components/ai/model-selector.tsx` - 旧的模型选择器
7. `src/components/ai/api-key-config.tsx` - 旧的 API Key 配置
8. `src/components/ai/chat-interface.tsx` - 旧的聊天界面

### 第四阶段（清理）
9. 废弃 `src/lib/ai/config-sync.ts`
10. 更新文档
11. 清理 `localStorage`

## 10. 参考文档

- `docs/OLD_CONFIG_USAGE.md` - 旧配置系统使用情况报告
- `docs/AI_CONFIG_UPDATES.md` - AI 配置更新日志
- `src/lib/ai/get-ai-config.ts` - 统一配置获取函数
- `src/components/ai/configured-model-selector.tsx` - 新的模型选择器组件
