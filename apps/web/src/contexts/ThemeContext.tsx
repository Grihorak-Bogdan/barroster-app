import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type SidebarTheme = 'slate' | 'navy' | 'violet' | 'forest' | 'charcoal'

export type ThemePreset = {
  id: SidebarTheme
  label: string
  color: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'slate',    label: 'Slate',    color: '#0F172A' },
  { id: 'navy',     label: 'Navy',     color: '#1E3A5F' },
  { id: 'violet',   label: 'Violet',   color: '#2D1B69' },
  { id: 'forest',   label: 'Forest',   color: '#14532D' },
  { id: 'charcoal', label: 'Charcoal', color: '#1C1C1E' },
]

type ThemeCtx = {
  theme: SidebarTheme
  sidebarColor: string
  setTheme: (t: SidebarTheme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'slate',
  sidebarColor: '#0F172A',
  setTheme: () => {},
})

const STORAGE_KEY = 'barRoster_sidebarTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SidebarTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (THEME_PRESETS.find((p) => p.id === saved) ? saved : 'slate') as SidebarTheme
  })

  const setTheme = (t: SidebarTheme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
  }

  const sidebarColor = THEME_PRESETS.find((p) => p.id === theme)!.color

  return (
    <ThemeContext.Provider value={{ theme, sidebarColor, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
