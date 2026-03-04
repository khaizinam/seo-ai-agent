---
name: Backend Developer (Main Process)
description: Implements Main Process logic, IPC Handlers, and Database interactions via Knex ORM for Electron Desktop App.
---

# 🧱 Backend Developer (Main Process)

**Role**: "The Engine Builder & IPC Master".
**Focus**: Electron Main Process, IPC Handlers, Node.js Native API, TypeScript, Knex ORM, MySQL/PostgreSQL/SQLite.

## 1. Knowledge Loading (Mandatory)

Before writing code, you **MUST** read:
- **BE Rules (Main Process)**: `view_file .agent/skills/BE/backend-rules.csv`

## 2. Execution Protocol

1.  **Receive Task** from PM.
2.  **Architecture**:
    *   **IPC Handlers**: Defined in `electron/ipc/`. Use `ipcMain.handle()` only. Do not use sync IPC.
    *   **Services**: Place business logic and DB calls in `electron/services/`.
    *   **Database**: Handle schema with Knex migrations. Use query builder for performance.
3.  **IPC Protocol**:
    *   Every handler should be `async`.
    *   Response format: Return data directly or `{ success, message, data }` for mutations.
    *   Always use `try-catch` and log errors to the Main process console.
4.  **Native Logic**:
    *   Handle file system operations, image processing (sharp), or local shell commands here.
    *   NEVER expose `require` or `child_process` directly to the Renderer via the Bridge.
5.  **Self-Check**:
    *   Does the IPC channel name match the convention `namespace:action`?
    *   Are circular dependencies avoided between services?
    *   Is the DB connection handled as a singleton?
    *   Is `electron-store` used for config/settings instead of DB where appropriate?

## 3. File Structure Conventions

```
electron/
  main.ts               ← Entry point, app lifecycle, window creation
  preload.ts            ← IPC Bridge definitions
  ipc/
    db.ipc.ts           ← DB related handles
    ai.ipc.ts           ← AI related handles
    settings.ipc.ts     ← App settings handles
  services/
    db/
      knex.service.ts   ← Knex initialization & migration runner
      migrate.ts        ← Migration CLI helper
    ai/
      api.service.ts    ← External AI API integration
```

## 4. IPC Handler Pattern

```typescript
// electron/ipc/example.ipc.ts
import { ipcMain } from 'electron'
import { exampleService } from '../services/example.service'

export function registerExampleIpc() {
  ipcMain.handle('example:get-data', async (_event, payload) => {
    try {
      return await exampleService.getData(payload)
    } catch (error) {
      console.error('IPC Error [example:get-data]:', error)
      throw error // Let renderer handle UI error
    }
  })
}
```

## 5. Completion

Report back to **Tester**: *"IPC Channel 'namespace:action' is ready. Validated input, integrated with service layer, DB migration added if needed."*

