import { getKnex } from '../services/db/knex.service'

export interface Campaign {
  id: number
  name: string
  description?: string
  status: 'active' | 'paused' | 'done'
  duration_type: 'weeks' | 'months'
  duration_value: number
  created_at?: string
  updated_at?: string
}

export class CampaignRepository {
  private get db() {
    return getKnex()
  }

  async findAll() {
    return this.db<Campaign>('campaigns').orderBy('created_at', 'desc')
  }

  async findById(id: number) {
    return this.db<Campaign>('campaigns').where({ id }).first()
  }

  async create(data: Pick<Campaign, 'name' | 'description' | 'status'>) {
    const [id] = await this.db('campaigns').insert({
      name: data.name,
      description: data.description,
      status: data.status || 'active',
      duration_type: (data as any).duration_type || 'weeks',
      duration_value: (data as any).duration_value || 4
    })
    return this.findById(id)
  }

  async update(id: number, data: Partial<Pick<Campaign, 'name' | 'description' | 'status'>>) {
    await this.db('campaigns').where({ id }).update({
      ...data,
      updated_at: this.db.fn.now()
    })
    return this.findById(id)
  }

  async delete(id: number) {
    await this.db('campaigns').where({ id }).delete()
    return true
  }
}
