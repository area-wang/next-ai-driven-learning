/**
 * Tiptap Vimeo 扩展
 * 支持嵌入 Vimeo 视频
 */

import { Node, mergeAttributes } from '@tiptap/core'

export interface VimeoOptions {
  addPasteHandler: boolean
  allowFullscreen: boolean
  autoplay: boolean
  ccLanguage?: string
  ccLoadPolicy?: boolean
  controls: boolean
  disableKBcontrols: boolean
  enableIFrameApi: boolean
  endTime: number
  height: number
  interfaceLanguage?: string
  ivLoadPolicy: number
  loop: boolean
  modestBranding: boolean
  HTMLAttributes: Record<string, unknown>
  inline: boolean
  nocookie: boolean
  origin?: string
  playlist?: string
  progressBarColor?: string
  width: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    vimeo: {
      /**
       * Insert a Vimeo video
       */
      setVimeoVideo: (options: { src: string }) => ReturnType
    }
  }
}

export const Vimeo = Node.create<VimeoOptions>({
  name: 'vimeo',

  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      autoplay: false,
      ccLanguage: undefined,
      ccLoadPolicy: undefined,
      controls: true,
      disableKBcontrols: false,
      enableIFrameApi: false,
      endTime: 0,
      height: 480,
      interfaceLanguage: undefined,
      ivLoadPolicy: 0,
      loop: false,
      modestBranding: false,
      HTMLAttributes: {},
      inline: false,
      nocookie: false,
      origin: undefined,
      playlist: undefined,
      progressBarColor: undefined,
      width: 640,
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vimeo-video]',
      },
    ]
  },

  addCommands() {
    return {
      setVimeoVideo:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = this.options.nocookie
      ? 'https://player.vimeo.com/video/'
      : 'https://player.vimeo.com/video/'

    // 从 URL 中提取视频 ID
    const videoIdMatch = HTMLAttributes.src?.match(/vimeo\.com\/(\d+)/) ||
                        HTMLAttributes.src?.match(/player\.vimeo\.com\/video\/(\d+)/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null

    if (!videoId) {
      return ['div', { 'data-vimeo-video': '' }, 'Invalid Vimeo URL']
    }

    const url = new URL(`${embedUrl}${videoId}`)

    if (this.options.autoplay) {
      url.searchParams.append('autoplay', '1')
    }

    if (this.options.loop) {
      url.searchParams.append('loop', '1')
    }

    if (!this.options.controls) {
      url.searchParams.append('controls', '0')
    }

    return [
      'div',
      { 'data-vimeo-video': '', class: 'vimeo-wrapper' },
      [
        'iframe',
        mergeAttributes(
          this.options.HTMLAttributes,
          {
            width: this.options.width,
            height: this.options.height,
            src: url.href,
            frameborder: '0',
            allow: 'autoplay; fullscreen; picture-in-picture',
            allowfullscreen: this.options.allowFullscreen ? 'true' : undefined,
          },
          HTMLAttributes
        ),
      ],
    ]
  },
})
