import React from "react"
import type { Supplier } from "@/types/supplier"
import { Search, Plus, Calendar, Building2, Filter } from "lucide-react"

interface PurchaseToolbarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedSupplier: string
  onSupplierChange: (id: string) => void
  suppliers: Supplier[]
  selectedStatus: string
  onStatusChange: (status: string) => void
  dateRangeDays: number
  onDateRangeChange: (days: number) => void
  onNewPurchase: () => void
}

export const PurchaseToolbar: React.FC<PurchaseToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedSupplier,
  onSupplierChange,
  suppliers,
  selectedStatus,
  onStatusChange,
  dateRangeDays,
  onDateRangeChange,
  onNewPurchase,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-3.5 shadow-xs">
      {/* Search & Filters */}
      <div className="flex items-center gap-2.5 flex-1 flex-wrap">
        {/* Search Bill # or Supplier */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bill no or supplier..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Date Range Filter (Default: Last 30 Days) */}
        <div className="flex items-center gap-1 border rounded-lg bg-background px-2.5 py-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <select
            value={dateRangeDays}
            onChange={(e) => onDateRangeChange(Number(e.target.value))}
            className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>All time</option>
          </select>
        </div>

        {/* Supplier Dropdown */}
        <div className="flex items-center gap-1 border rounded-lg bg-background px-2.5 py-1.5 text-xs">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <select
            value={selectedSupplier}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer max-w-[140px] truncate"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status Dropdown */}
        <div className="flex items-center gap-1 border rounded-lg bg-background px-2.5 py-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid / Credit</option>
          </select>
        </div>
      </div>

      {/* CTA: New Purchase */}
      <button
        type="button"
        onClick={onNewPurchase}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        New Purchase
      </button>
    </div>
  )
}
