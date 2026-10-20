import React from "react"
import { Search, Plus, Filter, AlertTriangle, X } from "lucide-react"
import { KIRANA_CATEGORIES } from "@/types/product"

interface ProductToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  lowStockOnly: boolean
  onLowStockToggle: () => void
  onAddProduct: () => void
  lowStockCount?: number
  totalCount?: number
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  lowStockOnly,
  onLowStockToggle,
  onAddProduct,
  lowStockCount = 0,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
      {/* Search & Filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by product, brand, or barcode..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="relative min-w-[170px]">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none pl-8 pr-8 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {KIRANA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        {/* Low Stock Toggle Button */}
        <button
          type="button"
          onClick={onLowStockToggle}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
            lowStockOnly
              ? "bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold ring-2 ring-amber-500/20"
              : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
          title="Filter items below minimum stock alert"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${lowStockOnly ? "text-amber-600" : "text-muted-foreground"}`} />
          <span>Low stock only</span>
          {lowStockCount > 0 && (
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full ${
                lowStockOnly
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {lowStockCount}
            </span>
          )}
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98] w-full md:w-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Product</span>
        </button>
      </div>
    </div>
  )
}

export default ProductToolbar
