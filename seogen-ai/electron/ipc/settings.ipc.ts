import { ipcMain, shell, session, app } from 'electron'
import Store from 'electron-store'
import { join } from 'path'

export function registerSettingsIpc(store: Store) {
  // Get all app settings
  ipcMain.handle('settings:getAll', async () => {
    return {
      dbConfig: store.get('dbConfig') || null,
      aiConfig: maskAiConfig(store.get('aiConfig') as Record<string, string> | undefined),
      theme: store.get('theme') || 'dark', // Default to dark if not set
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

  // Save full AI config (legacy and profiles)
  ipcMain.handle('settings:saveAiConfig', async (_e, config: any) => {
    const existing = store.get('aiConfig') as any || {}
    const merged = { ...existing }
    
    for (const [k, v] of Object.entries(config)) {
      if (k === 'profiles' && Array.isArray(v)) {
        // Handle profiles array - only update real keys if provided
        const existingProfiles = existing.profiles || []
        merged.profiles = v.map((p: any) => {
          const matched = existingProfiles.find((ep: any) => ep.id === p.id)
          return {
            ...p,
            apiKey: (p.apiKey && !p.apiKey.includes('••••')) ? p.apiKey : (matched?.apiKey || '')
          }
        }).slice(0, 10) // Limit to 10
      } else if (v && typeof v === 'string' && !v.includes('••••')) {
        merged[k] = v
      } else if (typeof v !== 'string') {
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

  // Get cache size
  ipcMain.handle('app:getCacheSize', async () => {
    try {
      const size = await session.defaultSession.getCacheSize()
      return { success: true, size }
    } catch (err) {
      return { success: false, size: 0 }
    }
  })

  // Clear cache and sessions
  ipcMain.handle('app:clearCache', async () => {
    try {
      await session.defaultSession.clearCache()
      await session.defaultSession.clearStorageData({
        storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage']
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  // Full cleanup / "Uninstall" logic
  ipcMain.handle('app:fullCleanup', async (_e, { keepSettings }: { keepSettings: boolean }) => {
    try {
      // 1. Clear session data
      await session.defaultSession.clearCache()
      await session.defaultSession.clearStorageData()

      // 2. Delete thumbnails folder
      const fs = await import('fs/promises')
      const thumbDir = join(app.getPath('userData'), 'thumbnails')
      try {
        await fs.rm(thumbDir, { recursive: true, force: true })
      } catch (e) { /* ignore */ }

      // 3. Clear settings if requested
      if (!keepSettings) {
        store.clear()
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })
}

function maskAiConfig(config: any) {
  if (!config) return null
  const masked: any = { ...config }

  // Mask individual legacy keys
  for (const [k, v] of Object.entries(config)) {
    if (k.toLowerCase().includes('key') && typeof v === 'string' && v.length > 8) {
      masked[k] = '••••' + v.slice(-6)
    }
  }

  // Mask profiles
  if (Array.isArray(config.profiles)) {
    masked.profiles = config.profiles.map((p: any) => ({
      ...p,
      apiKey: (p.apiKey && p.apiKey.length > 8) ? '••••' + p.apiKey.slice(-6) : p.apiKey
    }))
  }

  return masked
}
