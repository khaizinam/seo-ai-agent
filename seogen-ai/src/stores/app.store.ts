import { create } from 'zustand'

interface AppStore {
  dbConnected: boolean
  setDbConnected: (v: boolean) => void
  activeProvider: 'gemini' | 'claude' | 'copilot'
  setActiveProvider: (v: 'gemini' | 'claude' | 'copilot') => void
  isGenerating: boolean
  setIsGenerating: (v: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  dbConnected: false,
  setDbConnected: (dbConnected) => set({ dbConnected }),
  activeProvider: 'gemini',
  setActiveProvider: (activeProvider) => set({ activeProvider }),
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}))
