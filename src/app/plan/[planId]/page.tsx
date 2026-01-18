/**
 * 学习计划详情页面
 * 类似 Notion 的文档编辑器：左侧文档树 + 右侧编辑区域
 */

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { DocumentTree, DocumentNode } from "@/components/editor/document-tree"
import { ContentOutline } from "@/components/editor/content-outline"
import { AIGenerateDialog, type GenerateParams } from "@/components/editor/ai-generate-dialog"
import { type Editor } from "@tiptap/react"
import { useAIConfig } from "@/hooks/use-ai-config"
import { Sparkles, Loader2, ChevronLeft } from "lucide-react"

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string
  
  const [editorInstance, setEditorInstance] = React.useState<Editor | null>(null)
  const [isAIDialogOpen, setIsAIDialogOpen] = React.useState(false)
  const [aiParentDocId, setAIParentDocId] = React.useState<string | undefined>()
  const [aiMode, setAIMode] = React.useState<'outline' | 'content'>('outline') // 新增：区分生成模式
  const [isGenerating, setIsGenerating] = React.useState(false)
  const { config, getApiKey } = useAIConfig()
  
  // 文档数据结构：包含标题和内容
  const [documentContents, setDocumentContents] = React.useState<Record<string, { title: string; content: string; description?: string }>>({})
  const [documents, setDocuments] = React.useState<DocumentNode[]>([])
  const [activeDocId, setActiveDocId] = React.useState("")
  const [planTitle, setPlanTitle] = React.useState("")
  const [planInfo, setPlanInfo] = React.useState<{
    topic: string
    goal?: string
    level: 'beginner' | 'intermediate' | 'advanced'
  }>({ topic: '', level: 'beginner' })

  // 从数据库加载学习计划数据
  React.useEffect(() => {
    const loadPlanData = async () => {
      try {
        const response = await fetch(`/api/learning-plan/${planId}`)
        if (!response.ok) {
          throw new Error('加载失败')
        }

        const data = await response.json() as {
          plan: {
            id: string
            title: string
            description: string
            topic: string
            goal?: string
            level: string
            status: string
            progress: number
          }
          outlines: any[]
        }

        setPlanTitle(data.plan.title)
        setPlanInfo({
          topic: data.plan.topic,
          goal: data.plan.goal,
          level: data.plan.level as 'beginner' | 'intermediate' | 'advanced',
        })

        // 转换大纲为文档树结构
        const convertOutlineToDocuments = (
          outlineItems: any[]
        ): { nodes: DocumentNode[]; contents: Record<string, { title: string; content: string; description?: string }> } => {
          const nodes: DocumentNode[] = []
          const contents: Record<string, { title: string; content: string; description?: string }> = {}

          outlineItems.forEach((item) => {
            // 创建文档节点
            const node: DocumentNode = {
              id: item.id,
              title: item.title,
            }

            // 处理子项
            if (item.children && item.children.length > 0) {
              const childResult = convertOutlineToDocuments(item.children)
              node.children = childResult.nodes
              Object.assign(contents, childResult.contents)
            }

            nodes.push(node)
            contents[item.id] = {
              title: item.title,
              content: item.content || `<h2>${item.title}</h2><p>${item.description || ''}</p>`,
              description: item.description,
            }
          })

          return { nodes, contents }
        }

        const { nodes, contents } = convertOutlineToDocuments(data.outlines)
        setDocuments(nodes)
        setDocumentContents(contents)

        // 设置第一个文档为活动文档
        if (nodes.length > 0) {
          setActiveDocId(nodes[0].id)
        }
      } catch (error) {
        console.error('Failed to load plan data:', error)
        alert('加载学习计划失败')
      }
    }

    loadPlanData()
  }, [planId])

  // 获取当前文档的标题和内容
  const currentDoc = documentContents[activeDocId] || { title: "", content: "" }

  // 更新文档标题
  const handleTitleChange = React.useCallback((title: string) => {
    setDocumentContents((prev) => ({
      ...prev,
      [activeDocId]: {
        ...prev[activeDocId],
        title,
      },
    }))
  }, [activeDocId])

  // 更新文档内容
  const handleContentChange = React.useCallback((content: string) => {
    setDocumentContents((prev) => ({
      ...prev,
      [activeDocId]: {
        ...prev[activeDocId],
        content,
      },
    }))
  }, [activeDocId])

  const handleDocumentAdd = React.useCallback((parentId?: string) => {
    const newDocId = `doc-${Date.now()}`
    const newDoc: DocumentNode = {
      id: newDocId,
      title: "新文档",
    }

    // 添加新文档的内容
    setDocumentContents((prev) => ({
      ...prev,
      [newDocId]: {
        title: "新文档",
        content: "<p>开始编辑...</p>",
      },
    }))

    if (!parentId) {
      // 添加到根级别
      setDocuments((prev) => [...prev, newDoc])
    } else {
      // 添加到指定父文档下
      const addToParent = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newDoc],
            }
          }
          if (node.children) {
            return {
              ...node,
              children: addToParent(node.children),
            }
          }
          return node
        })
      }
      setDocuments((prev) => addToParent(prev))
    }

    setActiveDocId(newDocId)
  }, [])

  const handleDocumentDelete = React.useCallback((docId: string) => {
    if (!confirm("确定要删除这个文档吗？")) return

    const removeDoc = (nodes: DocumentNode[]): DocumentNode[] => {
      return nodes
        .filter((node) => node.id !== docId)
        .map((node) => ({
          ...node,
          children: node.children ? removeDoc(node.children) : undefined,
        }))
    }

    setDocuments((prev) => removeDoc(prev))

    // 删除文档内容
    setDocumentContents((prev) => {
      const newContents = { ...prev }
      delete newContents[docId]
      return newContents
    })

    // 如果删除的是当前文档，切换到第一个文档
    if (docId === activeDocId && documents.length > 0) {
      setActiveDocId(documents[0].id)
    }
  }, [activeDocId, documents])

  // AI 生成处理函数
  const handleAIGenerate = React.useCallback(async (params: GenerateParams) => {
    setIsGenerating(true)
    try {
      // 添加 API Key（如果有）
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const apiKey = getApiKey(config.provider)
      if (apiKey) {
        headers['x-api-key'] = apiKey
      }

      // 判断是生成章节内容还是生成大纲
      if (params.currentDocId) {
        // 生成章节内容模式
        const response = await fetch('/api/learning-content/generate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            outlineId: params.currentDocId,
            topic: planInfo.topic,
            chapterTitle: params.topic,
            goal: params.goal,
            additionalContext: params.additionalContext,
            level: params.level,
            provider: config.provider,
            model: config.model,
          }),
        })

        if (!response.ok) {
          const error = await response.json() as { error?: string }
          throw new Error(error.error || 'AI 生成失败')
        }

        const data = await response.json() as { content: string; saved: boolean }
        
        // 更新当前文档的内容
        setDocumentContents((prev) => ({
          ...prev,
          [params.currentDocId!]: {
            ...prev[params.currentDocId!],
            content: data.content,
          },
        }))

        alert('章节内容生成成功！')
      } else {
        // 生成大纲模式（原有逻辑）
        const response = await fetch('/api/learning-outline/generate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            topic: params.topic,
            goal: params.goal,
            level: params.level,
            provider: config.provider,
            model: config.model,
          }),
        })

        if (!response.ok) {
          const error = await response.json() as { error?: string }
          throw new Error(error.error || 'AI 生成失败')
        }

        const data = await response.json() as { outline: any[] }
        
        // 转换 AI 生成的大纲为文档树结构
      const convertOutlineToDocuments = (
        outlineItems: any[],
        parentId?: string
      ): { nodes: DocumentNode[]; contents: Record<string, { title: string; content: string }> } => {
        const nodes: DocumentNode[] = []
        const contents: Record<string, { title: string; content: string }> = {}

        outlineItems.forEach((item, index) => {
          const docId = parentId ? `${parentId}-${index + 1}` : `ai-${Date.now()}-${index}`
          
          // 生成文档内容（HTML格式）
          let htmlContent = `<h2>${item.title}</h2>`
          if (item.description) {
            htmlContent += `<p>${item.description}</p>`
          }
          if (item.estimatedTime) {
            htmlContent += `<p><strong>预计学习时间：</strong>${item.estimatedTime}</p>`
          }
          if (item.prerequisites && item.prerequisites.length > 0) {
            htmlContent += `<p><strong>前置知识：</strong></p><ul>`
            item.prerequisites.forEach((prereq: string) => {
              htmlContent += `<li>${prereq}</li>`
            })
            htmlContent += `</ul>`
          }

          // 创建文档节点
          const node: DocumentNode = {
            id: docId,
            title: item.title,
          }

          // 处理子项
          if (item.children && item.children.length > 0) {
            const childResult = convertOutlineToDocuments(item.children, docId)
            node.children = childResult.nodes
            Object.assign(contents, childResult.contents)
          }

          nodes.push(node)
          contents[docId] = {
            title: item.title,
            content: htmlContent,
          }
        })

        return { nodes, contents }
      }

      const { nodes, contents } = convertOutlineToDocuments(data.outline, params.parentDocId)

      // 更新文档树和内容
      if (params.parentDocId) {
        // 添加到指定父文档下
        const addToParent = (docNodes: DocumentNode[]): DocumentNode[] => {
          return docNodes.map((node) => {
            if (node.id === params.parentDocId) {
              return {
                ...node,
                children: [...(node.children || []), ...nodes],
              }
            }
            if (node.children) {
              return {
                ...node,
                children: addToParent(node.children),
              }
            }
            return node
          })
        }
        setDocuments((prev) => addToParent(prev))
      } else {
        // 添加到根级别
        setDocuments((prev) => [...prev, ...nodes])
      }

      // 添加文档内容
      setDocumentContents((prev) => ({
        ...prev,
        ...contents,
      }))

      // 切换到第一个生成的文档
      if (nodes.length > 0) {
        setActiveDocId(nodes[0].id)
      }

      alert('AI 生成成功！')
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [config, getApiKey, planInfo])

  // 打开 AI 生成对话框
  const openAIDialog = React.useCallback((mode: 'outline' | 'content' = 'outline', parentId?: string) => {
    setAIMode(mode)
    setAIParentDocId(parentId)
    setIsAIDialogOpen(true)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* 顶部标题栏 */}
      <div className="flex-shrink-0 border-b-4 border-white/50 bg-white/80 backdrop-blur-md px-6 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 hover:bg-teal-100 rounded-xl transition-all duration-200 cursor-pointer shadow-[2px_2px_4px_rgba(0,0,0,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
              aria-label="返回"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">
              {planTitle || `学习计划 #${planId}`}
            </h1>
          </div>
          
          {/* AI 生成按钮 - Claymorphism 风格 */}
          <button
            type="button"
            onClick={() => openAIDialog('content')}
            disabled={isGenerating || !activeDocId}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl border-4 border-white/50 bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)] hover:scale-105 hover:from-teal-600 hover:to-cyan-600 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                AI 生成内容
              </>
            )}
          </button>
        </div>
      </div>

      {/* 主体区域：文档树 + 编辑器 + 大纲 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文档树 */}
        <DocumentTree
          documents={documents}
          activeDocId={activeDocId}
          onDocumentSelect={setActiveDocId}
          onDocumentAdd={handleDocumentAdd}
          onDocumentDelete={handleDocumentDelete}
          onAIGenerate={(parentId) => openAIDialog('outline', parentId)}
        />

        {/* 中间编辑器 */}
        <TiptapEditor
          title={currentDoc.title}
          content={currentDoc.content}
          onTitleChange={handleTitleChange}
          onChange={handleContentChange}
          showBubbleMenu={true}
          className="flex-1"
          onEditorReady={setEditorInstance}
        />

        {/* 右侧大纲 */}
        <ContentOutline editor={editorInstance} />
      </div>

      {/* AI 生成对话框 */}
      <AIGenerateDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        onGenerate={handleAIGenerate}
        parentDocId={aiParentDocId}
        currentDoc={aiMode === 'content' && activeDocId ? {
          id: activeDocId,
          title: currentDoc.title,
          description: currentDoc.description,
        } : undefined}
        planInfo={planInfo}
      />
    </div>
  )
}
