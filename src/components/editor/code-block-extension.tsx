/**
 * 自定义代码块扩展
 * 支持语法高亮和语言标签显示
 */

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

// 扩展 CodeBlockLowlight 以添加语言标签
export const CustomCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'plaintext',
        parseHTML: element => {
          const { languageClassPrefix } = this.options
          const classNames = [...(element.firstElementChild?.classList || [])]
          const languages = classNames
            .filter(className => className.startsWith(languageClassPrefix || 'language-'))
            .map(className => className.replace(languageClassPrefix || 'language-', ''))
          const language = languages[0]

          if (!language) {
            return 'plaintext'
          }

          return language
        },
        rendered: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
        getAttrs: node => {
          const element = node as HTMLElement
          const codeElement = element.querySelector('code')
          if (!codeElement) return false

          const { languageClassPrefix } = this.options
          const classNames = [...codeElement.classList]
          const languages = classNames
            .filter(className => className.startsWith(languageClassPrefix || 'language-'))
            .map(className => className.replace(languageClassPrefix || 'language-', ''))

          return {
            language: languages[0] || 'plaintext',
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const language = node.attrs.language || 'plaintext'
    
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-language': language,
      }),
      [
        'code',
        {
          class: `language-${language}`,
        },
        0,
      ],
    ]
  },
}).configure({
  lowlight,
  defaultLanguage: 'plaintext',
  HTMLAttributes: {
    class: 'code-block-wrapper',
  },
})
