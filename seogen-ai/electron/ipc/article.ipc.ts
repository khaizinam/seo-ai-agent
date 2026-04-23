import { ipcMain, app } from 'electron'
import Store from 'electron-store'
import axios from 'axios'
import { join } from 'path'
import { existsSync } from 'fs'
import { readdir, unlink } from 'fs/promises'
import { getKnex, ensureConnection } from '../services/db/knex.service'
import { buildFullArticlePrompt } from '../lib/prompts'
import { DEFAULT_PERSONAS } from '../lib/persona-seeds'

export function registerArticleIpc(store: Store) {
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

  // Seed default personas (only if table is empty)
  ipcMain.handle('persona:seedDefaults', async () => {
    const db = getKnex()
    const count = await db('personas').count('id as cnt').first()
    if (count && Number(count.cnt) > 0) {
      return { success: false, message: 'Bảng personas đã có dữ liệu. Dùng Reset để seed lại.' }
    }
    await db('personas').insert(DEFAULT_PERSONAS)
    return { success: true, count: DEFAULT_PERSONAS.length }
  })

  // Reset personas to default seeds (truncate + re-seed)
  ipcMain.handle('persona:resetToDefaults', async () => {
    const db = getKnex()
    try {
      await db('personas').del()
      await db('personas').insert(DEFAULT_PERSONAS)
      return { success: true, count: DEFAULT_PERSONAS.length }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ---------- ARTICLES ----------
  ipcMain.handle('article:list', async (_e, filters?: { status?: string; campaign_id?: number }) => {
    const db = await ensureConnection(store)
    let q = db('articles')
      .leftJoin('keywords', 'articles.keyword_id', 'keywords.id')
      .leftJoin('personas', 'articles.persona_id', 'personas.id')
      .leftJoin('campaigns', 'articles.campaign_id', 'campaigns.id')
      .select(
        'articles.*',
        'keywords.keyword as keyword_from_db',
        'personas.name as persona_name',
        'campaigns.name as campaign_name'
      )
      .orderBy('articles.week_number', 'asc')
      .orderBy('articles.created_at', 'desc')

    if (filters?.status) q = q.where('articles.status', filters.status)
    if (filters?.campaign_id) q = q.where('articles.campaign_id', filters.campaign_id)
    return q
  })

  ipcMain.handle('article:get', async (_e, id: number) => {
    const db = await ensureConnection(store)
    return db('articles')
      .leftJoin('keywords', 'articles.keyword_id', 'keywords.id')
      .leftJoin('personas', 'articles.persona_id', 'personas.id')
      .select('articles.*', 'keywords.keyword as keyword_from_db', 'personas.name as persona_name')
      .where('articles.id', id)
      .first()
  })

  ipcMain.handle('article:create', async (_e, data: {
    keyword_id?: number; persona_id?: number; title: string; slug?: string;
    content_html?: string; content_text?: string; meta_title?: string;
    meta_description?: string; content_social?: string; status?: string
  }) => {
    const db = getKnex()
    const [id] = await db('articles').insert({ ...data, status: data.status || 'draft' })
    return db('articles').where({ id }).first()
  })

  ipcMain.handle('article:update', async (_e, { id, ...data }: { id: number;[key: string]: unknown }) => {
    try {
      const db = getKnex()
      await db('articles').where({ id }).update({ ...data, updated_at: db.fn.now() })
      const updated = await db('articles').where({ id }).first()
      return { success: true, article: updated }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('article:delete', async (_e, id: number) => {
    const db = getKnex()
    await db('articles').where({ id }).delete()
    
    // Clean up associated generated thumbnail images
    try {
      const thumbDir = join(app.getPath('userData'), 'thumbnails')
      if (existsSync(thumbDir)) {
        const files = await readdir(thumbDir)
        const suffix = `_${id}.jpg`
        for (const file of files) {
          if (file.endsWith(suffix) && file.startsWith('thumb_')) {
            await unlink(join(thumbDir, file)).catch(() => {})
          }
        }
      }
    } catch (e) {
      console.error('Lỗi khi xoá ảnh thumbnail:', e)
    }

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

  // ---------- ARTICLE WRITER ----------
  ipcMain.handle('article:generateFullContent', async (_e, { articleId, personaId }: { articleId: number; personaId: number }) => {
    const config = store.get('aiConfig') as any
    if (!config) return { success: false, error: 'Chưa cấu hình AI API key' }

    const db = getKnex()
    const article = await db('articles').where({ id: articleId }).first()
    const campaign = await db('campaigns').where({ id: article.campaign_id }).first()
    const persona = await db('personas').where({ id: personaId }).first()

    if (!article || !persona) return { success: false, error: 'Không tìm thấy bài viết hoặc nhân vật' }

    const lang = (store.get('outputLanguage') as string) || 'Vietnamese'
    const prompt = buildFullArticlePrompt(
      persona,
      campaign,
      { title: article.title, keyword: article.keyword || article.title, meta_description: article.meta_description },
      lang
    )

    try {
      const activeProfile = config.profiles?.find((p: any) => p.active)
      const provider = activeProfile?.provider || config.defaultProvider || 'gemini'
      const apiKey = activeProfile?.apiKey || (provider === 'gemini' ? config.geminiKey : provider === 'claude' ? config.claudeKey : config.copilotKey)
      const model = activeProfile?.model || (provider === 'gemini' ? config.geminiModel : provider === 'claude' ? config.claudeModel : config.copilotModel) || (provider === 'gemini' ? 'gemini-2.0-flash' : provider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o')

      let rawResponse = ''
      if (provider === 'gemini') {
        const geminiBody = { contents: [{ role: 'user', parts: [{ text: prompt }] }] }
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, geminiBody, { timeout: 300000 })
        rawResponse = res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else if (provider === 'copilot') {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', { model, messages: [{ role: 'user', content: prompt }] }, { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 300000 })
        rawResponse = res.data.choices?.[0]?.message?.content || ''
      } else if (provider === 'claude') {
        const res = await axios.post('https://api.anthropic.com/v1/messages', { model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, timeout: 300000 })
        rawResponse = res.data.content?.[0]?.text || ''
      }

      // Cleanup response if AI wrapped it in markdown code blocks
      let html = rawResponse.replace(/```html|```/g, '').trim()
      
      // Update article in DB
      await db('articles').where({ id: articleId }).update({
        content_html: html,
        persona_id: personaId,
        status: 'reviewed',
        updated_at: db.fn.now()
      })

      return { success: true, content: html }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
