import React, { useState, useMemo } from "react"
import type { Customer } from "@/types/sale"
import { formatINR } from "@/lib/formatters"
import { Search, UserPlus, Phone, BookOpen, ChevronRight, X } from "lucide-react"

interface CustomerListProps {
  customers: Customer[]
  selectedCustomerId: string | null
  onSelectCustomer: (customer: Customer) => void
  onOpenAddModal: () => void
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    })
  }, [customers, searchQuery])

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.outstanding_balance) || 0), 0)
  }, [customers])

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-xs overflow-hidden">
      {/* Header & Market Credit KPI */}
      <div className="p-4 border-b bg-muted/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Khata Customers</h2>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Customer</span>
          </button>
        </div>

        {/* Total Outstanding Banner */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 block">
              Total Market Credit (Udhaar)
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-amber-900 dark:text-amber-200">
              {formatINR(totalOutstanding)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {customers.length} accounts
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer by name or phone..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-sm font-medium">No customers found</p>
            <p className="text-xs mt-1">Try another search or add a new customer</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const isSelected = customer.id === selectedCustomerId
            const balance = Number(customer.outstanding_balance) || 0
            const limit = Number(customer.credit_limit) || 2000
            const limitUsedPercent = Math.min(100, Math.round((balance / limit) * 100))
            const isNearLimit = limitUsedPercent >= 80

            const initials = customer.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()

            return (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-primary/10 border-primary text-foreground shadow-xs ring-1 ring-primary/30"
                    : "bg-background hover:bg-muted/40 hover:border-border"
                }`}
              >
                {/* Avatar & Customer Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      balance > 0
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    }`}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate">{customer.name}</h4>
                    {customer.phone ? (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3" />
                        <span>{customer.phone}</span>
                      </p>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/60 italic">
                        No phone
                      </span>
                    )}

                    {/* Credit Limit mini bar */}
                    <div className="w-24 bg-muted rounded-full h-1 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isNearLimit ? "bg-red-500" : "bg-primary"
                        }`}
                        style={{ width: `${limitUsedPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Balance & Arrow */}
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <span
                      className={`block text-xs font-bold font-mono tabular-nums ${
                        balance > 0
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatINR(balance)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Limit: {formatINR(limit, false)}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground ${isSelected ? "text-primary" : ""}`} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default CustomerList
