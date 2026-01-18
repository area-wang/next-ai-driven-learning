"use client"

import * as React from "react"

export default function TestDeepSeekPage() {
  const [apiKey, setApiKey] = React.useState("")
  const [result, setResult] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const testAPI = async () => {
    setLoading(true)
    setResult("测试中...")

    try {
      const response = await fetch("/api/test-deepseek", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ 成功!\n\n${JSON.stringify(data, null, 2)}`)
      } else {
        setResult(`❌ 失败!\n\n${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setResult(`❌ 错误: ${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">DeepSeek API 测试</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            DeepSeek API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={testAPI}
          disabled={!apiKey || loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 cursor-pointer"
        >
          {loading ? "测试中..." : "测试 API"}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
