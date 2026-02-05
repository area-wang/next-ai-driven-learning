/**
 * 代码执行器
 * 使用 Piston API 执行代码
 * API 文档: https://piston.readthedocs.io/en/latest/api-v2/
 */

export type Language = 
  | 'javascript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'go'
  | 'rust'
  | 'typescript'
  | 'php'
  | 'ruby'
  | 'csharp'
  | 'swift'
  | 'kotlin'
  | 'scala'
  | 'r'
  | 'perl'
  | 'lua'
  | 'bash'

export interface LanguageInfo {
  id: Language
  name: string
  pistonId: string
  version: string
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { id: 'javascript', name: 'JavaScript', pistonId: 'javascript', version: '*' },
  { id: 'python', name: 'Python', pistonId: 'python', version: '*' },
  { id: 'java', name: 'Java', pistonId: 'java', version: '*' },
  { id: 'cpp', name: 'C++', pistonId: 'cpp', version: '*' },
  { id: 'c', name: 'C', pistonId: 'c', version: '*' },
  { id: 'go', name: 'Go', pistonId: 'go', version: '*' },
  { id: 'rust', name: 'Rust', pistonId: 'rust', version: '*' },
  { id: 'typescript', name: 'TypeScript', pistonId: 'typescript', version: '*' },
  { id: 'php', name: 'PHP', pistonId: 'php', version: '*' },
  { id: 'ruby', name: 'Ruby', pistonId: 'ruby', version: '*' },
  { id: 'csharp', name: 'C#', pistonId: 'csharp', version: '*' },
  { id: 'swift', name: 'Swift', pistonId: 'swift', version: '*' },
  { id: 'kotlin', name: 'Kotlin', pistonId: 'kotlin', version: '*' },
  { id: 'scala', name: 'Scala', pistonId: 'scala', version: '*' },
  { id: 'r', name: 'R', pistonId: 'r', version: '*' },
  { id: 'perl', name: 'Perl', pistonId: 'perl', version: '*' },
  { id: 'lua', name: 'Lua', pistonId: 'lua', version: '*' },
  { id: 'bash', name: 'Bash', pistonId: 'bash', version: '*' },
]

export interface ExecutionResult {
  stdout: string
  stderr: string
  compile_output: string
  time: number
  memory: number
}

interface PistonResponse {
  run?: {
    stdout: string
    stderr: string
    output: string
    code: number | null
    signal: string | null
    time?: number
    memory?: number
  }
  compile?: {
    stdout: string
    stderr: string
    output: string
    code: number | null
    signal: string | null
  }
  language: string
  version: string
}

const PISTON_API_URL = 'https://emkc.org/api/v2/piston'

/**
 * 执行代码
 */
export async function executeCode(
  language: Language,
  code: string
): Promise<ExecutionResult> {
  const langInfo = SUPPORTED_LANGUAGES.find(l => l.id === language)
  if (!langInfo) {
    throw new Error(`不支持的语言: ${language}`)
  }

  try {
    const requestBody = {
      language: langInfo.pistonId,
      version: langInfo.version,
      files: [
        {
          name: getFileName(language),
          content: code,
        },
      ],
    }

    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Piston API] 错误响应:', errorText)
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as PistonResponse

    // 检查是否有错误信号

    // 使用 output 字段作为主要输出（Piston API 会合并 stdout 和 stderr）
    const stdout = data.run?.stdout || data.run?.output || ''
    const stderr = data.run?.stderr || ''
    const compileOutput = data.compile?.output || data.compile?.stdout || data.compile?.stderr || ''

    return {
      stdout,
      stderr,
      compile_output: compileOutput,
      time: data.run?.time ? data.run.time / 1000 : 0, // 转换为秒
      memory: data.run?.memory || 0,
    }
  } catch (error) {
    console.error('[Piston API] 执行失败:', error)
    if (error instanceof Error) {
      throw new Error(`执行失败: ${error.message}`)
    }
    throw new Error('执行失败: 未知错误')
  }
}

/**
 * 获取文件名
 */
function getFileName(language: Language): string {
  const fileNames: Record<Language, string> = {
    javascript: 'main.js',
    python: 'main.py',
    java: 'Main.java',
    cpp: 'main.cpp',
    c: 'main.c',
    go: 'main.go',
    rust: 'main.rs',
    typescript: 'main.ts',
    php: 'main.php',
    ruby: 'main.rb',
    csharp: 'Main.cs',
    swift: 'main.swift',
    kotlin: 'Main.kt',
    scala: 'Main.scala',
    r: 'main.r',
    perl: 'main.pl',
    lua: 'main.lua',
    bash: 'main.sh',
  }
  return fileNames[language]
}

/**
 * 获取语言列表（从 Piston API）
 */
export async function getAvailableLanguages(): Promise<any[]> {
  try {
    const response = await fetch(`${PISTON_API_URL}/runtimes`)
    if (!response.ok) {
      throw new Error('获取语言列表失败')
    }
    return await response.json()
  } catch (error) {
    console.error('获取语言列表失败:', error)
    return []
  }
}
