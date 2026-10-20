import { useState, useEffect, useCallback } from "react"
import type { AppPreferences, AppTheme } from "@/types/profile"
import { toast } from "sonner"

const PREFERENCES_STORAGE_KEY = "kiranatrack_preferences_cache"

export const defaultPreferences: AppPreferences = {
  theme: "system",
  currency: "INR",
  dateFormat: "dd MMM yyyy",
}

export function getStoredPreferences(): AppPreferences {
  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && parsed.theme) {
        return {
          ...defaultPreferences,
          ...parsed,
        }
      }
    }
  } catch {
    // Ignore storage errors
  }
  return defaultPreferences
}

export function savePreferences(prefs: AppPreferences) {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors
  }
}

export function applyThemeClass(theme: AppTheme) {
  const root = document.documentElement
  let isDark = false

  if (theme === "dark") {
    isDark = true
  } else if (theme === "light") {
    isDark = false
  } else {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  }

  if (isDark) {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(getStoredPreferences)

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyThemeClass(preferences.theme)

    if (preferences.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        applyThemeClass("system")
      }
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [preferences.theme])

  const updatePreferences = useCallback((newPrefs: Partial<AppPreferences>) => {
    setPreferences((prev) => {
      const merged = { ...prev, ...newPrefs }
      savePreferences(merged)
      if (newPrefs.theme) {
        applyThemeClass(newPrefs.theme)
      }
      return merged
    })
    toast.success("Preferences updated")
  }, [])

  return {
    preferences,
    updatePreferences,
  }
}
