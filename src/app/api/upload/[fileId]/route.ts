import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * 删除文件 API
 * DELETE /api/upload/[fileId]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    // 验证用户登录
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { message: '未登录' },
        { status: 401 }
      )
    }

    const { fileId } = await context.params

    // TODO: 从数据库获取文件信息并验证所有权
    // const db = await getDb()
    // const file = await db.query.files.findFirst({
    //   where: eq(files.id, fileId)
    // })
    // 
    // if (!file) {
    //   return NextResponse.json({ message: '文件不存在' }, { status: 404 })
    // }
    // 
    // if (file.userId !== session.user.id) {
    //   return NextResponse.json({ message: '无权限' }, { status: 403 })
    // }

    // 从 R2 删除文件
    const r2 = (globalThis as any).STORAGE as R2Bucket | undefined
    if (r2) {
      // await r2.delete(file.r2Key)
      // if (file.thumbnailUrl) {
      //   const thumbnailKey = file.r2Key.replace(/\.[^.]+$/, '_thumb.jpg')
      //   await r2.delete(thumbnailKey)
      // }
    }

    // 从数据库删除记录
    // await db.delete(files).where(eq(files.id, fileId))

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('文件删除失败:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    )
  }
}
