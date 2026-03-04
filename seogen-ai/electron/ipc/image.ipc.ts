import { ipcMain, dialog } from 'electron'
import Store from 'electron-store'
import axios from 'axios'
import sharp from 'sharp'
import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { app } from 'electron'

// Image output directory: inside app user data
function getThumbDir(): string {
  const dir = join(app.getPath('userData'), 'thumbnails')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

interface NanoBananaResponse {
  url?: string
  image_url?: string
  data?: { url: string }[]
}

export function registerImageIpc(store: Store) {
  // Generate image via Nano Banana API then process with Sharp
  ipcMain.handle('image:generate', async (_e, payload: {
    prompt: string; articleId?: number; width?: number; height?: number; style?: string
  }) => {
    const config = store.get('aiConfig') as { nanoBananaKey?: string } | undefined
    if (!config?.nanoBananaKey) {
      return { success: false, error: 'Chưa cấu hình Nano Banana API key' }
    }

    try {
      // Call Nano Banana API
      const res = await axios.post<NanoBananaResponse>(
        'https://api.nanobanana.io/v1/generate',
        {
          prompt: payload.prompt,
          width: payload.width || 1200,
          height: payload.height || 630,
          style: payload.style || 'photorealistic',
          output_format: 'png',
        },
        {
          headers: {
            Authorization: `Bearer ${config.nanoBananaKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      )

      const imageUrl = res.data?.url || res.data?.image_url || res.data?.data?.[0]?.url
      if (!imageUrl) throw new Error('API không trả về URL ảnh')

      // Download image
      const imgRes = await axios.get<ArrayBuffer>(imageUrl, { responseType: 'arraybuffer', timeout: 30000 })
      const inputBuffer = Buffer.from(imgRes.data)

      // Process with Sharp: PNG → JPG, resize width 800px, compress q=82
      const thumbDir = getThumbDir()
      const filename = `thumb_${Date.now()}_${payload.articleId || 'gen'}.jpg`
      const outputPath = join(thumbDir, filename)

      await sharp(inputBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outputPath)

      return {
        success: true,
        path: outputPath,
        filename,
        url: imageUrl,
      }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  // Process an existing image (convert + resize + compress)
  ipcMain.handle('image:process', async (_e, inputPath: string) => {
    try {
      const thumbDir = getThumbDir()
      const filename = `processed_${Date.now()}.jpg`
      const outputPath = join(thumbDir, filename)

      await sharp(inputPath)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(outputPath)

      return { success: true, path: outputPath, filename }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  // Open file dialog to pick an image
  ipcMain.handle('image:pickFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Chọn ảnh Thumbnail',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths.length) return null
    return result.filePaths[0]
  })

  // Save file dialog (export)
  ipcMain.handle('image:saveDialog', async (_e, defaultName: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Lưu file',
      defaultPath: defaultName,
      filters: [{ name: 'All Files', extensions: ['*'] }],
    })
    return result.canceled ? null : result.filePath
  })

  // Get image metadata
  ipcMain.handle('image:metadata', async (_e, imagePath: string) => {
    try {
      const meta = await sharp(imagePath).metadata()
      return { success: true, ...meta }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })
}
