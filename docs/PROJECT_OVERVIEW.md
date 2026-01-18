# AI 驱动学习平台 - 项目说明文档

## 📖 项目简介

这是一个基于 AI 技术的智能学习平台，利用大语言模型（LLM）生成个性化学习计划、学习大纲、学习内容和测试题。平台集成了富文本编辑器、AI 对话助手等功能，旨在提供完整的学习体验。

### 核心特性

- 🤖 **多 AI 提供商支持**：OpenAI、DeepSeek、Gemini、Claude、Cloudflare AI
- 📚 **智能内容生成**：学习计划、大纲、知识内容、测试题
- ✍️ **富文本编辑器**：支持代码、公式、图片、视频、表格等
- 💬 **AI 对话助手**：实时解答学习问题
- 🎨 **Claymorphism 设计**：友好、现代的 UI 风格
- 📱 **响应式设计**：支持桌面和移动设备

---

## 🚀 快速开始

### 环境要求

- Node.js 20+
- npm/yarn/pnpm
- 版本管理工具：fnm（推荐）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd next-ai-driven-learning
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量示例文件
cp .env.local.example .env.local
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 文件，至少需要设置：
```bash
# NextAuth 密钥（必需）
AUTH_SECRET=PMF1RzbEJD4AhM3fLx+5uMuWaRl9Q7J7uCGS0W9+CwQ=
NEXTAUTH_URL=http://localhost:3000

# AI 提供商 API Keys（可选，不配置则使用免费的 Cloudflare AI）
OPENAI_API_KEY=sk-your-key
DEEPSEEK_API_KEY=your-key
GEMINI_API_KEY=your-key
CLAUDE_API_KEY=your-key
```

