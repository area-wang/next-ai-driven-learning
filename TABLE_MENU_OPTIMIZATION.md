# 表格工具栏优化说明

## 问题描述

之前的表格工具栏会跟随光标位置显示，导致以下问题：
1. **与文本工具栏冲突**：当在表格中选中文本时，两个工具栏会重叠
2. **位置不稳定**：工具栏跟随光标移动，难以快速找到
3. **视觉混乱**：两个浮动工具栏同时出现，界面杂乱

## 优化方案

### 新的交互方式：固定在表格上方

参考 Notion 的设计，将表格工具栏固定显示在表格的上方：

```
┌─────────────────────────────────────┐
│  表格 ↑ ↓ | ← → | - 🗑 | 删除表格   │  ← 表格工具栏（固定在表格上方）
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  列1  │  列2  │  列3  │             │
├───────┼───────┼───────┤             │
│  数据 │  数据 │  数据 │             │  ← 表格内容
├───────┼───────┼───────┤             │
│  数据 │  数据 │  数据 │             │
└─────────────────────────────────────┘
```

### 优势

1. **避免冲突**：
   - 表格工具栏固定在表格上方
   - 文本工具栏在选中文本上方
   - 两者不会重叠

2. **位置固定**：
   - 工具栏始终在表格上方 60px 处
   - 容易找到和使用
   - 视觉上更清晰

3. **更好的层级**：
   - 表格工具栏 z-index: 40
   - 文本工具栏 z-index: 50
   - 文本工具栏优先级更高

## 实现细节

### 1. 位置计算

```typescript
// 查找表格元素
const tableElement = /* 查找表格 DOM */

if (tableElement) {
  const rect = tableElement.getBoundingClientRect()
  
  // 计算表格相对于视口的位置
  const top = rect.top - 60 // 表格上方 60px
  const left = rect.left
  
  setPosition({ top, left })
}
```

### 2. 工具栏内容

**左侧：标签**
- "表格" 文字标签，表明这是表格工具栏

**中间：操作按钮**
- ↑ ↓：添加行（上方/下方）
- ← →：添加列（左侧/右侧）
- -：删除当前行
- 🗑：删除当前列

**右侧：删除表格**
- "删除表格" 文字按钮，红色高亮

### 3. 样式优化

```typescript
className="fixed z-40 flex items-center gap-1 px-3 py-2 rounded-xl border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-2xl"
```

- `z-40`：低于文本工具栏（z-50）
- `px-3 py-2`：更大的内边距
- 添加了 "表格" 标签
- "删除表格" 使用文字而不是图标

## 使用体验

### 场景 1：编辑表格内容
1. 点击表格中的任意单元格
2. 表格工具栏出现在表格上方
3. 可以添加/删除行列
4. 工具栏位置固定，不会移动

### 场景 2：选中表格中的文本
1. 在表格单元格中选中文本
2. 文本工具栏出现在选中文本上方
3. 表格工具栏仍然在表格上方
4. 两个工具栏不会重叠

### 场景 3：滚动页面
1. 滚动页面时
2. 表格工具栏随着表格移动
3. 始终保持在表格上方 60px 处

## 对比

### 之前的方案 ❌
```
优点：
- 工具栏靠近光标

缺点：
- 与文本工具栏冲突
- 位置不稳定
- 视觉混乱
```

### 现在的方案 ✅
```
优点：
- 避免工具栏冲突
- 位置固定，容易找到
- 视觉清晰
- 类似 Notion 的体验

缺点：
- 需要向上看才能找到工具栏（但这是标准做法）
```

## 技术实现

### 关键代码

```typescript
// 查找表格元素
const tableNode = view.domAtPos(from).node
const tableElement = tableNode.nodeType === 1 
  ? (tableNode as HTMLElement).closest('table')
  : (tableNode.parentElement as HTMLElement)?.closest('table')

if (tableElement) {
  const rect = tableElement.getBoundingClientRect()
  const top = rect.top - 60 // 表格上方 60px
  const left = rect.left
  setPosition({ top, left })
}
```

### 防闪烁

```typescript
style={{
  top: `${position.top}px`,
  left: `${position.left}px`,
  opacity: position.top === 0 && position.left === 0 ? 0 : 1,
  transition: 'opacity 150ms',
}}
```

## 未来优化

1. **响应式设计**：在移动端可以考虑将工具栏放在表格下方
2. **更多功能**：添加合并单元格、单元格背景色等功能
3. **快捷键**：添加键盘快捷键支持表格操作

## 总结

这次优化解决了表格工具栏与文本工具栏冲突的问题，提供了更清晰、更稳定的用户体验。新的交互方式参考了 Notion 等主流编辑器的设计，符合用户习惯。
