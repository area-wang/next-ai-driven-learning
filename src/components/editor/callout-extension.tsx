/**
 * Callout 扩展
 * 创建带图标的提示框（信息、警告、成功、错误）
 */

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react"
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CalloutOptions {
  types: string[]
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type?: string) => ReturnType
      toggleCallout: (type?: string) => ReturnType
    }
  }
}

const CalloutComponent = ({ node, updateAttributes }: any) => {
  const type = node.attrs.type || "info"

  const config = {
    info: {
      icon: Info,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      iconColor: "text-blue-500",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-900",
      iconColor: "text-yellow-500",
    },
    success: {
      icon: CheckCircle,
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
      iconColor: "text-green-500",
    },
    error: {
      icon: XCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      iconColor: "text-red-500",
    },
  }

  const currentConfig = config[type as keyof typeof config] || config.info
  const Icon = currentConfig.icon

  return (
    <NodeViewWrapper className="my-4">
      <div
        className={cn(
          "flex gap-3 p-4 rounded-xl border-[3px]",
          currentConfig.bg,
          currentConfig.border,
          currentConfig.text
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={cn("w-5 h-5", currentConfig.iconColor)} />
        </div>
        <NodeViewContent className="flex-1 callout-content" />
      </div>
    </NodeViewWrapper>
  )
}

export const Callout = Node.create<CalloutOptions>({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => {
          return {
            "data-type": attributes.type,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "callout" }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },

  addCommands() {
    return {
      setCallout:
        (type = "info") =>
        ({ commands }) => {
          return commands.setNode(this.name, { type })
        },
      toggleCallout:
        (type = "info") =>
        ({ commands }) => {
          return commands.toggleNode(this.name, "paragraph", { type })
        },
    }
  },
})
