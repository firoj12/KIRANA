import React, { useState, useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { format } from "date-fns"
import { useProfile } from "@/hooks/useProfile"
import { usePreferences } from "@/hooks/usePreferences"
import { CommandPalette } from "./CommandPalette"
import { MobileBottomNav } from "./MobileBottomNav"
import { InstallPwaPrompt } from "./InstallPwaPrompt"
import {
  Store,
  LayoutDashboard,
  Package,
  Receipt,
  BookOpen,
  ShoppingBag,
  Building2,
  Wallet,
  BarChart3,
  Settings,
  Calendar,
  CircleDot,
  User,
  Search,
  Sun,
  Moon,
} from "lucide-react"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Billing / POS", href: "/billing", icon: Receipt },
  { name: "Products", href: "/products", icon: Package },
  { name: "Purchases", href: "/purchases", icon: ShoppingBag },
  { name: "Suppliers", href: "/suppliers", icon: Building2 },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Khata (Ledger)", href: "/khata", icon: BookOpen },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface AppShellProps {
  children?: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation()
  const today = format(new Date(), "EEEE, dd MMM yyyy")
  const { data: profile } = useProfile()
  const { preferences, updatePreferences } = usePreferences()
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  // Listen for ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsCommandOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const toggleTheme = () => {
    const nextTheme = preferences.theme === "dark" ? "light" : "dark"
    updatePreferences({ theme: nextTheme })
  }

  const shopName = profile?.shop_name || "Shree Ganesh Kirana Store"
  const ownerName = profile?.owner_name || "Ramesh Gupta"

  return (
    <div className="min-h-screen flex bg-background text-foreground antialiased">
      {/* 240px Fixed/Sticky Sidebar (Desktop only: hidden md:flex) */}
      <aside className="hidden md:flex w-[240px] shrink-0 h-screen sticky top-0 flex-col border-r bg-card z-20">
        {/* Brand Header */}
        <div className="h-16 border-b px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base tracking-tight leading-tight truncate">
              KiranaTrack
            </span>
            <span className="text-xs text-muted-foreground truncate">
              किराना ट्रैक • Manager
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.href ||
              (item.href === "/dashboard" && location.pathname === "/")
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: linkActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    linkActive || isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer / System Status */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs">
            <div className="flex items-center gap-2">
              <CircleDot className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="font-medium">System Ready</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">v1.0 PWA</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Store Info (Desktop) or Mobile Brand */}
          <div className="flex items-center gap-3">
            <div className="flex md:hidden w-8 h-8 rounded-lg bg-primary/10 text-primary items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold leading-none truncate">
                  {shopName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                  Store #01 • Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                Indian Retail & Daily Ledger
              </p>
            </div>
          </div>

          {/* Center/Right: Command Bar Trigger & User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install PWA Prompt (shows if browser supports it and uninstalled) */}
            <InstallPwaPrompt />

            {/* ⌘K Command Palette Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border bg-background hover:bg-accent/50 text-muted-foreground hover:text-foreground text-xs transition cursor-pointer"
              title="Search commands (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono font-semibold bg-muted px-1.5 py-0.5 rounded border ml-1">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
              title={`Current theme: ${preferences.theme}. Click to toggle.`}
              aria-label="Toggle visual theme"
            >
              {preferences.theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {/* Date Widget (Desktop only) */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md border">
              <Calendar className="w-3.5 h-3.5" />
              <span>{today}</span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20 shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-medium leading-none truncate max-w-[100px]">
                  {ownerName}
                </span>
                <span className="text-[10px] text-muted-foreground">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with bottom padding on mobile for MobileBottomNav */}
        <main className="flex-1 p-4 sm:p-6 bg-slate-50/50 dark:bg-zinc-950/50 pb-24 md:pb-6">
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <MobileBottomNav />

      {/* Command Palette Modal (⌘K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  )
}

export default AppShell
