import React from "react"
import { usePreferences } from "@/hooks/usePreferences"
import type { AppTheme } from "@/types/profile"
import { Sun, Moon, Monitor, IndianRupee, Calendar, Check } from "lucide-react"
import { format } from "date-fns"

export const PreferencesTab: React.FC = () => {
  const { preferences, updatePreferences } = usePreferences()

  const themeOptions: { value: AppTheme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark (#0A0A0A)", icon: Moon },
    { value: "system", label: "System Default", icon: Monitor },
  ]

  const todayExample = format(new Date(), "dd MMM yyyy")

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-card border rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-foreground">Application Preferences</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize the visual appearance, regional numbering, and date formats.
          </p>
        </div>

        {/* 1. Theme Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-foreground block">
            Interface Theme
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon
              const isSelected = preferences.theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updatePreferences({ theme: opt.value })}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30 shadow-xs"
                      : "border-border hover:bg-accent/40 text-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold block truncate">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {opt.value === "dark" ? "High contrast dark" : opt.value === "light" ? "Clean bright" : "Matches OS"}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Currency Setting */}
        <div className="pt-2 border-t space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Store Currency & Numbering</span>
          </label>
          <div className="p-3 bg-muted/20 border rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                ₹
              </div>
              <div>
                <span className="text-xs font-bold text-foreground">Indian Rupee (INR)</span>
                <p className="text-[11px] text-muted-foreground">
                  Formatted using <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">en-IN</code> (Lakhs & Crores, e.g. ₹1,25,000)
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active Standard
            </span>
          </div>
        </div>

        {/* 3. Date Format Setting */}
        <div className="pt-2 border-t space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Date Display Format</span>
          </label>
          <div className="p-3 bg-muted/20 border rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground font-mono">dd MMM yyyy</span>
              <p className="text-[11px] text-muted-foreground">
                Example today: <span className="font-semibold text-foreground">{todayExample}</span>
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              Default Standard
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
