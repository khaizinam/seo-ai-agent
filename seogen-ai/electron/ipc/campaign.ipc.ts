import { ipcMain } from 'electron'
import { getKnex } from '../services/db/knex.service'

export function registerCampaignIpc() {
  // ---------- CAMPAIGNS ----------
  ipcMain.handle('campaign:list', async () => {
    const db = getKnex()
    return db('campaigns').orderBy('created_at', 'desc')
  })

  ipcMain.handle('campaign:create', async (_e, data: { name: string; description?: string }) => {
    const db = getKnex()
    const [id] = await db('campaigns').insert({ name: data.name, description: data.description, status: 'active' })
    return db('campaigns').where({ id }).first()
  })

  ipcMain.handle('campaign:update', async (_e, { id, ...data }: { id: number; name?: string; description?: string; status?: string }) => {
    const db = getKnex()
    await db('campaigns').where({ id }).update({ ...data, updated_at: db.fn.now() })
    return db('campaigns').where({ id }).first()
  })

  ipcMain.handle('campaign:delete', async (_e, id: number) => {
    const db = getKnex()
    await db('campaigns').where({ id }).delete()
    return { success: true }
  })

  // ---------- KEYWORDS ----------
  ipcMain.handle('keyword:list', async (_e, campaignId: number) => {
    const db = getKnex()
    return db('keywords').where({ campaign_id: campaignId }).orderBy('created_at', 'desc')
  })

  ipcMain.handle('keyword:create', async (_e, data: {
    campaign_id: number; keyword: string; volume?: number; difficulty?: number; intent?: string
  }) => {
    const db = getKnex()
    const [id] = await db('keywords').insert({ ...data, status: 'pending' })
    return db('keywords').where({ id }).first()
  })

  ipcMain.handle('keyword:bulkCreate', async (_e, { campaign_id, keywords }: { campaign_id: number; keywords: string[] }) => {
    const db = getKnex()
    const rows = keywords.map(k => ({ campaign_id, keyword: k, status: 'pending' }))
    await db('keywords').insert(rows)
    return { success: true, count: rows.length }
  })

  ipcMain.handle('keyword:updateStatus', async (_e, { id, status }: { id: number; status: string }) => {
    const db = getKnex()
    await db('keywords').where({ id }).update({ status })
    return { success: true }
  })

  ipcMain.handle('keyword:delete', async (_e, id: number) => {
    const db = getKnex()
    await db('keywords').where({ id }).delete()
    return { success: true }
  })
}
