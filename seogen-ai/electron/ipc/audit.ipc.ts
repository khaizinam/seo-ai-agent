import { ipcMain } from 'electron'
import { getKnex } from '../services/db/knex.service'

interface AuditIssue {
  type: 'critical' | 'warning' | 'info'
  message: string
  suggestion: string
}

interface AuditResult {
  score: number
  issues: AuditIssue[]
  suggestions: string[]
  breakdown: Record<string, number>
}

export function registerAuditIpc() {
  ipcMain.handle('audit:run', async (_e, payload: {
    articleId?: number
    title: string
    metaTitle?: string
    metaDescription?: string
    contentHtml: string
    contentText: string
    keyword: string
    slug?: string
  }) => {
    const result = runSeoAudit(payload)

    // Save to DB if articleId provided
    if (payload.articleId) {
      try {
        const db = getKnex()
        await db('seo_audits').insert({
          article_id: payload.articleId,
          score: result.score,
          issues: JSON.stringify(result.issues),
          suggestions: JSON.stringify(result.suggestions),
        })
        // Update article score
        await db('articles').where({ id: payload.articleId }).update({
          seo_score: result.score,
          updated_at: db.fn.now(),
        })
      } catch {
        // DB not connected — return result anyway
      }
    }

    return { success: true, ...result }
  })

  ipcMain.handle('audit:history', async (_e, articleId: number) => {
    const db = getKnex()
    return db('seo_audits').where({ article_id: articleId }).orderBy('audited_at', 'desc').limit(10)
  })
}

