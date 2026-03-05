import { ipcMain } from 'electron'
import { getKnex } from '../services/db/knex.service'

export interface Webhook {
  id: number
  name: string
  endpoint_url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH'
  headers: string // JSON representation
  body_type: 'form' | 'json'
  body_mapping: string // JSON representation
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export function registerWebhookIPC() {
  // List webhooks
  ipcMain.handle('webhook:list', async () => {
    try {
      const knex = getKnex()
      return await knex('webhooks').select('*').orderBy('updated_at', 'desc')
    } catch (e: any) {
      console.error('Lỗi lấy ds webhooks:', e)
      return []
    }
  })

  // Get single webhook
  ipcMain.handle('webhook:get', async (_, id: number) => {
    try {
      const knex = getKnex()
      return await knex('webhooks').where({ id }).first()
    } catch (e: any) {
      console.error('Lỗi lấy webhook:', e)
      return null
    }
  })

  // Create webhook
  ipcMain.handle('webhook:create', async (_, payload: Partial<Webhook>) => {
    try {
      const knex = getKnex()
      const [id] = await knex('webhooks').insert({
        name: payload.name,
        endpoint_url: payload.endpoint_url,
        method: payload.method || 'POST',
        headers: payload.headers || '[]',
        body_type: payload.body_type || 'json',
        body_mapping: payload.body_mapping || '[]',
        status: payload.status || 'active',
      })
      return { success: true, id }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // Update webhook
  ipcMain.handle('webhook:update', async (_, payload: Partial<Webhook>) => {
    try {
      const { id, created_at, updated_at, ...updateData } = payload
      if (!id) throw new Error('Root ID required')
      const knex = getKnex()
      await knex('webhooks').where({ id }).update({
        ...updateData,
        updated_at: knex.fn.now()
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  // Delete webhook
  ipcMain.handle('webhook:delete', async (_, id: number) => {
    try {
      const knex = getKnex()
      await knex('webhooks').where({ id }).delete()
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
