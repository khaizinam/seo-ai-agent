import { ipcMain } from 'electron'
import Store from 'electron-store'
import axios from 'axios'
import { getKnex } from '../services/db/knex.service'

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

  // ---------- ARTICLES ----------
  ipcMain.handle('article:list', async (_e, filters?: { status?: string; campaign_id?: number }) => {
    const db = getKnex()
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
    const db = getKnex()
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

  // ---------- ARTICLE WRITER ----------
  ipcMain.handle('article:generateFullContent', async (_e, { articleId, personaId }: { articleId: number; personaId: number }) => {
    const config = store.get('aiConfig') as any
    if (!config) return { success: false, error: 'Chưa cấu hình AI API key' }

    const db = getKnex()
    const article = await db('articles').where({ id: articleId }).first()
    const campaign = await db('campaigns').where({ id: article.campaign_id }).first()
    const persona = await db('personas').where({ id: personaId }).first()

    if (!article || !persona) return { success: false, error: 'Không tìm thấy bài viết hoặc nhân vật' }

    const prompt = `Bạn là một chuyên gia viết bài SEO. Hãy viết một bài viết hoàn chỉnh dựa trên các thông tin sau:
Nhân vật viết bài (Persona): "${persona.name}" - ${persona.description}
Phong cách viết: ${persona.writing_style}
Giọng văn: ${persona.tone}

Thông tin chiến dịch:
Tên chiến dịch: "${campaign?.name}"
Mô tả: "${campaign?.description}"

Thông tin bài viết:
Tiêu đề: "${article.title}"
Từ khoá chính: "${article.keyword || article.title}"
Mô tả (Meta Description): "${article.meta_description}"

Yêu cầu về nội dung:
1. Độ dài: 1000 - 2000 từ.
2. Cấu trúc bài viết mạch lạc, sử dụng các thẻ tiêu đề H2-H6. KHÔNG sử dụng thẻ H1 (vì H1 đã được dùng cho tiêu đề trang).
3. KHÔNG sử dụng Table of Contents hoặc phần mở đầu giới thiệu về blog. Tập trung thẳng vào nội dung.
4. KHÔNG sử dụng Markdown. CHỈ sử dụng HTML thuần túy.
5. Chỉ sử dụng các thẻ: <h2>, <h3>, <h4>, <h5>, <h6>, <p>, <a>, <strong>. KHÔNG sử dụng các thẻ danh sách như <ul>, <ol>, <li>.
6. Thay vì dùng danh sách (ul/li), hãy trình bày các ý dưới dạng các đoạn văn (p) hoặc tiêu đề con.
7. Output phải là mã HTML nén (minified), không có khoảng trắng thừa, không có xuống dòng giữa các thẻ.

Hãy chỉ trả về nội dung bên trong cặp thẻ <div>...</div>.`

    try {
      const activeProfile = config.profiles?.find((p: any) => p.active)
      const provider = activeProfile?.provider || config.defaultProvider || 'gemini'
      const apiKey = activeProfile?.apiKey || (provider === 'gemini' ? config.geminiKey : provider === 'claude' ? config.claudeKey : config.copilotKey)
      const model = activeProfile?.model || (provider === 'gemini' ? config.geminiModel : provider === 'claude' ? config.claudeModel : config.copilotModel) || (provider === 'gemini' ? 'gemini-2.0-flash' : provider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o')

      let rawResponse = ''
      if (provider === 'gemini') {
        const geminiBody = { contents: [{ role: 'user', parts: [{ text: prompt }] }] }
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, geminiBody)
        rawResponse = res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else if (provider === 'copilot') {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', { model, messages: [{ role: 'user', content: prompt }] }, { headers: { Authorization: `Bearer ${apiKey}` } })
        rawResponse = res.data.choices?.[0]?.message?.content || ''
      } else if (provider === 'claude') {
        const res = await axios.post('https://api.anthropic.com/v1/messages', { model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } })
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
