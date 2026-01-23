/**
 * 举一反三按钮扩展
 * 处理测试题中的举一反三按钮点击事件
 */

import { Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface SimilarQuestionButtonOptions {
  onButtonClick: (questionIndex: number) => void
}

export const SimilarQuestionButton = Node.create<SimilarQuestionButtonOptions>({
  name: 'similarQuestionButton',

  group: 'inline',

  inline: true,

  atom: true,

  selectable: false,

  draggable: false,

  addOptions() {
    return {
      onButtonClick: () => {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'button[data-similar-question-btn="true"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const element = node as HTMLElement
          return {
            questionIndex: element.getAttribute('data-question-index'),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'button',
      {
        ...HTMLAttributes,
        'data-similar-question-btn': 'true',
        type: 'button',
        contenteditable: 'false',
        style: 'display: inline-flex; align-items: center; gap: 4px; padding: 0px 8px; background: linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2); margin-left: 8px; user-select: none;',
      },
      '举一反三',
    ]
  },

  addProseMirrorPlugins() {
    const onButtonClick = this.options.onButtonClick

    return [
      new Plugin({
        key: new PluginKey('similarQuestionButtonHandler'),
        props: {
          handleDOMEvents: {
            click: (_view, event) => {
              const target = event.target as HTMLElement
              const button = target.closest('button[data-similar-question-btn="true"]')
              
              if (button) {
                event.preventDefault()
                event.stopPropagation()
                
                const questionIndex = button.getAttribute('data-question-index')
                if (questionIndex) {
                  const index = parseInt(questionIndex)
                  if (!isNaN(index)) {
                    onButtonClick(index)
                  }
                }
                return true
              }
              return false
            },
          },
        },
      }),
    ]
  },

  addAttributes() {
    return {
      questionIndex: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-question-index'),
        renderHTML: (attributes) => {
          if (!attributes.questionIndex) {
            return {}
          }
          return {
            'data-question-index': attributes.questionIndex,
          }
        },
      },
    }
  },
})
