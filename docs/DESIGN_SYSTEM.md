# 设计系统文档

## 设计风格

### Claymorphism

本项目采用 Claymorphism 设计风格，特点如下：

- **柔和的 3D 效果**：营造立体感
- **厚边框**：3-4px 边框增强视觉层次
- **双层阴影**：内阴影 + 外阴影
- **圆角**：16-24px 圆角
- **友好感**：适合教育场景

## 配色方案

### 主色调

```css
/* 青绿色（学习与成长） */
--color-primary: #0D9488;        /* teal-600 */
--color-primary-light: #14B8A6;  /* teal-500 */
--color-primary-dark: #0F766E;   /* teal-700 */
```

### 辅助色

```css
/* 亮青色 */
--color-secondary: #2DD4BF;      /* cyan-400 */
```

### CTA 按钮

```css
/* 橙色 */
--color-cta: #EA580C;            /* orange-600 */
--color-cta-hover: #C2410C;      /* orange-700 */
```

### 背景色

```css
/* 浅青色背景 */
--color-bg: #F0FDFA;             /* teal-50 */
--color-bg-card: rgba(255, 255, 255, 0.8);
```

### 文字色

```css
/* 深青色文字 */
--color-text: #134E4A;           /* teal-900 */
--color-text-secondary: #0F766E; /* teal-700 */
--color-text-muted: #5EEAD4;     /* teal-300 */
```

### 边框

```css
/* 白色半透明边框 */
--color-border: rgba(255, 255, 255, 0.2);
--color-border-light: #99F6E4;   /* teal-200 */
```

## 字体系统

### 主字体

```css
font-family: 'Baloo 2', 'Comic Neue', system-ui, sans-serif;
```

- **Baloo 2**：友好、圆润、教育感
- **Comic Neue**：轻松、活泼

### 代码字体

```css
font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
```

### 字体大小

| 用途 | 大小 | Tailwind 类 |
|------|------|-------------|
| H1 | 2.25rem (36px) | text-4xl |
| H2 | 1.875rem (30px) | text-3xl |
| H3 | 1.5rem (24px) | text-2xl |
| H4 | 1.25rem (20px) | text-xl |
| 正文 | 1rem (16px) | text-base |
| 小字 | 0.875rem (14px) | text-sm |

## 阴影效果

### 外部阴影（Claymorphism）

```css
/* 标准外阴影 */
box-shadow: 
  4px 4px 8px rgba(0, 0, 0, 0.1),
  -2px -2px 6px rgba(255, 255, 255, 0.8);

/* Tailwind 类 */
shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]
```

### 内部阴影（按下状态）

```css
/* 按下效果 */
box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1);

/* Tailwind 类 */
active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]
```

### 输入框阴影

```css
/* 内嵌阴影 */
box-shadow: 
  inset 2px 2px 4px rgba(0, 0, 0, 0.05),
  2px 2px 6px rgba(255, 255, 255, 0.8);

/* Tailwind 类 */
shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),2px_2px_6px_rgba(255,255,255,0.8)]
```

## 圆角

| 用途 | 大小 | Tailwind 类 |
|------|------|-------------|
| 小按钮 | 12px | rounded-xl |
| 卡片 | 16px | rounded-2xl |
| 对话框 | 24px | rounded-3xl |
| 圆形 | 50% | rounded-full |

## 边框

### 标准边框

```css
/* 3-4px 厚边框 */
border: 3px solid rgba(255, 255, 255, 0.5);

/* Tailwind 类 */
border-[3px] border-white/50
border-4 border-white/50
```

### 渐变边框

```css
/* 使用伪元素实现渐变边框 */
position: relative;
background: linear-gradient(135deg, #0D9488, #2DD4BF);
```

## 按钮样式

### 主按钮

```css
/* 渐变色按钮 */
background: linear-gradient(to bottom right, #14B8A6, #2DD4BF);
border: 4px solid rgba(255, 255, 255, 0.5);
border-radius: 16px;
padding: 12px 24px;
box-shadow: 
  4px 4px 8px rgba(0, 0, 0, 0.1),
  -2px -2px 6px rgba(255, 255, 255, 0.8);

/* Tailwind 类 */
bg-gradient-to-br from-teal-500 to-cyan-500
border-4 border-white/50
rounded-2xl
px-6 py-3
shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]
```

### 悬停效果

```css
/* 悬停放大 */
transform: scale(1.05);
background: linear-gradient(to bottom right, #0F766E, #14B8A6);

/* Tailwind 类 */
hover:scale-105
hover:from-teal-600 hover:to-cyan-600
```

### 按下效果

```css
/* 内阴影 */
box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1);

/* Tailwind 类 */
active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]
```

### 次要按钮

```css
/* 白色背景 */
background: rgba(255, 255, 255, 0.8);
border: 4px solid rgba(255, 255, 255, 0.5);
color: #134E4A;

/* Tailwind 类 */
bg-white/80
border-4 border-white/50
text-slate-700
```

## 输入框样式

### 标准输入框

```css
/* 内嵌效果 */
background: rgba(255, 255, 255, 0.9);
border: 4px solid rgba(255, 255, 255, 0.5);
border-radius: 16px;
padding: 16px 20px;
box-shadow: 
  inset 2px 2px 4px rgba(0, 0, 0, 0.05),
  2px 2px 6px rgba(255, 255, 255, 0.8);

/* Tailwind 类 */
bg-white/90
border-4 border-white/50
rounded-2xl
px-5 py-4
shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),2px_2px_6px_rgba(255,255,255,0.8)]
```

