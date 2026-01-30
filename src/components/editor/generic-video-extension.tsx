/**
 * 通用视频扩展
 * 支持多个主流视频平台：Bilibili、腾讯视频、优酷、爱奇艺
 */

import { Node, mergeAttributes } from '@tiptap/core'

export type GenericVideoType = 'bilibili' | 'tencent' | 'youku' | 'iqiyi'

export interface GenericVideoOptions {
  addPasteHandler: boolean
  allowFullscreen: boolean
  autoplay: boolean
  HTMLAttributes: Record<string, any>
  inline: boolean
  width: number
  height: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    genericVideo: {
      /**
       * Insert a generic video
       */
      setGenericVideo: (options: { src: string; type: GenericVideoType }) => ReturnType
    }
  }
}

/**
 * 解析 Bilibili URL 并生成嵌入链接
 */
function parseBilibiliUrl(url: string): string | null {
  // 支持 BV 号和 AV 号
  const bvMatch = url.match(/(?:bilibili\.com\/video\/|b23\.tv\/)(BV[a-zA-Z0-9]+)/)
  if (bvMatch && bvMatch[1]) {
    return `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}&high_quality=1`
  }

  const avMatch = url.match(/bilibili\.com\/video\/av(\d+)/)
  if (avMatch && avMatch[1]) {
    return `https://player.bilibili.com/player.html?aid=${avMatch[1]}&high_quality=1`
  }

  return null
}

/**
 * 解析腾讯视频 URL 并生成嵌入链接
 */
function parseTencentUrl(url: string): string | null {
  const match = url.match(/v\.qq\.com\/x\/(?:page|cover)\/([a-zA-Z0-9]+)/)
  if (match && match[1]) {
    return `https://v.qq.com/txp/iframe/player.html?vid=${match[1]}`
  }
  return null
}

/**
 * 解析优酷 URL 并生成嵌入链接
 */
function parseYoukuUrl(url: string): string | null {
  const match = url.match(/v\.youku\.com\/v_show\/id_([a-zA-Z0-9=]+)/)
  if (match && match[1]) {
    return `https://player.youku.com/embed/${match[1]}`
  }
  return null
}

/**
 * 解析爱奇艺 URL 并生成嵌入链接
 */
function parseIqiyiUrl(url: string): string | null {
  const match = url.match(/iqiyi\.com\/v_([a-zA-Z0-9_]+)/)
  if (match && match[1]) {
    // 爱奇艺的嵌入链接需要完整的视频ID
    return `https://www.iqiyi.com/common/flashplayer/20150916/player.swf?tvId=${match[1]}`
  }
  return null
}

/**
 * 根据类型解析 URL
 */
function parseVideoUrl(url: string, type: GenericVideoType): string | null {
  switch (type) {
    case 'bilibili':
      return parseBilibiliUrl(url)
    case 'tencent':
      return parseTencentUrl(url)
    case 'youku':
      return parseYoukuUrl(url)
    case 'iqiyi':
      return parseIqiyiUrl(url)
    default:
      return null
  }
}

export const GenericVideo = Node.create<GenericVideoOptions>({
  name: 'genericVideo',

  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      autoplay: false,
      HTMLAttributes: {},
      inline: false,
      width: 640,
      height: 480,
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
      type: {
        default: 'bilibili',
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
        tag: 'div[data-generic-video]',
      },
    ]
  },

  addCommands() {
    return {
      setGenericVideo:
        (options: { src: string; type: GenericVideoType }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = parseVideoUrl(HTMLAttributes.src, HTMLAttributes.type)

    if (!embedUrl) {
      return ['div', { 'data-generic-video': '' }, `无效的${HTMLAttributes.type}链接`]
    }

    const width = HTMLAttributes.width || this.options.width
    const height = HTMLAttributes.height || this.options.height

    return [
      'div',
      {
        'data-generic-video': '',
        'data-type': HTMLAttributes.type,
        class: 'generic-video-wrapper',
        style: `position: relative; padding-bottom: ${(height / width) * 100}%; height: 0; overflow: hidden;`,
      },
      [
        'iframe',
        mergeAttributes(
          this.options.HTMLAttributes,
          {
            width: '100%',
            height: '100%',
            src: embedUrl,
            frameborder: '0',
            allowfullscreen: this.options.allowFullscreen ? 'true' : 'false',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
          }
        ),
      ],
    ]
  },
})
