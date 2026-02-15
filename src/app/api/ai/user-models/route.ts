/**
 * 用户 AI 模型配置 API
 * 管理用户选择的模型列表和默认模型
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { aiModels, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'

// export const runtime = 'edge'

/**
 * GET - 获取用户的所有模型配置
 * 根据用户当前的配置模式,只返回对应模式的模型
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    // 获取用户的配置模式
    const user = await db
      .select({ configMode: users.configMode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const configMode = user[0]?.configMode || 'openrouter'

    // 只返回当前配置模式的模型
    const models = await db
      .select()
      .from(aiModels)
      .where(
        and(
          eq(aiModels.userId, userId),
          eq(aiModels.configMode, configMode)
        )
      )

    return NextResponse.json({
      success: true,
      data: models,
    })
  } catch (error) {
    console.error('获取模型配置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取模型配置失败' },
      { status: 500 }
    )
  }
}

/**
 * POST - 批量保存用户的模型配置
 * 保存时会标记当前配置模式,以便后续读取
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json() as {
      models: Array<{ id: string; name: string; provider: string }>
      defaultModelId?: string
    }
    const { models: modelList, defaultModelId } = body

    console.log('[User Models POST] 接收到的数据:', { 
      modelCount: modelList?.length, 
      defaultModelId, 
      userId 
    })

    if (!Array.isArray(modelList) || modelList.length === 0) {
      return NextResponse.json(
        { success: false, error: '模型列表不能为空' },
        { status: 400 }
      )
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    // 获取用户的配置模式
    const user = await db
      .select({ configMode: users.configMode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const configMode = user[0]?.configMode || 'openrouter'
    console.log('[User Models POST] 用户配置模式:', configMode)

    // 提取当前要保存的厂商列表（从模型 ID 中提取）
    const currentProviders = new Set<string>()
    modelList.forEach(model => {
      // 模型 ID 格式：provider/modelId
      const provider = model.id.split('/')[0]
      if (provider) {
        currentProviders.add(provider)
      }
    })
    console.log('[User Models POST] 当前保存的厂商:', Array.from(currentProviders))

    // 只删除当前要保存的厂商的模型配置（叠加模式）
    // 这样可以保留其他厂商的模型配置
    if (currentProviders.size > 0) {
      for (const provider of currentProviders) {
        try {
          // 删除该厂商的旧模型配置
          // 通过 modelId 的前缀匹配来识别厂商
          const existingModels = await db
            .select()
            .from(aiModels)
            .where(
              and(
                eq(aiModels.userId, userId),
                eq(aiModels.configMode, configMode)
              )
            )
          
          // 过滤出属于当前厂商的模型
          const providerModelIds = existingModels
            .filter(m => m.modelId.startsWith(`${provider}/`))
            .map(m => m.id)
          
          if (providerModelIds.length > 0) {
            // 逐个删除（避免 IN 查询的限制）
            for (const id of providerModelIds) {
              await db
                .delete(aiModels)
                .where(eq(aiModels.id, id))
            }
            console.log('[User Models POST] 已删除厂商 %s 的 %d 个旧模型', provider, providerModelIds.length)
          }
        } catch (deleteError) {
          console.error('[User Models POST] 删除厂商 %s 的旧模型配置失败:', provider, deleteError)
          // 继续执行,可能是因为没有旧数据
        }
      }
    }

    // 准备新的模型配置
    const newModels = modelList.map((model) => ({
      id: crypto.randomUUID(),
      userId: userId,
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      configMode: configMode,
      isSelected: true,
      isDefault: model.id === defaultModelId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    // SQLite 限制：最多 999 个绑定变量
    // 每个模型有 10 个字段，所以每批最多插入 99 个模型
    // 为了安全起见，我们每批插入 50 个
    const BATCH_SIZE = 50
    const totalBatches = Math.ceil(newModels.length / BATCH_SIZE)

    console.log('[User Models POST] 准备插入 %d 个模型，分 %d 批', 
      newModels.length, 
      totalBatches
    )

    // 分批插入，避免超过 SQLite 的 999 变量限制
    for (let i = 0; i < newModels.length; i += BATCH_SIZE) {
      const batch = newModels.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      
      try {
        await db.insert(aiModels).values(batch)
        console.log('[User Models POST] 批次 %d/%d 插入成功 (%d 个模型)', 
          batchNumber,
          totalBatches,
          batch.length
        )
      } catch (batchError) {
        console.error('[User Models POST] 批次 %d 插入失败:', batchNumber, batchError)
        throw new Error(`批次 ${batchNumber} 插入失败: ${batchError instanceof Error ? batchError.message : '未知错误'}`)
      }
    }

    console.log('[User Models POST] 所有模型保存成功')

    return NextResponse.json({
      success: true,
      data: { count: newModels.length },
    })
  } catch (error) {
    console.error('[User Models POST] 保存模型配置失败:', error)
    return NextResponse.json(
      { success: false, error: `保存模型配置失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}

/**
 * PUT - 添加单个模型到用户配置
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json() as {
      modelId: string
      modelName: string
      provider: string
      setAsDefault?: boolean
    }
    const { modelId, modelName, provider, setAsDefault } = body

    if (!modelId || !modelName || !provider) {
      return NextResponse.json(
        { success: false, error: '模型信息不完整' },
        { status: 400 }
      )
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    // 获取用户的配置模式
    const user = await db
      .select({ configMode: users.configMode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const configMode = user[0]?.configMode || 'openrouter'

    // 检查模型是否已存在
    const existing = await db
      .select()
      .from(aiModels)
      .where(
        and(
          eq(aiModels.userId, userId),
          eq(aiModels.modelId, modelId),
          eq(aiModels.configMode, configMode)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: '模型已存在',
      })
    }

    // 如果设置为默认，先取消其他模型的默认状态
    if (setAsDefault) {
      await db
        .update(aiModels)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(aiModels.userId, userId),
            eq(aiModels.configMode, configMode)
          )
        )
    }

    // 插入新模型
    await db.insert(aiModels).values({
      id: crypto.randomUUID(),
      userId: userId,
      modelId: modelId,
      modelName: modelName,
      provider: provider,
      configMode: configMode,
      isSelected: true,
      isDefault: setAsDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: '模型已添加',
    })
  } catch (error) {
    console.error('[User Models PUT] 添加模型失败:', error)
    return NextResponse.json(
      { success: false, error: `添加模型失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}

/**
 * PATCH - 更新默认模型
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json() as { modelId: string }
    const { modelId } = body

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: '模型 ID 不能为空' },
        { status: 400 }
      )
    }

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    // 将所有模型的 isDefault 设为 false
    await db
      .update(aiModels)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(aiModels.userId, userId))

    // 将指定模型的 isDefault 设为 true
    await db
      .update(aiModels)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(aiModels.userId, userId),
          eq(aiModels.modelId, modelId)
        )
      )

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('更新默认模型失败:', error)
    return NextResponse.json(
      { success: false, error: '更新默认模型失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - 删除模型配置
 * 如果提供 modelId 参数,删除指定模型
 * 如果不提供 modelId 参数,删除用户当前配置模式下的所有模型配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const modelId = searchParams.get('modelId')

    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    if (modelId) {
      // 删除指定模型
      await db
        .delete(aiModels)
        .where(
          and(
            eq(aiModels.userId, userId),
            eq(aiModels.modelId, modelId)
          )
        )
    } else {
      // 获取用户的配置模式
      const user = await db
        .select({ configMode: users.configMode })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      const configMode = user[0]?.configMode || 'openrouter'

      // 删除用户当前配置模式下的所有模型配置
      await db
        .delete(aiModels)
        .where(
          and(
            eq(aiModels.userId, userId),
            eq(aiModels.configMode, configMode)
          )
        )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('删除模型配置失败:', error)
    return NextResponse.json(
      { success: false, error: '删除模型配置失败' },
      { status: 500 }
    )
  }
}
