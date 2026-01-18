# 需求文档 - AI驱动学习平台

## 简介

AI驱动学习平台是一个综合性的在线学习系统，利用人工智能技术为用户生成个性化的学习内容，并集成多种科学学习方法（如费曼学习法）来帮助用户高效学习和巩固知识。平台提供富文本编辑、代码编辑、虚拟终端、浏览器沙盒等交互式学习工具，支持多种学习场景。

**技术栈：**
- 框架：Next.js (Node 20+, 使用fnm管理)
- 数据库：Cloudflare D1
- 部署：Cloudflare Pages
- PWA支持：渐进式Web应用

**开发阶段：**
- 第一阶段（当前）：核心功能实现
- 第二阶段（待办）：增强功能

**UI/UX设计原则：**
- 设计风格：现代、专业、友好的学习平台风格
- 视觉风格：Glassmorphism（玻璃态）- 磨砂玻璃效果、透明、模糊背景、多层次
- 配色方案：
  - 主色：#0D9488（青绿色 - 学习与成长）
  - 辅助色：#2DD4BF（亮青色）
  - CTA按钮：#EA580C（橙色 - 行动号召）
  - 背景：#F0FDFA（浅青色）
  - 文字：#134E4A（深青色）
- 字体：Baloo 2 / Comic Neue（友好、教育感、现代）
- 关键效果：背景模糊（10-20px）、细微边框、光反射、Z轴深度
- 响应式断点：375px（手机）、768px（平板）、1024px（小桌面）、1440px（大桌面）
- 可访问性：文字对比度最低4.5:1、支持键盘导航、尊重prefers-reduced-motion
- 交互：所有可点击元素添加cursor-pointer、平滑过渡（150-300ms）、清晰的hover和focus状态
- 避免：过度动画、默认深色模式、使用emoji作为图标

## 术语表

- **System**: AI学习平台系统
- **User**: 使用平台的学习者
- **AI_Generator**: AI内容生成服务
- **Learning_Plan**: 学习计划，包含学习目标、时间安排和学习路径
- **Learning_Outline**: 学习大纲，知识点的结构化组织
- **Learning_Guide**: 学习指南，详细的学习步骤和方法说明
- **Knowledge_Content**: 学习知识内容，AI生成的教学材料
- **Test_Question**: 测试题目，用于评估学习效果
- **Feynman_Method**: 费曼学习法，通过简化讲解来巩固理解
- **Rich_Text_Editor**: 富文本编辑器
- **Virtual_Terminal**: 虚拟终端，用于执行命令行操作
- **Browser_Sandbox**: 浏览器沙盒，隔离的网页预览环境
- **Code_Editor**: 代码编辑器
- **Learning_Session**: 学习会话，用户的一次完整学习过程
- **Progress_Tracker**: 学习进度跟踪器
- **Review_System**: 复习系统，基于遗忘曲线的智能复习
- **D1_Database**: Cloudflare D1数据库

## 核心需求（第一阶段）

### 需求 1: AI内容生成

**用户故事:** 作为学习者，我希望AI能够根据我的学习目标自动生成学习计划、大纲、指南和知识内容，以便我能够获得个性化的学习路径。

#### 验收标准

1. WHEN 用户输入学习主题和目标 THEN THE AI_Generator SHALL 生成结构化的学习计划
2. WHEN 学习计划生成完成 THEN THE System SHALL 基于计划生成详细的学习大纲
3. WHEN 用户请求学习指南 THEN THE AI_Generator SHALL 生成包含学习方法和步骤的指南
4. WHEN 用户开始学习某个知识点 THEN THE AI_Generator SHALL 生成该知识点的详细教学内容
5. WHEN 知识内容生成完成 THEN THE AI_Generator SHALL 自动生成对应的测试题目
6. WHEN AI生成内容时 THEN THE System SHALL 显示生成进度和状态
7. IF AI生成失败 THEN THE System SHALL 提供错误信息并允许用户重试

### 需求 2: 测试与评估系统

**用户故事:** 作为学习者，我希望通过测试题来检验我的学习效果，以便了解自己的掌握程度。

#### 验收标准

