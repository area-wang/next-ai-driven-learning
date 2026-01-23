# 测试题存储架构重构 - 需求文档

## 简介

当前系统将测试题转换为HTML存储在 `knowledgeContents.content` 字段中，答题时需要从HTML解析题目。这种设计存在以下问题：
1. HTML解析容易出错，格式变化会导致解析失败
2. 无法灵活查询和管理题目
3. 没有利用已有的 `testQuestions` 表
4. 题目数据和展示逻辑耦合

本需求旨在重构测试题存储架构，使用结构化数据存储题目。

## 术语表

- **TestQuestion**: 测试题实体，存储在 `testQuestions` 表中
- **KnowledgeContent**: 知识内容实体，存储在 `knowledgeContents` 表中
- **TestDocument**: 测试题文档，是一种特殊的知识内容
- **QuestionMetadata**: 题目元数据，包括题型、难度、选项等

## 需求

### 需求 1: 题目结构化存储

**用户故事:** 作为系统，我需要将测试题存储为结构化数据，以便灵活查询和管理。

#### 验收标准

1. WHEN 生成测试题时，THE System SHALL 将每道题目存储到 `testQuestions` 表
2. WHEN 存储题目时，THE System SHALL 保存题目类型、题目内容、选项、答案、解析等完整信息
3. WHEN 存储题目时，THE System SHALL 关联到对应的 `knowledgeContents` 记录
4. THE System SHALL 支持所有题型：单选、多选、判断、填空、简答、论述、编程、匹配、排序

### 需求 2: 题目查询接口

**用户故事:** 作为答题系统，我需要通过API查询题目列表，以便展示给用户答题。

#### 验收标准

1. WHEN 进入答题模式时，THE System SHALL 提供API查询指定文档的所有题目
2. WHEN 查询题目时，THE System SHALL 返回JSON数组格式的题目列表
3. WHEN 查询题目时，THE System SHALL 包含题目索引、类型、内容、选项等信息
4. WHEN 查询题目时（答题模式），THE System SHALL 不返回答案和解析
5. WHEN 查询题目时（查看结果模式），THE System SHALL 返回答案和解析

### 需求 3: 题目展示HTML生成

**用户故事:** 作为编辑器，我需要将题目渲染为HTML展示，以便用户在编辑模式下查看。

#### 验收标准

1. WHEN 保存测试题文档时，THE System SHALL 根据题目数据生成HTML内容
2. WHEN 生成HTML时，THE System SHALL 包含题目标题、内容、选项、答案和解析
3. WHEN 生成HTML时，THE System SHALL 使用 `data-question-id` 属性关联题目ID
4. THE System SHALL 支持从HTML重新同步到数据库（编辑后）

### 需求 4: 向后兼容

**用户故事:** 作为系统，我需要兼容已有的HTML格式题目，以便平滑迁移。

#### 验收标准

1. WHEN 遇到旧格式题目（纯HTML）时，THE System SHALL 尝试解析并迁移到数据库
2. WHEN 解析失败时，THE System SHALL 降级到HTML解析模式
3. WHEN 迁移完成后，THE System SHALL 标记文档已迁移
4. THE System SHALL 提供迁移工具批量处理旧数据

### 需求 5: 题目编辑和更新

**用户故事:** 作为用户，我需要在编辑器中修改题目，修改应该同步到数据库。

#### 验收标准

1. WHEN 用户修改题目内容时，THE System SHALL 检测变化
2. WHEN 保存文档时，THE System SHALL 更新对应的 `testQuestions` 记录
3. WHEN 删除题目时，THE System SHALL 从数据库中删除对应记录
4. WHEN 添加新题目时，THE System SHALL 在数据库中创建新记录

### 需求 6: 性能优化

**用户故事:** 作为系统，我需要优化题目加载性能，以便快速响应。

#### 验收标准

1. WHEN 查询题目时，THE System SHALL 使用索引优化查询速度
2. WHEN 题目数量较多时（>50），THE System SHALL 支持分页加载
3. WHEN 频繁访问时，THE System SHALL 使用缓存减少数据库查询
4. THE System SHALL 在500ms内返回题目列表

## 数据模型

### testQuestions 表（已存在，需要调整）

```typescript
{
  id: string                    // 题目ID
  contentId: string             // 关联的知识内容ID
  questionIndex: number         // 题目序号（第几题）
  questionType: string          // 题型：choice, multiple-choice, true-false, fill, short, essay, code, matching, ordering
  question: string              // 题目内容
  options: string               // 选项（JSON数组）
  correctAnswer: string         // 正确答案
  explanation: string           // 答案解析
  difficulty: string            // 难度：easy, medium, hard
  createdAt: Date
  updatedAt: Date
}
```

### API 接口

#### GET /api/test-questions/[contentId]

查询指定文档的所有题目

**Query参数:**
- `includeAnswers`: boolean - 是否包含答案和解析（默认false）

**响应:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "index": 1,
      "type": "choice",
      "question": "题目内容",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",  // 仅当 includeAnswers=true
      "explanation": "解析"   // 仅当 includeAnswers=true
    }
  ]
}
```

## 迁移策略

1. **阶段1**: 新生成的题目使用新架构（存入数据库）
2. **阶段2**: 答题时优先从数据库读取，降级到HTML解析
3. **阶段3**: 提供迁移工具，批量迁移旧数据
4. **阶段4**: 移除HTML解析逻辑

## 非功能需求

1. **性能**: 题目查询响应时间 < 500ms
2. **可靠性**: 数据库存储，避免HTML解析错误
3. **可维护性**: 结构化数据，易于查询和管理
4. **可扩展性**: 支持新增题型，无需修改解析逻辑
