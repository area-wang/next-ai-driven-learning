'use client'

interface FeedbackPanelProps {
  gaps: string[]
  suggestions: string[]
  score: number
}

export function FeedbackPanel({ gaps, suggestions, score }: FeedbackPanelProps) {
  return (
    <div className="space-y-6">
      {/* 评分 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">解释质量</span>
          <span className="text-2xl font-bold text-teal-600">{score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {score >= 80 ? '优秀' : score >= 60 ? '良好' : '需要改进'}
        </p>
      </div>

      {/* 知识盲点 */}
      {gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-red-600 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            知识盲点
          </h4>
          <ul className="space-y-2">
            {gaps.map((gap, index) => (
              <li
                key={index}
                className="text-sm bg-red-50 p-3 rounded border-l-4 border-red-400"
              >
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改进建议 */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-blue-600 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            改进建议
          </h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 鼓励信息 */}
      {score >= 80 && (
        <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            太棒了！你的解释非常清晰。继续保持这种简单易懂的风格！
          </p>
        </div>
      )}

      {score < 60 && (
        <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
          <p className="text-sm text-yellow-800">
            💪 不要气馁！尝试用更简单的语言、添加具体例子或类比来改进你的解释。
          </p>
        </div>
      )}
    </div>
  )
}
