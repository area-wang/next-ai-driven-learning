/**
 * 学习大纲更新和删除 API
 * 支持更新大纲的标题和内容，以及删除大纲
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { learningOutlines, knowledgeContents } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ outlineId: string }> }
) {
  try {
    const { outlineId } = await params
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    const body = await request.json() as {
      title?: string
      content?: string
      description?: string
    }

    const { title, content, description } = body

    // 更新大纲标题和描述
    if (title !== undefined || description !== undefined) {
      const updates: any = {}
      if (title !== undefined) updates.title = title
      if (description !== undefined) updates.description = description

      await db
        .update(learningOutlines)
        .set(updates)
        .where(eq(learningOutlines.id, outlineId))
    }

    // 更新内容
    let contentId: string | undefined
    if (content !== undefined) {
      // 检查是否已有内容记录
      const existingContent = await db
        .select()
        .from(knowledgeContents)
        .where(eq(knowledgeContents.outlineId, outlineId))
        .limit(1)

      if (existingContent.length > 0) {
        // 更新现有内容
        await db
          .update(knowledgeContents)
          .set({
            content,
            updatedAt: new Date(),
          })
          .where(eq(knowledgeContents.id, existingContent[0].id))
        contentId = existingContent[0].id
      } else {
        // 创建新内容记录
        const newContent = await db.insert(knowledgeContents).values({
          outlineId,
          content,
          contentType: 'rich_text',
          aiGenerated: false,
        }).returning()
        contentId = newContent[0].id
      }
    }

    return NextResponse.json({ 
      success: true,
      contentId, // 返回 contentId，避免前端再次查询
    })
  } catch (error) {
    console.error('更新大纲失败:', error)
    return NextResponse.json(
      { error: '更新大纲失败' },
      { status: 500 }
    )
  }
}

/**
 * 删除学习大纲
 * 支持递归删除子大纲或仅删除当前大纲
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ outlineId: string }> }
) {
  try {
    const { outlineId } = await params
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    // 获取查询参数，判断是否删除子文档
    const { searchParams } = new URL(request.url)
    const deleteChildren = searchParams.get('deleteChildren') === 'true'

    if (deleteChildren) {
      // 递归删除所有子大纲
      await deleteOutlineRecursive(db, outlineId)
    } else {
      // 只删除当前大纲，子大纲的 parentId 设置为当前大纲的 parentId
      const currentOutline = await db
        .select()
        .from(learningOutlines)
        .where(eq(learningOutlines.id, outlineId))
        .limit(1)

      if (currentOutline.length > 0) {
        const parentId = currentOutline[0].parentId

        // 更新子大纲的 parentId
        await db
          .update(learningOutlines)
          .set({ parentId })
          .where(eq(learningOutlines.parentId, outlineId))

        // 删除当前大纲的内容
        await db
          .delete(knowledgeContents)
          .where(eq(knowledgeContents.outlineId, outlineId))

        // 删除当前大纲
        await db
          .delete(learningOutlines)
          .where(eq(learningOutlines.id, outlineId))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除大纲失败:', error)
    return NextResponse.json(
      { error: '删除大纲失败' },
      { status: 500 }
    )
  }
}

/**
 * 递归删除大纲及其所有子大纲
 */
async function deleteOutlineRecursive(db: any, outlineId: string) {
  // 查找所有子大纲
  const children = await db
    .select()
    .from(learningOutlines)
    .where(eq(learningOutlines.parentId, outlineId))

  // 递归删除子大纲
  for (const child of children) {
    await deleteOutlineRecursive(db, child.id)
  }

  // 删除当前大纲的内容
  await db
    .delete(knowledgeContents)
    .where(eq(knowledgeContents.outlineId, outlineId))

  // 删除当前大纲
  await db
    .delete(learningOutlines)
    .where(eq(learningOutlines.id, outlineId))
}
