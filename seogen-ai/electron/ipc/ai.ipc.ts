import { ipcMain, BrowserWindow } from 'electron'
import Store from 'electron-store'
import axios from 'axios'

interface AIProfile {
  id: string
  name: string
  provider: 'gemini' | 'claude' | 'copilot'
  apiKey: string
  model: string
  active: boolean
  baseUrl?: string
}

interface AIConfig {
  geminiKey?: string
  geminiModel?: string
  claudeKey?: string
  claudeModel?: string
  copilotKey?: string
  copilotModel?: string
  defaultProvider?: 'gemini' | 'claude' | 'copilot'
  nanoBananaKey?: string
  profiles?: AIProfile[]
}

interface AIGeneratePayload {
  provider: 'gemini' | 'claude' | 'copilot'
  model?: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  stream?: boolean
  maxTokens?: number
  temperature?: number
}

export function registerAiIpc(store: Store) {
  // Save AI config
  ipcMain.handle('ai:saveConfig', async (_event, config: AIConfig) => {
    store.set('aiConfig', config)
    return { success: true }
  })

  // Get AI config (masked keys)
  ipcMain.handle('ai:getConfig', async () => {
    const config = store.get('aiConfig') as AIConfig | undefined
    if (!config) return null
    // Mask API keys for display
    return {
      ...config,
      geminiKey: config.geminiKey ? '••••' + config.geminiKey.slice(-6) : '',
      claudeKey: config.claudeKey ? '••••' + config.claudeKey.slice(-6) : '',
      copilotKey: config.copilotKey ? '••••' + config.copilotKey.slice(-6) : '',
      nanoBananaKey: config.nanoBananaKey ? '••••' + config.nanoBananaKey.slice(-6) : '',
    }
  })

  // Test AI connection
  ipcMain.handle('ai:testKey', async (_event, { provider, key }: { provider: string; key: string }) => {
    try {
      if (provider === 'gemini') {
        const res = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
          { timeout: 8000 }
        )
        return { success: true, message: `Gemini OK — ${res.data.models?.length || 0} models` }
      }
      if (provider === 'claude') {
        const res = await axios.get('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          timeout: 8000,
        })
        return { success: true, message: `Claude OK — ${res.data.models?.length || 0} models` }
      }
      if (provider === 'copilot') {
        const res = await axios.get('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
          timeout: 8000,
        })
        return { success: true, message: `OpenAI OK — ${res.data.data?.length || 0} models` }
      }
      return { success: false, message: 'Provider không hợp lệ' }
    } catch (err: unknown) {
      const error = err as { response?: { status: number }; message: string }
      return { success: false, message: `Lỗi: ${error.response?.status || error.message}` }
    }
  })

  // Generate content (non-streaming)
  ipcMain.handle('ai:generate', async (_event, payload: AIGeneratePayload) => {
    const config = store.get('aiConfig') as AIConfig | undefined
    if (!config) return { success: false, error: 'Chưa cấu hình AI API key' }

    try {
      const result = await generateWithProvider(payload, config)
      return { success: true, content: result }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  // Generate meta title + description
  ipcMain.handle('ai:generateMeta', async (_event, { keyword, title, content }: { keyword: string; title: string; content: string }) => {
    const config = store.get('aiConfig') as AIConfig | undefined
    if (!config) return { success: false, error: 'Chưa cấu hình AI API key' }

    const provider = (config.defaultProvider || 'gemini') as AIGeneratePayload['provider']
    const prompt = `Dựa vào bài viết về từ khoá: "${keyword}"
Tiêu đề bài: "${title}"
Nội dung tóm tắt: "${content.slice(0, 500)}..."

Hãy tạo:
1. Meta Title: ≤ 60 ký tự, có từ khoá, hấp dẫn, tự nhiên
2. Meta Description: ≤ 160 ký tự, mô tả lợi ích, có CTA nhẹ

Chỉ trả về JSON thuần, không markdown:
{"meta_title": "...", "meta_description": "..."}`

    try {
      const raw = await generateWithProvider({
        provider,
        messages: [{ role: 'user', content: prompt }],
      }, config)

      // Parse JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ')
      const parsed = JSON.parse(jsonMatch[0])
      return { success: true, ...parsed }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })
}

async function generateWithProvider(payload: AIGeneratePayload, config: AIConfig): Promise<string> {
  let provider = payload.provider
  const messages = payload.messages
  let apiKey: string | undefined
  let model: string | undefined

  // Check if we have active profile in new structure
  const activeProfile = config.profiles?.find(p => p.active)
  if (activeProfile && !payload.provider) {
    // If no specific provider requested, use the active profile
    provider = activeProfile.provider
    apiKey = activeProfile.apiKey
    model = payload.model || activeProfile.model
  } else if (activeProfile && payload.provider === activeProfile.provider) {
    // If requested provider matches active profile, use profile's key/model
    apiKey = activeProfile.apiKey
    model = payload.model || activeProfile.model
  }

  if (!provider) {
    throw new Error('No AI provider specified or active profile found.')
  }

  if (provider === 'gemini') {
    const key = apiKey || config.geminiKey
    const actualModel = model || payload.model || config.geminiModel || 'gemini-2.0-flash'
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    const systemMsg = messages.find(m => m.role === 'system')
    const body: Record<string, unknown> = {
      contents: geminiMessages.filter(m => m.role !== 'system'),
    }
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] }
    }
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      body,
      { timeout: 300000 }
    )
    return res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  if (provider === 'claude') {
    const key = apiKey || config.claudeKey
    const actualModel = model || payload.model || config.claudeModel || 'claude-3-5-sonnet-20241022'
    const systemMsg = messages.find(m => m.role === 'system')
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: payload.maxTokens || 4096,
        system: systemMsg?.content,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role, content: m.content,
        })),
      },
      {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 300000,
      }
    )
    return res.data.content?.[0]?.text || ''
  }

  if (provider === 'copilot') {
    const key = apiKey || config.copilotKey
    const actualModel = model || payload.model || config.copilotModel || 'gpt-4o'
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: actualModel,
        messages,
        max_tokens: payload.maxTokens || 4096,
        temperature: payload.temperature || 0.7,
      },
      {
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        timeout: 300000,
      }
    )
    return res.data.choices?.[0]?.message?.content || ''
  }

  throw new Error(`Provider "${provider}" không được hỗ trợ`)
}
