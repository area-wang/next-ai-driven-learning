'use client'

import { useState, useEffect } from 'react'
import { Check, Eye, EyeOff, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import {
  getAIConfig,
  saveAIConfig,
  type ModelConfig,
  type AIConfig,
} from '@/lib/ai/config'
import { useToast } from '@/components/ui/toast-container'

interface AvailableModel {
  id: string
  name: string
  provider: string
  providerId: string
  contextLength: number
  pricing: {
    prompt: number
    completion: number
  }
}

interface ModelsResponse {
  success: boolean
  data: {
    models: AvailableModel[]
    total: number
    providers: Array<{
      name: string
      count: number
    }>
  }
  error?: string
}

export default function AISettingsPage() {
  const toast = useToast()
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [defaultModelId, setDefaultModelId] = useState<string | undefined>(undefined)

  // 加载配置
  useEffect(() => {
    const config = getAIConfig()
    // OpenRouter 使用统一的 API Key
    if (config.models && config.models.length > 0) {
      setApiKey(config.models[0].apiKey || '')
    }
    // 加载已选择的模型
    const selected = new Set((config.models || []).map(m => m.id))
    setSelectedModels(selected)
    // 加载默认模型
    setDefaultModelId(config.defaultModelId)
  }, [])

  // 加载可用模型列表
  useEffect(() => {
    loadAvailableModels()
  }, [])

  const loadAvailableModels = async () => {
    setLoadingModels(true)
    try {
      const response = await fetch('/api/ai/models')
      const result: ModelsResponse = await response.json()
      if (result.success && result.data) {
        setAvailableModels(result.data.models)
      } else {
        console.error('Failed to load models:', result.error)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  // 获取唯一的厂商列表
  const providers = ['all', ...Array.from(new Set(availableModels.map(m => m.provider)))]

  // 过滤模型列表
  const filteredAvailableModels = availableModels
    .filter(m => selectedProvider === 'all' || m.provider === selectedProvider)
    .filter(m => searchQuery === '' || m.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // 测试 API Key 连接
  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.warning('请先输入 API Key')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'custom',
          apiKey: apiKey,
          baseUrl: 'https://openrouter.ai/api/v1',
          model: 'deepseek/deepseek-chat', // 使用一个通用模型测试
        }),
      })

      const data = await response.json() as { success?: boolean; error?: string }

      if (response.ok && data.success) {
        setTestResult({ success: true })
      } else {
        setTestResult({ success: false, error: data.error || '连接失败' })
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      })
    } finally {
      setTesting(false)
    }
  }

  // 切换模型选择
  const toggleModelSelection = (modelId: string) => {
    const newSelected = new Set(selectedModels)
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId)
    } else {
      newSelected.add(modelId)
    }
    setSelectedModels(newSelected)
  }

  // 保存配置
  const handleSaveConfig = () => {
    if (!apiKey) {
      toast.warning('请先输入 API Key')
      return
    }

    if (selectedModels.size === 0) {
      toast.warning('请至少选择一个模型')
      return
    }

    // 构建模型配置列表
    const models: ModelConfig[] = Array.from(selectedModels).map(modelId => {
      const model = availableModels.find(m => m.id === modelId)
      return {
        id: modelId,
        name: model?.name || modelId,
        provider: 'custom',
        model: modelId,
        apiKey: '', // API Key 不再存储在前端，由后端从环境变量读取
        baseUrl: 'https://openrouter.ai/api/v1',
        isConnected: testResult?.success || false,
      }
    })

    // 如果默认模型未设置或不在选中列表中，使用第一个模型
    let finalDefaultModelId = defaultModelId
    if (!finalDefaultModelId || !selectedModels.has(finalDefaultModelId)) {
      finalDefaultModelId = models[0]?.id
    }

    const config: AIConfig = {
      models,
      defaultModelId: finalDefaultModelId,
    }

    saveAIConfig(config)
    toast.success(`已保存 ${models.length} 个模型配置`)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI 模型配置
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          配置 OpenRouter API Key，然后选择想要使用的模型。
        </p>
      </div>

      {/* API Key 配置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          OpenRouter API Key
        </h3>

        {/* API Key 输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key
          </label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入 OpenRouter API Key"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {showApiKey ? (
                <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            在 <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a> 获取 API Key
          </p>
        </div>

        {/* 测试连接按钮 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleTestConnection}
            disabled={!apiKey || testing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                测试连接
              </>
            )}
          </button>

          {testResult && (
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">连接成功</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {testResult.error || '连接失败'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 模型选择器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">
            选择模型（已选 {selectedModels.size} 个）
          </h3>
          <button
            onClick={loadAvailableModels}
            disabled={loadingModels}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingModels ? 'animate-spin' : ''}`} />
            刷新列表
          </button>
        </div>

        {/* 厂商筛选 */}
        <div className="flex flex-wrap gap-2">
          {providers.map((provider) => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedProvider === provider
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {provider === 'all' ? '全部' : provider}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索模型..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* 模型列表 */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {loadingModels ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              加载模型列表...
            </div>
          ) : filteredAvailableModels.length > 0 ? (
            filteredAvailableModels.map((model) => {
              const isSelected = selectedModels.has(model.id)
              const isDefault = defaultModelId === model.id
              return (
                <div
                  key={model.id}
                  className={`flex items-center gap-3 p-3 border rounded-md transition-colors ${
                    isDefault
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleModelSelection(model.id)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {model.name}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {model.provider}
                      </span>
                      {isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-primary text-white rounded">
                          默认
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      上下文: {(model.contextLength / 1000).toFixed(0)}K
                    </p>
                  </div>
                  {isSelected && (
                    <button
                      onClick={() => setDefaultModelId(model.id)}
                      disabled={isDefault}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        isDefault
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {isDefault ? '已设为默认' : '设为默认'}
                    </button>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? '未找到匹配的模型' : '暂无可用模型'}
            </div>
          )}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={!apiKey || selectedModels.size === 0}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          保存配置
        </button>
      </div>
    </div>
  )
}
