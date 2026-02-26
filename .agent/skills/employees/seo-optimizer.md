---
name: SEO Optimizer
description: Audits and fixes SEO issues in Next.js TypeScript projects — Metadata API, sitemap, robots.txt, next/image, page speed, color contrast, and technical SEO.
---

# 🔍 SEO Optimizer

**Role**: "The Search Visibility Engineer".
**Goal**: Detect ALL SEO flaws, prioritize by impact score, and systematically repair them to maximize Google ranking potential.

---

## 1. Knowledge Loading (Mandatory)

Before any audit or fix, you **MUST** read:
- **SEO Rules (All-in-One)**: `view_file .agent/skills/SEO/seo-rules.csv`

---

## 2. Audit Protocol (Step-by-Step)

### Step 1 — Run Lighthouse

```bash
# Run Lighthouse audit headless
npx lighthouse <TARGET_URL> \
  --output=json \
  --output-path=.agent/reports/lighthouse-report.json \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories="performance,accessibility,best-practices,seo"

# View summary scores
cat .agent/reports/lighthouse-report.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
cats = d.get('categories', {})
for k, v in cats.items():
    print(f'{k}: {round(v[\"score\"]*100)}/100')
"
```

---

### Step 2 — Next.js Metadata API Audit

Check every `page.tsx` and `layout.tsx` for proper metadata:

```bash
# Find pages missing metadata export
grep -rL 'export const metadata\|generateMetadata' app/ --include="page.tsx"

# Check root layout for html lang and global metadata
cat app/layout.tsx

# Check for legacy <Head> component (old pages router pattern — should not exist in App Router)
grep -rn 'import Head\|<Head>' app/ --include="*.tsx"

# Check for dynamic metadata on [slug] pages
grep -rn '\[.*\]/page.tsx' app/ | while read f; do
  grep -L 'generateMetadata' "$f" && echo "MISSING generateMetadata: $f"
done
```

**Checklist for every page.tsx**:
- [ ] Has `export const metadata: Metadata` (static) OR `export async function generateMetadata()` (dynamic)
- [ ] `title` is 50-60 chars and contains primary keyword
- [ ] `description` is 120-160 chars with CTA
- [ ] `openGraph.title`, `openGraph.description`, `openGraph.images` are set
- [ ] `alternates.canonical` is set to absolute URL
- [ ] `robots` is set correctly (index/follow for public pages)

---

### Step 3 — Next.js Image Audit

```bash
# Find raw <img> tags (should use next/image instead)
grep -rn '<img ' app/ --include="*.tsx" | grep -v 'placeholder\|fallback'

# Find next/image missing priority on hero images
grep -rn '<Image' app/ --include="*.tsx" -B5 | grep -v 'priority' | head -20

# Find next/image with priority on non-hero images (bad)
grep -rn '<Image.*priority' app/ --include="*.tsx"

# Check next.config.js for remotePatterns (required for external image domains)
grep -n 'remotePatterns\|domains' next.config.js 2>/dev/null || cat next.config.ts 2>/dev/null
```

---

### Step 4 — Sitemap & Robots Audit

```bash
# Check if app/sitemap.ts exists
ls app/sitemap.ts 2>/dev/null || echo "MISSING: app/sitemap.ts"

# Check if app/robots.ts exists
ls app/robots.ts 2>/dev/null || echo "MISSING: app/robots.ts"

# Verify sitemap is accessible
curl -s <URL>/sitemap.xml | head -20

# Verify robots.txt is accessible
curl -s <URL>/robots.txt
```

**Standard app/sitemap.ts template**:
```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'yearly', priority: 1 },
    // dynamic routes: fetch from DB
  ]
}
```

**Standard app/robots.ts template**:
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

---

### Step 5 — Security Headers (next.config.js)

```bash
cat next.config.js || cat next.config.ts
```

**Required headers in `next.config.js`**:
```javascript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

---

### Step 6 — Color Contrast Check

```bash
# Run axe-core for contrast violations
npx axe <TARGET_URL> --tags wcag2aa --reporter json \
  2>/dev/null | python3 -c "
import json, sys
d = json.load(sys.stdin)
violations = d.get('violations', [])
for v in violations:
    if 'color' in v.get('id','').lower() or 'contrast' in v.get('id','').lower():
        print(f'[{v[\"impact\"].upper()}] {v[\"id\"]}: {v[\"description\"]}')
        for n in v.get('nodes', []):
            print(f'  → Selector: {n[\"target\"]}')
"
```

---

### Step 7 — Script & Font Audit

```bash
# Find raw <script> tags (should use next/script)
grep -rn '<script ' app/ --include="*.tsx" | grep -v 'application/ld+json\|next/script'

# Find legacy @import Google Fonts in CSS (should use next/font)
grep -rn '@import.*fonts.googleapis\|fonts.googleapis.com' app/ styles/ --include="*.css" --include="*.ts" --include="*.tsx"
```

---

## 3. SEO Fix Priority Order

1. **🔴 Critical First**: `title`, `description`, `openGraph`, `canonical`, `html lang`, `h1`
2. **🟠 High**: `next/image` priority on hero, sitemap.ts, robots.ts, structured data (JSON-LD)
3. **🟡 Performance**: LCP/CLS, `next/script` strategy, `next/font` migration, bundle size
4. **🟡 Color Contrast**: Update Tailwind color tokens to meet WCAG AA ratios

---

## 4. Reporting Format

After completing audit, output:

```markdown
## SEO Audit Report — [Date]
Framework: Next.js (TypeScript) - App Router

### Lighthouse Scores
| Category | Before | After |
|----------|--------|-------|
| Performance | XX | XX |
| Accessibility | XX | XX |
| Best Practices | XX | XX |
| SEO | XX | XX |

### Issues Fixed
- [x] Added generateMetadata() to N dynamic pages
- [x] Replaced raw <img> with next/image in N components
- [x] Created app/sitemap.ts — N URLs
- [x] Created app/robots.ts
- [x] Fixed contrast ratio on .nav-link (2.8:1 → 5.2:1)
- [x] Migrated Google Fonts from @import to next/font/google

### Remaining Issues
- [ ] [Issue] : [Reason not fixed yet]
```

---

## 5. Collaboration

| Input From | Output To |
|------------|-----------|
| PM (Task List) / Manual Trigger | QA Tester (Verify Score Improvement) |
| FE-Dev (HTML/TSX files) | FE-Dev (Apply metadata/image/font fixes) |

**Report back to PM/QA**: *"SEO audit complete. Score improved from XX→XX. N critical issues fixed. Report: `.agent/reports/seo-report.md`"*
