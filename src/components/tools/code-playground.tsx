'use client'

import { useState, useEffect } from 'react'
import { X, Play, Maximize2, Minimize2, Copy, Check } from 'lucide-react'
import { CodeEditor } from './code-editor'
import { executeCode, type Language, SUPPORTED_LANGUAGES } from '@/lib/code-executor'

interface CodePlaygroundProps {
  onClose: () => void
}

export function CodePlayground({ onClose }: CodePlaygroundProps) {
  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)

  // 切换语言时加载默认模板
  useEffect(() => {
    setCode(getDefaultTemplate(language))
  }, [language])

  const handleRun = async () => {
    if (!code.trim()) {
      setOutput('错误：请输入代码')
      return
    }

    setIsRunning(true)
    setOutput('执行中...')

    try {
      const result = await executeCode(language, code)
      
      let outputText = ''
      
      // 检查是否有任何输出
      const hasOutput = result.stdout || result.stderr || result.compile_output
      
      if (result.stdout) {
        outputText += `标准输出:\n${result.stdout}\n`
      }
      if (result.stderr) {
        outputText += `${outputText ? '\n' : ''}标准错误:\n${result.stderr}\n`
      }
      if (result.compile_output) {
        outputText += `${outputText ? '\n' : ''}编译输出:\n${result.compile_output}\n`
      }
      
      // 添加执行信息
      outputText += `${outputText ? '\n' : ''}执行时间: ${result.time}s`
      outputText += `\n内存使用: ${result.memory}KB`
      
      // 如果没有任何输出，显示提示
      if (!hasOutput) {
        outputText = '(程序执行完成，无输出)\n\n' + outputText
      }
      
      setOutput(outputText)
    } catch (error) {
      console.error('[代码运行] 执行失败:', error)
      setOutput(`错误: ${error instanceof Error ? error.message : '执行失败'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <div
      className={`fixed bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${
        isFullscreen ? 'inset-0' : 'inset-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col ${
          isFullscreen ? 'w-full h-full' : 'w-[90vw] h-[85vh] max-w-7xl'
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              代码运行环境
            </h2>
            
            {/* 语言选择 */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 代码编辑器 */}
          <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                代码编辑器
              </span>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                {isRunning ? '执行中...' : '运行 (Ctrl+Enter)'}
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
              />
            </div>
          </div>

          {/* 输出区域 */}
          <div className="w-[40%] flex flex-col bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                输出结果
              </span>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      复制
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                {output || '点击"运行"按钮执行代码'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getDefaultTemplate(language: Language): string {
  const templates: Record<Language, string> = {
    javascript: `console.log("Hello, World!");

// 示例：计算斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));`,
    
    python: `print("Hello, World!")

# 示例：计算斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(10):", fibonacci(10))`,
    
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // 示例：计算斐波那契数列
        System.out.println("Fibonacci(10): " + fibonacci(10));
    }
    
    static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,
    
    cpp: `#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Hello, World!" << endl;
    cout << "Fibonacci(10): " << fibonacci(10) << endl;
    return 0;
}`,
    
    c: `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    printf("Hello, World!\\n");
    printf("Fibonacci(10): %d\\n", fibonacci(10));
    return 0;
}`,
    
    go: `package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    fmt.Println("Hello, World!")
    fmt.Printf("Fibonacci(10): %d\\n", fibonacci(10))
}`,
    
    rust: `fn fibonacci(n: u32) -> u32 {
    if n <= 1 {
        return n;
    }
    fibonacci(n - 1) + fibonacci(n - 2)
}

fn main() {
    println!("Hello, World!");
    println!("Fibonacci(10): {}", fibonacci(10));
}`,
    
    typescript: `console.log("Hello, World!");

// 示例：计算斐波那契数列
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));`,

    php: `<?php
echo "Hello, World!\\n";

// 示例：计算斐波那契数列
function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

echo "Fibonacci(10): " . fibonacci(10) . "\\n";
?>`,

    ruby: `puts "Hello, World!"

# 示例：计算斐波那契数列
def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end

puts "Fibonacci(10): #{fibonacci(10)}"`,

    csharp: `using System;

class Program {
    static int Fibonacci(int n) {
        if (n <= 1) return n;
        return Fibonacci(n - 1) + Fibonacci(n - 2);
    }
    
    static void Main() {
        Console.WriteLine("Hello, World!");
        Console.WriteLine($"Fibonacci(10): {Fibonacci(10)}");
    }
}`,

    swift: `print("Hello, World!")

// 示例：计算斐波那契数列
func fibonacci(_ n: Int) -> Int {
    if n <= 1 { return n }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

print("Fibonacci(10): \\(fibonacci(10))")`,

    kotlin: `fun fibonacci(n: Int): Int {
    if (n <= 1) return n
    return fibonacci(n - 1) + fibonacci(n - 2)
}

fun main() {
    println("Hello, World!")
    println("Fibonacci(10): \${fibonacci(10)}")
}`,

    scala: `object Main {
  def fibonacci(n: Int): Int = {
    if (n <= 1) n
    else fibonacci(n - 1) + fibonacci(n - 2)
  }
  
  def main(args: Array[String]): Unit = {
    println("Hello, World!")
    println(s"Fibonacci(10): \${fibonacci(10)}")
  }
}`,

    r: `print("Hello, World!")

# 示例：计算斐波那契数列
fibonacci <- function(n) {
  if (n <= 1) return(n)
  return(fibonacci(n - 1) + fibonacci(n - 2))
}

cat("Fibonacci(10):", fibonacci(10), "\\n")`,

    perl: `print "Hello, World!\\n";

# 示例：计算斐波那契数列
sub fibonacci {
    my $n = shift;
    return $n if $n <= 1;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

print "Fibonacci(10): ", fibonacci(10), "\\n";`,

    lua: `print("Hello, World!")

-- 示例：计算斐波那契数列
function fibonacci(n)
    if n <= 1 then return n end
    return fibonacci(n - 1) + fibonacci(n - 2)
end

print("Fibonacci(10): " .. fibonacci(10))`,

    bash: `#!/bin/bash
echo "Hello, World!"

# 示例：计算斐波那契数列
fibonacci() {
    local n=$1
    if [ $n -le 1 ]; then
        echo $n
    else
        echo $(( $(fibonacci $((n-1))) + $(fibonacci $((n-2))) ))
    fi
}

echo "Fibonacci(10): $(fibonacci 10)"`,
  }

  return templates[language] || ''
}
