import React, { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Receipt,
  Package,
  BookOpen,
  Menu,
  X,
  ShoppingBag,
  Building2,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react"

export const MobileBottomNav: React.FC = () => {
  const location = useLocation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const primaryTabs = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Billing", href: "/billing", icon: Receipt, isAction: true },
    { name: "Products", href: "/products", icon: Package },
    { name: "Khata", href: "/khata", icon: BookOpen },
  ]

  const moreNavItems = [
    { name: "Purchases", href: "/purchases", icon: ShoppingBag, desc: "Inbound wholesale stock" },
    { name: "Suppliers", href: "/suppliers", icon: Building2, desc: "Vendors & payment balances" },
    { name: "Expenses", href: "/expenses", icon: Wallet, desc: "Rent, electricity, staff wages" },
    { name: "Reports", href: "/reports", icon: BarChart3, desc: "P&L, margins & CSV exports" },
    { name: "Settings", href: "/settings", icon: Settings, desc: "Shop profile, theme & preferences" },
  ]

  return (
    <>
      {/* Fixed Bottom Tab Bar (Visible only on < md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t md:hidden flex items-center justify-around px-2 py-1.5 shadow-lg">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon
          const isActive =
            location.pathname === tab.href ||
            (tab.href === "/dashboard" && location.pathname === "/")

          if (tab.isAction) {
            return (
              <NavLink
                key={tab.name}
                to={tab.href}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-background transition-transform active:scale-95">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-primary mt-0.5">
                  {tab.name}
                </span>
              </NavLink>
            )
          }

          return (
            <NavLink
              key={tab.name}
              to={tab.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{tab.name}</span>
            </NavLink>
          )
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
            isDrawerOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>

      {/* "More" Drawer Modal for Mobile */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-card border-t rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-base font-bold text-foreground">Kirana Navigation</h3>
                <p className="text-xs text-muted-foreground">All store modules and operational tools</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "hover:bg-accent/40 text-foreground"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block truncate">{item.name}</span>
                      <span
                        className={`text-[11px] truncate ${
                          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {item.desc}
                      </span>
                    </div>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
