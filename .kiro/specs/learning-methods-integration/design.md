# 学习方法集成系统 - 设计文档

## 1. 系统架构

### 1.1 整体架构
```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                              │
├─────────────────────────────────────────────────────────┤
│  学习方法选择器  │  费曼工具  │  复习系统  │  笔记工具    │
│  番茄钟        │  闪卡系统  │  统计分析  │  知识图谱    │
├─────────────────────────────────────────────────────────┤
│                    业务逻辑层                              │
├─────────────────────────────────────────────────────────┤
│  复习算法  │  SM-2算法  │  AI集成  │  数据同步        │
├─────────────────────────────────────────────────────────┤
│                    数据访问层                              │
├─────────────────────────────────────────────────────────┤
│  Drizzle ORM  │  Cloudflare D1  │  LocalStorage       │
└─────────────────────────────────────────────────────────┘
```

### 1.2 模块划分

#### 1.2.1 学习方法管理模块
- 学习方法配置
- 方法切换和组合
- 使用指南展示

#### 1.2.2 费曼学习模块
- 解释编辑器
- AI 对话系统
- 盲点识别

#### 1.2.3 复习计划模块
- 艾宾浩斯算法
- 复习提醒
- 复习追踪

#### 1.2.4 笔记系统模块
- 卡片盒笔记
- 康奈尔笔记
- 双向链接

#### 1.2.5 时间管理模块
- 番茄钟
- 学习统计
- 专注模式

#### 1.2.6 记忆强化模块
- 闪卡系统
- SM-2 算法
- 复习队列

## 2. 数据库设计

### 2.1 学习方法配置表 (learning_methods)
```sql
CREATE TABLE learning_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  method_type TEXT NOT NULL, -- 'feynman', 'ebbinghaus', 'zettelkasten', 'cornell', 'pomodoro', 'spaced_repetition'
  is_enabled BOOLEAN DEFAULT true,
  config JSON, -- 方法特定配置
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES learning_plans(id) ON DELETE CASCADE
);
```

### 2.2 费曼解释表 (feynman_explanations)
```sql
CREATE TABLE feynman_explanations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL, -- 关联的学习内容
  concept TEXT NOT NULL, -- 要解释的概念
  explanation TEXT NOT NULL, -- 用户的解释
  ai_feedback JSON, -- AI 反馈：{ gaps: [], suggestions: [], score: 0-100 }
  version INTEGER DEFAULT 1, -- 解释版本
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES knowledge_contents(id) ON DELETE CASCADE
);
```

### 2.3 复习计划表 (review_schedules)
```sql
CREATE TABLE review_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  review_round INTEGER NOT NULL, -- 第几轮复习 (1-7)
  scheduled_at INTEGER NOT NULL, -- 计划复习时间
  completed_at INTEGER, -- 实际完成时间
  effectiveness INTEGER, -- 复习效果评分 (1-5)
  next_review_at INTEGER, -- 下次复习时间
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES knowledge_contents(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_schedules_user_status ON review_schedules(user_id, status);
CREATE INDEX idx_review_schedules_scheduled ON review_schedules(scheduled_at);
```

### 2.4 卡片盒笔记表 (zettelkasten_notes)
```sql
CREATE TABLE zettelkasten_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSON, -- ['tag1', 'tag2']
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE note_links (
  id TEXT PRIMARY KEY,
  from_note_id TEXT NOT NULL,
  to_note_id TEXT NOT NULL,
  link_type TEXT DEFAULT 'related', -- 'related', 'parent', 'child', 'reference'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (from_note_id) REFERENCES zettelkasten_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (to_note_id) REFERENCES zettelkasten_notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_links_from ON note_links(from_note_id);
CREATE INDEX idx_note_links_to ON note_links(to_note_id);
```

### 2.5 康奈尔笔记表 (cornell_notes)
```sql
CREATE TABLE cornell_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  main_notes TEXT NOT NULL, -- 笔记区
  cues TEXT, -- 线索区（关键词、问题）
  summary TEXT, -- 总结区
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES knowledge_contents(id) ON DELETE CASCADE
);
```