4. **初始化数据库**
```bash
# 生成迁移文件
npm run db:generate

# 运行本地数据库迁移
npm run db:migrate:local
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
- 首页：http://localhost:3000
- AI 设置：http://localhost:3000/settings/ai
- 学习计划：http://localhost:3000/learning-plan

---

## 📁 项目结构

```
next-ai-driven-learning/
├── src/
│   ├── app/                      # Next.js App Router 页面
│   │   ├── api/                  # API 路由
│   │   │   ├── ai/              # AI 相关 API
│   │   │   ├── learning-plan/   # 学习计划 API
│   │   │   ├── learning-outline/# 学习大纲 API
│   │   │   └── learning-content/# 学习内容 API
│   │   ├── settings/            # 设置页面
│   │   ├── learning-plan/       # 学习计划页面
│   │   ├── learn/[planId]/      # 学习详情页
│   │   └── ai-chat/             # AI 对话页面
│   ├── components/              # React 组件
│   │   ├── ai/                  # AI 相关组件
│   │   ├── editor/              # 富文本编辑器组件
│   │   └── learning/            # 学习功能组件
│   ├── lib/                     # 工具库
│   │   ├── ai/                  # AI 客户端和提示词
│   │   ├── db-connection.ts     # 数据库连接
│   │   └── storage/             # 文件存储
│   ├── hooks/                   # React Hooks
│   └── db/                      # 数据库 Schema
├── docs/                        # 项目文档
├── drizzle/                     # 数据库迁移文件
├── public/                      # 静态资源
└── .kiro/                       # Kiro 配置和规范
```

---

## 🎯 核心功能

### 1. LLM 模型选择系统

支持多个 AI 提供商和 15+ 个模型：

| 提供商 | 模型 | 特点 | 成本 |
|--------|------|------|------|
| **Cloudflare AI** | Llama 3.1 8B | 免费，无需配置 | 免费 |
| **OpenAI** | GPT-4o, GPT-4o Mini | 业界领先 | $0.00015-$0.01/1k tokens |
| **DeepSeek** | DeepSeek Chat/Coder | 高性价比，中文友好 | $0.0001/1k tokens |
| **Google Gemini** | Gemini 1.5 Pro/Flash | 超大上下文 | $0.000075-$0.00125/1k tokens |
| **Anthropic Claude** | Claude 3.5 Sonnet/Haiku | 推理能力强 | $0.0008-$0.015/1k tokens |

**配置方式：**
1. 访问 `/settings/ai`
2. 选择提供商和模型
3. 输入 API Key（保存在浏览器本地）
4. 立即生效

### 2. AI 对话助手

- **流式响应**：实时显示 AI 回复
- **上下文对话**：支持多轮对话
- **模型切换**：对话中快速切换模型
- **消息历史**：保存对话记录

**使用场景：**
- 解答学习问题
- 代码调试帮助
- 概念解释
- 学习建议

### 3. 学习计划生成

AI 根据主题、目标、难度生成个性化学习计划：

**生成内容：**
- 学习目标和预期成果
- 学习路径和阶段划分
- 每个阶段的重点内容
- 建议的学习时间分配
- 学习资源推荐

**数据流程：**
```
用户输入 → AI 生成 → 保存数据库 → 展示列表
```

### 4. 学习大纲生成

生成层次化的学习大纲：

**特性：**
- 树形结构（支持多级章节）
- 时间估算（每章节预计学习时间）
- 前置知识标记
- 可展开/折叠

**数据结构：**
```json
{
  "outline": [
    {
      "title": "第一章：基础概念",
      "description": "介绍基础知识",
      "estimatedTime": "120分钟",
      "prerequisites": ["数学基础"],
      "children": [
        {
          "title": "1.1 核心概念",
          "description": "详细说明",
          "estimatedTime": "30分钟"
        }
      ]
    }
  ]
}
```

### 5. 学习详情页

**三栏布局：**
```
┌────────┬──────────────────┬────────┐
│ 文档树 │   富文本编辑器    │ 大纲   │
│        │                  │        │
│ ├ 第1章│  ┌────────────┐  │ ├ H1   │
│ │ ├1.1│  │            │  │ ├ H2   │
│ │ └1.2│  │  编辑区域  │  │ └ H3   │
│ ├ 第2章│  │            │  │        │
│ └ [+] │  └────────────┘  │        │
└────────┴──────────────────┴────────┘
```

**功能特性：**
- 点击大纲项切换章节
- 富文本编辑器记录笔记
- AI 生成章节内容
- 自动保存进度
- 响应式设计

### 6. 富文本编辑器

**基础功能：**
- 文本格式：粗体、斜体、删除线、行内代码
- 标题：H1-H6 六级标题
- 列表：无序、有序、任务列表
- 引用和代码块（带语法高亮）
- 链接、对齐、分割线

**高级功能：**
- 颜色：字体颜色、背景颜色（8种预设）
- 媒体：图片、YouTube/Vimeo 视频
- 表格：可调整大小，支持添加/删除行列
- 数学公式：LaTeX 公式（KaTeX 渲染）
- 提示框：信息、警告、成功、错误（4种类型）

**交互特性：**
- 斜杠命令：输入 `/` 快速插入内容
- 浮动工具栏：选中文本时显示
- 键盘快捷键：Ctrl+B、Ctrl+I、Ctrl+Z 等
- 拖拽上传：直接拖拽图片文件
- 粘贴上传：复制图片后粘贴

**代码块语法高亮：**
- 支持多种编程语言
- 自动识别语言标签
- 深色主题渐变背景
- 完整的语法高亮配色

---

## 🎨 设计系统

### Claymorphism 风格

**核心特征：**
- 柔和的 3D 效果
- 厚边框（3-4px）
- 双层阴影（内+外）
- 圆角（16-24px）
- 友好、玩具感

**配色方案：**
```css
/* 主色调 - 青绿色（学习与成长） */
--color-primary: #0D9488;        /* teal-600 */
--color-primary-light: #14B8A6;  /* teal-500 */
--color-primary-dark: #0F766E;   /* teal-700 */

/* 辅助色 - 亮青色 */
--color-secondary: #2DD4BF;      /* cyan-400 */