function runSeoAudit(payload: {
  title: string; metaTitle?: string; metaDescription?: string;
  contentHtml: string; contentText: string; keyword: string; slug?: string
}): AuditResult {
  const issues: AuditIssue[] = []
  const breakdown: Record<string, number> = {}
  const kw = payload.keyword.toLowerCase()
  const text = payload.contentText.toLowerCase()
  const html = payload.contentHtml

  // 1. Meta Title (10đ)
  const mt = payload.metaTitle || payload.title
  const mtLen = mt.length
  let mtScore = 0
  if (mtLen >= 30 && mtLen <= 60) mtScore += 6
  else issues.push({ type: 'warning', message: `Meta Title dài ${mtLen} ký tự (tối ưu 30-60)`, suggestion: 'Điều chỉnh độ dài meta title về 30-60 ký tự' })
  if (mt.toLowerCase().includes(kw)) mtScore += 4
  else issues.push({ type: 'critical', message: 'Meta Title không chứa từ khoá', suggestion: 'Thêm từ khoá chính vào meta title' })
  breakdown['Meta Title'] = mtScore

  // 2. Meta Description (10đ)
  const md = payload.metaDescription || ''
  const mdLen = md.length
  let mdScore = 0
  if (mdLen >= 80 && mdLen <= 160) mdScore += 6
  else if (mdLen === 0) issues.push({ type: 'critical', message: 'Thiếu Meta Description', suggestion: 'Thêm meta description 80-160 ký tự' })
  else issues.push({ type: 'warning', message: `Meta Desc dài ${mdLen} ký tự (tối ưu 80-160)`, suggestion: 'Điều chỉnh độ dài meta description' })
  if (md.toLowerCase().includes(kw)) mdScore += 4
  else if (mdLen > 0) issues.push({ type: 'warning', message: 'Meta Desc không chứa từ khoá', suggestion: 'Thêm từ khoá vào meta description' })
  breakdown['Meta Description'] = mdScore

  // 3. H1 (10đ)
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/gi)
  let h1Score = 0
  if (!h1Match) issues.push({ type: 'critical', message: 'Không có H1', suggestion: 'Thêm heading H1 chứa từ khoá chính' })
  else if (h1Match.length > 1) issues.push({ type: 'warning', message: `Có ${h1Match.length} H1 (nên có 1)`, suggestion: 'Chỉ dùng 1 H1 duy nhất trên trang' })
  else {
    h1Score += 6
    if (h1Match[0].toLowerCase().includes(kw)) h1Score += 4
    else issues.push({ type: 'warning', message: 'H1 không chứa từ khoá', suggestion: 'Thêm từ khoá chính vào H1' })
  }
  breakdown['H1'] = h1Score

  // 4. H2/H3 structure (10đ)
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length
  let headingScore = 0
  if (h2Count >= 2) headingScore += 7
  else issues.push({ type: 'warning', message: 'Ít hơn 2 heading H2', suggestion: 'Thêm ít nhất 2 H2 để cấu trúc bài viết' })
  if (h3Count >= 1) headingScore += 3
  breakdown['Headings H2/H3'] = headingScore

  // 5. Keyword density (15đ)
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const kwCount = (text.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  const density = wordCount > 0 ? (kwCount / wordCount) * 100 : 0
  let densityScore = 0
  if (density >= 0.8 && density <= 2.5) densityScore = 15
  else if (density < 0.8) issues.push({ type: 'warning', message: `Mật độ từ khoá thấp (${density.toFixed(2)}%)`, suggestion: 'Tăng mật độ từ khoá lên 1-2%' })
  else issues.push({ type: 'warning', message: `Mật độ từ khoá cao (${density.toFixed(2)}%)`, suggestion: 'Giảm số lần dùng từ khoá, tránh nhồi nhét' })
  breakdown['Keyword Density'] = densityScore

  // 6. Content length (10đ)
  let lengthScore = 0
  if (wordCount >= 1500) lengthScore = 10
  else if (wordCount >= 800) lengthScore = 7
  else if (wordCount >= 500) lengthScore = 4
  else issues.push({ type: 'critical', message: `Nội dung ngắn (${wordCount} từ)`, suggestion: 'Viết tối thiểu 800 từ, lý tưởng 1500+ từ' })
  breakdown['Content Length'] = lengthScore

  // 7. Internal links (5đ)
  const intLinks = (html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || []).filter(a => !a.includes('http'))
  let intLinkScore = intLinks.length >= 2 ? 5 : intLinks.length >= 1 ? 3 : 0
  if (intLinks.length === 0) issues.push({ type: 'info', message: 'Không có internal link', suggestion: 'Thêm ít nhất 2 link nội bộ liên quan' })
  breakdown['Internal Links'] = intLinkScore

  // 8. External links (5đ)
  const extLinks = (html.match(/<a[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi) || [])
  let extLinkScore = extLinks.length >= 1 ? 5 : 0
  if (extLinks.length === 0) issues.push({ type: 'info', message: 'Không có external link', suggestion: 'Thêm 1-2 link ngoài uy tín (Wikipedia, nghiên cứu...)' })
  breakdown['External Links'] = extLinkScore

  // 9. Image alt text (5đ)
  const imgs = html.match(/<img[^>]*>/gi) || []
  const imgsWithAlt = imgs.filter(i => /alt=["'][^"']+["']/.test(i))
  let altScore = imgs.length === 0 ? 3 : imgsWithAlt.length === imgs.length ? 5 : Math.round((imgsWithAlt.length / imgs.length) * 5)
  if (imgs.length > 0 && imgsWithAlt.length < imgs.length) {
    issues.push({ type: 'warning', message: `${imgs.length - imgsWithAlt.length}/${imgs.length} ảnh thiếu alt text`, suggestion: 'Thêm alt text mô tả cho tất cả ảnh' })
  }
  breakdown['Image Alt Text'] = altScore

  // 10. Readability (10đ)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : 0
  let readScore = 0
  if (avgSentenceLen <= 20) readScore = 10
  else if (avgSentenceLen <= 25) readScore = 7
  else { readScore = 4; issues.push({ type: 'info', message: `Câu dài (TB ${avgSentenceLen.toFixed(0)} từ/câu)`, suggestion: 'Chia câu dài thành câu ngắn hơn 20 từ' }) }
  breakdown['Readability'] = readScore

  const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const suggestions = [
    ...issues.filter(i => i.type === 'critical').map(i => i.suggestion),
    ...issues.filter(i => i.type === 'warning').map(i => i.suggestion),
  ]

  return { score: Math.min(totalScore, 100), issues, suggestions, breakdown }
}
