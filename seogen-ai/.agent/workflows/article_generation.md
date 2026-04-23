# Workflow: Article Generation Flow

This project uses a **Linear 4-Step Wizard** to generate high-quality SEO articles.

## 🚀 The Wizard Flow

### Step 1: Article Brief
- **Action**: User provides a Title or Primary Keyword.
- **AI Skill**: `buildBriefUserPrompt`.
- **Output**: JSON object with `campaign_summary` and `target_audience`.
- **Purpose**: Establishes the "Why" and "Who" for the AI before writing.

### Step 2: Content Outline
- **Action**: User reviews the brief and clicks "Gen Outline".
- **AI Skill**: `buildOutlineUserPrompt`.
- **Output**: JSON array of headings (H2-H6) with hierarchical numbering.
- **Purpose**: Defines the structure of the article.

### Step 3: Full Content Generation (Chunking)
- **Mechanism**: To avoid context loss and "AI laziness," the content is generated in batches (Chunks).
- **Skill 3a (Intro)**: `buildIntroUserPrompt`. Generates hook, intro paragraphs, and Table of Contents (ToC).
- **Skill 3b (Body Chunks)**: `buildBatchChunkUserPrompt`. Loops through the outline in batches of 5 headings.
- **Skill 3c (QnA)**: Appends an FAQ schema based on the plan.
- **Final Result**: A complete HTML article with structured headings (H2-H6), internal links, and SEO-optimized paragraphs.

### Step 4: SEO Audit & Finalize
- **Action**: Automated check against SEO rules (Keywords, Headings, Meta Tags).
- **Final Action**: Save to DB as `reviewed` and prepare for Publishing.

---

## 📡 Publishing Flow
1. **Selection**: User selects one or more articles in the management table.
2. **Webhook Dispatch**: App sends a POST request to configured endpoints (e.g., WordPress REST API).
3. **Status Update**: Article status changes to `published`.

---

## 🔑 Data Synchronization
- **Keyword Match**: The wizard automatically tries to match the article's keyword name to the campaign's keyword list to maintain relational integrity.
- **Auto-Save**: The app uses a debounced auto-save mechanism to persist data to the local DB (Knex) as the user progresses through steps.
