import { ipcMain } from 'electron'
import Store from 'electron-store'
import { connectDB, runMigrations, getKnex, DBConfig } from '../services/db/knex.service'
import { DEFAULT_PERSONAS } from '../lib/persona-seeds'

async function seedPersonasIfEmpty() {
  try {
    const db = getKnex()
    const count = await db('personas').count('id as cnt').first()
    if (!count || Number(count.cnt) === 0) {
      await db('personas').insert(DEFAULT_PERSONAS)
    }
  } catch { /* table may not exist yet */ }
}

export function registerDbIpc(store: Store) {
  // Test & save DB connection
  ipcMain.handle('db:connect', async (_event, config: DBConfig) => {
    const result = await connectDB(config)
    if (result.success) {
      store.set('dbConfig', config)
      // Save connection history by database type
      const history = store.get('dbConfigsByType') as Record<string, DBConfig> || {}
      history[config.type] = config
      store.set('dbConfigsByType', history)
      
      // Run migrations on successful connect
      try {
        await runMigrations(store)
        await seedPersonasIfEmpty()
      } catch (err: unknown) {
        const error = err as Error
        return { success: true, message: result.message, migrationWarning: error.message }
      }
    }
    return result
  })

  // Get saved DB config
  ipcMain.handle('db:getConfig', async () => {
    return {
      current: store.get('dbConfig') || null,
      history: store.get('dbConfigsByType') || {}
    }
  })

  // Test connection without saving
  ipcMain.handle('db:testConnection', async (_event, config: DBConfig) => {
    return await connectDB(config)
  })

  // Reconnect with saved config on startup
  ipcMain.handle('db:reconnect', async () => {
    const config = store.get('dbConfig') as DBConfig | undefined
    if (!config) return { success: false, message: 'Chưa có cấu hình DB' }
    const result = await connectDB(config)
    if (result.success) {
      try {
        await runMigrations(store)
        await seedPersonasIfEmpty()
      } catch { /* ignore */ }
    }
    return result
  })

  // Full reset (Drop & Migrate)
  ipcMain.handle('db:reset', async () => {
    const { resetDB } = await import('../services/db/knex.service')
    return await resetDB(store)
  })

  // Synchronize data between SQLite and Cloud databases
  ipcMain.handle('db:sync', async (_event, direction: 'push' | 'pull') => {
    let sqliteKnex: any = null
    try {
      const remoteKnex = getKnex()
      if (remoteKnex.client.config.client === 'sqlite3') {
        return { success: false, message: 'Đồng bộ chỉ khả dụng khi bạn đang kết nối tới cơ sở dữ liệu Cloud (MySQL, PostgreSQL, MariaDB).' }
      }

      // 1. Initialize SQLite connection
      const path = require('path')
      const Knex = require('knex')
      let userDataPath = '.'
      try {
        const { app } = require('electron')
        userDataPath = app ? app.getPath('userData') : '.'
      } catch (e) {
        userDataPath = '.'
      }
      const sqliteFilename = path.join(userDataPath, 'seogen.sqlite')
      sqliteKnex = Knex({
        client: 'sqlite3',
        connection: { filename: sqliteFilename },
        useNullAsDefault: true,
      })

      // 2. Identify source and target Knex
      const sourceKnex = direction === 'push' ? sqliteKnex : remoteKnex
      const targetKnex = direction === 'push' ? remoteKnex : sqliteKnex

      const tables = ['campaigns', 'keywords', 'personas', 'articles', 'thumbnail_prompts', 'seo_audits', 'webhooks', 'ai_logs']

      // 3. Disable foreign key checks on target
      if (targetKnex.client.config.client === 'mysql2' || targetKnex.client.config.client === 'mysql') {
        await targetKnex.raw('SET FOREIGN_KEY_CHECKS = 0')
      } else if (targetKnex.client.config.client === 'sqlite3') {
        await targetKnex.raw('PRAGMA foreign_keys = OFF')
      }

      // 4. Perform transaction
      await targetKnex.transaction(async (trx: any) => {
        for (const table of tables) {
          // Verify table exists in source
          if (!(await sourceKnex.schema.hasTable(table))) continue
          
          // Read all data from source
          const rows = await sourceKnex(table).select('*')

          // Truncate/delete target table
          await trx(table).truncate().catch(async () => {
             // fallback for sqlite or postgres truncate issues
             await trx(table).delete()
          })

          // Insert into target table in chunks
          if (rows.length > 0) {
            const CHUNK_SIZE = 100
            for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
              const chunk = rows.slice(i, i + CHUNK_SIZE)
              await trx(table).insert(chunk)
            }
          }
        }
      })

      // 5. Re-enable foreign key checks on target
      if (targetKnex.client.config.client === 'mysql2' || targetKnex.client.config.client === 'mysql') {
        await targetKnex.raw('SET FOREIGN_KEY_CHECKS = 1')
      } else if (targetKnex.client.config.client === 'sqlite3') {
        await targetKnex.raw('PRAGMA foreign_keys = ON')
      }

      return { success: true, message: `Đồng bộ dữ liệu ${direction === 'push' ? 'lên Cloud' : 'về máy cá nhân'} thành công!` }
    } catch (err: any) {
      return { success: false, message: 'Lỗi đồng bộ: ' + err.message }
    } finally {
      if (sqliteKnex) {
        await sqliteKnex.destroy().catch(() => {})
      }
    }
  })

  // List config profiles on Cloud DB
  ipcMain.handle('db:listConfigProfiles', async () => {
    try {
      const db = getKnex()
      if (!(await db.schema.hasTable('app_configs'))) {
        return { success: false, profiles: [], error: 'Bảng app_configs chưa được khởi tạo. Hãy thử kết nối lại DB.' }
      }
      const rows = await db('app_configs').select('id', 'profile_name', 'created_at', 'updated_at')
      return { success: true, profiles: rows }
    } catch (e: any) {
      return { success: false, error: e.message, profiles: [] }
    }
  })

  // Save/Upload local configuration profile to Cloud DB
  ipcMain.handle('db:saveConfigProfile', async (_event, { profileName, overwriteId }: { profileName: string; overwriteId?: number }) => {
    try {
      const db = getKnex()
      
      const configToSave = {
        aiConfig: store.get('aiConfig') || null,
        theme: store.get('theme') || 'dark',
        outputLanguage: store.get('outputLanguage') || 'Vietnamese',
        defaultPersonaId: store.get('defaultPersonaId') || '',
        autoSwitchModel: store.get('autoSwitchModel') || false,
      }

      const jsonStr = JSON.stringify(configToSave)

      if (overwriteId) {
        // Overwrite existing
        await db('app_configs').where({ id: overwriteId }).update({
          profile_name: profileName,
          config_json: jsonStr,
          updated_at: db.fn.now()
        })
      } else {
        // Insert new profile
        const existing = await db('app_configs').where({ profile_name: profileName }).first()
        if (existing) {
          return { success: false, error: `Tên cấu hình "${profileName}" đã tồn tại. Vui lòng chọn ghi đè hoặc đổi tên khác.` }
        }
        await db('app_configs').insert({
          profile_name: profileName,
          config_json: jsonStr
        })
      }

      return { success: true, message: `Đồng bộ cấu hình "${profileName}" lên Cloud thành công!` }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // Download & Apply configuration profile from Cloud DB
  ipcMain.handle('db:loadConfigProfile', async (_event, profileId: number) => {
    try {
      const db = getKnex()
      const row = await db('app_configs').where({ id: profileId }).first()
      if (!row) {
        return { success: false, error: 'Không tìm thấy cấu hình trên Cloud DB.' }
      }

      const parsed = JSON.parse(row.config_json)
      
      if (parsed.aiConfig) store.set('aiConfig', parsed.aiConfig)
      if (parsed.theme) store.set('theme', parsed.theme)
      if (parsed.outputLanguage) store.set('outputLanguage', parsed.outputLanguage)
      if (parsed.defaultPersonaId) store.set('defaultPersonaId', parsed.defaultPersonaId)
      if (parsed.autoSwitchModel !== undefined) store.set('autoSwitchModel', parsed.autoSwitchModel)

      return { success: true, message: `Đồng bộ cấu hình "${row.profile_name}" về máy thành công! Hệ thống sẽ tải lại cấu hình mới.` }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
