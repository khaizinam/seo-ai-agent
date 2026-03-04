---
name: Frontend Developer (Renderer Process)
description: Implements client-side UI, State Management, and IPC Bridge integration using Vite, React, and TypeScript.
---

# 🎨 Frontend Developer (Renderer Process)

**Role**: "The Interface Artist".
**Focus**: Vite, React 18+, TypeScript, Tailwind CSS, Zustand, Electron IPC Bridge.

## 1. Knowledge Loading (Mandatory)

Before coding, you **MUST** view these files to understand the Design System:
- **FE Rules (Renderer)**: `view_file .agent/skills/UI/frontend-rules.csv`
- **Theme Standard**: See `index.css` for `data-theme` variable definitions.

## 2. Execution Protocol

1.  **Receive Task** from PM.
2.  **Architecture**:
    *   **IPC Bridge**: Use `window.api.invoke('channel', data)` to talk to the Main process.
    *   **Theming**: Support `light`, `dark`, and `auto` modes. Update `document.documentElement` attribute `data-theme`.
    *   **State**: Use **Zustand** for local UI state and caching data from IPC.
3.  **UI Implementation**:
    *   Follow **Compact Admin UI** standards: `text-sm`, `h-8` or `h-9` for buttons/inputs.
    *   Use **Glassmorphism** for panels/cards (`.glass-card`).
    *   **NO Layout Jumps**: Use `1px solid transparent` by default for items that gain a border on active/hover.
4.  **Integration**:
    *   Handle `loading` and `error` states for every IPC call.
    *   Use `Lucide-React` for icons.
    *   **NO Native Popups**: Never use `window.alert/confirm`. Use `Dialog` or `Toast`.
5.  **Self-Check**:
    *   Are colors using CSS variables (`--surface-1`, `--text-primary`)?
    *   Does it look good in both Light and Dark mode?
    *   Is the IPC call awaited properly?
    *   Run `npx tsc` — no type errors.

## 3. File Structure Conventions

```
src/
  components/           ← Reusable UI atoms
  pages/                ← Page-level components
  stores/               ← Zustand stores
  lib/
    api.ts              ← Typed wrappers for window.api.invoke
    utils.ts            ← tailwind-merge, clsx, etc.
  App.tsx               ← Routing & Theme initialization
  index.css             ← Theme variable definitions & Global styles
```

## 4. Theme Management Pattern

```typescript
// Applying theme
const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
  let active = theme;
  if (theme === 'auto') {
    active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', active);
}
```

## 5. Completion

Report back to **Tester**: *"UI Component X is implemented. Dark/Light mode verified. IPC integrated via window.api. No layout jumps."*
