import React from "react"
import { useSearchParams } from "react-router-dom"
import { ProfileSettingsTab } from "@/components/settings/ProfileSettingsTab"
import { PreferencesTab } from "@/components/settings/PreferencesTab"
import { DangerZoneTab } from "@/components/settings/DangerZoneTab"
import { Settings, User, Sliders, AlertTriangle } from "lucide-react"

type SettingsTab = "profile" | "preferences" | "danger"

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab") as SettingsTab | null
  const activeTab: SettingsTab = tabParam && ["profile", "preferences", "danger"].includes(tabParam)
    ? tabParam
    : "profile"

  const setActiveTab = (tab: SettingsTab) => {
    setSearchParams({ tab })
  }

  const tabs = [
    { id: "profile" as SettingsTab, label: "Store Profile", icon: User },
    { id: "preferences" as SettingsTab, label: "Preferences", icon: Sliders },
    { id: "danger" as SettingsTab, label: "Danger Zone", icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Settings & Store Configuration
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your store business profile, UI theme, regional preferences, and account controls.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isDanger = tab.id === "danger"
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? isDanger
                    ? "bg-destructive text-destructive-foreground shadow-xs"
                    : "bg-primary text-primary-foreground shadow-xs"
                  : isDanger
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "profile" && <ProfileSettingsTab />}
        {activeTab === "preferences" && <PreferencesTab />}
        {activeTab === "danger" && <DangerZoneTab />}
      </div>
    </div>
  )
}

export default SettingsPage
