import { useState, useEffect } from 'react'

export function useTableState<T>(key: string, defaultState: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const cached = localStorage.getItem(`table_state_${key}`)
      if (cached) return JSON.parse(cached)
    } catch (e) { }
    return defaultState
  })

  useEffect(() => {
    localStorage.setItem(`table_state_${key}`, JSON.stringify(state))
  }, [key, state])

  return [state, setState] as const
}
