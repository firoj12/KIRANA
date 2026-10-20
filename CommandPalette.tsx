import React, { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { usePreferences } from "@/hooks/usePreferences"
import {
  Search,
  LayoutDashboard,
  Receipt,
  Package,
  ShoppingBag,
  Building2,
  Wallet,
  BookOpen,
  BarChart3,
  Settings,
  PlusCircle,
  Sun,
  Moon,
  X,
  CornerDownLeft,
} from "lucide-react"

interface CommandItem {
  id: string
  label: string
  subtitle?: string
  category: "Navigation" | "Quick Actions" | "Preferences"
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { preferences, updatePreferences } = usePreferences()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-dashboard",
        label: "Dashboard",
        subtitle: "Store KPIs, sales trend & top products",
        category: "Navigation",
        icon: LayoutDashboard,
        action: () => {
          navigate("/dashboard")
          onClose()
        },
      },
      {
        id: "nav-billing",
        label: "Billing / POS Register",
        subtitle: "Barcode scanner, cart & receipt generator",
        category: "Navigation",
        icon: Receipt,
        action: () => {
          navigate("/billing")
          onClose()
        },
      },
      {
        id: "nav-products",
        label: "Products Catalog",
        subtitle: "Stock levels, selling price & GST rates",
        category: "Navigation",
        icon: Package,
        action: () => {
          navigate("/products")
          onClose()
        },
      },
      {
        id: "nav-purchases",
        label: "Purchases & Inbound Stock",
        subtitle: "Wholesale restock bills & supplier payments",
        category: "Navigation",
        icon: ShoppingBag,
        action: () => {
          navigate("/purchases")
          onClose()
        },
      },
      {
        id: "nav-suppliers",
        label: "Suppliers Directory",
        subtitle: "Wholesale vendors, GSTIN & payable balances",
        category: "Navigation",
        icon: Building2,
        action: () => {
          navigate("/suppliers")
          onClose()
        },
      },
      {
        id: "nav-expenses",
        label: "Expenses & Overheads",
        subtitle: "Rent, power bills, staff wages & transport",
        category: "Navigation",
        icon: Wallet,
        action: () => {
          navigate("/expenses")
          onClose()
        },
      },
      {
        id: "nav-khata",
        label: "Khata (Customer Ledger)",
        subtitle: "Customer credit limits & udhaar tracking",
        category: "Navigation",
        icon: BookOpen,
        action: () => {
          navigate("/khata")
          onClose()
        },
      },
      {
        id: "nav-reports",
        label: "Reports & Financial Analytics",
        subtitle: "Gross profit, COGS, net margins & CSV export",
        category: "Navigation",
        icon: BarChart3,
        action: () => {
          navigate("/reports")
          onClose()
        },
      },
      {
        id: "nav-settings",
        label: "Settings",
        subtitle: "Shop profile, theme, currency & danger zone",
        category: "Navigation",
        icon: Settings,
        action: () => {
          navigate("/settings")
          onClose()
        },
      },

      // Quick Actions
      {
        id: "qa-new-sale",
        label: "+ New Bill / POS Sale",
        subtitle: "Open POS register for quick customer billing",
        category: "Quick Actions",
        icon: PlusCircle,
        action: () => {
          navigate("/billing")
          onClose()
        },
      },
      {
        id: "qa-add-product",
        label: "+ Add Product to Inventory",
        subtitle: "Register barcode, purchase & sell price",
        category: "Quick Actions",
        icon: PlusCircle,
        action: () => {
          navigate("/products?action=add")
          onClose()
        },
      },
      {
        id: "qa-new-purchase",
        label: "+ Record Stock Purchase",
        subtitle: "Inbound wholesale invoice from supplier",
        category: "Quick Actions",
        icon: PlusCircle,
        action: () => {
          navigate("/purchases?action=add")
          onClose()
        },
      },
      {
        id: "qa-log-expense",
        label: "+ Log Business Expense",
        subtitle: "Record shop rent, electricity, freight or wages",
        category: "Quick Actions",
        icon: PlusCircle,
        action: () => {
          navigate("/expenses?action=add")
          onClose()
        },
      },
      {
        id: "qa-add-customer",
        label: "+ Add Customer (Khata)",
        subtitle: "Register customer credit limit & contact",
        category: "Quick Actions",
        icon: PlusCircle,
        action: () => {
          navigate("/khata?action=add")
          onClose()
        },
      },

      // Preferences
      {
        id: "pref-toggle-theme",
        label: preferences.theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme",
        subtitle: preferences.theme === "dark" ? "Activate clean bright mode" : "Activate #0A0A0A dark mode",
        category: "Preferences",
        icon: preferences.theme === "dark" ? Sun : Moon,
        action: () => {
          updatePreferences({ theme: preferences.theme === "dark" ? "light" : "dark" })
          onClose()
        },
      },
    ],
    [navigate, onClose, preferences.theme, updatePreferences]
  )

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase().trim()
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    )
  }, [items, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Keyboard Navigation inside Palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action()
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[75vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="p-3.5 border-b flex items-center gap-3 bg-background">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, or actions... (Esc to close)"
            className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded text-muted-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded border">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-border/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching commands or pages found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold truncate">{item.label}</span>
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <CornerDownLeft className="w-4 h-4 text-primary-foreground shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Navigate with ↑ ↓ • Press Enter to select</span>
          <span>KiranaTrack ⌘K</span>
        </div>
      </div>
    </div>
  )
}
