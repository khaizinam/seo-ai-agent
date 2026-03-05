/**
 * Centralized AI Prompt Builders (Frontend)
 * All prompts written in concise English to save tokens.
 * Output language is configurable via the `lang` parameter (default: 'Vietnamese').
 */

// ─── Helper: Strip HTML to plain text ───

export function stripHtmlToText(html: string, maxLength = 1500): string {
  return html
    .replace(/<[^>]*>/g, ' ')       // Remove all HTML tags
    .replace(/&[a-zA-Z]+;/g, ' ')   // Remove HTML entities
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .trim()
    .substring(0, maxLength)
}
// ─── Article Generation ───

export function buildArticleSystemPrompt(personaName?: string, lang = 'Vietnamese'): string {
  if (personaName) {
    return `You are "${personaName}", a top-tier SEO content strategist. Write professional, engaging articles that rank well on Google and deliver real value to readers. You understand E-E-A-T principles deeply.\nOutput language: ${lang}.`
  }
  return `You are a top-tier SEO content strategist with deep expertise in on-page SEO, E-E-A-T, and user engagement. Write natural, authoritative, value-driven articles.\nOutput language: ${lang}.`
}

export function buildArticleUserPrompt(
  keyword: string,
  title?: string,
  lang = 'Vietnamese',
  campaignContext?: {
    campaignName?: string
    campaignDescription?: string
    relatedKeywords?: string
  }
): string {
  const campaignBlock = campaignContext?.campaignName
    ? `\nCAMPAIGN CONTEXT:
Campaign: "${campaignContext.campaignName}"
Description: ${campaignContext.campaignDescription || 'N/A'}
${campaignContext.relatedKeywords ? `Related keywords in this campaign: [${campaignContext.relatedKeywords}]` : ''}
The article must align with this campaign's theme, features, and target audience. Reference the campaign's services/products naturally where appropriate.`
    : ''

  return `Write a complete SEO article for the keyword: "${keyword}"
${title ? `Title: "${title}"` : ''}
${campaignBlock}

SEO & KEYWORD RULES:
- Place the main keyword naturally in the FIRST H2 heading.
- Include the keyword within the first 100 words of the article.
- Use the keyword again in the conclusion/final paragraph.
- Overall keyword density: 1-2%. Never stuff keywords unnaturally.
- Use 2-3 LSI/semantically related keywords throughout the article (synonyms, related terms).${campaignContext?.relatedKeywords ? '\n- Where natural, reference other related keywords from the campaign to build topical authority.' : ''}

CONTENT STRUCTURE:
- Start with an engaging hook (2-3 sentences that capture attention — a question, a surprising fact, or a pain point).
- Organize into clear sections with H2/H3 headings. Use H4-H6 for deeper subsections when needed.
- Flow: Hook intro → Problem/Context → Main content sections → Practical examples/data → Conclusion with CTA.
- End with a strong conclusion that summarizes key takeaways and includes a subtle call-to-action.
- Use smooth transition phrases between sections for natural reading flow.

E-E-A-T (Experience, Expertise, Authority, Trust):
- Include at least 1-2 specific data points, statistics, or real-world examples to build authority.
- Reference practical experience or expert insights where relevant.
- Write with confidence and depth — avoid vague or generic statements.

READABILITY:
- Keep paragraphs short: 2-4 sentences maximum.
- Use <strong> to bold key phrases and important terms naturally (not just the keyword).
- Vary sentence length for rhythm. Prefer clear, direct language.

HTML FORMAT RULES:
- HTML format only (no <html><body> wrappers, inner content only).
- Use H2-H6 headings. Do NOT use H1.
- By default, use well-structured paragraphs (<p>) instead of list tags.
- EXCEPTION: For technical/tutorial/report content that naturally requires enumeration, you MAY use <ul>/<ol>/<li> with inline CSS:
  <ul style="padding-left:20px;margin:12px 0;list-style-type:disc">
    <li style="margin-bottom:8px;line-height:1.6">...</li>
  </ul>
- Length: 1000-1500 words.
- Output minified HTML only. No markdown, no explanations, no wrappers.
Output language: ${lang}.`
}

// ─── Social Content Generation ───

export function buildSocialSystemPrompt(personaName?: string, lang = 'Vietnamese'): string {
  if (personaName) {
    return `You are "${personaName}". Write engaging social media promotional content.\nOutput language: ${lang}.`
  }
  return `You are a Social Media Marketing expert.\nOutput language: ${lang}.`
}

export function buildSocialUserPrompt(
  title: string,
  articleText: string,
  personaName: string,
  platform: 'Facebook' | 'LinkedIn',
  lang = 'Vietnamese'
): string {
  return `Based on the SEO article: "${title}"
Article summary: ${articleText}
Requirements:
1. Use dynamic icons/emojis and relevant hashtags.
2. Write in the voice of: ${personaName}.
3. Return ONLY the post content, no explanations.
Platform: ${platform}.
Output language: ${lang}.`
}

// ─── Thumbnail Prompt Generation ───

export function buildThumbnailSystemPrompt(): string {
  return `You are an expert image designer and Prompt Engineer for AI image generators (Midjourney, DALL-E 3).`
}

export function buildThumbnailUserPrompt(title: string, articleText: string): string {
  return `Based on the SEO article: "${title}"
Article summary: ${articleText}
Requirements:
1. Create 1 detailed English prompt to generate a thumbnail image for this article.
2. Image must be eye-catching, reflect the topic, with appropriate artistic style.
3. Include lighting, angle, detail keywords (cinematic, high detail, 8k, digital art).
4. Prompt must focus on visuals, NO text in image (no text).
Return ONLY the English prompt, no explanations.`
}

// ─── Persona Preview ───

export function buildPersonaPreviewSystemPrompt(persona: {
  name: string
  writing_style?: string
  tone?: string
  prompt_template?: string
}, lang = 'Vietnamese'): string {
  if (persona.prompt_template) {
    return persona.prompt_template
  }
  return `You are ${persona.name}. Writing style: ${persona.writing_style || 'professional'}. Tone: ${persona.tone || 'friendly'}.\nOutput language: ${lang}.`
}

export function buildPersonaPreviewUserPrompt(lang = 'Vietnamese'): string {
  return `Write 2-3 sample sentences about "website SEO optimization" in your unique style.\nOutput language: ${lang}.`
}