1. WHEN 用户完成知识点学习 THEN THE System SHALL 提供相关的测试题目
2. WHEN 用户提交答案 THEN THE System SHALL 立即评估并显示结果
3. WHEN 测试完成 THEN THE System SHALL 生成详细的成绩报告和知识点掌握分析
4. WHEN 用户答错题目 THEN THE System SHALL 提供详细的解析和相关知识点链接
5. THE System SHALL 支持多种题型（选择题、填空题、编程题、简答题）
6. WHEN 用户完成多次测试 THEN THE System SHALL 追踪进步趋势并可视化展示

### 需求 3: 费曼学习法集成

**用户故事:** 作为学习者，我希望使用费曼学习法来巩固知识，通过用简单的语言讲解复杂概念来加深理解。

#### 验收标准

1. WHEN 用户选择使用费曼学习法 THEN THE System SHALL 提供专门的讲解界面
2. WHEN 用户输入讲解内容 THEN THE Rich_Text_Editor SHALL 支持文字、图片、代码等多种形式
3. WHEN 用户完成讲解 THEN THE AI_Generator SHALL 分析讲解质量并提供反馈
4. WHEN AI检测到概念理解偏差 THEN THE System SHALL 指出问题并提供正确解释
5. THE System SHALL 允许用户保存和回顾自己的费曼讲解记录
6. WHEN 用户讲解复杂概念 THEN THE System SHALL 提示用户简化语言

### 需求 4: 多种学习方法支持

**用户故事:** 作为学习者，我希望平台支持多种主流学习方法，以便我能选择最适合自己的学习方式。

#### 验收标准

1. THE System SHALL 支持间隔重复学习法（Spaced Repetition）
2. THE System SHALL 支持主动回忆学习法（Active Recall）
3. THE System SHALL 支持思维导图学习法
4. THE System SHALL 支持番茄工作法（Pomodoro Technique）
5. WHEN 用户选择学习方法 THEN THE System SHALL 根据方法特点调整学习界面和流程
6. THE System SHALL 允许用户组合使用多种学习方法
7. WHEN 用户使用间隔重复 THEN THE System SHALL 基于遗忘曲线智能安排复习时间

### 需求 5: 富文本编辑器（含媒体上传）

**用户故事:** 作为学习者，我希望使用富文本编辑器记录笔记和整理知识，并能够直接在编辑器中上传和管理图片、视频等媒体文件，以便更好地组织学习内容。

#### 验收标准

1. THE Rich_Text_Editor SHALL 支持基本文本格式（粗体、斜体、下划线、删除线）
2. THE Rich_Text_Editor SHALL 支持标题层级（H1-H6）
3. THE Rich_Text_Editor SHALL 支持列表（有序列表、无序列表、任务列表）
4. THE Rich_Text_Editor SHALL 支持代码块和行内代码
5. THE Rich_Text_Editor SHALL 支持表格插入和编辑
6. THE Rich_Text_Editor SHALL 支持链接插入
7. THE Rich_Text_Editor SHALL 支持数学公式（LaTeX）
8. WHEN 用户编辑内容 THEN THE System SHALL 自动保存草稿
9. THE Rich_Text_Editor SHALL 支持Markdown快捷输入

**媒体上传功能（集成在编辑器中）：**

10. THE Rich_Text_Editor SHALL 支持通过工具栏按钮上传图片
11. THE Rich_Text_Editor SHALL 支持拖拽图片/视频/音频文件到编辑器自动上传
12. THE Rich_Text_Editor SHALL 支持粘贴剪贴板中的图片自动上传
13. THE Rich_Text_Editor SHALL 支持常见图片格式（JPG, PNG, GIF, WebP, SVG）
14. THE Rich_Text_Editor SHALL 支持视频格式（MP4, WebM, MOV）并嵌入播放器
15. THE Rich_Text_Editor SHALL 支持音频格式（MP3, WAV, OGG）并嵌入播放器
16. THE Rich_Text_Editor SHALL 支持嵌入YouTube和Vimeo视频链接
17. THE Rich_Text_Editor SHALL 限制单个文件大小（图片最大10MB，视频最大100MB）
18. WHEN 用户上传文件 THEN THE Rich_Text_Editor SHALL 显示上传进度
19. IF 文件格式不支持或超过大小限制 THEN THE System SHALL 拒绝上传并提示用户
20. THE Rich_Text_Editor SHALL 对上传的图片进行压缩优化
21. THE Rich_Text_Editor SHALL 支持媒体文件的尺寸调整、对齐和删除
22. THE Rich_Text_Editor SHALL 为上传的视频自动生成缩略图预览

