import { create } from 'zustand'

interface AppStore {
  dbConnected: boolean
  setDbConnected: (v: boolean) => void
  activeProvider: 'gemini' | 'claude' | 'copilot'
  setActiveProvider: (v: 'gemini' | 'claude' | 'copilot') => void
  isGenerating: boolean
  setIsGenerating: (v: boolean) => void
  theme: 'light' | 'dark' | 'auto'
  setTheme: (v: 'light' | 'dark' | 'auto') => void
  toast: { message: string, type: 'success' | 'error' } | null
  setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  dbConnected: false,
  setDbConnected: (dbConnected) => set({ dbConnected }),
  activeProvider: 'gemini',
  setActiveProvider: (activeProvider) => set({ activeProvider }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toast: null,
  setToast: (toast) => {
    set({ toast })
    if (toast) {
      setTimeout(() => set({ toast: null }), 3000)
    }
  },
}))
