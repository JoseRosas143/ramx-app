'use client'

import { useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('ramx-theme') as
      | ThemeMode
      | null

    const initialTheme: ThemeMode = storedTheme === 'dark' ? 'dark' : 'light'

    applyTheme(initialTheme)
    setTheme(initialTheme)
    setReady(true)
  }, [])

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'

    window.localStorage.setItem('ramx-theme', nextTheme)
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white/80 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-950 dark:text-white">
            Apariencia
          </p>
          <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            RAMX usa modo claro como experiencia principal. El modo oscuro se irá ajustando pantalla por pantalla para conservar el estilo premium.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          disabled={!ready}
          className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          {!ready
            ? 'Cargando tema…'
            : theme === 'dark'
              ? '☀️ Volver a modo claro'
              : '🌙 Probar modo oscuro'}
        </button>
      </div>
    </div>
  )
}

function applyTheme(theme: ThemeMode) {
  const isDark = theme === 'dark'

  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}