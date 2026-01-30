'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-container'
import { Spinner } from '@/components/ui/spinner'

interface Node {
  id: string
  title: string
  tags: string[]
  createdAt: number
}

interface Edge {
  id: string
  from: string
  to: string
  type: string
}

interface KnowledgeGraphProps {
  onNodeClick?: (nodeId: string) => void
}

export function KnowledgeGraph({ onNodeClick }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    loadGraph()
  }, [])

  const loadGraph = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/zettelkasten/graph')
      const result = await response.json() as {
        success: boolean
        data?: { nodes: Node[]; edges: Edge[] }
        error?: string
      }

      if (result.success && result.data) {
        setNodes(result.data.nodes)
        setEdges(result.data.edges)
      } else {
        toast.error(result.error || '加载失败')
      }
    } catch (error) {
      console.error('加载知识图谱失败:', error)
      toast.error('加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 获取所有标签
  const allTags = Array.from(
    new Set(nodes.flatMap(node => node.tags))
  ).sort()

  // 过滤节点
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = !searchTerm || 
      node.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || node.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  // 计算节点的连接数
  const getConnectionCount = (nodeId: string) => {
    return edges.filter(
      edge => edge.from === nodeId || edge.to === nodeId
    ).length
  }

  // 获取相关节点
  const getRelatedNodes = (nodeId: string) => {
    const relatedIds = new Set<string>()
    edges.forEach(edge => {
      if (edge.from === nodeId) relatedIds.add(edge.to)
      if (edge.to === nodeId) relatedIds.add(edge.from)
    })
    return Array.from(relatedIds)
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索笔记..."
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedTag(null)}
              className={!selectedTag ? 'bg-teal-50' : ''}
            >
              全部
            </Button>
            <Button variant="outline" onClick={loadGraph}>
              刷新
            </Button>
          </div>
        </div>

        {/* 标签过滤 */}
        {allTags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">按标签过滤：</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    tag === selectedTag
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">笔记总数</p>
          <p className="text-2xl font-bold text-teal-600">{nodes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">链接总数</p>
          <p className="text-2xl font-bold text-teal-600">{edges.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">标签总数</p>
          <p className="text-2xl font-bold text-teal-600">{allTags.length}</p>
        </Card>
      </div>

      {/* 笔记列表（简化版图谱） */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">笔记网络</h3>
        
        {filteredNodes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>暂无笔记</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNodes.map(node => {
              const connectionCount = getConnectionCount(node.id)
              const relatedNodes = getRelatedNodes(node.id)
              
              return (
                <div
                  key={node.id}
                  onClick={() => onNodeClick?.(node.id)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {node.title}
                      </h4>
                      {node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {node.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-gray-100 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        {connectionCount} 个连接
                        {relatedNodes.length > 0 && (
                          <span className="ml-2">
                            → {relatedNodes.map(id => 
                              nodes.find(n => n.id === id)?.title
                            ).filter(Boolean).join(', ')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="ml-4">
                      <div
                        className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold"
                        style={{
                          fontSize: `${Math.min(24, 12 + connectionCount * 2)}px`
                        }}
                      >
                        {connectionCount}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* 提示信息 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          💡 提示：节点的大小表示连接数量。点击笔记可以查看详情和编辑。
        </p>
      </Card>
    </div>
  )
}
