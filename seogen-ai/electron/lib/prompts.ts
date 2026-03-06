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
  return `You are a senior SEO copywriter specializing in high-CTR meta tags.
Your goal: maximize click-through rate on Google Search results.

Article keyword: "${keyword}"
Article title: "${title}"
Content summary: "${contentSnippet}..."

━━━ META TITLE RULES ━━━
- Length: 55-70 characters EXACTLY (count every character including spaces)
- Google displays up to ~60 chars on desktop and ~78 on mobile — place the main keyword within the first 60 chars
- Formula: [Number or Power Word] + [Main Keyword] + [Unique Value Hook]
- Power words to consider (translate/adapt to output language): Best, Must-Read, All-Time, Greatest, Most Popular, Essential, Top-Rated
- Must feel written for humans, not search engines
- Example of too short / weak: "Top 10 Best Manga" (18 chars — unacceptable)
- Example of strong: "Top 10 Greatest Manga of All Time You Cannot Miss" (50 chars)

━━━ META DESCRIPTION RULES ━━━
- Length: 150-160 characters EXACTLY (NEVER below 145)
- Formula: [Relatable hook or question] + [keyword + core benefit] + [specific supporting detail] + [soft CTA]
- The hook must address WHY the reader should care
- Include 1-2 specific details to add credibility and context
- End with a soft call-to-action suited to the output language
- Example of weak: "Learn about the best manga series of all time." (flat, no hook, too short)
- Example of strong: "Not sure which manga to read next? Discover the top 10 greatest manga of all time, from action epics to timeless classics. Start your list now!"

━━━ SELF-CHECK BEFORE OUTPUT ━━━
Before returning JSON, silently verify:
[ ] Meta title is between 55-70 characters?
[ ] Main keyword appears within the first 60 characters of the title?
[ ] Meta description is between 150-160 characters?
[ ] Title contains a power word or number?
[ ] Description follows: hook + keyword + detail + CTA?
If any check fails, rewrite until all pass.

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
