/**
 * 编辑器测试页面
 * 类似 Notion 的文档编辑器：左侧文档树 + 右侧编辑区域
 */

"use client"

import * as React from "react"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { DocumentTree, DocumentNode } from "@/components/editor/document-tree"
import { ContentOutline } from "@/components/editor/content-outline"
import { AIGenerateDialog, type GenerateParams } from "@/components/editor/ai-generate-dialog"
import { ConfiguredModelSelector } from "@/components/ai/configured-model-selector"
import { type Editor } from "@tiptap/react"
import { Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast-container"

export default function TestEditorPage() {
  const [editorInstance, setEditorInstance] = React.useState<Editor | null>(null)
  const [isAIDialogOpen, setIsAIDialogOpen] = React.useState(false)
  const [aiParentDocId, setAIParentDocId] = React.useState<string | undefined>()
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [selectedModelId, setSelectedModelId] = React.useState<string>('')
  const toast = useToast()
  // 文档数据结构：包含标题和内容
  const [documentContents, setDocumentContents] = React.useState<Record<string, { title: string; content: string }>>({
    "1": {
      title: "快速开始",
      content: `<h2>欢迎使用文档编辑器</h2>
<p>这是一个类似飞书的文档编辑器，具有以下特点：</p>
<ul>
  <li>左侧文档树，支持父子嵌套</li>
  <li>输入 <code>/</code> 打开命令菜单</li>
  <li>支持拖拽上传图片、视频</li>
  <li>支持数学公式、代码块</li>
</ul>`,
    },
    "1-1": {
      title: "什么是斜杠命令",
      content: `<h2>斜杠命令</h2>
<p>在编辑器中输入 <code>/</code> 就会弹出命令菜单，你可以：</p>
<ul>
  <li>输入 <code>/标题</code> 插入标题</li>
  <li>输入 <code>/列表</code> 插入列表</li>
  <li>输入 <code>/代码</code> 插入代码块</li>
  <li>输入 <code>/图片</code> 插入图片</li>
</ul>`,
    },
    "1-2": {
      title: "如何使用编辑器",
      content: `<h2>使用指南</h2>
<p>点击左侧文档树切换文档，选中文本会显示浮动工具栏。</p>`,
    },
    "2": {
      title: "功能介绍",
      content: `<h2>功能介绍</h2>
<p>编辑器支持丰富的功能...</p>`,
    },
    "2-1": {
      title: "文本格式",
      content: `<h2>文本格式</h2>
<p>支持<strong>粗体</strong>、<em>斜体</em>、<s>删除线</s>等格式。</p>`,
    },
    "2-2": {
      title: "媒体上传",
      content: `<h2>媒体上传</h2>
<p>支持拖拽上传图片和视频。</p>`,
    },
    "2-3": {
      title: "代码块",
      content: `<h2>代码块</h2>
<p>支持语法高亮的代码块。</p>`,
    },
    "3": {
      title: "示例文档",
      content: `<h2>示例文档</h2>
<p>这是一个示例文档。</p>`,
    },
  })

  const [documents, setDocuments] = React.useState<DocumentNode[]>([
    {
      id: "1",
      title: "快速开始",
      children: [
        { id: "1-1", title: "什么是斜杠命令" },
        { id: "1-2", title: "如何使用编辑器" },
      ],
    },
    {
      id: "2",
      title: "功能介绍",
      children: [
        { id: "2-1", title: "文本格式" },
        { id: "2-2", title: "媒体上传" },
        { id: "2-3", title: "代码块" },
      ],
    },
    {
      id: "3",
      title: "示例文档",
    },
  ])

  const [activeDocId, setActiveDocId] = React.useState("1")

  // 获取当前文档的标题和内容
  const currentDoc = documentContents[activeDocId] || { title: "", content: "" }

  // 同步文档树的标题和 documentContents 中的标题
  const documentsWithTitles = React.useMemo(() => {
    const updateTitles = (nodes: DocumentNode[]): DocumentNode[] => {
      return nodes.map((node) => ({
        ...node,
        title: documentContents[node.id]?.title || node.title,
        children: node.children ? updateTitles(node.children) : undefined,
      }))
    }
    return updateTitles(documents)
  }, [documents, documentContents])

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
        content: "",
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
      // 调用 AI 生成 API
      const response = await fetch('/api/learning-outline/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: params.topic,
          goal: params.goal,
          level: params.level,
          modelId: selectedModelId, // 传递 modelId 给后端
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

      toast.success('AI 生成成功！')
    } catch (error) {
      console.error('AI generation failed:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [selectedModelId, toast])

  // 打开 AI 生成对话框
  const openAIDialog = React.useCallback((parentId?: string) => {
    setAIParentDocId(parentId)
    setIsAIDialogOpen(true)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          文档编辑器
        </h1>
        
        <div className="flex items-center gap-4">
          {/* 模型选择器 */}
          <ConfiguredModelSelector
            value={selectedModelId}
            onChange={setSelectedModelId}
          />
          
          {/* AI 生成按钮 */}
          <button
            type="button"
            onClick={() => openAIDialog()}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI 生成内容
              </>
            )}
          </button>
        </div>
      </div>

      {/* 主体区域：文档树 + 编辑器 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文档树 */}
        <DocumentTree
          documents={documents}
          activeDocId={activeDocId}
          onDocumentSelect={setActiveDocId}
          onDocumentAdd={handleDocumentAdd}
          onDocumentDelete={handleDocumentDelete}
          onAIGenerate={openAIDialog}
        />

        {/* 右侧编辑器 */}
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
      />
    </div>
  )
}
