import Knex, { Knex as KnexType } from 'knex'
import Store from 'electron-store'

export interface DBConfig {
  type: 'mysql' | 'mariadb' | 'postgresql'
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
}

let knexInstance: KnexType | null = null

function getClient(type: DBConfig['type']): string {
  if (type === 'postgresql') return 'pg'
  return 'mysql2' // mysql and mariadb both use mysql2
}

export function createKnex(config: DBConfig): KnexType {
  return Knex({
    client: getClient(config.type),
    connection: {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    },
    pool: { min: 2, max: 10 },
    acquireConnectionTimeout: 10000,
  })
}

export async function connectDB(config: DBConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (knexInstance) {
      await knexInstance.destroy()
    }
    const newKnex = createKnex(config)
    // Test connection
    await newKnex.raw('SELECT 1')
    knexInstance = newKnex
    return { success: true, message: 'Kết nối thành công!' }
  } catch (err: unknown) {
    const error = err as Error
    return { success: false, message: error.message || 'Lỗi kết nối DB' }
  }
}

export function getKnex(): KnexType {
  if (!knexInstance) {
    throw new Error('Database chưa được kết nối. Vui lòng vào Settings > Database để cấu hình.')
  }
  return knexInstance
}

export async function runMigrations(store: Store): Promise<void> {
  const config = store.get('dbConfig') as DBConfig | undefined
  if (!config) return

  const knex = getKnex()
  await knex.schema
    // campaigns
    .createTableIfNotExists('campaigns', (t) => {
      t.increments('id').primary()
      t.string('name', 255).notNullable()
      t.text('description')
      t.enum('status', ['active', 'paused', 'done']).defaultTo('active')
      t.timestamps(true, true)
    })
    // keywords
    .createTableIfNotExists('keywords', (t) => {
      t.increments('id').primary()
      t.integer('campaign_id').unsigned().references('id').inTable('campaigns').onDelete('CASCADE')
      t.string('keyword', 500).notNullable()
      t.integer('volume').defaultTo(0)
      t.integer('difficulty').defaultTo(0)
      t.enum('intent', ['informational', 'commercial', 'transactional', 'navigational']).defaultTo('informational')
      t.enum('status', ['pending', 'in_progress', 'done']).defaultTo('pending')
      t.timestamps(true, true)
    })
    // personas
    .createTableIfNotExists('personas', (t) => {
      t.increments('id').primary()
      t.string('name', 255).notNullable()
      t.text('description')
      t.text('writing_style')
      t.string('tone', 100).defaultTo('friendly')
      t.text('example_text')
      t.text('prompt_template')
      t.timestamps(true, true)
    })
    // articles
    .createTableIfNotExists('articles', (t) => {
      t.increments('id').primary()
      t.integer('keyword_id').unsigned().references('id').inTable('keywords').onDelete('SET NULL').nullable()
      t.integer('persona_id').unsigned().references('id').inTable('personas').onDelete('SET NULL').nullable()
      t.string('title', 500)
      t.string('slug', 500)
      t.text('content_html')
      t.text('content_text')
      t.string('meta_title', 70)
      t.string('meta_description', 300)
      t.enum('meta_title_status', ['auto', 'edited', 'approved']).defaultTo('auto')
      t.enum('meta_desc_status', ['auto', 'edited', 'approved']).defaultTo('auto')
      t.integer('seo_score').defaultTo(0)
      t.enum('status', ['draft', 'reviewed', 'published']).defaultTo('draft')
      t.string('thumbnail_path', 500)
      t.string('thumbnail_url', 500)
      t.timestamps(true, true)
    })
    // thumbnail_prompts
    .createTableIfNotExists('thumbnail_prompts', (t) => {
      t.increments('id').primary()
      t.string('name', 255).notNullable()
      t.text('prompt_template')
      t.string('style', 100)
      t.timestamps(true, true)
    })
    // seo_audits
    .createTableIfNotExists('seo_audits', (t) => {
      t.increments('id').primary()
      t.integer('article_id').unsigned().references('id').inTable('articles').onDelete('CASCADE')
      t.integer('score').defaultTo(0)
      t.json('issues')
      t.json('suggestions')
      t.timestamp('audited_at').defaultTo(knex.fn.now())
    })
}
