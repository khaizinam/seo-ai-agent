import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

// Import all IPC handlers
import { registerDbIpc } from './ipc/db.ipc'
import { registerAiIpc } from './ipc/ai.ipc'
import { registerCampaignIpc } from './ipc/campaign.ipc'
import { registerArticleIpc } from './ipc/article.ipc'
import { registerImageIpc } from './ipc/image.ipc'
import { registerAuditIpc } from './ipc/audit.ipc'
import { registerSettingsIpc } from './ipc/settings.ipc'

const store = new Store()
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'SEOGEN AI',
    // icon: join(__dirname, '../build-resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // Frameless không dùng, dùng frame mặc định cho stable
    frame: true,
    backgroundColor: '#0f172a',
    show: false,
  })

  // Restore window position/size
  const bounds = store.get('windowBounds') as Electron.Rectangle | undefined
  if (bounds) {
    mainWindow.setBounds(bounds)
  }

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Save window position on close
  mainWindow.on('close', () => {
    if (mainWindow) {
      store.set('windowBounds', mainWindow.getBounds())
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Register all IPC handlers
function registerAllIpc() {
  registerDbIpc(store)
  registerAiIpc(store)
  registerCampaignIpc()
  registerArticleIpc()
  registerImageIpc(store)
  registerAuditIpc()
  registerSettingsIpc(store)
}

app.whenReady().then(() => {
  createWindow()
  registerAllIpc()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
