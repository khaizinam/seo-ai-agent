import { ipcMain } from 'electron'
import { getKnex } from '../services/db/knex.service'

export function registerArticleIpc() {
  // ---------- PERSONAS ----------
  ipcMain.handle('persona:list', async () => {
    const db = getKnex()
    return db('personas').orderBy('created_at', 'desc')
  })

  ipcMain.handle('persona:create', async (_e, data: {
    name: string; description?: string; writing_style?: string; tone?: string; example_text?: string; prompt_template?: string
  }) => {
    const db = getKnex()
    const [id] = await db('personas').insert(data)
    return db('personas').where({ id }).first()
  })

  ipcMain.handle('persona:update', async (_e, { id, ...data }: { id: number;[key: string]: unknown }) => {
    const db = getKnex()
    await db('personas').where({ id }).update({ ...data, updated_at: db.fn.now() })
    return db('personas').where({ id }).first()
  })

  ipcMain.handle('persona:delete', async (_e, id: number) => {
    const db = getKnex()
    await db('personas').where({ id }).delete()
    return { success: true }
  })

  // ---------- ARTICLES ----------
  ipcMain.handle('article:list', async (_e, filters?: { status?: string; campaign_id?: number }) => {
    const db = getKnex()
    let q = db('articles')
      .leftJoin('keywords', 'articles.keyword_id', 'keywords.id')
      .leftJoin('personas', 'articles.persona_id', 'personas.id')
      .leftJoin('campaigns', 'keywords.campaign_id', 'campaigns.id')
      .select(
        'articles.*',
        'keywords.keyword',
        'personas.name as persona_name',
        'campaigns.name as campaign_name',
        'campaigns.id as campaign_id'
      )
      .orderBy('articles.created_at', 'desc')

    if (filters?.status) q = q.where('articles.status', filters.status)
    if (filters?.campaign_id) q = q.where('campaigns.id', filters.campaign_id)
    return q
  })

  ipcMain.handle('article:get', async (_e, id: number) => {
    const db = getKnex()
    return db('articles')
      .leftJoin('keywords', 'articles.keyword_id', 'keywords.id')
      .leftJoin('personas', 'articles.persona_id', 'personas.id')
      .select('articles.*', 'keywords.keyword', 'personas.name as persona_name')
      .where('articles.id', id)
      .first()
  })

  ipcMain.handle('article:create', async (_e, data: {
    keyword_id?: number; persona_id?: number; title: string; slug?: string;
    content_html?: string; content_text?: string; meta_title?: string;
    meta_description?: string; status?: string
  }) => {
    const db = getKnex()
    const [id] = await db('articles').insert({ ...data, status: data.status || 'draft' })
    return db('articles').where({ id }).first()
  })

  ipcMain.handle('article:update', async (_e, { id, ...data }: { id: number;[key: string]: unknown }) => {
    const db = getKnex()
    await db('articles').where({ id }).update({ ...data, updated_at: db.fn.now() })
    return db('articles').where({ id }).first()
  })

  ipcMain.handle('article:delete', async (_e, id: number) => {
    const db = getKnex()
    await db('articles').where({ id }).delete()
    return { success: true }
  })

  // ---------- META MANAGER ----------
  // Get all articles for meta management view
  ipcMain.handle('article:metaList', async (_e, filters?: {
    meta_status?: 'auto' | 'edited' | 'approved'; campaign_id?: number
  }) => {
    const db = getKnex()
    let q = db('articles')
      .leftJoin('keywords', 'articles.keyword_id', 'keywords.id')
      .leftJoin('campaigns', 'keywords.campaign_id', 'campaigns.id')
      .select(
        'articles.id', 'articles.title', 'articles.slug',
        'articles.meta_title', 'articles.meta_description',
        'articles.meta_title_status', 'articles.meta_desc_status',
        'articles.seo_score', 'articles.status',
        'keywords.keyword',
        'campaigns.name as campaign_name', 'campaigns.id as campaign_id'
      )
      .orderBy('articles.created_at', 'desc')

    if (filters?.meta_status) q = q.where('articles.meta_title_status', filters.meta_status)
    if (filters?.campaign_id) q = q.where('campaigns.id', filters.campaign_id)
    return q
  })

  // Bulk update meta for multiple articles
  ipcMain.handle('article:bulkUpdateMeta', async (_e, updates: Array<{
    id: number; meta_title?: string; meta_description?: string;
    meta_title_status?: string; meta_desc_status?: string
  }>) => {
    const db = getKnex()
    await Promise.all(updates.map(({ id, ...data }) =>
      db('articles').where({ id }).update({ ...data, updated_at: db.fn.now() })
    ))
    return { success: true, count: updates.length }
  })

  // Approve meta for multiple articles
  ipcMain.handle('article:bulkApproveMeta', async (_e, ids: number[]) => {
    const db = getKnex()
    await db('articles').whereIn('id', ids).update({
      meta_title_status: 'approved',
      meta_desc_status: 'approved',
      updated_at: db.fn.now(),
    })
    return { success: true }
  })

  // Export meta to CSV format
  ipcMain.handle('article:exportMetaCsv', async (_e, ids?: number[]) => {
    const db = getKnex()
    let q = db('articles')
      .leftJoin('keywords', 'articles.keyword_id', 'keywords.id')
      .select('articles.title', 'articles.slug', 'articles.meta_title',
        'articles.meta_description', 'keywords.keyword', 'articles.seo_score')
    if (ids?.length) q = q.whereIn('articles.id', ids)

    const rows = await q
    const header = 'title,slug,keyword,meta_title,meta_description,seo_score\n'
    const csv = rows.map((r: Record<string, string | number>) =>
      [r.title, r.slug, r.keyword, r.meta_title, r.meta_description, r.seo_score]
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n')
    return header + csv
  })

  // ---------- THUMBNAIL PROMPTS ----------
  ipcMain.handle('thumbPrompt:list', async () => {
    const db = getKnex()
    return db('thumbnail_prompts').orderBy('created_at', 'desc')
  })

  ipcMain.handle('thumbPrompt:create', async (_e, data: { name: string; prompt_template: string; style?: string }) => {
    const db = getKnex()
    const [id] = await db('thumbnail_prompts').insert(data)
    return db('thumbnail_prompts').where({ id }).first()
  })

  ipcMain.handle('thumbPrompt:delete', async (_e, id: number) => {
    const db = getKnex()
    await db('thumbnail_prompts').where({ id }).delete()
    return { success: true }
  })
}
