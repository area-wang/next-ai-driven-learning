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
import { type Editor } from "@tiptap/react"
import { useAIConfig } from "@/hooks/use-ai-config"
import { useAutoSave } from "@/hooks/use-auto-save"
import { Sparkles, Loader2, ChevronLeft, BookOpen, ClipboardCheck } from "lucide-react"
import { useToast } from "@/components/ui/toast-container"

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
  const [aiMode, setAIMode] = React.useState<'outline' | 'content'>('outline') // 新增：区分生成模式
  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false)
  const [testParentDocId, setTestParentDocId] = React.useState<string | undefined>()
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isTestGenerating, setIsTestGenerating] = React.useState(false)
  const [isAnswerMode, setIsAnswerMode] = React.useState(false)
  const [isSimilarGenerating, setIsSimilarGenerating] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string; childrenCount: number } | null>(null)
  const { config, getApiKey } = useAIConfig()
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

      // 从配置获取模型信息并添加到请求头
      const { getDefaultModel } = await import('@/lib/ai/config')
      const { addModelConfigToHeaders } = await import('@/lib/ai/config-client')
      const modelConfig = getDefaultModel()
      
      if (!modelConfig) {
        toast.warning('未配置可用的 AI 模型，请前往设置页面配置')
        return
      }

      const headers = addModelConfigToHeaders(
        { 'Content-Type': 'application/json' },
        modelConfig
      )

      const response = await fetch('/api/test-answer/generate-similar', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originalQuestion: {
            type: questionType,
            question: questionText,
            difficulty: 'medium',
            topic: questionText.substring(0, 50),
          },
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
  }, [isSimilarGenerating, editorInstanceRef])

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

  // AI 生成处理函数
  const handleAIGenerate = React.useCallback(async (params: GenerateParams) => {
    setIsGenerating(true)
    try {
      // 使用 fetchWithModel 辅助函数
      const { fetchWithModel } = await import('@/lib/ai/fetch-with-model')

      // 判断是生成章节内容还是生成大纲
      if (params.currentDocId) {
        // 生成章节内容模式
        const response = await fetchWithModel(
          '/api/learning-content/generate',
          params.modelId,
          {
            method: 'POST',
            body: JSON.stringify({
              outlineId: params.currentDocId,
              topic: planInfo.topic,
              chapterTitle: params.topic,
              goal: params.goal,
              additionalContext: params.additionalContext,
              level: params.level,
              modelId: params.modelId, // 传递模型ID
            }),
          }
        )

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
      } else {
        // 生成大纲模式
        const response = await fetchWithModel(
          '/api/learning-outline/generate',
          params.modelId,
          {
            method: 'POST',
            body: JSON.stringify({
              planId, // 添加 planId
              parentId: params.parentDocId, // 添加 parentId
              topic: params.topic,
              goal: params.goal,
              level: params.level,
              modelId: params.modelId, // 传递模型ID
            }),
          }
        )

        if (!response.ok) {
          const error = await response.json() as { error?: string }
          throw new Error(error.error || 'AI 生成失败')
        }

        const data = await response.json() as { outlines: any[] }
        
        // 转换 AI 生成的大纲为文档树结构（使用数据库返回的 ID）
      const convertOutlineToDocuments = (
        outlineItems: any[]
      ): { nodes: DocumentNode[]; contents: Record<string, { title: string; content: string; description?: string }> } => {
        const nodes: DocumentNode[] = []
        const contents: Record<string, { title: string; content: string; description?: string }> = {}

        outlineItems.forEach((item) => {
          // 使用数据库返回的 ID
          const docId = item.id
          
          // 生成文档内容（HTML格式）
          let htmlContent = `<h2>${item.title}</h2>`
          if (item.description) {
            htmlContent += `<p>${item.description}</p>`
          }
          if (item.estimatedTime) {
            htmlContent += `<p><strong>预计学习时间：</strong>${item.estimatedTime} 分钟</p>`
          }

          // 创建文档节点
          const node: DocumentNode = {
            id: docId,
            title: item.title,
          }

          // 处理子项
          if (item.children && item.children.length > 0) {
            const childResult = convertOutlineToDocuments(item.children)
            node.children = childResult.nodes
            Object.assign(contents, childResult.contents)
          }

          nodes.push(node)
          contents[docId] = {
            title: item.title,
            content: htmlContent,
            description: item.description,
          }
        })

        return { nodes, contents }
      }

      const { nodes, contents } = convertOutlineToDocuments(data.outlines)

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
        setAndSaveActiveDocId(nodes[0].id)
      }

      toast.success('AI 生成成功！')
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [planInfo, setAndSaveActiveDocId, planId, activeDocId, documentContents, documents, toast])

  // 打开 AI 生成对话框
  const openAIDialog = React.useCallback((mode: 'outline' | 'content' = 'outline', parentId?: string) => {
    setAIMode(mode)
    setAIParentDocId(parentId)
    setIsAIDialogOpen(true)
  }, [])

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

      // 使用 fetchWithModel 辅助函数
      const { fetchWithModel } = await import('@/lib/ai/fetch-with-model')
      const response = await fetchWithModel(
        '/api/test-questions/generate',
        params.modelId,
        {
          method: 'POST',
          body: JSON.stringify({
            topic: params.topic,
            planTopic: planInfo.topic, // 添加学习计划主题
            planGoal: planInfo.goal, // 添加学习计划目标
            currentContent, // 添加当前章节内容
            additionalContext: params.additionalContext, // 添加用户自定义描述
            difficulty: params.difficulty,
            questionCount: params.questionCount,
            questionTypes: params.questionTypes,
            modelId: params.modelId, // 传递模型ID
          }),
        }
      )

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
  }, [config, getApiKey, activeDocId, setAndSaveActiveDocId, documentContents, editorInstanceRef, planInfo, toast])

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

      {/* 主体区域：文档树 + 编辑器 + 大纲 */}
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

        {/* 右侧大纲 */}
        <ContentOutline editor={editorInstanceRef.current} />
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
    </div>
  )
}