/* CTA按钮 - 橙色 */
--color-cta: #EA580C;            /* orange-600 */
--color-cta-hover: #C2410C;      /* orange-700 */

/* 背景色 */
--color-bg: #F0FDFA;             /* teal-50 */
--color-bg-card: rgba(255, 255, 255, 0.8);

/* 文字色 */
--color-text: #134E4A;           /* teal-900 */
--color-text-secondary: #0F766E; /* teal-700 */
```

**字体系统：**
- 主字体：Baloo 2（友好、圆润）
- 辅助字体：Comic Neue（教育感）
- 代码字体：Fira Code、Consolas

**阴影效果：**
```css
/* 外部阴影 */
shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]

/* 内部阴影（按下状态） */
active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]

/* 输入框内嵌阴影 */
shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),2px_2px_6px_rgba(255,255,255,0.8)]
```

### 响应式设计

**断点：**
- 移动端：375px
- 平板：768px
- 桌面：1024px
- 大屏：1440px

**设计原则：**
- 移动优先
- 触摸友好
- 流式布局
- 自适应字体

### 可访问性

- ✅ 文字对比度 ≥ 4.5:1
- ✅ 键盘导航支持
- ✅ 屏幕阅读器友好
- ✅ ARIA 标签
- ✅ `prefers-reduced-motion` 支持

---

## 🔧 技术栈

### 前端框架
- **Next.js 15**：React 框架，支持 SSR 和 SSG
- **TypeScript**：类型安全
- **Tailwind CSS**：实用优先的 CSS 框架
- **React Hooks**：状态管理

### 编辑器
- **Tiptap**：基于 ProseMirror 的富文本编辑器
- **Lowlight**：代码语法高亮
- **KaTeX**：数学公式渲染

### UI 组件
- **Lucide React**：图标库
- **Tippy.js**：工具提示

### 后端服务
- **Edge Runtime**：Cloudflare Workers
- **Cloudflare D1**：SQLite 数据库
- **Drizzle ORM**：类型安全的 ORM
- **Cloudflare R2**：对象存储（文件上传）
- **NextAuth.js**：认证系统

### AI 集成
- **OpenAI SDK**：GPT 模型
- **DeepSeek API**：DeepSeek 模型
- **Google Generative AI**：Gemini 模型
- **Anthropic SDK**：Claude 模型
- **Cloudflare AI**：免费 LLM

---

## 📊 数据库设计

### 核心表结构

#### 1. users（用户表）
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### 2. learning_plans（学习计划表）
```sql
CREATE TABLE learning_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  goal TEXT,
  level TEXT NOT NULL,  -- beginner/intermediate/advanced
  status TEXT NOT NULL,  -- active/completed/archived
  progress INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 3. learning_outlines（学习大纲表）
```sql
CREATE TABLE learning_outlines (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  parent_id TEXT,  -- 父章节ID（支持嵌套）
  title TEXT NOT NULL,
  description TEXT,
  estimated_time TEXT,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES learning_plans(id),
  FOREIGN KEY (parent_id) REFERENCES learning_outlines(id)
);
```

#### 4. knowledge_contents（知识内容表）
```sql
CREATE TABLE knowledge_contents (
  id TEXT PRIMARY KEY,
  outline_id TEXT NOT NULL,
  content TEXT NOT NULL,  -- HTML 格式
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (outline_id) REFERENCES learning_outlines(id)
);
```

#### 5. test_questions（测试题表）
```sql
CREATE TABLE test_questions (
  id TEXT PRIMARY KEY,
  outline_id TEXT NOT NULL,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL,  -- multiple_choice/fill_blank/coding/essay
  options TEXT,  -- JSON 数组
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL,  -- easy/medium/hard
  created_at INTEGER NOT NULL,
  FOREIGN KEY (outline_id) REFERENCES learning_outlines(id)
);
```

### 数据库操作

