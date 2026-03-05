/**
 * Centralized AI Prompt Builders (Backend / Electron)
 * All prompts written in concise English to save tokens.
 * Output language is configurable via the `lang` parameter (default: 'Vietnamese').
 */

// ─── Meta Title/Description Generation ───

export function buildMetaGenerationPrompt(
  keyword: string,
  title: string,
  contentSnippet: string,
  lang = 'Vietnamese'
): string {
  return `You are an SEO expert. Generate meta tags for the article below.

Article keyword: "${keyword}"
Article title: "${title}"
Content summary: "${contentSnippet}..."

RULES:
1. Meta Title:
   - 50-60 characters (STRICT — count carefully)
   - Include the main keyword naturally
   - Use a power word or number if appropriate
   - No clickbait

2. Meta Description:
   - 140-160 characters (STRICT — count carefully, NEVER shorter than 130 chars)
   - Structure: [Pain point or benefit] + [keyword naturally] + [soft CTA like "Tìm hiểu ngay" / "Discover now"]
   - Must be a compelling, complete sentence that makes the user want to click
   - Include the keyword or a close variant once
   - End with a soft call-to-action
   - Do NOT just repeat the title. Add unique value/context.

Return ONLY pure JSON, no markdown, no comments:
{"meta_title": "...", "meta_description": "..."}
Output language: ${lang}.`
}

// ─── Full Article Generation (from planned article) ───

export function buildFullArticlePrompt(
  persona: { name: string; description?: string; writing_style?: string; tone?: string },
  campaign: { name?: string; description?: string } | null,
  article: { title: string; keyword?: string; meta_description?: string },
  lang = 'Vietnamese'
): string {
  const kw = article.keyword || article.title
  return `You are a top-tier SEO content strategist. Write a complete, high-ranking article.

PERSONA:
Name: "${persona.name}" - ${persona.description || 'professional writer'}
Writing style: ${persona.writing_style || 'professional'}
Tone: ${persona.tone || 'friendly'}
Embody this persona's voice consistently throughout the article.

CAMPAIGN CONTEXT:
Campaign: "${campaign?.name || ''}" — ${campaign?.description || ''}

ARTICLE TARGET:
Title: "${article.title}"
Main keyword: "${kw}"
Meta description: "${article.meta_description || ''}"

SEO & KEYWORD RULES:
- Place "${kw}" naturally in the FIRST H2 heading.
- Include "${kw}" within the first 100 words.
- Use "${kw}" again in the conclusion/final paragraph.
- Keyword density: 1-2%. Never stuff unnaturally.
- Sprinkle 2-3 LSI/semantically related terms throughout the article.

CONTENT STRUCTURE:
- Start with an engaging hook (question, surprising fact, or pain point) — 2-3 sentences.
- NO Table of Contents. NO generic blog intro. Jump into value immediately.
- Flow: Hook → Problem/Context → Main sections (H2/H3) → Examples/Data → Conclusion + CTA.
- End with a strong conclusion summarizing key takeaways + subtle call-to-action.
- Use smooth transitions between sections.

E-E-A-T (Experience, Expertise, Authority, Trust):
- Include 1-2 specific data points, statistics, or real examples.
- Write with authority and depth — avoid generic or vague statements.
- Reference practical experience where relevant.

READABILITY:
- Short paragraphs: 2-4 sentences max.
- Use <strong> to bold key phrases naturally.
- Vary sentence length. Prefer clear, direct language.

HTML FORMAT:
1. No Markdown. HTML only.
2. Allowed tags: <h2>, <h3>, <h4>, <h5>, <h6>, <p>, <a>, <strong>.
3. Use H2-H6. Do NOT use H1 (reserved for page title).
4. By default, use paragraphs (<p>) instead of list tags.
5. EXCEPTION: For technical/tutorial/report content requiring enumeration, you MAY use <ul>/<ol>/<li> with inline CSS:
   <ul style="padding-left:20px;margin:12px 0;list-style-type:disc"><li style="margin-bottom:8px;line-height:1.6">...</li></ul>
6. Length: 1000-2000 words.
7. Output minified HTML only (no whitespace, no line breaks between tags).

Return only the content inside <div>...</div>.
Output language: ${lang}.`
}
