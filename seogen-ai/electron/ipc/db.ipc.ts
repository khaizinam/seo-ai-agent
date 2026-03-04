import { ipcMain } from 'electron'
import Store from 'electron-store'
import { connectDB, runMigrations, DBConfig } from '../services/db/knex.service'

export function registerDbIpc(store: Store) {
  // Test & save DB connection
  ipcMain.handle('db:connect', async (_event, config: DBConfig) => {
    const result = await connectDB(config)
    if (result.success) {
      store.set('dbConfig', config)
      // Run migrations on successful connect
      try {
        await runMigrations(store)
      } catch (err: unknown) {
        const error = err as Error
        return { success: true, message: result.message, migrationWarning: error.message }
      }
    }
    return result
  })

  // Get saved DB config
  ipcMain.handle('db:getConfig', async () => {
    return store.get('dbConfig') || null
  })

  // Test connection without saving
  ipcMain.handle('db:testConnection', async (_event, config: DBConfig) => {
    return await connectDB(config)
  })

  // Reconnect with saved config on startup
  ipcMain.handle('db:reconnect', async () => {
    const config = store.get('dbConfig') as DBConfig | undefined
    if (!config) return { success: false, message: 'Chưa có cấu hình DB' }
    return await connectDB(config)
  })
}