**迁移命令：**
```bash
# 生成迁移文件
npm run db:generate

# 本地迁移
npm run db:migrate:local

# 远程迁移
npm run db:migrate:remote

# 打开数据库控制台
npm run db:studio
```

---

## 🛠️ 开发指南

### 项目命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run preview          # 预览生产版本
npm run deploy           # 部署到 Cloudflare

# 数据库
npm run db:generate      # 生成迁移文件
npm run db:migrate:local # 本地数据库迁移
npm run db:migrate:remote# 远程数据库迁移
npm run db:studio        # 打开数据库控制台

# 代码质量
npm run lint             # 运行 ESLint
npm run type-check       # TypeScript 类型检查
```

### 代码规范

**TypeScript：**
- 使用严格模式
- 避免 `any` 类型
- 导出类型定义

**React：**
- 使用函数组件和 Hooks
- Props 使用 TypeScript 接口
- 避免内联样式

**Tailwind CSS：**
- 使用实用类
- 避免自定义 CSS
- 使用 CSS 变量定义主题色

**命名规范：**
- 组件：PascalCase（`UserProfile.tsx`）
- 文件：kebab-case（`user-profile.ts`）
- 变量：camelCase（`userName`）
- 常量：UPPER_SNAKE_CASE（`API_KEY`）

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature/your-feature-name

# 创建 Pull Request
```

**提交信息规范：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 📝 使用指南

### 场景 1：创建学习计划

1. 访问 `/learning-plan`
2. 点击"创建学习计划"
3. 填写：
   - 学习主题（例如：Python 编程）
   - 学习目标（例如：掌握 Python 基础语法）
   - 难度级别（初级/中级/高级）
4. 点击"生成学习计划"
5. AI 自动生成计划并保存

### 场景 2：生成学习大纲

1. 在学习计划列表中点击某个计划
2. 进入学习详情页
3. 点击"AI 生成内容"
4. 填写章节信息
5. AI 生成大纲树形结构

### 场景 3：编写学习笔记

1. 在学习详情页点击某个章节
2. 在富文本编辑器中编写笔记
3. 使用斜杠命令快速插入内容：
   - `/标题` - 插入标题
   - `/代码` - 插入代码块
   - `/图片` - 插入图片
   - `/表格` - 插入表格
4. 笔记自动保存

### 场景 4：使用 AI 助手

1. 在学习详情页切换到"AI 助手"标签
2. 输入问题（例如："解释 Python 的装饰器"）
3. AI 实时回复
4. 支持多轮对话

### 场景 5：切换 AI 模型

1. 访问 `/settings/ai`
2. 选择提供商（例如：DeepSeek）
3. 选择模型（例如：DeepSeek Chat）
4. 输入 API Key
5. 返回任何 AI 功能页面，立即生效

---

## 🔐 安全说明

### API Key 管理

**存储方式：**
- 用户配置的 API Keys 保存在浏览器 `localStorage`
- 不会上传到服务器或数据库
- 每次 API 调用通过请求头传递

**环境变量：**
- `.dev.vars` 和 `.env.local` 已添加到 `.gitignore`
- 不会被提交到代码仓库
- 仅在本地开发环境使用

**生产环境：**
- 部署到 Cloudflare Pages 时，在控制台配置环境变量
- 不要在代码中硬编码 API Keys
- 使用 Cloudflare Secrets 管理敏感信息

### 数据安全

- 用户密码使用 bcrypt 哈希
- 会话使用 JWT 令牌
- HTTPS 加密传输
- CORS 跨域保护

---

## 🐛 故障排除

### 问题 1：API Key 无效

**症状：** AI 生成失败，提示 API Key 错误

**解决：**
1. 检查 API Key 是否正确
2. 确认 API Key 有足够的配额
3. 尝试重新输入 API Key
4. 切换到免费的 Cloudflare AI

### 问题 2：数据库连接失败

**症状：** 保存数据时报错

**解决：**
1. 确认已运行数据库迁移：`npm run db:migrate:local`
2. 检查 `wrangler.jsonc` 中的数据库配置
3. 重启开发服务器