### 聚焦状态

```css
/* 边框变色 + 外发光 */
border-color: #14B8A6;
box-shadow: 
  inset 2px 2px 6px rgba(13, 148, 136, 0.1),
  0 0 0 3px rgba(13, 148, 136, 0.1);

/* Tailwind 类 */
focus:border-teal-400
focus:shadow-[inset_2px_2px_6px_rgba(13,148,136,0.1),0_0_0_3px_rgba(13,148,136,0.1)]
```

## 卡片样式

### 标准卡片

```css
/* 毛玻璃效果 */
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
border: 4px solid rgba(255, 255, 255, 0.5);
border-radius: 24px;
box-shadow: 
  8px 8px 16px rgba(0, 0, 0, 0.1),
  -8px -8px 16px rgba(255, 255, 255, 0.9);

/* Tailwind 类 */
bg-white/80
backdrop-blur-md
border-4 border-white/50
rounded-3xl
shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)]
```

### 悬停效果

```css
/* 轻微放大 */
transform: scale(1.02);
box-shadow: 
  12px 12px 24px rgba(0, 0, 0, 0.15),
  -12px -12px 24px rgba(255, 255, 255, 0.9);

/* Tailwind 类 */
hover:scale-[1.02]
hover:shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)]
```

## 过渡动画

### 标准过渡

```css
/* 200ms 平滑过渡 */
transition: all 200ms ease-out;

/* Tailwind 类 */
transition-all duration-200
```

### 常用过渡属性

| 属性 | 时长 | 缓动函数 |
|------|------|----------|
| 颜色 | 150ms | ease-out |
| 变换 | 200ms | ease-out |
| 阴影 | 200ms | ease-out |
| 透明度 | 150ms | ease-out |

## 响应式设计

### 断点

| 断点 | 宽度 | Tailwind 前缀 |
|------|------|---------------|
| 移动端 | < 768px | (默认) |
| 平板 | ≥ 768px | md: |
| 桌面 | ≥ 1024px | lg: |
| 大屏 | ≥ 1440px | xl: |

### 响应式示例

```html
<!-- 移动端单列，桌面端双列 -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- 内容 -->
</div>

<!-- 移动端隐藏，桌面端显示 -->
<div class="hidden md:block">
  <!-- 内容 -->
</div>
```

## 可访问性

### 颜色对比度

- 正文文字：≥ 4.5:1
- 大文字（18px+）：≥ 3:1
- UI 组件：≥ 3:1

### 键盘导航

```css
/* 聚焦状态 */
:focus-visible {
  outline: 2px solid #0D9488;
  outline-offset: 2px;
}
```

### 动画偏好

```css
/* 尊重用户动画偏好 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 图标

### 图标库

使用 Lucide React：
```bash
npm install lucide-react
```

### 图标大小

| 用途 | 大小 | Tailwind 类 |
|------|------|-------------|
| 小图标 | 16px | w-4 h-4 |
| 标准图标 | 20px | w-5 h-5 |
| 大图标 | 24px | w-6 h-6 |
| 超大图标 | 32px | w-8 h-8 |

### 图标颜色

```css
/* 主色调图标 */
color: #0D9488;

/* Tailwind 类 */
text-primary
```

## 间距系统

### 标准间距

| 用途 | 大小 | Tailwind 类 |
|------|------|-------------|
| 极小 | 4px | gap-1, p-1, m-1 |
| 小 | 8px | gap-2, p-2, m-2 |
| 标准 | 16px | gap-4, p-4, m-4 |
| 大 | 24px | gap-6, p-6, m-6 |
| 超大 | 32px | gap-8, p-8, m-8 |

### 布局间距

```html
<!-- 卡片内边距 -->
<div class="p-6">
  <!-- 内容 -->
</div>

<!-- 元素间距 -->
<div class="space-y-4">
  <!-- 子元素 -->
</div>

<!-- 网格间距 -->
<div class="grid grid-cols-2 gap-4">
  <!-- 网格项 -->
</div>
```

## 组件示例

### 对话框

```html
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
  <div class="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-3xl shadow-[8px_8px_20px_rgba(0,0,0,0.15),-4px_-4px_12px_rgba(255,255,255,0.9)] w-full max-w-2xl border-4 border-white/50">
    <!-- 对话框内容 -->
  </div>
</div>
```

### 按钮组

```html
<div class="flex gap-4">
  <button class="flex-1 px-6 py-4 rounded-2xl border-4 border-white/50 bg-white/80 text-slate-700 font-bold shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)] hover:scale-[1.02] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 cursor-pointer">
    取消
  </button>
  <button class="flex-1 px-6 py-4 rounded-2xl border-4 border-white/50 bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)] hover:scale-[1.02] hover:from-teal-600 hover:to-cyan-600 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 cursor-pointer">
    确认
  </button>
</div>
```

## 最佳实践

### 1. 保持一致性
- 使用统一的圆角大小
- 使用统一的边框粗细
- 使用统一的阴影效果

### 2. 适度使用效果
- 不要过度使用阴影
- 不要过度使用动画
- 保持视觉层次清晰

### 3. 性能优化
- 使用 CSS 变量
- 避免复杂的阴影
- 使用 `will-change` 优化动画

### 4. 可访问性优先
- 确保足够的颜色对比度
- 提供键盘导航支持
- 添加 ARIA 标签

## 参考资源

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Claymorphism 设计指南](https://hype4.academy/articles/design/claymorphism-in-user-interfaces)
- [Web 可访问性指南](https://www.w3.org/WAI/WCAG21/quickref/)
