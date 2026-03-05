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

  // Publish Article to Webhook
  ipcMain.handle('webhook:publish', async (_, { webhookId, articleId }: { webhookId: number, articleId: number }) => {
    const axios = require('axios')
    try {
      const knex = getKnex()
      const webhook = await knex('webhooks').where({ id: webhookId }).first()
      const article = await knex('articles').where({ id: articleId }).first()

      if (!webhook) throw new Error('Webhook không tồn tại')
      if (!article) throw new Error('Bài viết không tồn tại')

      let headers: any = {}
      try {
        const hArr = JSON.parse(webhook.headers || '[]')
        hArr.forEach((h: any) => { if (h.key) headers[h.key] = h.value })
      } catch (e) {}

      const mapValue = (val: string) => {
        if (!val) return val
        return val
          .replace(/\{\{title\}\}/g, article.title || '')
          .replace(/\{\{content\}\}/g, article.content_html || '')
          .replace(/\{\{meta_title\}\}/g, article.meta_title || '')
          .replace(/\{\{meta_description\}\}/g, article.meta_description || '')
          .replace(/\{\{keyword\}\}/g, article.keyword || '')
          .replace(/\{\{slug\}\}/g, article.slug || '')
      }

      let body: any = {}
      if (webhook.body_type === 'json' || webhook.body_type === 'form') {
        try {
          const bArr = JSON.parse(webhook.body_mapping || '[]')
          bArr.forEach((b: any) => {
            if (b.key) body[b.key] = mapValue(b.value)
          })
        } catch (e) {}
      }

      const config: any = {
        method: webhook.method,
        url: webhook.endpoint_url,
        headers,
        timeout: 120000, // 120 seconds
      }

      if (webhook.method !== 'GET') {
        if (webhook.body_type === 'form') {
          const params = new URLSearchParams()
          for (const k in body) params.append(k, body[k])
          config.data = params
        } else {
          config.data = body
        }
      }

      const response = await axios(config)
      return { 
        success: true, 
        status: response.status, 
        data: response.data 
      }
    } catch (e: any) {
      console.error('Webhook publish error:', e)
      if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        return { success: false, error: 'Request Timeout (120s)' }
      }
      return { 
        success: false, 
        error: e.response?.data ? JSON.stringify(e.response.data) : e.message,
        status: e.response?.status
      }
    }
  })
}