### 问题 3：图片上传失败

**症状：** 拖拽图片后显示错误

**解决：**
1. 检查图片大小（建议 < 5MB）
2. 检查图片格式（支持 JPG、PNG、GIF）
3. 确认 R2 存储配置正确
4. 检查网络连接

### 问题 4：代码块没有语法高亮

**症状：** 代码块显示为纯文本

**解决：**
1. 确认代码块指定了语言（例如：```python）
2. 检查 `CustomCodeBlock` 扩展是否正确加载
3. 清除浏览器缓存
4. 重新生成内容

### 问题 5：工具栏不显示

**症状：** 选中文本后浮动工具栏不出现

**解决：**
1. 确保选中了文本（不是空选区）
2. 检查 `showBubbleMenu` 属性是否为 `true`
3. 刷新页面

---

## 📚 相关文档

### 项目文档
- **配置指南**：`docs/AI_SETUP_GUIDE.md`
- **编辑器功能**：`docs/EDITOR_FEATURES.md`
- **编辑器使用示例**：`docs/EDITOR_USAGE_EXAMPLES.md`
- **设计系统**：`docs/DESIGN_SYSTEM.md`

### 规范文档
- **需求文档**：`.kiro/specs/ai-learning-platform/requirements.md`
- **设计文档**：`.kiro/specs/ai-learning-platform/design.md`
- **任务列表**：`.kiro/specs/ai-learning-platform/tasks.md`

### 外部资源
- [Next.js 文档](https://nextjs.org/docs)
- [Tiptap 文档](https://tiptap.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)

---

## 🔜 后续规划

### 短期目标（1-2 个月）

1. **知识内容生成**
   - AI 自动生成章节详细内容
   - 支持多种内容格式
   - 内容质量评估

2. **测试题生成**
   - 根据学习内容生成测试题
   - 支持多种题型
   - 自动评分系统

3. **学习进度追踪**
   - 可视化学习进度
   - 学习时间统计
   - 成就系统

4. **费曼学习法**
   - 录音/文字讲解
   - AI 评估讲解质量
   - 提供改进建议

### 中期目标（3-6 个月）

1. **代码编辑器**
   - 在线代码编辑
   - 代码运行和调试
   - 多语言支持

2. **虚拟终端**
   - 浏览器内终端
   - 命令执行
   - 文件系统模拟

3. **协作功能**
   - 实时协作编辑
   - 评论和讨论
   - 分享学习计划

4. **移动端 App**
   - PWA 支持
   - 离线功能
   - 推送通知

### 长期目标（6-12 个月）

1. **社区功能**
   - 用户分享学习计划
   - 学习小组
   - 排行榜

2. **高级 AI 功能**
   - 个性化推荐
   - 学习路径优化
   - 智能答疑

3. **多语言支持**
   - 界面国际化
   - 内容翻译
   - 多语言学习

4. **企业版**
   - 团队管理
   - 学习分析
   - 定制化功能

---

## 🤝 贡献指南

### 如何贡献

1. Fork 项目
2. 创建功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 创建 Pull Request

### 代码审查

- 确保代码通过 TypeScript 类型检查
- 遵循项目代码规范
- 添加必要的注释
- 更新相关文档

### 报告问题

- 使用 GitHub Issues
- 提供详细的问题描述
- 包含复现步骤
- 附上截图或错误日志

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。

---

## 👥 团队

- **项目负责人**：[Your Name]
- **技术架构**：[Your Name]
- **UI/UX 设计**：[Your Name]

---

## 📞 联系方式

- **项目主页**：[GitHub Repository]
- **问题反馈**：[GitHub Issues]
- **邮箱**：[your-email@example.com]

---

## 🎉 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/)
- [Tiptap](https://tiptap.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudflare](https://www.cloudflare.com/)
- [Drizzle ORM](https://orm.drizzle.team/)

---

**最后更新：** 2024-01-18

**版本：** 1.0.0
