import { getKnex } from '../services/db/knex.service'

export interface Keyword {
  id: number
  campaign_id: number
  keyword: string
  volume?: number
  difficulty?: number
  intent?: string
  status: 'pending' | 'in_progress' | 'done' | 'failed'
  created_at?: string
  updated_at?: string
}

export class KeywordRepository {
  private get db() {
    return getKnex()
  }

  async findByCampaignId(campaignId: number) {
    return this.db<Keyword>('keywords').where({ campaign_id: campaignId }).orderBy('created_at', 'desc')
  }

  async create(data: Pick<Keyword, 'campaign_id' | 'keyword' | 'volume' | 'difficulty' | 'intent' | 'status'>) {
    const [id] = await this.db('keywords').insert({
      ...data,
      status: data.status || 'pending'
    })
    return this.db('keywords').where({ id }).first()
  }

  async bulkCreate(campaign_id: number, keywords: string[]) {
    const rows = keywords.map(k => ({
      campaign_id,
      keyword: k,
      status: 'pending'
    }))
    await this.db('keywords').insert(rows)
    return rows.length
  }

  async updateStatus(id: number, status: string) {
    await this.db('keywords').where({ id }).update({ status })
    return true
  }

  async syncKeywords(campaign_id: number, keywords: { keyword: string, intent: string }[]) {
    // Start a transaction if possible, or just delete then insert
    await this.db('keywords').where({ campaign_id }).delete()
    
    if (keywords.length > 0) {
      const rows = keywords.map(k => ({
        campaign_id,
        keyword: k.keyword,
        intent: k.intent || 'informational',
        status: 'pending' // Default status, though hidden in UI
      }))
      await this.db('keywords').insert(rows)
    }
    return keywords.length
  }

  async delete(id: number) {
    await this.db('keywords').where({ id }).delete()
    return true
  }
}
