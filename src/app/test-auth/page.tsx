import { auth } from "@/lib/auth"

export default async function TestAuthPage() {
  const session = await auth()

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Auth 测试页面</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Session 信息:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          {session ? "✅ 已登录" : "❌ 未登录"}
        </p>
      </div>
    </div>
  )
}