### 2.6 番茄钟记录表 (pomodoro_sessions)
```sql
CREATE TABLE pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT, -- 可选：关联的学习内容
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration INTEGER NOT NULL, -- 计划时长（秒）
  actual_duration INTEGER, -- 实际时长（秒）
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'interrupted'
  session_type TEXT DEFAULT 'work', -- 'work', 'short_break', 'long_break'
  notes TEXT, -- 本次番茄钟的学习笔记
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_pomodoro_user_date ON pomodoro_sessions(user_id, start_time);
```

### 2.7 闪卡表 (flashcards)
```sql
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT, -- 可选：关联的学习内容
  front TEXT NOT NULL, -- 正面（问题）
  back TEXT NOT NULL, -- 背面（答案）
  tags JSON,
  -- SM-2 算法参数
  easiness_factor REAL DEFAULT 2.5, -- 难度因子 (1.3-2.5)
  repetitions INTEGER DEFAULT 0, -- 重复次数
  interval INTEGER DEFAULT 0, -- 复习间隔（天）
  next_review_at INTEGER, -- 下次复习时间
  last_reviewed_at INTEGER, -- 上次复习时间
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES knowledge_contents(id) ON DELETE SET NULL
);

CREATE INDEX idx_flashcards_user_review ON flashcards(user_id, next_review_at);
```

### 2.8 闪卡复习记录表 (flashcard_reviews)
```sql
CREATE TABLE flashcard_reviews (
  id TEXT PRIMARY KEY,
  flashcard_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  quality INTEGER NOT NULL, -- 回忆质量 (0-5)
  reviewed_at INTEGER NOT NULL,
  time_spent INTEGER, -- 花费时间（秒）
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

CREATE INDEX idx_flashcard_reviews_card ON flashcard_reviews(flashcard_id);
```

## 3. API 设计

### 3.1 学习方法 API

#### 获取学习方法配置
```typescript
GET /api/learning-methods?planId={planId}

Response: {
  methods: [
    {
      id: string
      methodType: 'feynman' | 'ebbinghaus' | ...
      isEnabled: boolean
      config: object
    }
  ]
}
```

#### 更新学习方法配置
```typescript
POST /api/learning-methods

Request: {
  planId: string
  methodType: string
  isEnabled: boolean
  config: object
}

Response: {
  success: boolean
  method: object
}
```

### 3.2 费曼学习 API

#### 创建费曼解释
```typescript
POST /api/feynman/explanations

Request: {
  contentId: string
  concept: string
  explanation: string
}

Response: {
  id: string
  aiFeedback: {
    gaps: string[] // 知识盲点
    suggestions: string[] // 改进建议
    score: number // 0-100
  }
}
```

#### 获取 AI 反馈
```typescript
POST /api/feynman/feedback

Request: {
  concept: string
  explanation: string
}

Response: {
  gaps: string[]
  suggestions: string[]
  score: number
  simplifications: string[] // 简化建议
}
```

### 3.3 复习计划 API

#### 生成复习计划
```typescript
POST /api/review/schedule

Request: {
  contentId: string
  learnedAt: number // 学习时间戳
}

Response: {
  schedules: [
    {
      round: number
      scheduledAt: number
    }
  ]
}
```

#### 获取待复习内容
```typescript
GET /api/review/due

Response: {
  reviews: [
    {
      id: string
      contentId: string
      contentTitle: string
      round: number
      scheduledAt: number
    }
  ]
}
```

#### 完成复习
```typescript
POST /api/review/complete

Request: {
  reviewId: string
  effectiveness: number // 1-5
}

Response: {
  success: boolean
  nextReviewAt: number
}
```

### 3.4 卡片盒笔记 API

#### 创建笔记
```typescript
POST /api/zettelkasten/notes

Request: {
  title: string
  content: string
  tags: string[]
}

Response: {
  id: string
  note: object
}
```

#### 创建链接
```typescript
POST /api/zettelkasten/links

Request: {
  fromNoteId: string
  toNoteId: string
  linkType: 'related' | 'parent' | 'child' | 'reference'
}

Response: {
  success: boolean
  link: object
}
```

#### 获取知识图谱
```typescript
GET /api/zettelkasten/graph

Response: {
  nodes: [
    { id: string, title: string, tags: string[] }
  ]
  edges: [
    { from: string, to: string, type: string }
  ]
}
```

### 3.5 康奈尔笔记 API

#### 创建康奈尔笔记
```typescript
POST /api/cornell/notes

Request: {
  contentId: string
  mainNotes: string
  cues?: string
  summary?: string
}

Response: {
  id: string
  note: object
}
```

