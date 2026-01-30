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
import { TestQuestionDialog, type GenerateTestParams } from "@/components/editor/test-question-dialog"
import { TestAnswerOverlay } from "@/components/test-answer/test-answer-overlay"
import { DeleteConfirmDialog } from "@/components/editor/delete-confirm-dialog"
import { OutlinePreviewDialog } from "@/components/editor/outline-preview-dialog"
import { ConfiguredModelSelector } from "@/components/ai/configured-model-selector"
import { type Editor } from "@tiptap/react"
import { useAutoSave } from "@/hooks/use-auto-save"
import { Sparkles, Loader2, ChevronLeft, ChevronRight, BookOpen, ClipboardCheck } from "lucide-react"
import { useToast } from "@/components/ui/toast-container"
import { LearningToolsSidebar } from "@/components/learning/learning-tools-sidebar"
import { FeynmanConceptDialog } from "@/components/feynman/feynman-concept-dialog"
import { FlashcardViewDialog } from "@/components/flashcards/flashcard-view-dialog"
import { ReviewScheduleDialog } from "@/components/review/review-schedule-dialog"
import { CornellNoteDialog } from "@/components/cornell/cornell-note-dialog"

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.planId as string
  
  // 辅助函数：递归查找文档节点
  const findDocById = (node: DocumentNode, targetId: string): DocumentNode | null => {
    if (node.id === targetId) {
      return node
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findDocById(child, targetId)
        if (found) return found
      }
    }
    return null
  }
  
  // 辅助函数：将 Markdown 代码块转换为 HTML 代码块
  const convertMarkdownCodeToHtml = (text: string): string => {
    // 匹配 Markdown 代码块：```语言名\n代码\n```
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    
    return text.replace(codeBlockRegex, (match, language, code) => {
      // 转义 HTML 特殊字符
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      
      // 返回 HTML 代码块
      const lang = language || 'plaintext'
      return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`
    })
  }
  
  // 使用 ref 存储编辑器实例，避免闭包问题
  const editorInstanceRef = React.useRef<Editor | null>(null)
  const [isAIDialogOpen, setIsAIDialogOpen] = React.useState(false)
  const [aiParentDocId, setAIParentDocId] = React.useState<string | undefined>()
  const [aiParentDocTitle, setAIParentDocTitle] = React.useState<string | undefined>() // 新增：父文档标题
  const [aiMode, setAIMode] = React.useState<'outline' | 'content'>('outline') // 新增:区分生成模式
  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false)
  const [testParentDocId, setTestParentDocId] = React.useState<string | undefined>()
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isTestGenerating, setIsTestGenerating] = React.useState(false)
  const [isAnswerMode, setIsAnswerMode] = React.useState(false)
  const [isSimilarGenerating, setIsSimilarGenerating] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string; childrenCount: number } | null>(null)
  const [isFeynmanDialogOpen, setIsFeynmanDialogOpen] = React.useState(false)
  const [feynmanConcepts, setFeynmanConcepts] = React.useState<Array<{ name: string; description: string; difficulty: 'easy' | 'medium' | 'hard' }>>([])
  const [isFeynmanGenerating, setIsFeynmanGenerating] = React.useState(false) // 费曼概念生成状态
  const [rightSidebarMode, setRightSidebarMode] = React.useState<'outline' | 'tools'>('outline') // 右侧栏模式
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = React.useState(false) // 右侧栏折叠状态
  const [isFlashcardDialogOpen, setIsFlashcardDialogOpen] = React.useState(false) // 闪卡查看对话框
  const [isFlashcardGenerating, setIsFlashcardGenerating] = React.useState(false) // 闪卡生成状态
  const [generatedFlashcardContentId, setGeneratedFlashcardContentId] = React.useState<string | null>(null) // 记录生成闪卡的文档ID
  const [isReviewDialogOpen, setIsReviewDialogOpen] = React.useState(false) // 复习计划对话框
  const [isCornellDialogOpen, setIsCornellDialogOpen] = React.useState(false) // 康奈尔笔记对话框
  const [selectedModelId, setSelectedModelId] = React.useState<string>('') // 选中的模型 ID
  // 新增：子文档大纲预览相关状态
  const [isOutlinePreviewOpen, setIsOutlinePreviewOpen] = React.useState(false)
  const [previewOutlines, setPreviewOutlines] = React.useState<any[]>([])
  const [isRegeneratingOutline, setIsRegeneratingOutline] = React.useState(false)
  const [currentGenerateParams, setCurrentGenerateParams] = React.useState<any>(null)
  const toast = useToast()
  
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
              isTestDocument: item.isTestDocument || false,  // 读取测试题文档标志
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

        // 尝试从 localStorage 恢复上次打开的文档
        const storageKey = `active-doc-${planId}`
        const savedDocId = localStorage.getItem(storageKey)
        
        // 检查保存的文档 ID 是否存在于当前文档列表中
        const docExists = savedDocId && contents[savedDocId]
        
        if (docExists) {
          // 恢复上次打开的文档
          setActiveDocId(savedDocId)
        } else if (nodes.length > 0) {
          // 如果没有保存的文档或文档不存在，使用第一个文档
          setAndSaveActiveDocId(nodes[0].id)
        }
      } catch (error) {
        console.error('Failed to load plan data:', error)
        toast.error('加载学习计划失败')
      }
    }

    loadPlanData()
  }, [planId])

  // 获取当前文档的标题和内容
  const currentDoc = documentContents[activeDocId] || { title: "", content: "" }

  // 检测是否为测试题文档
  const isTestDocument = React.useMemo(() => {
    return currentDoc.title.includes('测试题') || currentDoc.content.includes('第 1 题')
  }, [currentDoc.title, currentDoc.content])

  // 自动保存当前文档
  useAutoSave(currentDoc.title, currentDoc.content, {
    delay: 2000, // 2秒防抖
    onSave: async ({ title, content }) => {
      if (!activeDocId) return
      
      try {
        const response = await fetch(`/api/learning-outline/${activeDocId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, content }),
        })

        if (!response.ok) {
          throw new Error('保存失败')
        }
      } catch (error) {
        console.error('自动保存失败:', error)
        throw error
      }
    },
    onSuccess: () => {
      // 文档已自动保存
    },
    onError: (error) => {
      console.error('自动保存错误:', error)
    },
  })

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

  // 处理举一反三按钮点击
  const handleSimilarQuestionClick = React.useCallback(async (questionIndex: number) => {
    if (isSimilarGenerating) return
    
    // 检查是否选择了模型
    if (!selectedModelId) {
      toast.warning('请先选择 AI 模型')
      return
    }
    
    setIsSimilarGenerating(true)
    try {
      // 直接从编辑器实例获取最新内容
      const editor = editorInstanceRef.current
      if (!editor) {
        toast.error('编辑器未初始化')
        return
      }

      const currentContent = editor.getHTML()
      
      if (!currentContent) {
        toast.error('无法获取当前文档内容')
        return
      }

      // 解析当前文档，找到指定题目
      const parser = new DOMParser()
      const doc = parser.parseFromString(currentContent, 'text/html')
      const questionHeaders = doc.querySelectorAll('h3')
      
      let questionText = ''
      let questionType: 'choice' | 'fill' | 'short' | 'code' = 'short'
      
      for (const header of Array.from(questionHeaders)) {
        const headerText = header.textContent || ''
        const match = headerText.match(/第\s*(\d+)\s*题/)
        if (match && parseInt(match[1]) === questionIndex) {
          let currentElement = header.nextElementSibling
          while (currentElement && currentElement.tagName !== 'H3' && currentElement.tagName !== 'HR') {
            const text = currentElement.textContent || ''
            if (currentElement.tagName === 'P' && text.includes('题目：')) {
              questionText = text.replace('题目：', '').trim()
            }
            if (text.includes('选项：') || currentElement.tagName === 'UL') {
              questionType = 'choice'
            }
            currentElement = currentElement.nextElementSibling
          }
          break
        }
      }

      if (!questionText) {
        toast.error(`未找到第 ${questionIndex} 题`)
        return
      }

      const response = await fetch('/api/test-answer/generate-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalQuestion: {
            type: questionType,
            question: questionText,
            difficulty: 'medium',
            topic: questionText.substring(0, 50),
          },
          modelId: selectedModelId, // 传递选中的模型 ID
        }),
      })

      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        const errorMessage = errorData.error || '生成失败'
        toast.error(`生成失败：${errorMessage}`)
        return
      }

      const data = await response.json() as {
        question: string
        options?: string[]
        answer: string
        explanation: string
      }

      // 生成相似题目的 HTML 内容 - 使用 details 标签实现可展开收起
      let similarQuestionHTML = `<details open><summary>💡 举一反三</summary><div style="margin-top: 12px; padding: 16px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; border-radius: 8px;">`
      similarQuestionHTML += `<p><strong>题目：</strong>${data.question}</p>`
      
      if (data.options && data.options.length > 0) {
        similarQuestionHTML += `<p><strong>选项：</strong></p>`
        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
        data.options.forEach((option: string, optIndex: number) => {
          // 检查选项是否已经包含标签（如 "A. "）
          const hasLabel = /^[A-H]\.\s/.test(option)
          if (hasLabel) {
            // 如果已经有标签，直接使用
            similarQuestionHTML += `<p>${option}</p>`
          } else {
            // 如果没有标签，添加标签
            similarQuestionHTML += `<p>${optionLabels[optIndex]}. ${option}</p>`
          }
        })
      }
      
      similarQuestionHTML += `<details style="margin-top: 12px;"><summary>💡 答案和解析</summary><div style="margin-top: 8px;">`
      similarQuestionHTML += `<p><strong>答案：</strong>${data.answer}</p>`
      if (data.explanation) {
        similarQuestionHTML += `<p><strong>解析：</strong>${data.explanation}</p>`
      }
      similarQuestionHTML += `</div></details></div></details>`

      // 找到要插入的位置（在当前题目的分隔线之前）
      const docForUpdate = parser.parseFromString(currentContent, 'text/html')
      const headersForUpdate = docForUpdate.querySelectorAll('h3')
      
      let insertPosition = -1
      let foundHeader = false
      
      for (const header of Array.from(headersForUpdate)) {
        const headerText = header.textContent || ''
        const match = headerText.match(/第\s*(\d+)\s*题/)
        if (match && parseInt(match[1]) === questionIndex) {
          foundHeader = true
          // 找到这个题目后面的 HR 标签
          let currentElement = header.nextElementSibling
          while (currentElement) {
            if (currentElement.tagName === 'HR') {
              // 找到 HR 在文档中的位置
              const allElements = Array.from(docForUpdate.body.children)
              insertPosition = allElements.indexOf(currentElement)
              break
            }
            if (currentElement.tagName === 'H3' && currentElement.textContent?.includes('第') && currentElement.textContent?.includes('题')) {
              // 如果遇到下一个题目标题，说明没有 HR，在这里插入
              const allElements = Array.from(docForUpdate.body.children)
              insertPosition = allElements.indexOf(currentElement)
              break
            }
            currentElement = currentElement.nextElementSibling
          }
          break
        }
      }

      if (!foundHeader || insertPosition === -1) {
        toast.error('无法找到插入位置')
        return
      }

      // 在找到的位置之前插入相似题目
      const tempDiv = docForUpdate.createElement('div')
      tempDiv.innerHTML = similarQuestionHTML
      const newDetailsElement = tempDiv.firstElementChild

      if (newDetailsElement) {
        const allElements = Array.from(docForUpdate.body.children)
        const insertBeforeElement = allElements[insertPosition]
        if (insertBeforeElement) {
          docForUpdate.body.insertBefore(newDetailsElement, insertBeforeElement)
        }
      }

      // 使用编辑器 API 更新内容
      const updatedContent = docForUpdate.body.innerHTML
      editor.commands.setContent(updatedContent)
      
      toast.success('相似题目已生成并插入到文档中')
    } catch (error) {
      console.error('生成相似题目失败:', error)
      toast.error('生成失败，请重试')
    } finally {
      setIsSimilarGenerating(false)
    }
  }, [isSimilarGenerating, selectedModelId, editorInstanceRef, toast])

  // 切换文档时保存到 localStorage
  const handleDocumentSelect = React.useCallback((docId: string) => {
    setActiveDocId(docId)
    // 保存到 localStorage
    const storageKey = `active-doc-${planId}`
    localStorage.setItem(storageKey, docId)
  }, [planId])

  // 辅助函数：设置活动文档并保存到 localStorage
  const setAndSaveActiveDocId = React.useCallback((docId: string) => {
    setActiveDocId(docId)
    const storageKey = `active-doc-${planId}`
    localStorage.setItem(storageKey, docId)
  }, [planId])

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

    setAndSaveActiveDocId(newDocId)
  }, [])

  const handleDocumentDelete = React.useCallback((docId: string) => {
    // 查找要删除的文档节点
    let targetDoc: DocumentNode | null = null
    for (const doc of documents) {
      const found = findDocById(doc, docId)
      if (found) {
        targetDoc = found
        break
      }
    }

    if (!targetDoc) {
      return
    }

    // 打开删除确认对话框
    setDeleteTarget({
      id: docId,
      title: targetDoc.title,
      childrenCount: targetDoc.children?.length || 0,
    })
    setDeleteDialogOpen(true)
  }, [documents, findDocById])

  // 确认删除文档
  const confirmDelete = React.useCallback(async (deleteChildren: boolean) => {
    if (!deleteTarget) return

    const { id: docId } = deleteTarget

    try {
      // 调用 API 删除数据库记录
      const response = await fetch(`/api/learning-outline/${docId}?deleteChildren=${deleteChildren}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 从前端状态中移除文档
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
      if (docId === activeDocId) {
        const remainingDocs = removeDoc(documents)
        if (remainingDocs.length > 0) {
          setAndSaveActiveDocId(remainingDocs[0].id)
        }
      }
    } catch (error) {
      console.error('删除文档失败:', error)
      toast.error('删除失败，请重试')
    }
  }, [activeDocId, documents, setAndSaveActiveDocId, deleteTarget, toast])

  // 辅助函数：转换大纲为文档树结构
  const convertOutlineToDocuments = React.useCallback((
    outlineItems: any[]
  ): { nodes: DocumentNode[]; contents: Record<string, { title: string; content: string; description?: string }> } => {
    const nodes: DocumentNode[] = []
    const contents: Record<string, { title: string; content: string; description?: string }> = {}

    outlineItems.forEach((item) => {
      // 创建文档节点
      const node: DocumentNode = {
        id: item.id,
        title: item.title,
        isTestDocument: item.isTestDocument || false,
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
  }, [])

  // AI 生成处理函数
  const handleAIGenerate = React.useCallback(async (params: GenerateParams) => {
    setIsGenerating(true)
    try {
      // 判断是生成章节内容还是生成大纲
      if (params.currentDocId) {
        // 生成章节内容模式
        const response = await fetch('/api/learning-content/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            outlineId: params.currentDocId,
            topic: planInfo.topic,
            chapterTitle: params.topic,
            goal: params.goal,
            additionalContext: params.additionalContext,
            level: params.level,
            modelId: params.modelId, // 传递模型ID给后端
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

        toast.success('章节内容生成成功！')
        setIsAIDialogOpen(false)
      } else {
        // 生成大纲模式 - 显示预览对话框
        const response = await fetch('/api/learning-outline/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId, // 添加 planId
            parentId: params.parentDocId, // 添加 parentId
            topic: params.topic,
            goal: params.goal,
            level: params.level,
            additionalContext: params.additionalContext, // 添加补充描述
            modelId: params.modelId, // 传递模型ID给后端
            depth: params.depth, // 传递层级深度
          }),
        })

        if (!response.ok) {
          const error = await response.json() as { error?: string; details?: string; rawResponse?: string }
          console.error('[AI Generate] API error:', error)
          
          // 构建详细的错误信息
          let errorMessage = error.error || 'AI 生成失败'
          if (error.details) {
            errorMessage += `\n详情: ${error.details}`
          }
          if (error.rawResponse) {
            console.error('[AI Generate] Raw AI response:', error.rawResponse)
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json() as { outlines: any[] }
        
        // 保存生成参数和大纲数据，打开预览对话框
        setCurrentGenerateParams(params)
        setPreviewOutlines(data.outlines)
        setIsAIDialogOpen(false)
        setIsOutlinePreviewOpen(true)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [planInfo, planId, toast])

  // 接受大纲并应用
  const handleAcceptOutline = React.useCallback((mode: 'replace' | 'merge') => {
    if (!previewOutlines || previewOutlines.length === 0) {
      toast.error('没有可应用的大纲')
      return
    }

    // 转换大纲为文档树结构
    const { nodes, contents } = convertOutlineToDocuments(previewOutlines)
    
    if (currentGenerateParams?.parentDocId) {
      // 有父文档：在父文档下添加子文档
      if (mode === 'replace') {
        // 覆盖模式：删除所有已有子文档
        const replaceChildren = (docNodes: DocumentNode[]): DocumentNode[] => {
          return docNodes.map((node) => {
            if (node.id === currentGenerateParams.parentDocId) {
              return {
                ...node,
                children: nodes, // 直接替换
              }
            }
            if (node.children) {
              return {
                ...node,
                children: replaceChildren(node.children),
              }
            }
            return node
          })
        }
        setDocuments((prev) => replaceChildren(prev))
      } else {
        // 智能去重模式：只添加不重复的子文档
        const mergeChildren = (docNodes: DocumentNode[]): DocumentNode[] => {
          return docNodes.map((node) => {
            if (node.id === currentGenerateParams.parentDocId) {
              const existingTitles = new Set((node.children || []).map(c => c.title))
              const newNodes = nodes.filter(n => !existingTitles.has(n.title))
              return {
                ...node,
                children: [...(node.children || []), ...newNodes],
              }
            }
            if (node.children) {
              return {
                ...node,
                children: mergeChildren(node.children),
              }
            }
            return node
          })
        }
        setDocuments((prev) => mergeChildren(prev))
      }
    } else {
      // 根级别
      if (mode === 'replace') {
        setDocuments(nodes)
      } else {
        const existingTitles = new Set(documents.map(d => d.title))
        const newNodes = nodes.filter(n => !existingTitles.has(n.title))
        setDocuments((prev) => [...prev, ...newNodes])
      }
    }
    
    // 添加文档内容
    setDocumentContents((prev) => ({
      ...prev,
      ...contents,
    }))
    
    // 切换到第一个生成的文档
    if (nodes.length > 0) {
      setAndSaveActiveDocId(nodes[0].id)
    }
    
    setIsOutlinePreviewOpen(false)
    toast.success('大纲已应用！')
  }, [previewOutlines, currentGenerateParams, documents, setAndSaveActiveDocId, toast, convertOutlineToDocuments])

  // 重新生成大纲
  const handleRegenerateOutline = React.useCallback(async (feedback: string) => {
    if (!feedback.trim() || !currentGenerateParams) return
    
    setIsRegeneratingOutline(true)
    try {
      const response = await fetch('/api/learning-outline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          parentId: currentGenerateParams.parentDocId,
          topic: currentGenerateParams.topic,
          goal: currentGenerateParams.goal,
          level: currentGenerateParams.level,
          modelId: currentGenerateParams.modelId,
          depth: currentGenerateParams.depth,
          additionalContext: currentGenerateParams.additionalContext 
            ? `${currentGenerateParams.additionalContext}\n\n用户反馈：${feedback}`
            : `用户反馈：${feedback}`,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || '重新生成失败')
      }
      
      const data = await response.json() as { outlines: any[] }
      setPreviewOutlines(data.outlines)
      toast.success('大纲已重新生成')
    } catch (error) {
      console.error('Regenerate failed:', error)
      toast.error(error instanceof Error ? error.message : '重新生成失败')
    } finally {
      setIsRegeneratingOutline(false)
    }
  }, [currentGenerateParams, planId, toast])

  // 打开 AI 生成对话框
  const openAIDialog = React.useCallback((mode: 'outline' | 'content' = 'outline', parentId?: string) => {
    setAIMode(mode)
    setAIParentDocId(parentId)
    
    // 查找父文档标题
    if (parentId) {
      for (const doc of documents) {
        const found = findDocById(doc, parentId)
        if (found) {
          setAIParentDocTitle(found.title)
          break
        }
      }
    } else {
      setAIParentDocTitle(undefined)
    }
    
    setIsAIDialogOpen(true)
  }, [documents, findDocById])

  // 打开测试题生成对话框
  const openTestDialog = React.useCallback((parentId?: string) => {
    setTestParentDocId(parentId)
    setIsTestDialogOpen(true)
  }, [])

  // 生成测试题处理函数
  const handleTestGenerate = React.useCallback(async (params: GenerateTestParams) => {
    setIsTestGenerating(true)
    try {
      // 获取当前文档内容作为上下文
      const currentContent = activeDocId ? documentContents[activeDocId]?.content : undefined

      // 直接调用 API，让后端处理配置
      const response = await fetch('/api/test-questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: params.topic,
          planTopic: planInfo.topic, // 添加学习计划主题
          planGoal: planInfo.goal, // 添加学习计划目标
          currentContent, // 添加当前章节内容
          additionalContext: params.additionalContext, // 添加用户自定义描述
          difficulty: params.difficulty,
          questionCount: params.questionCount,
          questionTypes: params.questionTypes,
          modelId: params.modelId, // 传递模型ID给后端
        }),
      })

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || '生成测试题失败')
      }

      const data = await response.json() as { questions: any[] }

      // 检查当前文档是否是测试题文档
      let currentDoc: DocumentNode | null = null
      if (activeDocId) {
        for (const doc of documents) {
          const found = findDocById(doc, activeDocId)
          if (found) {
            currentDoc = found
            break
          }
        }
      }
      const isCurrentTestDoc = currentDoc?.isTestDocument === true

      if (isCurrentTestDoc && activeDocId) {
        // 如果当前是测试题文档,直接覆盖内容
        
        // 获取当前文档标题(移除"- 测试题"后缀)
        let topicTitle = params.topic
        if (topicTitle.endsWith(' - 测试题')) {
          topicTitle = topicTitle.replace(/ - 测试题$/, '')
        }
        const testDocTitle = `${topicTitle} - 测试题`
        
        // 生成新的测试题内容(完整覆盖)
        let htmlContent = `<h2>${testDocTitle}</h2>`
        htmlContent += `<p><strong>难度：</strong>${params.difficulty === 'easy' ? '简单' : params.difficulty === 'medium' ? '中等' : '困难'}</p>`
        htmlContent += `<p><strong>题型：</strong>${params.questionTypes.map((t) => {
          const typeMap: Record<string, string> = {
            choice: '单选题',
            'multiple-choice': '多选题',
            'true-false': '判断题',
            fill: '填空题',
            short: '简答题',
            essay: '论述题',
            code: '编程题',
            matching: '匹配题',
            ordering: '排序题',
          }
          return typeMap[t] || t
        }).join('、')}</p>`
        htmlContent += `<p><strong>题目数量：</strong>${params.questionCount}</p>`
        htmlContent += `<hr />`
        
        // 添加题目内容
        data.questions.forEach((question, index) => {
          // 添加题目标题，包含题型标记
          htmlContent += `<h3 data-question-type="${question.type || 'short'}">第 ${index + 1} 题 <button type="button" data-similar-question-btn="true" data-question-index="${index + 1}" contenteditable="false"></button></h3>`
          // 转换 Markdown 代码块为 HTML
          const questionHtml = convertMarkdownCodeToHtml(question.question)
          htmlContent += `<div><strong>题目：</strong></div>${questionHtml}`
          if (question.options) {
            htmlContent += `<p><strong>选项：</strong></p>`
            const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
            question.options.forEach((option: string, optIndex: number) => {
              const hasLabel = /^[A-H]\.\s/.test(option)
              if (hasLabel) {
                htmlContent += `<p>${option}</p>`
              } else {
                htmlContent += `<p>${optionLabels[optIndex]}. ${option}</p>`
              }
            })
          }
          
          htmlContent += `<details><summary>💡 答案和解析</summary>`
          if (question.answer) {
            const answerHtml = convertMarkdownCodeToHtml(question.answer)
            htmlContent += `<div><strong>答案：</strong></div>${answerHtml}`
          }
          if (question.explanation) {
            const explanationHtml = convertMarkdownCodeToHtml(question.explanation)
            htmlContent += `<div><strong>解析：</strong></div>${explanationHtml}`
          }
          htmlContent += `</details>`
          htmlContent += `<hr />`
        })
        
        // 更新编辑器内容
        const editor = editorInstanceRef.current
        if (editor) {
          editor.commands.setContent(htmlContent)
        }
        
        // 更新文档标题和内容
        setDocumentContents((prev) => ({
          ...prev,
          [activeDocId]: {
            title: testDocTitle,
            content: htmlContent,
          },
        }))
        
        // 更新文档树中的标题（确保 isTestDocument 标志保持）
        const updateDocTitle = (nodes: DocumentNode[]): DocumentNode[] => {
          return nodes.map((node) => {
            if (node.id === activeDocId) {
              return {
                ...node,
                title: testDocTitle,
                isTestDocument: true, // 确保标志保持
              }
            }
            if (node.children) {
              return {
                ...node,
                children: updateDocTitle(node.children),
              }
            }
            return node
          })
        }
        setDocuments((prev) => updateDocTitle(prev))
        
        // 保存到数据库
        const updateResponse = await fetch(`/api/learning-outline/${activeDocId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: testDocTitle,
            content: htmlContent,
          }),
        })

        if (!updateResponse.ok) {
          throw new Error('保存文档失败')
        }

        // 从 PATCH 响应中获取 contentId
        const updateData = await updateResponse.json() as { success: boolean; contentId?: string }
        const contentId = updateData.contentId

        if (!contentId) {
          toast.error('未能获取内容ID')
          throw new Error('未能获取内容ID')
        }

        // 保存题目到数据库
        await fetch('/api/test-questions/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            questions: data.questions.map((q: any, index: number) => ({
              questionIndex: index + 1,
              questionType: q.type || 'short',
              question: q.question,
              options: q.options ? JSON.stringify(q.options) : null,
              correctAnswer: q.answer || '',
              explanation: q.explanation || '',
              difficulty: params.difficulty,
            })),
          }),
        })
        
        toast.success(`成功生成 ${data.questions.length} 道题目!`)
      } else {
        // 如果不是测试题文档,创建新的子文档
        
        // 移除标题中已有的" - 测试题"后缀，避免重复
        let topicTitle = params.topic
        if (topicTitle.endsWith(' - 测试题')) {
          topicTitle = topicTitle.replace(/ - 测试题$/, '')
        }
        const testDocTitle = `${topicTitle} - 测试题`
        
        // 生成测试题内容（HTML格式，答案默认收起）
        let htmlContent = `<h2>${testDocTitle}</h2>`
        htmlContent += `<p><strong>难度：</strong>${params.difficulty === 'easy' ? '简单' : params.difficulty === 'medium' ? '中等' : '困难'}</p>`
        htmlContent += `<p><strong>题型：</strong>${params.questionTypes.map((t) => {
          const typeMap: Record<string, string> = {
            choice: '单选题',
            'multiple-choice': '多选题',
            'true-false': '判断题',
            fill: '填空题',
            short: '简答题',
            essay: '论述题',
            code: '编程题',
            matching: '匹配题',
            ordering: '排序题',
          }
          return typeMap[t] || t
        }).join('、')}</p>`
        htmlContent += `<p><strong>题目数量：</strong>${params.questionCount}</p>`
        htmlContent += `<hr />`

        // 添加题目内容，答案使用 details 标签收起
        data.questions.forEach((question, index) => {
          // 添加题目标题，包含题型标记
          htmlContent += `<h3 data-question-type="${question.type || 'short'}">第 ${index + 1} 题 <button type="button" data-similar-question-btn="true" data-question-index="${index + 1}" contenteditable="false"></button></h3>`
          // 转换 Markdown 代码块为 HTML
          const questionHtml = convertMarkdownCodeToHtml(question.question)
          htmlContent += `<div><strong>题目：</strong></div>${questionHtml}`
          if (question.options) {
            htmlContent += `<p><strong>选项：</strong></p>`
            const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
            question.options.forEach((option: string, optIndex: number) => {
              // 检查选项是否已经包含标签（如 "A. "）
              const hasLabel = /^[A-H]\.\s/.test(option)
              if (hasLabel) {
                // 如果已经有标签，直接使用
                htmlContent += `<p>${option}</p>`
              } else {
                // 如果没有标签，添加标签
                htmlContent += `<p>${optionLabels[optIndex]}. ${option}</p>`
              }
            })
          }
          
          // 答案和解析使用 details 标签收起（不添加 open 属性，默认收起）
          htmlContent += `<details><summary>💡 答案和解析</summary>`
          if (question.answer) {
            const answerHtml = convertMarkdownCodeToHtml(question.answer)
            htmlContent += `<div><strong>答案：</strong></div>${answerHtml}`
          }
          if (question.explanation) {
            const explanationHtml = convertMarkdownCodeToHtml(question.explanation)
            htmlContent += `<div><strong>解析：</strong></div>${explanationHtml}`
          }
          htmlContent += `</details>`
          htmlContent += `<hr />`
        })

        // 保存到数据库 - 直接创建大纲项
        // 如果当前文档是测试题文档，不要在其下创建子文档，而是在其父级创建
        let currentParentId = params.parentDocId
        if (activeDocId && !isCurrentTestDoc) {
          // 只有当前文档不是测试题文档时，才作为父文档
          currentParentId = activeDocId
        }
        
        try {
          // 创建大纲项
          const createOutlineResponse = await fetch('/api/learning-outline/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              planId,
              parentId: currentParentId,
              title: testDocTitle,
              description: '测试题',
              level: 0,
              order: 0,
              isTestDocument: true,  // 标记为测试题文档
            }),
          })

          let testDocId = `test-${Date.now()}`
          
          if (createOutlineResponse.ok) {
            const createData = await createOutlineResponse.json() as { outline: { id: string } }
            testDocId = createData.outline.id

            // 更新保存的内容
            await fetch(`/api/learning-outline/${testDocId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: testDocTitle,
                content: htmlContent,
              }),
            })
          } else {
            console.error('创建测试题大纲项失败')
          }

          const testDoc: DocumentNode = {
            id: testDocId,
            title: testDocTitle,
            isTestDocument: true,  // 标记为测试题文档
          }

          // 添加文档内容
          setDocumentContents((prev) => ({
            ...prev,
            [testDocId]: {
              title: testDoc.title,
              content: htmlContent,
            },
          }))

          // 添加到文档树 - 作为当前文档的子文档
          if (currentParentId) {
            const addAsChild = (nodes: DocumentNode[]): DocumentNode[] => {
              return nodes.map((node) => {
                if (node.id === currentParentId) {
                  return {
                    ...node,
                    children: [...(node.children || []), testDoc],
                  }
                }
                if (node.children) {
                  return {
                    ...node,
                    children: addAsChild(node.children),
                  }
                }
                return node
              })
            }
            setDocuments((prev) => addAsChild(prev))
          } else {
            // 如果没有当前文档，添加到根级别
            setDocuments((prev) => [...prev, testDoc])
          }

          // 切换到生成的测试题文档
          setAndSaveActiveDocId(testDocId)

          // 保存题目到数据库
          try {
            // 获取 contentId（从 knowledgeContents 表）
            const contentResponse = await fetch(`/api/learning-outline/${testDocId}/content`)
            if (contentResponse.ok) {
              const contentData = await contentResponse.json() as { contentId: string }
              const contentId = contentData.contentId

              // 保存题目到数据库
              await fetch('/api/test-questions/save', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contentId,
                  questions: data.questions.map((q: any, index: number) => ({
                    questionIndex: index + 1,
                    questionType: q.type || 'short',
                    question: q.question,
                    options: q.options ? JSON.stringify(q.options) : null,
                    correctAnswer: q.answer || '',
                    explanation: q.explanation || '',
                    difficulty: params.difficulty,
                  })),
                }),
              })
            } else {
              console.warn('获取内容ID失败，题目未保存到数据库（仅保存HTML）')
            }
          } catch (error) {
            console.error('保存题目到数据库失败:', error)
            console.warn('题目未保存到数据库，但HTML已保存')
          }

          toast.success('测试题生成成功！')
        } catch (error) {
          console.error('保存测试题失败:', error)
          toast.error('保存测试题失败，请重试')
        }
      }
    } catch (error) {
      console.error('Test generation failed:', error)
      throw error
    } finally {
      setIsTestGenerating(false)
    }
  }, [activeDocId, setAndSaveActiveDocId, documentContents, editorInstanceRef, planInfo, toast])

  // 处理学习工具生成
  const handleLearningToolGenerate = React.useCallback(async (toolType: string) => {
    if (!activeDocId || !currentDoc.content) {
      toast.warning('请先选择一个文档')
      return
    }

    try {
      switch (toolType) {
        case 'review': {
          // 创建复习计划
          const reviewResponse = await fetch('/api/review/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId: activeDocId,
            }),
          })
          
          if (!reviewResponse.ok) {
            const errorData = await reviewResponse.json() as { error?: string }
            throw new Error(errorData.error || '创建复习计划失败')
          }
          
          const reviewData = await reviewResponse.json() as { schedules: any[]; message: string }
          toast.success(reviewData.message || '复习计划已创建')
          break
        }

        default:
          toast.warning('未知的学习工具类型')
      }
    } catch (error) {
      console.error('生成失败:', error)
      toast.error(error instanceof Error ? error.message : '生成失败，请重试')
    }
  }, [activeDocId, currentDoc, toast])

  // 处理打开费曼学习法对话框
  const handleOpenFeynmanDialog = React.useCallback(async () => {
    if (!currentDoc.content || currentDoc.content.trim().length < 50) {
      toast.warning('文档内容太少，请先添加更多内容')
      return
    }

    // 设置 loading 状态
    setIsFeynmanGenerating(true)

    try {
      // 先清空旧的概念，确保每次都是重新生成
      setFeynmanConcepts([])
      
      // 清除旧的费曼解释历史记录（因为文档内容已改变，旧的解释不再适用）
      try {
        await fetch(`/api/feynman/clear?contentId=${activeDocId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.warn('清除旧的费曼解释失败:', error)
        // 不影响后续流程
      }

      toast.info('正在从当前文档内容中提取核心概念...')
      
      // 每次都重新从当前文档内容中提取概念
      const conceptsResponse = await fetch('/api/feynman/generate-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentDoc.content,
          title: currentDoc.title,
        }),
      })

      if (!conceptsResponse.ok) {
        throw new Error('提取概念失败')
      }

      const conceptsData = await conceptsResponse.json() as { 
        success: boolean
        data: { 
          concepts: Array<{ 
            name: string
            description: string
            difficulty: 'easy' | 'medium' | 'hard'
          }> 
        } 
      }

      if (conceptsData.success && conceptsData.data.concepts.length > 0) {
        // 设置新提取的概念
        setFeynmanConcepts(conceptsData.data.concepts)
        setIsFeynmanDialogOpen(true)
        toast.success(`成功提取 ${conceptsData.data.concepts.length} 个核心概念`)
      } else {
        toast.error('未能提取到核心概念')
      }
    } catch (error) {
      console.error('提取概念失败:', error)
      toast.error('提取概念失败，请重试')
    } finally {
      // 清除 loading 状态
      setIsFeynmanGenerating(false)
    }
  }, [activeDocId, currentDoc, toast])

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
          
          {/* 按钮组 */}
          <div className="flex items-center gap-3">
            {/* 模型选择器 */}
            <ConfiguredModelSelector
              showLabel={false}
              value={selectedModelId}
              onChange={setSelectedModelId}
            />
            
            <div className="flex items-center gap-2">
              {/* 答题按钮（仅测试题文档显示） */}
              {isTestDocument && (
                <button
                  type="button"
                  onClick={() => setIsAnswerMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  开始答题
                </button>
              )}

              {/* 生成测试题按钮 */}
              <button
                type="button"
                onClick={() => openTestDialog()}
                disabled={isTestGenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isTestGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    生成测试题
                  </>
                )}
              </button>

              {/* AI 生成按钮 */}
              <button
                type="button"
                onClick={() => openAIDialog('content')}
                disabled={isGenerating || !activeDocId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI 生成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主体区域：文档树 + 编辑器 + 右侧栏（大纲/学习工具） */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧文档树 */}
        <DocumentTree
          documents={documents}
          activeDocId={activeDocId}
          onDocumentSelect={handleDocumentSelect}
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
          onEditorReady={(editor) => {
            editorInstanceRef.current = editor
          }}
          onSimilarQuestionClick={handleSimilarQuestionClick}
        />

        {/* 右侧栏：大纲或学习工具（可切换） */}
        <div className="flex flex-col overflow-hidden transition-all duration-300" style={{ width: rightSidebarCollapsed ? '48px' : '320px' }}>
          {/* 切换按钮 - 测试题文档只显示大纲 */}
          {!isTestDocument && !rightSidebarCollapsed && (
            <div className="flex-shrink-0 border-b bg-white/80">
              <div className="flex">
                <button
                  onClick={() => setRightSidebarMode('outline')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    rightSidebarMode === 'outline'
                      ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📋 大纲
                </button>
                <button
                  onClick={() => setRightSidebarMode('tools')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    rightSidebarMode === 'tools'
                      ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🛠️ 学习工具
                </button>
              </div>
            </div>
          )}

          {/* 折叠按钮 */}
          <div className="flex-shrink-0 border-b bg-white/80 px-4 py-3 flex items-center justify-between">
            {!rightSidebarCollapsed && (
              <h2 className="font-semibold text-[var(--color-text)]">
                {isTestDocument || rightSidebarMode === 'outline' ? '大纲' : '学习工具'}
              </h2>
            )}
            <button
              type="button"
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ml-auto"
              aria-label={rightSidebarCollapsed ? "展开右侧栏" : "收起右侧栏"}
            >
              <ChevronRight className={`w-4 h-4 text-[var(--color-text)] transition-transform ${rightSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* 内容区域 - 测试题文档只显示大纲 */}
          {!rightSidebarCollapsed && (
            <div className="flex-1 overflow-hidden bg-white/60 backdrop-blur-sm">
              {isTestDocument || rightSidebarMode === 'outline' ? (
                <ContentOutline editor={editorInstanceRef.current} />
              ) : (
                <LearningToolsSidebar
                  contentId={activeDocId}
                  documentContent={currentDoc.content}
                  documentTitle={currentDoc.title}
                  selectedModelId={selectedModelId}
                  onToolGenerate={handleLearningToolGenerate}
                  onOpenFlashcardDialog={() => setIsFlashcardDialogOpen(true)}
                  onOpenFeynmanDialog={handleOpenFeynmanDialog}
                  onOpenReviewDialog={() => setIsReviewDialogOpen(true)}
                  onOpenCornellDialog={() => setIsCornellDialogOpen(true)}
                  onFlashcardGeneratingChange={setIsFlashcardGenerating}
                  isFeynmanGenerating={isFeynmanGenerating}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI 生成对话框 */}
      <AIGenerateDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        onGenerate={handleAIGenerate}
        parentDocId={aiParentDocId}
        parentDocTitle={aiParentDocTitle}
        currentDoc={aiMode === 'content' && activeDocId ? {
          id: activeDocId,
          title: currentDoc.title,
          description: currentDoc.description,
        } : undefined}
        planInfo={planInfo}
      />

      {/* 测试题生成对话框 */}
      <TestQuestionDialog
        isOpen={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        onGenerate={handleTestGenerate}
        parentDocId={testParentDocId}
        currentDoc={activeDocId ? { id: activeDocId, title: currentDoc.title } : undefined}
      />

      {/* 答题覆盖层 */}
      {isAnswerMode && isTestDocument && (
        <TestAnswerOverlay
          documentContent={currentDoc.content}
          documentId={activeDocId}
          planId={planId}
          modelId={selectedModelId}
          onClose={() => setIsAnswerMode(false)}
          onUpdateContent={handleContentChange}
        />
      )}

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeleteTarget(null)
          }}
          onConfirm={confirmDelete}
          documentTitle={deleteTarget.title}
          childrenCount={deleteTarget.childrenCount}
        />
      )}

      {/* 费曼学习法对话框 */}
      {/* 费曼学习法对话框 - 条件渲染 */}
      {isFeynmanDialogOpen && feynmanConcepts.length > 0 && (
        <FeynmanConceptDialog
          isOpen={isFeynmanDialogOpen}
          onClose={() => setIsFeynmanDialogOpen(false)}
          concepts={feynmanConcepts}
          contentId={activeDocId}
          onSuccess={() => {
            toast.success('费曼解释已保存')
          }}
        />
      )}

      {/* 闪卡查看对话框 - 条件渲染 */}
      {isFlashcardDialogOpen && (
        <FlashcardViewDialog
          isOpen={isFlashcardDialogOpen}
          onClose={() => {
            setIsFlashcardDialogOpen(false)
            setGeneratedFlashcardContentId(null)
            setIsFlashcardGenerating(false)
          }}
          contentId={generatedFlashcardContentId || activeDocId}
          isGenerating={isFlashcardGenerating}
        />
      )}

      {/* 复习计划对话框 - 条件渲染 */}
      {isReviewDialogOpen && (
        <ReviewScheduleDialog
          isOpen={isReviewDialogOpen}
          onClose={() => setIsReviewDialogOpen(false)}
          outlineId={activeDocId}
        />
      )}

      {/* 康奈尔笔记对话框 - 条件渲染 */}
      {isCornellDialogOpen && (
        <CornellNoteDialog
          isOpen={isCornellDialogOpen}
          onClose={() => setIsCornellDialogOpen(false)}
          contentId={activeDocId}
          selectedModelId={selectedModelId}
        />
      )}

      {/* 子文档大纲预览对话框 */}
      {isOutlinePreviewOpen && (
        <OutlinePreviewDialog
          isOpen={isOutlinePreviewOpen}
          onClose={() => {
            setIsOutlinePreviewOpen(false)
            setPreviewOutlines([])
            setCurrentGenerateParams(null)
          }}
          onAccept={handleAcceptOutline}
          onRegenerate={handleRegenerateOutline}
          outlines={previewOutlines}
          isRegenerating={isRegeneratingOutline}
          parentDocTitle={aiParentDocTitle}
          hasExistingChildren={(() => {
            if (!currentGenerateParams?.parentDocId) return false
            for (const doc of documents) {
              const found = findDocById(doc, currentGenerateParams.parentDocId)
              if (found && found.children && found.children.length > 0) {
                return true
              }
            }
            return false
          })()}
        />
      )}
    </div>
  )
}
