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

  // Get metadata from buffer
  ipcMain.handle('image:metadataFromBuffer', async (_e, base64: string) => {
    try {
      const buffer = Buffer.from(base64, 'base64')
      const meta = await sharp(buffer).metadata()
      return { success: true, width: meta.width, height: meta.height, format: meta.format, size: buffer.length }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  // Convert image: resize + format + quality
  ipcMain.handle('image:convert', async (_e, payload: {
    base64: string;
    width: number;
    format: 'webp' | 'jpg';
    quality: number;
    compress: boolean;
  }) => {
    try {
      const inputBuffer = Buffer.from(payload.base64, 'base64')
      let pipeline = sharp(inputBuffer).resize({ width: payload.width, withoutEnlargement: true })

      if (payload.format === 'webp') {
        pipeline = pipeline.webp({
          quality: payload.quality,
          effort: payload.compress ? 6 : 4,
        })
      } else {
        pipeline = pipeline.jpeg({
          quality: payload.quality,
          mozjpeg: payload.compress,
        })
      }

      const outputBuffer = await pipeline.toBuffer()
      const meta = await sharp(outputBuffer).metadata()

      return {
        success: true,
        base64: outputBuffer.toString('base64'),
        size: outputBuffer.length,
        width: meta.width,
        height: meta.height,
        format: payload.format,
      }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  // Save processed buffer to user-chosen location
  ipcMain.handle('image:saveConverted', async (_e, payload: { base64: string; defaultName: string }) => {
    try {
      const ext = payload.defaultName.split('.').pop() || 'jpg'
      const result = await dialog.showSaveDialog({
        title: 'Lưu ảnh đã xử lý',
        defaultPath: payload.defaultName,
        filters: [
          { name: 'Image', extensions: [ext] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })
      if (result.canceled || !result.filePath) return { success: false, error: 'Hủy lưu' }

      const buffer = Buffer.from(payload.base64, 'base64')
      const fs = await import('fs/promises')
      await fs.writeFile(result.filePath, buffer)

      return { success: true, path: result.filePath }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })

  // Pick multiple image files
  ipcMain.handle('image:pickFiles', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Chọn ảnh để chuyển đổi',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }],
      properties: ['openFile', 'multiSelections'],
    })
    if (result.canceled || !result.filePaths.length) return null
    return result.filePaths
  })

  // Read file to base64
  ipcMain.handle('image:readFileBase64', async (_e, filePath: string) => {
    try {
      const fs = await import('fs/promises')
      const buffer = await fs.readFile(filePath)
      return { success: true, base64: buffer.toString('base64'), name: require('path').basename(filePath) }
    } catch (err: unknown) {
      const error = err as Error
      return { success: false, error: error.message }
    }
  })
}
