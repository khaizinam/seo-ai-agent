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

export async function ensureConnection(store: Store): Promise<KnexType> {
  if (!knexInstance) {
    const config = store.get('dbConfig') as DBConfig | undefined
    if (config) {
      await connectDB(config)
    }
  }
  
  if (knexInstance) {
    try {
      await knexInstance.raw('SELECT 1')
    } catch (e: any) {
      if (e.code === 'ECONNRESET' || e.fatal) {
        console.log('DB connection lost, attempting to reconnect...')
        const config = store.get('dbConfig') as DBConfig | undefined
        if (config) {
          await connectDB(config)
        }
      }
    }
  }
  
  return getKnex()
}

export async function runMigrations(store: Store): Promise<void> {
  const config = store.get('dbConfig') as DBConfig | undefined
  if (!config) return

  const knex = getKnex()

  // campaigns
  if (!(await knex.schema.hasTable('campaigns'))) {
    await knex.schema.createTable('campaigns', (t) => {
      t.increments('id').primary()
      t.string('name', 255).notNullable()
      t.text('description')
      t.enum('status', ['active', 'paused', 'done']).defaultTo('active')
      t.enum('duration_type', ['weeks', 'months']).defaultTo('weeks')
      t.integer('duration_value').defaultTo(4)
      t.integer('articles_per_week').defaultTo(4)
      t.timestamps(true, true)
    })
  } else {
    // Check missing columns
    if (!(await knex.schema.hasColumn('campaigns', 'duration_type'))) {
      await knex.schema.table('campaigns', t => {
        t.enum('duration_type', ['weeks', 'months']).defaultTo('weeks')
        t.integer('duration_value').defaultTo(4)
      })
    }
    if (!(await knex.schema.hasColumn('campaigns', 'articles_per_week'))) {
      await knex.schema.table('campaigns', t => {
        t.integer('articles_per_week').defaultTo(4)
      })
    }
  }

  // keywords
  if (!(await knex.schema.hasTable('keywords'))) {
    await knex.schema.createTable('keywords', (t) => {
      t.increments('id').primary()
      t.integer('campaign_id').unsigned().references('id').inTable('campaigns').onDelete('CASCADE')
      t.string('keyword', 500).notNullable()
      t.integer('volume').defaultTo(0)
      t.integer('difficulty').defaultTo(0)
      t.enum('intent', ['informational', 'commercial', 'transactional', 'navigational']).defaultTo('informational')
      t.enum('status', ['pending', 'in_progress', 'done']).defaultTo('pending')
      t.timestamps(true, true)
    })
  }

  // personas
  if (!(await knex.schema.hasTable('personas'))) {
    await knex.schema.createTable('personas', (t) => {
      t.increments('id').primary()
      t.string('name', 255).notNullable()
      t.text('description')
      t.text('writing_style')
      t.string('tone', 100).defaultTo('friendly')
      t.text('example_text')
      t.text('prompt_template')
      t.timestamps(true, true)
    })
  }

  // articles
  if (!(await knex.schema.hasTable('articles'))) {
    await knex.schema.createTable('articles', (t) => {
      t.increments('id').primary()
      t.integer('keyword_id').unsigned().references('id').inTable('keywords').onDelete('SET NULL').nullable()
      t.integer('persona_id').unsigned().references('id').inTable('personas').onDelete('SET NULL').nullable()
      t.string('title', 500)
      t.string('slug', 500)
      t.text('content_html', 'longtext')
      t.text('content_text', 'longtext')
      t.string('meta_title', 70)
      t.string('meta_description', 300)
      t.enum('meta_title_status', ['auto', 'edited', 'approved']).defaultTo('auto')
      t.enum('meta_desc_status', ['auto', 'edited', 'approved']).defaultTo('auto')
      t.integer('seo_score').defaultTo(0)
      t.enum('status', ['draft', 'reviewed', 'published']).defaultTo('draft')
      t.string('thumbnail_path', 500)
      t.string('thumbnail_url', 500)
      t.enum('article_type', ['pillar', 'satellite']).defaultTo('satellite')
      t.integer('campaign_id').unsigned().references('id').inTable('campaigns').onDelete('CASCADE').nullable()
      t.integer('week_number').defaultTo(1)
      t.string('keyword', 500)
      t.text('content_social', 'longtext')
      t.text('thumbnail_prompt')
      t.integer('current_step').defaultTo(1)
      t.integer('highest_unlocked_step').defaultTo(1)
      t.text('campaign_summary', 'longtext')
      t.string('tone_of_voice', 100)
      t.text('target_audience', 'longtext')
      t.string('output_language', 50)
      t.text('primary_keywords', 'longtext') // stored as JSON string
      t.text('secondary_keywords', 'longtext') // stored as JSON string
      t.text('keyword_placement_rules', 'longtext') // stored as JSON string
      t.text('eeat_summary', 'longtext')
      t.text('qna_list', 'longtext') // stored as JSON string
      t.text('outline_data', 'longtext') // stored as JSON string
      t.timestamps(true, true)
    })
  } else {
    // Check missing columns
    if (!(await knex.schema.hasColumn('articles', 'campaign_id'))) {
      await knex.schema.table('articles', t => {
        t.enum('article_type', ['pillar', 'satellite']).defaultTo('satellite')
        t.integer('campaign_id').unsigned().references('id').inTable('campaigns').onDelete('CASCADE').nullable()
        t.integer('week_number').defaultTo(1)
      })
    }
    if (!(await knex.schema.hasColumn('articles', 'keyword'))) {
      await knex.schema.table('articles', t => {
        t.string('keyword', 500)
      })
    }
    if (!(await knex.schema.hasColumn('articles', 'content_social'))) {
      await knex.schema.table('articles', t => {
        t.text('content_social')
      })
    }
    if (!(await knex.schema.hasColumn('articles', 'thumbnail_prompt'))) {
      await knex.schema.table('articles', t => {
        t.text('thumbnail_prompt')
      })
    }
    // Linear Wizard Fields
    if (!(await knex.schema.hasColumn('articles', 'current_step'))) {
      await knex.schema.table('articles', t => {
        t.integer('current_step').defaultTo(1)
        t.integer('highest_unlocked_step').defaultTo(1)
        t.text('campaign_summary', 'longtext')
        t.string('tone_of_voice', 100)
        t.text('target_audience', 'longtext')
        t.string('output_language', 50)
        t.text('primary_keywords', 'longtext')
        t.text('secondary_keywords', 'longtext')
        t.text('keyword_placement_rules', 'longtext')
        t.text('eeat_summary', 'longtext')
        t.text('qna_list', 'longtext')
        t.text('outline_data', 'longtext')
        t.text('internal_links', 'longtext')
      })
    }

    if (!(await knex.schema.hasColumn('articles', 'internal_links'))) {
      await knex.schema.table('articles', t => {
        t.text('internal_links', 'longtext')
      })
    }

    // Force alter some fields to longtext if they are not already longtext (mostly for MySQL)
    if (knex.client.config.client === 'mysql2' || knex.client.config.client === 'mysql') {
      try {
         await knex.raw(`
           ALTER TABLE articles 
           MODIFY COLUMN content_html LONGTEXT,
           MODIFY COLUMN content_text LONGTEXT,
           MODIFY COLUMN content_social LONGTEXT,
           MODIFY COLUMN campaign_summary LONGTEXT,
           MODIFY COLUMN target_audience LONGTEXT,
           MODIFY COLUMN primary_keywords LONGTEXT,
           MODIFY COLUMN secondary_keywords LONGTEXT,
           MODIFY COLUMN keyword_placement_rules LONGTEXT,
           MODIFY COLUMN eeat_summary LONGTEXT,
           MODIFY COLUMN qna_list LONGTEXT,
           MODIFY COLUMN outline_data LONGTEXT,
           MODIFY COLUMN internal_links LONGTEXT
         `)
      } catch (e) {
         console.error('Lỗi khi nâng cấp cột bài viết lên LONGTEXT:', e)
      }
    }
  }

  // thumbnail_prompts
  if (!(await knex.schema.hasTable('thumbnail_prompts'))) {
    await knex.schema.createTable('thumbnail_prompts', (t) => {
      t.increments('id').primary()
      t.string('name', 255).notNullable()
      t.text('prompt_template')
      t.string('style', 100)
      t.timestamps(true, true)
    })
  }

  // seo_audits
  if (!(await knex.schema.hasTable('seo_audits'))) {
    await knex.schema.createTable('seo_audits', (t) => {
      t.increments('id').primary()
      t.integer('article_id').unsigned().references('id').inTable('articles').onDelete('CASCADE')
      t.integer('score').defaultTo(0)
      t.json('issues')
      t.json('suggestions')
      t.timestamp('audited_at').defaultTo(knex.fn.now())
    })
  }

  // webhooks
  if (!(await knex.schema.hasTable('webhooks'))) {
    await knex.schema.createTable('webhooks', (t) => {
      t.increments('id').primary()
      t.string('name', 255).notNullable()
      t.string('endpoint_url', 1000).notNullable()
      t.enum('method', ['GET', 'POST', 'PUT', 'PATCH']).defaultTo('POST')
      t.text('headers') // json string of {key, value} arrays
      t.enum('body_type', ['form', 'json']).defaultTo('json')
      t.text('body_mapping') // json string of mappings
      t.enum('status', ['active', 'inactive']).defaultTo('active')
      t.timestamps(true, true)
    })
  }

  // ai_logs
  if (!(await knex.schema.hasTable('ai_logs'))) {
    await knex.schema.createTable('ai_logs', (t) => {
      t.increments('id').primary()
      t.string('provider', 50)
      t.string('model', 100)
      t.text('messages', 'longtext')
      t.text('response', 'longtext')
      t.integer('duration_ms')
      t.string('status', 20) // success, error
      t.text('error_message')
      t.integer('prompt_tokens')
      t.integer('completion_tokens')
      t.integer('total_tokens')
      t.timestamp('created_at').defaultTo(knex.fn.now())
    })
  }
}

export async function resetDB(store: Store): Promise<{ success: boolean; message: string }> {
  try {
    const knex = getKnex()
    
    // Disable foreign key checks for dropping
    if (knex.client.config.client === 'mysql2' || knex.client.config.client === 'mysql') {
      await knex.raw('SET FOREIGN_KEY_CHECKS = 0')
    } else if (knex.client.config.client === 'pg') {
      // In PG we can use DROP TABLE ... CASCADE or just drop in order
    }

    const tables = ['ai_logs', 'webhooks', 'seo_audits', 'articles', 'keywords', 'campaigns', 'personas', 'thumbnail_prompts']
    for (const table of tables) {
      await knex.schema.dropTableIfExists(table)
    }

    if (knex.client.config.client === 'mysql2' || knex.client.config.client === 'mysql') {
      await knex.raw('SET FOREIGN_KEY_CHECKS = 1')
    }

    // Run migrations again
    await runMigrations(store)

    return { success: true, message: 'Đã xóa toàn bộ dữ liệu và cấu hình lại database!' }
  } catch (err: unknown) {
    const error = err as Error
    return { success: false, message: 'Lỗi reset DB: ' + error.message }
  }
}