#### AI 生成线索和总结
```typescript
POST /api/cornell/generate

Request: {
  mainNotes: string
}

Response: {
  cues: string // 关键词和问题
  summary: string // 总结
}
```

### 3.6 番茄钟 API

#### 开始番茄钟
```typescript
POST /api/pomodoro/start

Request: {
  contentId?: string
  duration: number // 秒
  sessionType: 'work' | 'short_break' | 'long_break'
}

Response: {
  id: string
  startTime: number
  endTime: number
}
```

#### 完成番茄钟
```typescript
POST /api/pomodoro/complete

Request: {
  sessionId: string
  notes?: string
}

Response: {
  success: boolean
  session: object
}
```

#### 获取统计
```typescript
GET /api/pomodoro/stats?startDate={date}&endDate={date}

Response: {
  totalSessions: number
  totalDuration: number
  completionRate: number
  dailyStats: [
    { date: string, sessions: number, duration: number }
  ]
}
```

### 3.7 闪卡 API

#### 创建闪卡
```typescript
POST /api/flashcards

Request: {
  contentId?: string
  front: string
  back: string
  tags?: string[]
}

Response: {
  id: string
  flashcard: object
}
```

#### 获取待复习闪卡
```typescript
GET /api/flashcards/due

Response: {
  flashcards: [
    {
      id: string
      front: string
      back: string
      nextReviewAt: number
    }
  ]
}
```

#### 提交复习结果
```typescript
POST /api/flashcards/review

Request: {
  flashcardId: string
  quality: number // 0-5
  timeSpent: number // 秒
}

Response: {
  success: boolean
  nextReviewAt: number
  interval: number
}
```

## 4. 前端组件设计

### 4.1 学习方法选择器
```typescript
<LearningMethodSelector
  planId={string}
  selectedMethods={string[]}
  onChange={(methods) => void}
/>
```

### 4.2 费曼学习工具
```typescript
<FeynmanTool
  contentId={string}
  concept={string}
  onSave={(explanation) => void}
/>

// 子组件
<FeynmanEditor
  value={string}
  onChange={(value) => void}
/>

<AIStudentDialog
  explanation={string}
  onQuestion={(question) => void}
/>

<FeedbackPanel
  gaps={string[]}
  suggestions={string[]}
  score={number}
/>
```

### 4.3 复习系统
```typescript
<ReviewCalendar
  reviews={Review[]}
  onReviewClick={(review) => void}
/>

<ReviewCard
  content={Content}
  round={number}
  onComplete={(effectiveness) => void}
/>

<ReviewReminder
  dueReviews={Review[]}
  onDismiss={() => void}
/>
```

### 4.4 卡片盒笔记
```typescript
<ZettelkastenEditor
  noteId={string}
  onSave={(note) => void}
/>

<KnowledgeGraph
  notes={Note[]}
  links={Link[]}
  onNodeClick={(noteId) => void}
/>

<NoteLinkDialog
  fromNoteId={string}
  onLink={(toNoteId, linkType) => void}
/>
```

### 4.5 康奈尔笔记
```typescript
<CornellNoteEditor
  contentId={string}
  onSave={(note) => void}
/>

// 三栏布局
<CornellLayout>
  <CuesColumn />
  <MainNotesColumn />
  <SummaryRow />
</CornellLayout>
```

### 4.6 番茄钟
```typescript
<PomodoroTimer
  duration={number}
  onComplete={() => void}
/>

<PomodoroStats
  sessions={Session[]}
  dateRange={[Date, Date]}
/>

<FocusMode
  isActive={boolean}
  onToggle={() => void}
/>
```

### 4.7 闪卡系统
```typescript
<FlashcardCreator
  contentId={string}
  onSave={(flashcard) => void}
/>

<FlashcardReviewer
  flashcards={Flashcard[]}
  onReview={(id, quality) => void}
/>

<FlashcardStats
  totalCards={number}
  dueCards={number}
  masteredCards={number}
/>
```

## 5. 算法实现

### 5.1 艾宾浩斯复习算法
```typescript
function generateReviewSchedule(learnedAt: number): ReviewSchedule[] {
  const intervals = [
    20 * 60,        // 20 分钟
    24 * 60 * 60,   // 1 天
    2 * 24 * 60 * 60,   // 2 天
    4 * 24 * 60 * 60,   // 4 天
    7 * 24 * 60 * 60,   // 7 天
    15 * 24 * 60 * 60,  // 15 天
    30 * 24 * 60 * 60,  // 30 天
  ]
  
  return intervals.map((interval, index) => ({
    round: index + 1,
    scheduledAt: learnedAt + interval * 1000,
  }))
}
```

