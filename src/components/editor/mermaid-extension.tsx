/**
 * Mermaid 图表扩展
 * 支持在编辑器中渲染 Mermaid 图表
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import * as React from 'react'
import mermaid from 'mermaid'
import { Maximize2, Edit, Trash2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
  sequence: {
    useMaxWidth: true,
  },
  gantt: {
    useMaxWidth: true,
  },
})

const MermaidNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected }) => {
  const [svg, setSvg] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')
  const [isEditing, setIsEditing] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [editContent, setEditContent] = React.useState(node.attrs.content)
  const [scale, setScale] = React.useState(1) // 全屏默认缩放
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const renderDiagram = async () => {
      if (!node.attrs.content) {
        setSvg('')
        return
      }

      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`
        const { svg: renderedSvg } = await mermaid.render(id, node.attrs.content)
        
        // 解析并修复 SVG（Mermaid 9.1.7+ 移除了 height 属性）
        const parser = new DOMParser()
        const doc = parser.parseFromString(renderedSvg, 'image/svg+xml')
        const svgElement = doc.querySelector('svg')
        
        if (svgElement) {
          const viewBox = svgElement.getAttribute('viewBox')
          const height = svgElement.getAttribute('height')
          
          // 如果没有 height 属性，从 viewBox 中提取并调整
          if (viewBox && !height) {
            const [x, y, w, h] = viewBox.split(' ').map(Number)
            
            // x 和 y 都平移到原点
            // viewBox 的 w 和 h 需要根据负坐标调整
            const newX = 0
            const newY = 0
            const newWidth = x < 0 ? Math.abs(x) + w : w
            const newHeight = y < 0 ? Math.abs(y) + h : h
            
            // 更新 viewBox：x 和 y 都平移到 0，w 和 h 调整
            svgElement.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`)
            
            svgElement.removeAttribute('style')
          }
          
          // 使用修复后的 SVG
          const fixedSvg = new XMLSerializer().serializeToString(svgElement)
          setSvg(fixedSvg)
        } else {
          // 如果解析失败，使用原始 SVG
          setSvg(renderedSvg)
        }
        
        setError('')
      } catch (err) {
        console.error('Mermaid 渲染失败:', err)
        setError(err instanceof Error ? err.message : '渲染失败')
      }
    }

    renderDiagram()
  }, [node.attrs.content])

  const handleSave = () => {
    updateAttributes({ content: editContent })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(node.attrs.content)
    setIsEditing(false)
  }

  const handleFullscreen = () => {
    setIsFullscreen(true)
  }

  const handleCloseFullscreen = () => {
    setIsFullscreen(false)
    setScale(1) // 重置缩放
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3)) // 最大 3 倍
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5)) // 最小 0.5 倍
  }

  const handleResetZoom = () => {
    setScale(1)
  }

  // 监听 ESC 键关闭全屏
  React.useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  // 监听鼠标滚轮缩放
  React.useEffect(() => {
    if (!isFullscreen) return

    const handleWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent
      // 按住 Ctrl/Cmd 键时才缩放
      if (wheelEvent.ctrlKey || wheelEvent.metaKey) {
        e.preventDefault()
        const delta = wheelEvent.deltaY > 0 ? -0.1 : 0.1
        setScale(prev => Math.max(0.5, Math.min(3, prev + delta)))
      }
    }

    const container = document.querySelector('.mermaid-diagram-fullscreen')
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [isFullscreen])

  return (
    <NodeViewWrapper className="mermaid-wrapper">
      <div
        ref={containerRef}
        className={`group relative my-4 border-2 rounded-lg transition-all ${
          selected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
        }`}
      >
        {isEditing ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">编辑 Mermaid 图表</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="关闭编辑"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[300px] p-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="输入 Mermaid 图表代码...&#10;&#10;示例：&#10;graph LR&#10;  A[开始] --> B[处理]&#10;  B --> C{判断}&#10;  C -->|是| D[结束]&#10;  C -->|否| B"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                保存
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={deleteNode}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium ml-auto"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                删除图表
              </button>
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <div className="p-4">
                <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="font-semibold mb-2 flex items-center">
                    <span className="text-lg mr-2">⚠️</span>
                    Mermaid 渲染错误
                  </p>
                  <pre className="text-sm whitespace-pre-wrap font-mono bg-red-100 p-2 rounded mt-2">{error}</pre>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    编辑代码
                  </button>
                </div>
              </div>
            ) : svg ? (
              <div className="p-4">
                <div
                  className="mermaid-diagram bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                
                {/* 悬停时显示的操作按钮 */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleFullscreen}
                    className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    title="全屏查看"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={deleteNode}
                    className="p-2 bg-white border border-red-300 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <p className="text-lg mb-2">📊 空的 Mermaid 图表</p>
                  <p className="text-sm">点击下方按钮开始创建图表</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  添加代码
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 全屏模态框 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* 头部工具栏 */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
            <button
              onClick={handleCloseFullscreen}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
              title="退出全屏 (ESC)"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">退出全屏</span>
            </button>
            
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              <h3 className="text-base font-medium text-gray-800">Mermaid 图表</h3>
              {!isEditing && (
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="缩小 (Ctrl + 滚轮)"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-xs text-gray-600 min-w-[3rem] text-center font-medium">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="放大 (Ctrl + 滚轮)"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <button
                    onClick={handleResetZoom}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="重置缩放"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <Edit className="w-4 h-4 inline mr-1" />
              编辑
            </button>
          </div>
          
          {/* 图表内容区域 */}
          {isEditing ? (
            <div className="flex-1 overflow-auto bg-gray-50 p-8">
              <div className="max-w-6xl mx-auto space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">编辑 Mermaid 图表</h3>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[500px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="输入 Mermaid 图表代码...&#10;&#10;示例：&#10;graph LR&#10;  A[开始] --> B[处理]&#10;  B --> C{判断}&#10;  C -->|是| D[结束]&#10;  C -->|否| B"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    保存
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      deleteNode()
                      setIsFullscreen(false)
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium ml-auto"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    删除图表
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-gray-50 p-8">
              <div 
                className="mermaid-diagram-fullscreen w-full h-full flex items-center justify-center"
              >
                <div 
                  className="mermaid-svg-container w-full transition-transform duration-200"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center',
                  }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const MermaidNode = Node.create({
  name: 'mermaid',

  group: 'block',

  atom: true,
  
  selectable: false,

  addAttributes() {
    return {
      content: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const element = node as HTMLElement
          const content = element.getAttribute('data-content')
          return {
            content: content ? decodeURIComponent(content) : element.textContent || '',
          }
        },
      },
      {
        tag: 'pre[class*="language-mermaid"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const element = node as HTMLElement
          const code = element.querySelector('code')
          return {
            content: code?.textContent || element.textContent || '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView)
  },

  addCommands() {
    return {
      setMermaid:
        (content: string) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { content },
          })
        },
    }
  },
})
