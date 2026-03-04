import { contextBridge, ipcRenderer } from 'electron'

// Expose safe API to renderer via contextBridge
contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, payload?: unknown) => ipcRenderer.invoke(channel, payload),
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})

// Type declaration for renderer
export type ElectronAPI = {
  invoke: (channel: string, payload?: unknown) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  removeAllListeners: (channel: string) => void
}
