# 联网搜索功能使用文档

## 📚 相关文档

- [Markdown 渲染快速开始](../QUICK_START_MARKDOWN.md) - 快速上手指南
- [Markdown 渲染测试](../TEST_MARKDOWN_RENDERING.md) - 测试用例和验收标准
- [Markdown 渲染实现总结](../MARKDOWN_RENDERING_SUMMARY.md) - 技术实现细节

## 功能概述

联网搜索功能允许 AI 在生成内容前自动搜索最新的互联网信息，提高回答的准确性和时效性。

**开发状态**：
- ✅ 后端实现完成（100%）
- ✅ 前端实现完成（100%）
- ⏳ 待测试和部署

## 配置步骤

### 1. 获取 Tavily API Key

1. 访问 [Tavily AI](https://tavily.com/)
2. 注册账号并获取 API Key
3. 免费账号每月有 1000 次搜索额度

### 2. 配置 Tavily API Key（数据库存储）

**重要**：Tavily API Key 现在存储在数据库中，不再使用环境变量。

1. 访问 AI 设置页面（`/settings/ai`）
2. 在"联网搜索配置"区域找到"Tavily API Key"输入框
3. 输入你的 API Key
4. 点击"保存配置"

**安全特性**：
- API Key 在数据库中加密存储
- 前端显示时自动脱敏（只显示前4位和后4位）
- 支持显示/隐藏切换
- 传输时使用编码保护

### 3. 运行数据库迁移

```bash
# 本地开发环境
wrangler d1 execute ai-learning-platform --local --file=./drizzle/0008_add_web_search_config.sql
wrangler d1 execute ai-learning-platform --local --file=./drizzle/0009_add_tavily_api_key.sql

# 生产环境
wrangler d1 execute ai-learning-platform --remote --file=./drizzle/0008_add_web_search_config.sql
wrangler d1 execute ai-learning-platform --remote --file=./drizzle/0009_add_tavily_api_key.sql
```

迁移文件：
- `drizzle/0008_add_web_search_config.sql` - 添加搜索参数配置
- `drizzle/0009_add_tavily_api_key.sql` - 添加 Tavily API Key 存储

## 使用方法

### 1. 配置搜索参数（设置页）

访问 AI 设置页面（`/settings/ai`），在"联网搜索配置"区域配置：

- **Tavily API Key**：输入你的 Tavily API Key（必需）
  - 支持显示/隐藏切换
  - 自动脱敏显示（只显示前4位和后4位）
  - 加密存储在数据库中
- **搜索结果数量**：3 / 5 / 10 条（默认 5）
- **搜索语言**：中文 / 英文 / 自动（默认自动）

这些参数会应用到所有使用联网搜索的场景。

### 2. 使用联网搜索

在以下 5 个场景中，可以启用联网搜索：

#### a. AI 对话助手
- 位置：对话界面
- 开关：勾选"🌐 联网搜索"
- 效果：AI 会搜索相关信息后回答

#### b. 学习计划生成
- 位置：学习计划生成界面
- 开关：勾选"使用联网搜索"
- 效果：搜索最新的学习路径和资源

#### c. 学习大纲生成
- 位置：学习大纲生成界面
- 开关：勾选"使用联网搜索"
- 效果：搜索最新的知识点和标准

#### d. 学习内容生成
- 位置：学习内容生成界面
- 开关：勾选"使用联网搜索"
- 效果：搜索详细资料和最佳实践

#### e. 学习测试题生成
- 位置：测试题生成界面
- 开关：勾选"使用联网搜索"
- 效果：搜索最新的考试题型和面试题

## API 使用示例

### AI 对话 API

```typescript
POST /api/ai/chat
{
  "messages": [
    { "role": "user", "content": "React 19 有哪些新特性？" }
  ],
  "enableWebSearch": true  // 启用联网搜索
}
```

### 学习计划生成 API

```typescript
POST /api/learning-plan/generate
{
  "topic": "Next.js 15",
  "level": "intermediate",
  "enableWebSearch": true  // 启用联网搜索
}
```

### 学习大纲生成 API

```typescript
POST /api/learning-outline/generate
{
  "topic": "TypeScript 高级特性",
  "level": "advanced",
  "enableWebSearch": true  // 启用联网搜索
}
```

### 学习内容生成 API

```typescript
POST /api/ai/generate
{
  "prompt": "生成 React Server Components 的详细教程",
  "enableWebSearch": true  // 启用联网搜索
}
```

### 测试题生成 API

```typescript
POST /api/test-questions/generate
{
  "topic": "JavaScript ES2024",
  "difficulty": "medium",
  "questionCount": 5,
  "questionTypes": ["choice", "short"],
  "enableWebSearch": true  // 启用联网搜索
}
```

## 搜索配置 API

### 获取搜索配置

```typescript
GET /api/ai/search-config

Response:
{
  "searchResultCount": 5,
  "searchLanguage": "auto",
  "tavilyApiKey": "tvly-****5678"  // 脱敏后的 API Key
}
```

### 保存搜索配置

```typescript
POST /api/ai/search-config
{
  "searchResultCount": 10,
  "searchLanguage": "zh",
  "tavilyApiKey": "tvly-1234567890abcdef"  // 可选，只在更新时发送
}

Response:
{
  "success": true,
  "tavilyApiKey": "tvly-****cdef"  // 返回脱敏后的值
}
```

## 工作原理

1. **用户启用开关**：在界面上勾选"联网搜索"
2. **提取搜索查询**：从用户输入中提取关键词
3. **调用 Tavily API**：使用用户配置的参数搜索
4. **格式化结果**：将搜索结果格式化为结构化文本
5. **添加到 Prompt**：将搜索结果作为上下文添加到 LLM prompt
6. **生成内容**：LLM 基于搜索结果和自身知识生成回答

## 错误处理

- **搜索失败**：自动降级到普通 LLM 调用，不影响用户体验
- **API Key 未配置**：显示友好的错误提示
- **搜索超时**：3 秒超时后降级

## 成本控制

- Tavily 免费账号：1000 次/月
- 建议：仅在需要最新信息时启用
- 监控：查看日志了解搜索使用情况

## 技术架构

```
用户界面
  ↓ (enableWebSearch=true)
API 路由
  ↓
getSearchConfig() - 获取用户配置
  ↓
performSearch() - 执行搜索
  ↓
searchWithTavily() - 调用 Tavily API
  ↓
formatSearchResultsForPrompt() - 格式化结果
  ↓
添加到 LLM Prompt
  ↓
生成内容
```

## 文件结构

```
src/
├── lib/
│   └── search/
│       ├── tavily.ts              # Tavily API 集成
│       ├── utils.ts               # 搜索工具函数
│       └── get-search-config.ts   # 获取用户配置
├── app/
│   └── api/
│       ├── ai/
│       │   ├── chat/route.ts      # AI 对话（已集成）
│       │   ├── generate/route.ts  # 内容生成（已集成）
│       │   └── search-config/route.ts  # 搜索配置 API
│       ├── learning-plan/
│       │   └── generate/route.ts  # 学习计划（已集成）
│       ├── learning-outline/
│       │   └── generate/route.ts  # 学习大纲（已集成）
│       └── test-questions/
│           └── generate/route.ts  # 测试题（已集成）
└── db/
    └── schema.ts                  # 数据库 Schema（已更新）
```

## 数据库 Schema

```sql
-- users 表新增字段（迁移 0008）
ALTER TABLE users ADD COLUMN search_result_count INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN search_language TEXT DEFAULT 'auto';

-- users 表新增字段（迁移 0009）
ALTER TABLE users ADD COLUMN tavily_api_key TEXT;  -- 加密存储的 Tavily API Key
```

## 常见问题

### Q: 搜索结果不准确怎么办？
A: 可以在设置页调整搜索结果数量，或者尝试更具体的搜索关键词。

### Q: 搜索速度慢怎么办？
A: Tavily API 通常在 1-3 秒内返回结果。如果超时，系统会自动降级到普通模式。

### Q: 如何查看搜索使用情况？
A: 查看服务器日志，搜索 `[Tavily Search]` 关键词。

### Q: 可以使用其他搜索 API 吗？
A: 可以，参考 `src/lib/search/tavily.ts` 实现其他搜索提供商的集成。

## 后续优化方向

1. 搜索结果缓存（避免重复搜索）
2. 智能关键词提取
3. 搜索使用统计显示
4. 支持更多搜索提供商
5. 搜索结果质量评分


## 🎯 搜索准确性优化（v2.0）

### 已实现的优化

| 优化项 | 说明 | 效果 |
|--------|------|------|
| **🤖 AI 驱动的搜索策略** | 使用 LLM 分析查询意图 | 自动识别领域，无需穷举关键词 |
| **高级搜索深度** | 使用 `advanced` 模式替代 `basic` | 搜索更深入，结果更全面 |
| **原始内容包含** | 启用 `includeRawContent` | 提供更多上下文信息 |
| **智能关键词优化** | AI 自动优化搜索关键词 | 移除无用词，保留核心内容 |
| **动态域名推荐** | AI 推荐权威域名 | 根据查询内容推荐最相关的网站 |
| **相关性排序** | 按评分从高到低排序 | 优先展示最相关结果 |
| **相关性指示器** | 🔥⭐📄 视觉标识 | 快速识别高质量结果 |
| **使用说明** | 提供 LLM 使用指导 | 更好地利用搜索结果 |

### 🤖 AI 驱动的搜索策略

系统使用 LLM 分析用户查询，自动生成最佳搜索策略：

#### 工作流程

1. **意图分析**：LLM 分析用户查询的真实意图
2. **场景识别**：自动识别搜索场景（编程/文档/新闻/学习/通用）
3. **域名推荐**：根据查询内容推荐最权威的网站
4. **关键词优化**：自动提取核心关键词，移除无用词
5. **执行搜索**：使用优化后的策略执行搜索

#### AI 分析示例

**示例 1：编程问题**
```
用户输入：请帮我查一下 React 19 的新特性和使用方法
AI 分析：
{
  "context": "programming",
  "recommendedDomains": [
    "reactjs.org",
    "github.com",
    "dev.to",
    "stackoverflow.com"
  ],
  "optimizedQuery": "React 19 新特性 使用方法",
  "reasoning": "这是关于 React 框架的技术查询，推荐官方文档和技术社区"
}
```

**示例 2：中文技术问题**
```
用户输入：Vue 3 组合式 API 和 React Hooks 有什么区别
AI 分析：
{
  "context": "programming",
  "recommendedDomains": [
    "vuejs.org",
    "reactjs.org",
    "juejin.cn",
    "zhihu.com",
    "stackoverflow.com"
  ],
  "optimizedQuery": "Vue 3 组合式 API React Hooks 区别",
  "reasoning": "对比两个框架的特性，推荐官方文档和中文技术社区"
}
```

**示例 3：新闻资讯**
```
用户输入：最新的 AI 技术发展趋势
AI 分析：
{
  "context": "news",
  "recommendedDomains": [
    "techcrunch.com",
    "theverge.com",
    "wired.com",
    "arstechnica.com"
  ],
  "optimizedQuery": "AI 技术发展趋势 2026",
  "reasoning": "查询最新资讯，推荐科技媒体网站"
}
```

#### 优势

1. **无需穷举关键词**：AI 自动理解查询意图，覆盖所有领域
2. **动态域名推荐**：根据具体查询推荐最相关的网站
3. **支持中文查询**：自动识别中文查询，推荐中文网站（知乎、掘金等）
4. **智能降级**：如果 AI 分析失败，自动降级到简单关键词提取
5. **持续优化**：随着 LLM 能力提升，搜索策略自动改进

### 搜索场景支持

AI 可以识别以下搜索场景（不限于这些）：

1. **编程相关** (`programming`)
   - 自动推荐：StackOverflow、GitHub、官方文档等
   - 支持任何编程语言和框架

2. **文档查询** (`documentation`)
   - 自动推荐：官方文档站点
   - 优先返回权威文档

3. **新闻资讯** (`news`)
   - 自动推荐：科技媒体网站
   - 获取最新动态

4. **学习相关** (`learning`)
   - 自动推荐：教育平台、学习资源
   - 适合学习计划生成

5. **通用搜索** (`general`)
   - 不限制域名
   - 搜索范围最广

### 使用建议

1. **自然语言提问**
   - ✅ 好："React 19 有哪些新特性？"
   - ✅ 好："Vue 3 和 React 的区别"
   - ✅ 好："最新的 TypeScript 5.0 更新"
   - AI 会自动理解并优化

2. **增加搜索结果数量**
   - 在设置页面将结果数量从 5 增加到 10
   - 获取更全面的信息

3. **关注相关性指标**
   - 🔥 高相关性（90%+）：最可靠的结果
   - ⭐ 中等相关性（80-90%）：有价值的参考
   - 📄 一般相关性（<80%）：可作为补充

4. **查看 AI 推荐的域名**
   - 日志中会显示 AI 推荐的域名
   - 了解搜索策略的依据

5. **信任 AI 的判断**
   - AI 会根据查询内容自动选择最佳策略
   - 无需手动指定搜索场景


## 📝 Markdown 渲染支持

### 功能说明

AI 对话助手现在支持 Markdown 格式渲染，让 AI 的回答更加美观和易读。

### 支持的 Markdown 语法

| 语法 | 效果 | 示例 |
|------|------|------|
| **标题** | 层级标题 | `# H1`, `## H2`, `### H3` |
| **粗体** | 加粗文本 | `**粗体**` |
| **斜体** | 倾斜文本 | `*斜体*` |
| **代码** | 行内代码 | `` `code` `` |
| **代码块** | 多行代码 | ` ```js\ncode\n``` ` |
| **列表** | 有序/无序列表 | `- 项目` 或 `1. 项目` |
| **引用** | 引用块 | `> 引用内容` |
| **链接** | 超链接 | `[文本](url)` |
| **分割线** | 水平线 | `---` |
| **表格** | 数据表格 | Markdown 表格语法 |

### 样式特性

1. **代码块高亮**
   - 深色背景（`#1e293b`）
   - 浅色文字（`#e2e8f0`）
   - 圆角边框
   - 水平滚动支持

2. **行内代码**
   - 浅灰色背景
   - 红色文字（`#e11d48`）
   - 等宽字体（Fira Code）

3. **链接样式**
   - 主题色（`#0D9488`）
   - 下划线
   - 悬停变色

4. **列表样式**
   - 清晰的缩进
   - 合适的行间距
   - 支持嵌套列表

5. **引用块**
   - 左侧边框
   - 斜体文字
   - 浅色文字

### 技术实现

- **库**：使用 `marked` v17.0.1
- **配置**：启用 GFM（GitHub Flavored Markdown）
- **安全**：使用 `dangerouslySetInnerHTML`（仅用于 AI 消息）
- **样式**：自定义 CSS 类 `.ai-message-markdown`

### 使用示例

**用户提问**：
```
请用 Markdown 格式介绍 React Hooks
```

**AI 回答**（渲染后）：

# React Hooks

React Hooks 是 React 16.8 引入的新特性。

## 常用 Hooks

1. **useState** - 状态管理
2. **useEffect** - 副作用处理
3. **useContext** - 上下文访问

### 代码示例

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

> 注意：Hooks 只能在函数组件中使用。

更多信息请访问 [React 官方文档](https://react.dev)。

### 注意事项

1. **用户消息不渲染 Markdown**
   - 用户输入保持原样显示
   - 避免意外的格式化

2. **AI 消息自动渲染**
   - AI 回答自动应用 Markdown 渲染
   - 支持流式输出时的实时渲染

3. **代码块滚动**
   - 长代码自动显示滚动条
   - 保持界面整洁

### 相关文件

- `src/components/ai/ai-chat-drawer.tsx` - AI 对话组件
- `src/app/globals.css` - Markdown 样式定义
- `package.json` - marked 库依赖

### 更新日志

**2026-02-02**
- ✅ 集成 marked 库
- ✅ 添加 Markdown 渲染函数
- ✅ 创建自定义样式类
- ✅ 支持代码块高亮
- ✅ 优化移动端显示