### 需求 6: 代码编辑器

**用户故事:** 作为学习编程的用户，我希望有一个功能完善的代码编辑器，以便我能够编写和测试代码。

#### 验收标准

1. THE Code_Editor SHALL 支持语法高亮（支持主流编程语言）
2. THE Code_Editor SHALL 提供代码自动补全功能
3. THE Code_Editor SHALL 支持代码格式化
4. THE Code_Editor SHALL 显示行号和代码折叠
5. THE Code_Editor SHALL 支持多文件标签页
6. THE Code_Editor SHALL 提供主题切换（亮色/暗色）
7. WHEN 用户编写代码 THEN THE System SHALL 实时检查语法错误
8. THE Code_Editor SHALL 支持快捷键操作（保存、查找、替换等）

### 需求 7: 虚拟终端

**用户故事:** 作为学习命令行操作的用户，我希望有一个虚拟终端来练习命令，以便在安全环境中学习。

#### 验收标准

1. THE Virtual_Terminal SHALL 提供类Unix终端界面
2. THE Virtual_Terminal SHALL 支持基本Shell命令（ls, cd, mkdir, cat等）
3. THE Virtual_Terminal SHALL 支持命令历史记录（上下箭头）
4. THE Virtual_Terminal SHALL 支持Tab键自动补全
5. WHEN 用户执行危险命令 THEN THE System SHALL 在沙盒环境中隔离执行
6. THE Virtual_Terminal SHALL 支持多终端标签页
7. WHEN 用户执行代码 THEN THE Virtual_Terminal SHALL 显示输出结果
8. THE Virtual_Terminal SHALL 支持清屏和终端重置

### 需求 8: 浏览器沙盒

**用户故事:** 作为学习Web开发的用户，我希望有一个浏览器沙盒来预览我的HTML/CSS/JS代码，以便实时查看效果。

#### 验收标准

1. THE Browser_Sandbox SHALL 提供隔离的iframe预览环境
2. WHEN 用户修改代码 THEN THE Browser_Sandbox SHALL 实时更新预览
3. THE Browser_Sandbox SHALL 支持响应式视图切换（桌面、平板、手机）
4. THE Browser_Sandbox SHALL 显示控制台日志和错误信息
5. THE Browser_Sandbox SHALL 支持外部资源加载（CDN库）
6. IF 代码存在安全风险 THEN THE System SHALL 阻止执行并警告用户
7. THE Browser_Sandbox SHALL 支持全屏预览模式

### 需求 9: AI对话助手

**用户故事:** 作为学习者，我希望有一个AI助手能够回答我的问题和提供学习建议，以便在遇到困难时获得即时帮助。

#### 验收标准

1. THE System SHALL 提供AI对话界面
2. WHEN 用户提问 THEN THE AI_Generator SHALL 基于上下文提供相关答案
3. THE AI_Generator SHALL 能够解释复杂概念
4. THE AI_Generator SHALL 能够提供学习建议和资源推荐
5. WHEN 用户学习特定知识点 THEN THE AI_Generator SHALL 主动提供相关提示
6. THE System SHALL 保存对话历史供用户回顾
7. THE AI_Generator SHALL 支持多轮对话理解上下文

### 需求 10: 响应式设计与可访问性

**用户故事:** 作为用户，我希望能在不同设备上流畅使用平台，并且平台应该对所有人友好，界面美观且交互流畅。

#### 验收标准

1. THE System SHALL 在桌面、平板、手机上正常显示和操作
2. THE System SHALL 在移动设备上提供优化的触摸交互
3. THE System SHALL 使用Glassmorphism设计风格（磨砂玻璃效果、透明背景、多层次）
4. THE System SHALL 使用推荐的配色方案（主色#0D9488、辅助色#2DD4BF、CTA#EA580C）
5. THE System SHALL 使用Baloo 2或Comic Neue字体系列
6. THE System SHALL 在所有可点击元素上显示cursor-pointer
7. THE System SHALL 为交互元素提供平滑过渡效果（150-300ms）
8. THE System SHALL 使用SVG图标（Heroicons或Lucide），不使用emoji作为图标
9. THE System SHALL 支持键盘导航
10. THE System SHALL 提供适当的ARIA标签
11. THE System SHALL 支持屏幕阅读器
12. THE System SHALL 确保文字对比度最低4.5:1
13. THE System SHALL 提供清晰的hover和focus状态
14. THE System SHALL 尊重用户的prefers-reduced-motion设置
15. THE System SHALL 在375px、768px、1024px、1440px断点正常显示
16. THE System SHALL 避免布局偏移（使用skeleton加载器和固定尺寸）
17. WHEN 用户设置偏好 THEN THE System SHALL 记住用户的可访问性设置

