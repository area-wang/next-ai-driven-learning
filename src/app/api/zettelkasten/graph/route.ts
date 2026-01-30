import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { zettelkastenNotes, noteLinks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/zettelkasten/graph - 获取知识图谱数据
 */

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()

    // 获取所有笔记
    const notes = await db
      .select()
      .from(zettelkastenNotes)
      .where(eq(zettelkastenNotes.userId, userId))

    // 获取所有链接
    const links = await db.select().from(noteLinks)

    // 过滤出属于当前用户笔记的链接
    const noteIds = new Set(notes.map(n => n.id))
    const filteredLinks = links.filter(
      link => noteIds.has(link.fromNoteId) && noteIds.has(link.toNoteId)
    )

    // 构建图谱数据
    const nodes = notes.map(note => ({
      id: note.id,
      title: note.title,
      tags: note.tags ? JSON.parse(note.tags) : [],
      createdAt: note.createdAt,
    }))

    const edges = filteredLinks.map(link => ({
      id: link.id,
      from: link.fromNoteId,
      to: link.toNoteId,
      type: link.linkType,
    }))

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        edges,
      },
    })
  } catch (error) {
    console.error('获取知识图谱失败:', error)
    return NextResponse.json({ error: '获取知识图谱失败' }, { status: 500 })
  }
}
