# Toast 和确认对话框使用指南

本文档说明如何使用新的 Toast 提示组件和确认对话框替换原生 `alert()`。

## Toast 提示组件

### 基本用法

```typescript
import { useToast } from '@/components/ui/toast-container'

function MyComponent() {
  const toast = useToast()

  const handleSuccess = () => {
    toast.success('操作成功！')
  }

  const handleError = () => {
    toast.error('操作失败，请重试')
  }

  const handleWarning = () => {
    toast.warning('请先输入必填项')
  }

  const handleInfo = () => {
    toast.info('这是一条提示信息')
  }

  return (
    <button onClick={handleSuccess}>显示提示</button>
  )
}
```

### API

- `toast.success(message, duration?)` - 成功提示（绿色）
- `toast.error(message, duration?)` - 错误提示（红色）
- `toast.warning(message, duration?)` - 警告提示（黄色）
- `toast.info(message, duration?)` - 信息提示（蓝色）

参数:
- `message`: 提示文本
- `duration`: 显示时长（毫秒），默认 3000ms

### 替换示例

**替换前:**
```typescript
alert('保存成功！')
alert('请先输入 API Key')
alert('操作失败，请重试')
```

**替换后:**
```typescript
toast.success('保存成功！')
toast.warning('请先输入 API Key')
toast.error('操作失败，请重试')
```

## 确认对话框

### 基本用法

```typescript
import { useConfirm } from '@/components/ui/confirm-dialog'

function MyComponent() {
  const { confirm } = useConfirm()

  const handleDelete = () => {
    confirm({
      title: '确认删除',
      message: '删除后无法恢复，确定要删除吗？',
      type: 'danger',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        // 执行删除操作
        await deleteItem()
        toast.success('删除成功')
      },
      onCancel: () => {
        // 可选：取消时的回调
      }
    })
  }

  return (
    <button onClick={handleDelete}>删除</button>
  )
}
```

### API

```typescript
confirm({
  title: string          // 对话框标题
  message: string        // 提示信息
  type?: 'danger' | 'warning' | 'info'  // 类型，默认 'info'
  confirmText?: string   // 确认按钮文本，默认 '确认'
  cancelText?: string    // 取消按钮文本，默认 '取消'
  onConfirm: () => void | Promise<void>  // 确认回调
  onCancel?: () => void  // 取消回调（可选）
})
```

### 类型说明

- `danger`: 危险操作（红色按钮），如删除
- `warning`: 警告操作（黄色按钮），如覆盖
- `info`: 普通确认（蓝色按钮），如保存

## 批量替换指南

### 1. 查找所有 alert

```bash
grep -r "alert(" src/
```

### 2. 替换步骤

对于每个文件:

1. 添加导入:
```typescript
import { useToast } from '@/components/ui/toast-container'
// 如果需要确认对话框
import { useConfirm } from '@/components/ui/confirm-dialog'
```

2. 在组件中获取 hook:
```typescript
function MyComponent() {
  const toast = useToast()
  const { confirm } = useConfirm()
  // ...
}
```

3. 替换 alert:
- 成功消息 → `toast.success()`
- 错误消息 → `toast.error()`
- 警告/验证 → `toast.warning()`
- 普通提示 → `toast.info()`

### 3. 常见模式

**表单验证:**
```typescript
// 替换前
if (!value) {
  alert('请输入必填项')
  return
}

// 替换后
if (!value) {
  toast.warning('请输入必填项')
  return
}
```

**操作成功:**
```typescript
// 替换前
alert('保存成功！')

// 替换后
toast.success('保存成功！')
```

**操作失败:**
```typescript
// 替换前
alert('操作失败，请重试')

// 替换后
toast.error('操作失败，请重试')
```

**需要确认的操作:**
```typescript
// 替换前
if (window.confirm('确定要删除吗？')) {
  await deleteItem()
}

// 替换后
confirm({
  title: '确认删除',
  message: '删除后无法恢复，确定要删除吗？',
  type: 'danger',
  onConfirm: async () => {
    await deleteItem()
    toast.success('删除成功')
  }
})
```

## 需要替换的文件列表

以下文件包含 `alert()` 调用，需要逐个替换:

1. ✅ `src/app/settings/ai/page.tsx` - 已完成
2. `src/app/learn/new/page.tsx`
3. `src/app/plan/[planId]/page.tsx`
4. `src/components/editor/test-question-dialog.tsx`
5. `src/components/editor/ai-generate-dialog.tsx`
6. `src/components/editor/editor-toolbar.tsx`
7. `src/components/editor/slash-command.tsx`
8. `src/components/test-answer/test-answer-overlay.tsx`

## 注意事项

1. **只在客户端组件中使用**: Toast 和 Confirm 只能在 `'use client'` 组件中使用
2. **异步操作**: `onConfirm` 支持异步函数，会自动显示加载状态
3. **自动关闭**: Toast 默认 3 秒后自动关闭，可以通过 `duration` 参数调整
4. **多个提示**: 可以同时显示多个 Toast，它们会自动堆叠显示
5. **样式一致**: 所有提示都遵循项目的设计规范，无需额外样式调整

## 设计规范

Toast 组件遵循以下设计规范:
- 位置: 固定在右上角
- 动画: 从右侧滑入，淡出消失
- 颜色: 
  - Success: 绿色 (#10B981)
  - Error: 红色 (#EF4444)
  - Warning: 黄色 (#F59E0B)
  - Info: 蓝色 (#3B82F6)
- 圆角: 8px
- 阴影: 使用 shadow-lg
- 图标: 使用 lucide-react 图标库

确认对话框遵循以下设计规范:
- 遮罩: 半透明黑色背景
- 位置: 屏幕居中
- 最大宽度: 28rem (448px)
- 按钮: 右对齐，主按钮在右侧
- 图标: 根据类型显示不同颜色的图标