### 5.2 SM-2 间隔重复算法
```typescript
interface SM2Result {
  easinessFactor: number
  repetitions: number
  interval: number
  nextReviewAt: number
}

function calculateSM2(
  quality: number, // 0-5
  easinessFactor: number,
  repetitions: number,
  interval: number
): SM2Result {
  // 更新难度因子
  let newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEF = Math.max(1.3, newEF) // 最小值 1.3
  
  // 更新重复次数和间隔
  let newRepetitions = repetitions
  let newInterval = interval
  
  if (quality < 3) {
    // 回忆失败，重置
    newRepetitions = 0
    newInterval = 0
  } else {
    newRepetitions += 1
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEF)
    }
  }
  
  const nextReviewAt = Date.now() + newInterval * 24 * 60 * 60 * 1000
  
  return {
    easinessFactor: newEF,
    repetitions: newRepetitions,
    interval: newInterval,
    nextReviewAt,
  }
}
```

### 5.3 费曼解释评分算法
```typescript
async function evaluateFeynmanExplanation(
  concept: string,
  explanation: string
): Promise<{
  gaps: string[]
  suggestions: string[]
  score: number
}> {
  const prompt = `
作为一位教育专家，请评估以下费曼学习法解释：

概念：${concept}
解释：${explanation}

请从以下维度评估：
1. 是否用简单的语言解释？
2. 是否包含具体例子？
3. 是否有类比说明？
4. 逻辑是否清晰？
5. 是否有知识盲点？

请返回 JSON 格式：
{
  "gaps": ["盲点1", "盲点2"],
  "suggestions": ["建议1", "建议2"],
  "score": 85
}
`
  
  const response = await aiClient.chat({
    messages: [{ role: 'user', content: prompt }],
  })
  
  return JSON.parse(response)
}
```

## 6. UI/UX 设计

### 6.1 学习方法入口
- 在学习计划详情页添加"学习方法"标签页
- 提供方法卡片展示和快速启动
- 使用图标和颜色区分不同方法

### 6.2 费曼学习界面
- 左侧：解释编辑器
- 右侧：AI 反馈面板
- 底部：历史版本对比

### 6.3 复习日历
- 月视图显示复习计划
- 不同颜色表示复习轮次
- 点击日期查看详情

### 6.4 知识图谱
- 力导向图布局
- 节点大小表示笔记重要性
- 边的粗细表示链接强度
- 支持缩放和拖拽

### 6.5 番茄钟界面
- 大号计时器显示
- 进度环动画
- 简洁的控制按钮
- 统计图表展示

### 6.6 闪卡界面
- 卡片翻转动画
- 滑动手势支持
- 质量评分按钮
- 进度指示器

## 7. 性能优化

### 7.1 数据库优化
- 为常用查询添加索引
- 使用分页加载大量数据
- 缓存复习计划

### 7.2 前端优化
- 虚拟滚动（知识图谱、闪卡列表）
- 懒加载组件
- 防抖和节流
- Service Worker 缓存

### 7.3 算法优化
- 批量计算复习计划
- 异步处理 AI 请求
- 本地缓存 AI 反馈

## 8. 测试策略

### 8.1 单元测试
- 复习算法测试
- SM-2 算法测试
- 日期计算测试

### 8.2 集成测试
- API 端到端测试
- 数据库操作测试
- AI 集成测试

### 8.3 E2E 测试
- 用户流程测试
- 跨浏览器测试
- 移动端测试

## 9. 部署和监控

### 9.1 部署
- Cloudflare Pages 部署
- 数据库迁移脚本
- 环境变量配置

### 9.2 监控
- 复习提醒成功率
- API 响应时间
- 用户使用率
- 错误日志

## 10. 未来扩展

### 10.1 社交功能
- 分享费曼解释
- 协作笔记
- 学习小组

### 10.2 AI 增强
- 个性化学习建议
- 自动生成闪卡
- 智能复习优化

### 10.3 数据分析
- 学习效果分析
- 记忆曲线可视化
- 学习习惯洞察
