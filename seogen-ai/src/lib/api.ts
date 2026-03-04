// Type-safe wrapper around the Electron contextBridge API
declare global {
  interface Window {
    api: {
      invoke: (channel: string, payload?: unknown) => Promise<unknown>
      on: (channel: string, callback: (...args: unknown[]) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}

export function invoke<T = unknown>(channel: string, payload?: unknown): Promise<T> {
  return window.api.invoke(channel, payload) as Promise<T>
}

export function listen(channel: string, callback: (...args: unknown[]) => void) {
  window.api.on(channel, callback)
  return () => window.api.removeAllListeners(channel)
}
