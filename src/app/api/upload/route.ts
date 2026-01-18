import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * 文件上传 API
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { message: '未登录' },
        { status: 401 }
      )
    }

    // 获取表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const originalName = formData.get('originalName') as string
    const mimeType = formData.get('mimeType') as string
    const thumbnail = formData.get('thumbnail') as File | null

    if (!file) {
      return NextResponse.json(
        { message: '未提供文件' },
        { status: 400 }
      )
    }

    // 生成文件ID和key
    const fileId = crypto.randomUUID()
    const ext = originalName.split('.').pop() || ''
    const key = `uploads/${session.user.id}/${fileId}.${ext}`

    // 获取 R2 bucket (从环境变量)
    // 注意：在 Cloudflare Workers 环境中，R2 bucket 通过绑定获取
    // 这里我们先返回模拟数据，实际部署时需要配置 R2
    const r2 = (globalThis as any).STORAGE as R2Bucket | undefined

    if (!r2) {
      // 开发环境：返回模拟数据
      console.warn('R2 bucket 未配置，返回模拟数据')
      
      return NextResponse.json({
        fileId,
        url: `/uploads/${fileId}.${ext}`,
        key,
        size: file.size,
        mimeType,
        thumbnailUrl: thumbnail ? `/uploads/${fileId}_thumb.jpg` : undefined,
      })
    }

    // 上传文件到 R2
    const arrayBuffer = await file.arrayBuffer()
    await r2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: mimeType,
      },
      customMetadata: {
        originalName,
        userId: session.user.id || '',
        uploadedAt: new Date().toISOString(),
      },
    })

    // 生成公开 URL
    const url = `${process.env.R2_PUBLIC_URL}/${key}`

    // 如果有缩略图，也上传
    let thumbnailUrl: string | undefined
    if (thumbnail) {
      const thumbnailKey = `uploads/${session.user.id}/${fileId}_thumb.jpg`
      const thumbnailBuffer = await thumbnail.arrayBuffer()
      await r2.put(thumbnailKey, thumbnailBuffer, {
        httpMetadata: {
          contentType: 'image/jpeg',
        },
      })
      thumbnailUrl = `${process.env.R2_PUBLIC_URL}/${thumbnailKey}`
    }

    // 保存文件记录到数据库
    // TODO: 实现数据库保存逻辑
    // const db = await getDb()
    // await db.insert(files).values({
    //   id: fileId,
    //   userId: session.user.id!,
    //   filename: `${fileId}.${ext}`,
    //   originalName,
    //   mimeType,
    //   size: file.size,
    //   r2Key: key,
    //   url,
    //   thumbnailUrl,
    // })

    return NextResponse.json({
      fileId,
      url,
      key,
      size: file.size,
      mimeType,
      thumbnailUrl,
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
}
