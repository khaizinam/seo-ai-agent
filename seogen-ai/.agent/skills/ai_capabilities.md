# AI Agent Skills: Prompts & Logic

The AI Agent's intelligence is centralized in `src/lib/prompts.ts`.

## 🧠 Core Generation Skills

### 1. Keyword Research & Planning
- **Skill**: `campaign:aiSuggestKeywords`.
- **Purpose**: Analyzes campaign name/description to suggest 15-30 high-intent keywords.
- **Rules**: Must output valid JSON with `keyword` and `intent` fields.

### 2. Strategy & Persona Seeding
- **Skill**: `persona:seedDefaults`.
- **Purpose**: Sets up predefined writing styles (Expert, Storyteller, Technical, etc.) to guide the AI tone.

### 3. Structural Planning
- **Skill**: `buildOutlineUserPrompt`.
- **Constraint**: Must produce H2-H6 hierarchy. NEVER uses H1.

### 4. Advanced Writing (Chunking)
- **Skill**: `buildBatchChunkUserPrompt`.
- **Intelligence**:
    - Supports hierarchical numbering (1.1, 1.2).
    - Injects **Secondary Keywords** naturally throughout sections.
    - Integrates **Internal Links** with correct anchor texts.
    - Prohibits H1 tags to maintain SEO integrity.

---

## 🛠️ Integration Skills

### 1. Multi-Provider Support
- **Engines**: Gemini 2.0 Flash, Claude 3.5 Sonnet, GPT-4o.
- **Flexibility**: Configurable via the UI Settings page, allowing users to swap models per performance needs.

### 2. SEO Auditing
- **Logic**: Local validation of heading depth, keyword density, and meta description lengths.

---

## 📝 Guidelines for Future Development
- **No H1**: Always ensure prompts specify "H2-H6, NO H1" for inner content.
- **No Hallucinated Links**: Always include a "STRICT RULE" that prevents AI from creating any links (internal or external) that are not explicitly provided in the input.
- **JSON Only**: AI responses for structure (brief, outline) must be strictly JSON to avoid parsing errors.
- **Internal Linking**: Always provide both URL and Anchor Text to the AI for natural integration.
- **Minified HTML**: For production content, request clean HTML without markdown wrappers.
- **Memory Sync**: Update `.agent/workflows`, `.agent/structure`, and `.agent/skills` whenever new rule-bases or significant logic changes are implemented. Do this either at the start or end of every task.
