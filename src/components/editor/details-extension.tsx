/**
 * Details 和 Summary 标签扩展
 * 用于支持可折叠的内容（答案、解析等）
 * 使用自定义 NodeView 来保持原生 details/summary 的交互行为
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import React from 'react'

// Details 组件
const DetailsComponent = ({ node, updateAttributes }: any) => {
  const [isOpen, setIsOpen] = React.useState(node.attrs.open || false)

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const newOpen = e.currentTarget.open
    setIsOpen(newOpen)
    updateAttributes({ open: newOpen })
  }

  return (
    <NodeViewWrapper
      as="details"
      open={isOpen}
      onToggle={handleToggle}
      style={{
        marginTop: '12px',
        padding: '12px',
        backgroundColor: '#f0fdfa',
        borderLeft: '3px solid #0D9488',
        borderRadius: '4px',
      }}
    >
      <NodeViewContent as="div" />
    </NodeViewWrapper>
  )
}

export const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'summary block+',
  defining: true,
  
  parseHTML() {
    return [
      {
        tag: 'details',
        preserveWhitespace: 'full',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'details',
      mergeAttributes(HTMLAttributes, {
        style: 'margin-top: 12px; padding: 12px; background-color: #f0fdfa; border-left: 3px solid #0D9488; border-radius: 4px;',
      }),
      0,
    ]
  },

  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: (element) => element.hasAttribute('open'),
        renderHTML: (attributes) => {
          return attributes.open ? { open: 'open' } : {}
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(DetailsComponent)
  },
})

// Summary 组件
const SummaryComponent = () => {
  return (
    <NodeViewWrapper as="summary" style={{
      cursor: 'pointer',
      fontWeight: 'bold',
      color: '#0D9488',
      userSelect: 'none',
    }}>
      <NodeViewContent />
    </NodeViewWrapper>
  )
}

export const Summary = Node.create({
  name: 'summary',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'summary',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'summary',
      mergeAttributes(HTMLAttributes, {
        style: 'cursor: pointer; font-weight: bold; color: #0D9488; user-select: none;',
      }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SummaryComponent)
  },
})
