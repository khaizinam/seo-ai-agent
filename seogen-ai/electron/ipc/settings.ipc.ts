import { ipcMain, shell } from 'electron'
import Store from 'electron-store'
import { app } from 'electron'
import { join } from 'path'

export function registerSettingsIpc(store: Store) {
  // Get all app settings
  ipcMain.handle('settings:getAll', async () => {
    return {
      dbConfig: store.get('dbConfig') || null,
      aiConfig: maskAiConfig(store.get('aiConfig') as Record<string, string> | undefined),
      appVersion: app.getVersion(),
      userDataPath: app.getPath('userData'),
    }
  })

  // Save any settings key
  ipcMain.handle('settings:set', async (_e, { key, value }: { key: string; value: unknown }) => {
    store.set(key, value)
    return { success: true }
  })

  // Get raw AI config (for editing — still masked)
  ipcMain.handle('settings:getAiConfig', async () => {
    return maskAiConfig(store.get('aiConfig') as Record<string, string> | undefined)
  })

  // Save full AI config (with real keys)
  ipcMain.handle('settings:saveAiConfig', async (_e, config: Record<string, string>) => {
    // Merge with existing so we don't overwrite non-edited keys
    const existing = store.get('aiConfig') as Record<string, string> | undefined || {}
    // Only update keys that are not masked
    const merged = { ...existing }
    for (const [k, v] of Object.entries(config)) {
      if (v && !v.includes('••••')) {
        merged[k] = v
      }
    }
    store.set('aiConfig', merged)
    return { success: true }
  })

  // Open userData folder in explorer
  ipcMain.handle('settings:openUserData', async () => {
    shell.openPath(app.getPath('userData'))
  })

  // Open thumbnails folder
  ipcMain.handle('settings:openThumbnailDir', async () => {
    shell.openPath(join(app.getPath('userData'), 'thumbnails'))
  })

  // Clear all settings (factory reset)
  ipcMain.handle('settings:reset', async () => {
    store.clear()
    return { success: true }
  })

  // Get app version info
  ipcMain.handle('app:version', async () => {
    return { version: app.getVersion(), name: app.getName() }
  })
}

function maskAiConfig(config: Record<string, string> | undefined) {
  if (!config) return null
  const masked: Record<string, string> = {}
  for (const [k, v] of Object.entries(config)) {
    if (k.toLowerCase().includes('key') && typeof v === 'string' && v.length > 8) {
      masked[k] = '••••' + v.slice(-6)
    } else {
      masked[k] = v
    }
  }
  return masked
}