### 需求 11: 性能与优化

**用户故事:** 作为用户，我希望平台响应迅速、加载快速，以便获得流畅的学习体验。

#### 验收标准

1. WHEN 用户访问页面 THEN THE System SHALL 在2秒内完成首屏加载
2. THE System SHALL 使用懒加载优化图片和组件
3. THE System SHALL 缓存常用数据减少网络请求
4. THE System SHALL 使用虚拟滚动处理长列表
5. WHEN AI生成内容 THEN THE System SHALL 使用流式传输显示进度
6. THE System SHALL 压缩和优化静态资源
7. THE System SHALL 使用CDN加速资源加载

### 需求 12: 数据持久化与同步

**用户故事:** 作为用户，我希望我的学习数据能够安全保存并在不同设备间同步，以便随时随地学习。

#### 验收标准

1. WHEN 用户编辑内容 THEN THE System SHALL 自动保存到D1_Database
2. THE System SHALL 支持离线模式（本地IndexedDB存储）
3. WHEN 网络恢复 THEN THE System SHALL 自动同步本地数据到D1_Database
4. IF 同步冲突发生 THEN THE System SHALL 提示用户选择保留哪个版本
5. THE System SHALL 定期备份用户数据
6. THE System SHALL 提供数据恢复功能（最近30天）
7. WHEN 用户切换设备 THEN THE System SHALL 自动同步学习进度和设置

### 需求 13: PWA支持

**用户故事:** 作为用户，我希望能够将平台安装到设备上像原生应用一样使用，以便获得更好的使用体验。

#### 验收标准

1. THE System SHALL 提供Web App Manifest配置
2. THE System SHALL 注册Service Worker支持离线访问
3. WHEN 用户访问网站 THEN THE System SHALL 提示安装到主屏幕
4. THE System SHALL 在离线状态下显示缓存的内容
5. THE System SHALL 提供应用图标和启动画面
6. THE System SHALL 支持推送通知（需用户授权）
7. WHEN 有新版本 THEN THE System SHALL 提示用户更新
8. THE System SHALL 缓存关键资源以提升加载速度

### 需求 14: 用户认证与数据管理

**用户故事:** 作为用户，我希望有自己的账户来保存和管理我的学习数据，以便在不同设备上访问我的学习内容。

#### 验收标准

1. THE System SHALL 支持邮箱注册和登录
2. THE System SHALL 支持第三方登录（Google, GitHub）
3. WHEN 用户首次登录 THEN THE System SHALL 引导完成基本设置
4. THE System SHALL 为每个用户隔离存储学习数据
5. THE System SHALL 加密存储用户密码
6. THE System SHALL 支持密码重置功能
7. WHEN 用户长时间未操作 THEN THE System SHALL 自动登出以保护隐私
8. THE System SHALL 允许用户导出个人学习数据

### 需求 15: LLM 模型选择与管理

**用户故事:** 作为用户，我希望能够选择不同的 AI 模型提供商和具体模型，以便根据我的需求和偏好使用最合适的 AI 服务。

#### 验收标准

1. THE System SHALL 支持多个 LLM 提供商（OpenAI/ChatGPT、DeepSeek、Gemini、Claude、Cloudflare AI）
2. WHEN 用户访问设置页面 THEN THE System SHALL 显示可用的 AI 提供商列表
3. WHEN 用户选择提供商 THEN THE System SHALL 显示该提供商支持的模型列表
4. THE System SHALL 为每个提供商显示模型特点（速度、成本、能力）
5. WHEN 用户选择模型 THEN THE System SHALL 保存用户偏好到本地存储和数据库
6. WHEN 用户使用 AI 功能 THEN THE System SHALL 使用用户选择的模型
7. THE System SHALL 在 AI 对话界面显示当前使用的提供商和模型
8. THE System SHALL 允许用户在对话界面快速切换模型
9. IF 用户未配置 API Key THEN THE System SHALL 提示用户配置或使用默认的 Cloudflare AI
10. THE System SHALL 验证 API Key 的有效性
11. WHEN API 调用失败 THEN THE System SHALL 显示错误信息并建议切换模型
12. THE System SHALL 记录每个模型的使用次数和成功率

