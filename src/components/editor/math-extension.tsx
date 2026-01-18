"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import * as React from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

// Math Node View Component with Claymorphism style
function MathNodeView({ node, updateAttributes, deleteNode }: any) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [latex, setLatex] = React.useState(node.attrs.latex || "")
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const renderMath = React.useCallback((latexString: string) => {
    try {
      const html = katex.renderToString(latexString, {
        throwOnError: false,
        displayMode: node.attrs.display,
      })
      setError(null)
      return html
    } catch (err) {
      setError(err instanceof Error ? err.message : "渲染错误")
      return ""
    }
  }, [node.attrs.display])

  const handleSave = () => {
    if (latex.trim()) {
      updateAttributes({ latex: latex.trim() })
      setIsEditing(false)
    } else {
      deleteNode()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setLatex(node.attrs.latex || "")
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <NodeViewWrapper className="inline-block">
        {/* Claymorphism style: soft 3D, thick borders, double shadows, rounded */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 border-[3px] border-teal-200 rounded-2xl shadow-[0_2px_8px_rgba(13,148,136,0.1),0_4px_16px_rgba(13,148,136,0.05)] transition-all duration-200">
          <label htmlFor="math-input" className="sr-only">
            LaTeX 公式输入
          </label>
          <input
            id="math-input"
            ref={inputRef}
            type="text"
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="输入 LaTeX 公式..."
            aria-label="LaTeX 公式输入框"
            className="min-w-[200px] h-10 px-3 text-sm border-none outline-none bg-transparent text-[var(--color-text)] placeholder:text-teal-400 focus:outline-none"
          />
          <span className="text-xs font-medium text-teal-600 px-2 py-1 bg-teal-50 rounded-lg">
            {node.attrs.display ? "块级" : "行内"}
          </span>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper
      className={node.attrs.display ? "block my-4" : "inline-block"}
      onClick={() => setIsEditing(true)}
    >
      {/* Claymorphism hover effect: soft press with smooth transition */}
      <span
        className="cursor-pointer inline-block px-2 py-1 rounded-xl bg-teal-50/50 border-2 border-teal-100 hover:bg-teal-50 hover:border-teal-200 hover:shadow-[0_2px_8px_rgba(13,148,136,0.15)] active:shadow-[inset_0_2px_4px_rgba(13,148,136,0.1)] transition-all duration-200 ease-out"
        dangerouslySetInnerHTML={{ __html: renderMath(node.attrs.latex) }}
        role="button"
        tabIndex={0}
        aria-label={`数学公式: ${node.attrs.latex}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setIsEditing(true)
          }
        }}
      />
      {error && (
        <span className="text-xs text-red-500 ml-2 font-medium" role="alert">
          ({error})
        </span>
      )}
    </NodeViewWrapper>
  )
}

// Math Extension
export const MathExtension = Node.create({
  name: "math",

  group: "inline",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
      },
      display: {
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='math']",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-type": "math" }, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView)
  },

  addCommands() {
    return {
      setMath:
        (attributes: { latex: string; display?: boolean }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})

// Block Math Extension (for display mode)
export const BlockMathExtension = Node.create({
  name: "blockMath",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='block-math']",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "block-math" }, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer((props: any) => (
      <MathNodeView {...props} node={{ ...props.node, attrs: { ...props.node.attrs, display: true } }} />
    ))
  },

  addCommands() {
    return {
      setBlockMath:
        (attributes: { latex: string }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})
