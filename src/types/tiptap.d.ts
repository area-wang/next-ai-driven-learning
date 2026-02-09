import '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      /**
       * 插入行内数学公式
       */
      setMath: (attributes: { latex: string; display?: boolean }) => ReturnType
    }
    blockMath: {
      /**
       * 插入块级数学公式
       */
      setBlockMath: (attributes: { latex: string }) => ReturnType
    }
    vimeo: {
      /**
       * 插入 Vimeo 视频
       */
      setVimeoVideo: (options: { src: string }) => ReturnType
    }
    mermaid: {
      /**
       * 插入 Mermaid 图表
       */
      setMermaid: (content: string) => ReturnType
    }
  }
}
