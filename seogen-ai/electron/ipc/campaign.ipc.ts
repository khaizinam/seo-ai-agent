import { ipcMain, dialog } from 'electron'
import Store from 'electron-store'
import axios from 'axios'
import { CampaignRepository } from '../repositories/campaign.repository'
import { KeywordRepository } from '../repositories/keyword.repository'

export function registerCampaignIpc(store: Store) {
  const campaignRepo = new CampaignRepository()
  const keywordRepo = new KeywordRepository()

  // ---------- CAMPAIGNS ----------
  ipcMain.handle('campaign:list', async () => {
    return campaignRepo.findAll()
  })

  ipcMain.handle('campaign:get', async (_e, id: number) => {
    return campaignRepo.findById(id)
  })

  ipcMain.handle('campaign:create', async (_e, data: { name: string; description?: string, status?: string }) => {
    return campaignRepo.create({
      name: data.name,
      description: data.description,
      status: (data.status as 'active' | 'paused' | 'done') || 'active'
    })
  })

  ipcMain.handle('campaign:update', async (_e, { id, ...data }: { id: number; name?: string; description?: string; status?: string }) => {
    return campaignRepo.update(id, data as any)
  })

  ipcMain.handle('campaign:delete', async (_e, id: number) => {
    await campaignRepo.delete(id)
    return { success: true }
  })

  // ---------- KEYWORDS ----------
  ipcMain.handle('keyword:list', async (_e, campaignId: number) => {
    return keywordRepo.findByCampaignId(campaignId)
  })

  ipcMain.handle('keyword:create', async (_e, data: {
    campaign_id: number; keyword: string; volume?: number; difficulty?: number; intent?: string; status?: string
  }) => {
    return keywordRepo.create(data as any)
  })

  ipcMain.handle('keyword:bulkCreate', async (_e, { campaign_id, keywords }: { campaign_id: number; keywords: string[] }) => {
    const count = await keywordRepo.bulkCreate(campaign_id, keywords)
    return { success: true, count }
  })

  ipcMain.handle('keyword:updateStatus', async (_e, { id, status }: { id: number; status: string }) => {
    await keywordRepo.updateStatus(id, status)
    return { success: true }
  })

  ipcMain.handle('keyword:delete', async (_e, id: number) => {
    await keywordRepo.delete(id)
    return { success: true }
  })

  // ---------- AI ASSISTANT ----------
  ipcMain.handle('campaign:aiSuggestKeywords', async (_e, { id, name, description }: { id: number; name: string; description: string }) => {
    const config = store.get('aiConfig') as any
    if (!config) return { success: false, error: 'Chưa cấu hình AI API key' }

    // Get current keywords to avoid exact duplicates or to help AI context
    const currentKws = await keywordRepo.findByCampaignId(id)
    const kwList = currentKws.map(k => k.keyword).join(', ')

    const prompt = `Bạn là chuyên gia SEO. Tôi có một chiến dịch SEO:
Tên: "${name}"
Mô tả: "${description}"
Danh sách từ khoá hiện tại: [${kwList}]

Nhiệm vụ: Hãy phân tích và đề xuất một danh sách từ khoá SEO mới, toàn diện, bao gồm cả các từ khoá hiện tại (nếu còn tốt) và các từ khoá mới tiềm năng.
Yêu cầu:
1. Tập trung vào các từ khoá có Intent rõ ràng (informational, commercial, transactional, navigational).
2. Danh sách khoảng 15-30 từ khoá.
3. Chỉ trả về JSON thuần, không markdown, theo định dạng:
[
  {"keyword": "...", "intent": "informational"},
  {"keyword": "...", "intent": "transactional"}
]`

    try {
      // Find active profile or default
      const activeProfile = config.profiles?.find((p: any) => p.active)
      const provider = activeProfile?.provider || config.defaultProvider || 'gemini'
      const apiKey = activeProfile?.apiKey || (provider === 'gemini' ? config.geminiKey : provider === 'claude' ? config.claudeKey : config.copilotKey)
      const model = activeProfile?.model || (provider === 'gemini' ? config.geminiModel : provider === 'claude' ? config.claudeModel : config.copilotModel) || (provider === 'gemini' ? 'gemini-2.0-flash' : provider === 'claude' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o')

      let rawResponse = ''
      if (provider === 'gemini') {
        const geminiBody = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        }
        const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, geminiBody)
        rawResponse = res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else if (provider === 'copilot') {
        const res = await axios.post('https://api.openai.com/v1/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }]
        }, { headers: { Authorization: `Bearer ${apiKey}` } })
        rawResponse = res.data.choices?.[0]?.message?.content || ''
      } else if (provider === 'claude') {
        const res = await axios.post('https://api.anthropic.com/v1/messages', {
            model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
        }, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' } })
        rawResponse = res.data.content?.[0]?.text || ''
      }

      const jsonMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (!jsonMatch) throw new Error('AI không trả về danh sách JSON hợp lệ')
      const suggested = JSON.parse(jsonMatch[0])

      return { success: true, keywords: suggested }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('campaign:syncKeywords', async (_e, { campaignId, keywords }: { campaignId: number; keywords: any[] }) => {
    const count = await keywordRepo.syncKeywords(campaignId, keywords)
    return { success: true, count }
  })

  // ---------- CONTENT PLANNER ----------
  
  ipcMain.handle('campaign:aiSuggestTime', async (_e, { name, description, keywords }: any) => {
    const config = store.get('aiConfig') as any
    if (!config) return { success: false, error: 'Chưa cấu hình AI API key' }

    const prompt = `Bạn là chuyên gia phân tích SEO. Dựa vào chiến dịch:
Tên: "${name}"
Mô tả: "${description}"
Cụm từ khoá: [${keywords}]

Nhiệm vụ: Phân bổ số tuần chạy (duration_value) và mật độ bài viết/tuần (articles_per_week) hợp lý nhất cho chiến dịch này để phủ tối đa từ khoá nhưng không spam. 
Yêu cầu: Tổng bài (tuần x mật độ) nên nằm trong khoảng 5 -> 30 bài tùy theo độ phức tạp.
Chỉ trả về độ dài bằng JSON nguyên bản, không dùng block code:
{ "duration_value": 4, "articles_per_week": 3 }`

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

      const jsonMatch = rawResponse.match(/\{\s*"duration_value"[\s\S]*\}\s*/)
      if (!jsonMatch) throw new Error('AI không trả về khối JSON hợp lệ hoặc không có kết quả')
      const result = JSON.parse(jsonMatch[0])

      return { success: true, duration_value: result.duration_value, articles_per_week: result.articles_per_week }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('campaign:generateContentPlan', async (_e, { id, name, description, duration_type, duration_value, articles_per_week }: any) => {
    const config = store.get('aiConfig') as any
    if (!config) return { success: false, error: 'Chưa cấu hình AI API key' }

    // Get current keywords to help AI context
    const currentKws = await keywordRepo.findByCampaignId(id)
    const kwList = currentKws.map(k => k.keyword).join(', ')

    // Context for Append-Only Mode
    const db = (campaignRepo as any).db;
    const existingArticles = await db('articles').where({ campaign_id: id }).select('title', 'article_type', 'week_number', 'keyword');
    const existingCount = existingArticles.length;
    
    // Default fallback to 4 if not provided
    const apw = articles_per_week || 4;
    const targetCount = duration_value * apw;
    const missingCount = targetCount - existingCount;

    if (missingCount <= 0) {
      return { success: false, error: 'Kế hoạch đã có đủ số bài theo mục tiêu Mật độ. Tăng số tuần hoặc tăng mật độ/tuần để lập thêm.' }
    }

    let existingCsv = 'Chưa có bài viết nào.'
    if (existingCount > 0) {
      existingCsv = existingArticles.map((a: any) => `Tuần ${a.week_number}, Loại: ${a.article_type}, Tiêu đề: "${a.title}", Từ khoá: "${a.keyword}"`).join('\n')
    }

    const prompt = `Bạn là chuyên gia lập kế hoạch nội dung SEO (Content Plan). Tôi có một chiến dịch SEO:
Tên: "${name}"
Mô tả: "${description}"
Thời gian chạy: ${duration_value} ${duration_type === 'weeks' ? 'tuần' : 'tháng'}
Mật độ mục tiêu: ${apw} bài / ${duration_type === 'weeks' ? 'tuần' : 'tháng'}
Danh sách từ khoá mục tiêu: [${kwList}]

=== DANH SÁCH BÀI VIẾT ĐÃ CÓ (Đã được lên lịch) ===
${existingCsv}
===================================================

Nhiệm vụ: Tạo bổ sung CHÍNH XÁC ${missingCount} bài viết MỚI HOÀN TOÀN để bù đắp vào các tuần còn trống/thiếu theo mật độ mục tiêu. 
TUYỆT ĐỐI KHÔNG trả lại hay xoá các bài viết đã có trong danh sách trên!

Yêu cầu các bài MỚI:
1. Tiếp nối logic và không được trùng lặp với tiêu đề đã có.
2. Từ khoá phải lấy từ [Danh sách từ khoá mục tiêu].
3. Mỗi bài viết mới phải có:
   - "title": Tiêu đề thu hút, chuẩn SEO.
   - "article_type": "pillar" hoặc "satellite".
   - "week_number": Số thứ tự ${duration_type === 'weeks' ? 'tuần' : 'tháng'} (từ 1 đến ${duration_value}). (Chú ý cân đối vào các tuần chưa đủ ${apw} bài)
   - "keyword": Từ khoá chính cho bài đó.
   - "meta_title": Meta title tối ưu (≤ 60 ký tự).
   - "meta_description": Meta description hấp dẫn (≤ 160 ký tự).
4. Chỉ trả về JSON thuần danh sách các bài bổ sung, không markdown, theo định dạng:
[
  {
    "title": "...",
    "article_type": "pillar",
    "week_number": 1,
    "keyword": "...",
    "meta_title": "...",
    "meta_description": "..."
  }
]`

    try {
      // Reuse AI logic (should probably be moved to a service)
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

      const jsonMatch = rawResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (!jsonMatch) throw new Error('AI không trả về danh sách JSON hợp lệ')
      const plan = JSON.parse(jsonMatch[0])

      // Save plan items to 'articles' table (APPEND mode)
      const rows = plan.map((item: any) => ({
        campaign_id: id,
        title: item.title,
        article_type: item.article_type,
        week_number: item.week_number,
        keyword: item.keyword,
        meta_title: item.meta_title,
        meta_description: item.meta_description,
        status: 'draft',
      }))
      
      if (rows.length > 0) {
        await db('articles').insert(rows)
      }

      return { success: true, count: rows.length }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // ─── Export Campaign Report as .md ───
  ipcMain.handle('campaign:exportReport', async (_e, campaignId: number) => {
    try {
      const { getKnex } = await import('../services/db/knex.service')
      const db = getKnex()

      // Gather data
      const campaign = await db('campaigns').where({ id: campaignId }).first()
      if (!campaign) return { success: false, error: 'Campaign not found' }

      const keywords = await db('keywords').where({ campaign_id: campaignId }).orderBy('intent')
      const articles = await db('articles').where({ campaign_id: campaignId }).orderBy('week_number').orderBy('article_type')

      // Build markdown
      const lines: string[] = []
      lines.push(`# Campaign Report: ${campaign.name}`)
      lines.push('')
      lines.push('## Campaign Overview')
      lines.push('')
      lines.push(`- **Name:** ${campaign.name}`)
      lines.push(`- **Description:** ${campaign.description || 'N/A'}`)
      lines.push(`- **Status:** ${campaign.status || 'active'}`)
      lines.push(`- **Duration:** ${campaign.duration_value || 4} ${campaign.duration_type || 'weeks'}`)
      lines.push(`- **Articles per week:** ${campaign.articles_per_week || 4}`)
      lines.push(`- **Total keywords:** ${keywords.length}`)
      lines.push(`- **Total planned articles:** ${articles.length}`)
      lines.push('')

      // Keywords by intent
      lines.push('## Keywords by Intent')
      lines.push('')
      const intentGroups: Record<string, typeof keywords> = {}
      for (const kw of keywords) {
        const intent = kw.intent || 'informational'
        if (!intentGroups[intent]) intentGroups[intent] = []
        intentGroups[intent].push(kw)
      }
      for (const [intent, kws] of Object.entries(intentGroups)) {
        lines.push(`### ${intent.charAt(0).toUpperCase() + intent.slice(1)} (${kws.length})`)
        lines.push('')
        for (const kw of kws) {
          const meta = []
          if (kw.volume) meta.push(`volume: ${kw.volume}`)
          if (kw.difficulty) meta.push(`difficulty: ${kw.difficulty}`)
          lines.push(`- ${kw.keyword}${meta.length ? ` *(${meta.join(', ')})*` : ''}`)
        }
        lines.push('')
      }

      // Articles by week
      lines.push('## Content Plan by Week')
      lines.push('')
      const weekGroups: Record<number, typeof articles> = {}
      for (const art of articles) {
        const wk = art.week_number || 1
        if (!weekGroups[wk]) weekGroups[wk] = []
        weekGroups[wk].push(art)
      }
      for (const [week, arts] of Object.entries(weekGroups).sort(([a], [b]) => +a - +b)) {
        lines.push(`### Week ${week}`)
        lines.push('')
        lines.push('| # | Type | Title | Keyword | Status |')
        lines.push('|---|------|-------|---------|--------|')
        for (let i = 0; i < arts.length; i++) {
          const art = arts[i]
          const type = art.article_type === 'pillar' ? '**PILLAR**' : 'Satellite'
          const kw = art.keyword || '-'
          const status = art.status || 'draft'
          lines.push(`| ${i + 1} | ${type} | ${art.title} | ${kw} | ${status} |`)
        }
        lines.push('')
      }

      // Footer
      lines.push('---')
      lines.push(`*Generated on ${new Date().toISOString().split('T')[0]} by SEOGen AI*`)
      lines.push('')

      const mdContent = lines.join('\n')

      // Show save dialog
      const slugName = campaign.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase()
      const result = await dialog.showSaveDialog({
        title: 'Export Campaign Report',
        defaultPath: `campaign_report_${slugName}.md`,
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'cancelled' }
      }

      const fs = await import('fs')
      fs.writeFileSync(result.filePath, mdContent, 'utf-8')

      return { success: true, filePath: result.filePath }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
