import TurndownService from 'turndown'
import { marked } from 'marked'

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

/**
 * Convert HTML to Markdown
 */
export function htmlToMarkdown(html: string): string {
  return td.turndown(html)
}

/**
 * Convert HTML to plain text (strips all tags)
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Convert Markdown to HTML
 */
export async function markdownToHtml(md: string): Promise<string> {
  return marked.parse(md)
}

/**
 * Count words in HTML content
 */
export function countWords(html: string): number {
  const text = htmlToText(html)
  return text.split(/\s+/).filter(Boolean).length
}

/**
 * Extract first image src from HTML
 */
export function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
  return match ? match[1] : null
}

/**
 * Generate slug from Vietnamese text
 */
export function generateSlug(text: string): string {
  const map: Record<string, string> = {
    'à|á|ã|ả|ạ|ă|ắ|ặ|ằ|ẳ|ẵ|â|ấ|ầ|ẩ|ẫ|ậ': 'a',
    'è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ': 'e', 'ì|í|ị|ỉ|ĩ': 'i',
    'ò|ó|õ|ọ|ỏ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ': 'o',
    'ù|ú|ụ|ủ|ũ|ư|ứ|ừ|ử|ữ|ự': 'u', 'ỳ|ý|ỵ|ỷ|ỹ': 'y',
    'đ': 'd',
    'À|Á|Ã|Ả|Ạ|Ă|Ắ|Ặ|Ằ|Ẳ|Ẵ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ': 'a',
    'È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ': 'e', 'Ì|Í|Ị|Ỉ|Ĩ': 'i',
    'Ò|Ó|Õ|Ọ|Ỏ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ': 'o',
    'Ù|Ú|Ụ|Ủ|Ũ|Ư|Ứ|Ừ|Ử|Ữ|Ự': 'u', 'Ỳ|Ý|Ỵ|Ỷ|Ỹ': 'y', 'Đ': 'd',
  }
  let slug = text.toLowerCase()
  for (const [pattern, replacement] of Object.entries(map)) {
    slug = slug.replace(new RegExp(pattern, 'g'), replacement)
  }
  return slug.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}