## 待办需求（第二阶段）

### 需求 15: 学习进度追踪

**用户故事:** 作为学习者，我希望系统能够追踪我的学习进度，以便我了解自己的学习状况和成就。

#### 验收标准

1. THE Progress_Tracker SHALL 记录用户完成的知识点数量
2. THE Progress_Tracker SHALL 计算学习计划的完成百分比
3. THE Progress_Tracker SHALL 追踪每日学习时长
4. THE Progress_Tracker SHALL 统计测试成绩和正确率
5. WHEN 用户完成里程碑 THEN THE System SHALL 显示成就徽章
6. THE System SHALL 提供可视化的进度仪表板
7. THE System SHALL 生成学习报告（周报、月报）
8. THE Progress_Tracker SHALL 对比用户与平均水平的差异

### 需求 16: 智能复习系统

**用户故事:** 作为学习者，我希望系统能够智能安排复习时间，以便我能够高效巩固已学知识。

#### 验收标准

1. THE Review_System SHALL 基于艾宾浩斯遗忘曲线计算复习时间
2. WHEN 知识点首次学习完成 THEN THE System SHALL 安排第一次复习时间
3. WHEN 用户完成复习 THEN THE System SHALL 根据掌握程度调整下次复习间隔
4. THE Review_System SHALL 每日生成复习任务列表
5. WHEN 复习任务到期 THEN THE System SHALL 发送提醒通知
6. THE System SHALL 优先安排即将遗忘的知识点复习
7. THE Review_System SHALL 支持手动标记"已掌握"或"需加强"

### 需求 17: 协作与分享

**用户故事:** 作为学习者，我希望能够与他人分享我的学习笔记和项目，以便互相学习和交流。

#### 验收标准

1. THE System SHALL 允许用户将笔记设置为公开或私密
2. WHEN 笔记设为公开 THEN THE System SHALL 生成分享链接
3. THE System SHALL 支持笔记的评论功能
4. THE System SHALL 允许用户收藏他人的优质笔记
5. THE System SHALL 提供学习小组功能
6. WHEN 用户在小组中 THEN THE System SHALL 允许成员共享学习资源
7. THE System SHALL 支持实时协作编辑（类似Google Docs）

### 需求 18: 搜索与导航

**用户故事:** 作为用户，我希望能够快速搜索和定位学习内容，以便高效使用平台。

#### 验收标准

1. THE System SHALL 提供全局搜索功能
2. WHEN 用户输入搜索关键词 THEN THE System SHALL 搜索笔记、知识点、测试题
3. THE System SHALL 支持搜索结果的筛选（按类型、时间、标签）
4. THE System SHALL 提供搜索历史记录
5. THE System SHALL 支持标签系统组织内容
6. THE System SHALL 提供面包屑导航
7. THE System SHALL 支持快捷键快速导航（Cmd+K / Ctrl+K）

### 需求 19: 学习路径推荐

**用户故事:** 作为新用户，我希望系统能够根据我的背景和目标推荐合适的学习路径，以便快速开始学习。

#### 验收标准

1. WHEN 新用户注册 THEN THE System SHALL 询问学习目标和当前水平
2. WHEN 用户完成评估 THEN THE AI_Generator SHALL 生成个性化学习路径
3. THE System SHALL 提供预设的热门学习路径（前端开发、数据科学等）
4. THE System SHALL 根据用户进度动态调整学习路径
5. WHEN 用户完成某个阶段 THEN THE System SHALL 推荐下一步学习内容
6. THE System SHALL 展示学习路径的完整地图和当前位置

### 需求 20: 通知系统

**用户故事:** 作为用户，我希望收到重要的学习提醒和更新通知，以便保持学习连续性。

#### 验收标准

1. THE System SHALL 支持浏览器推送通知
2. THE System SHALL 支持邮件通知
3. WHEN 复习任务到期 THEN THE System SHALL 发送提醒
4. WHEN 学习计划有更新 THEN THE System SHALL 通知用户
5. WHEN 有人评论用户笔记 THEN THE System SHALL 发送通知
6. THE System SHALL 允许用户自定义通知偏好
7. THE System SHALL 提供通知中心查看历史通知
