# SEOGEN AI - Project Structure Map

## 📂 Root Directory
- `electron/`: Backend logic (Main process, IPC handlers, Database services).
- `src/`: Frontend React application (Vite-based).
- `dist/`: Web production build.
- `dist-electron/`: Electron production build.
- `build-resources/`: Assets for electron-builder (icons, etc.).
- `.agent/`: AI Agent memory and internal documentation.

---

## 🖥️ Electron (Backend / Main Process)
- `main.ts`: Entry point for the Electron app.
- `preload.ts`: Bridge between Main and Renderer processes (safe API exposure).
- `ipc/`: **Internal Process Communication** handlers.
    - `article.ipc.ts`: CRUD and AI generation logic for articles.
    - `campaign.ipc.ts`: Campaign and keyword planning logic.
    - `settings.ipc.ts`: Application configuration (AI keys, Theme).
    - `webhook.ipc.ts`: Integration with external publishing platforms.
- `services/`: Core business logic and integrations.
    - `db/knex.service.ts`: Database connection and table migrations (SQLite, MySQL, PG).
- `repositories/`: Data Access Layer using Knex.
    - `article.repository.ts`: Article data management.
    - `campaign.repository.ts`: Campaign data management.

---

## 🎨 Source (Frontend / Renderer Process)
- `App.tsx`: Central entry point with **React Router** definitions.
- `pages/`: Page-level components.
    - `articles/`: Article management and the **Linear Wizard**.
    - `campaigns/`: Campaign management and keyword planning.
    - `webhooks/`: Webhook configuration for publishing.
    - `Dashboard.tsx`: Overview of project status.
    - `Settings.tsx`: DB and AI configuration.
- `components/`:
    - `ui/`: Shared atomic UI components (Button, Input, Select, DataTable).
    - `campaigns/`: Campaign-specific sub-components.
    - `articles/`: Article-specific sub-components (Sidebar, Wizard steps).
- `lib/`:
    - `api.ts`: Helper for `window.api.invoke` (communication with Electron).
    - `prompts.ts`: **The AI Core**. Centralized prompt templates for all generation steps.
- `stores/`: **Zustand** store for global application state (`app.store.ts`).
- `hooks/`: Custom React hooks for table persistence and shared logic.

---

## 🛠️ Technology Stack
- **Runtime**: Node.js + Electron.
- **Frontend**: React + TypeScript + Vite.
- **Styling**: Vanilla CSS (Tailwind compatible).
- **Database**: Knex.js (Multi-dialect).
- **AI**: Integration with Google Gemini, Anthropic Claude, and OpenAI via REST APIs.
