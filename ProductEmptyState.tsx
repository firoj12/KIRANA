import React from "react"
import { PackageSearch, Plus } from "lucide-react"

interface ProductEmptyStateProps {
  onAddClick: () => void
  isFiltered?: boolean
  onResetFilters?: () => void
  onLoadSampleData?: () => void
}

export const ProductEmptyState: React.FC<ProductEmptyStateProps> = ({
  onAddClick,
  isFiltered = false,
  onResetFilters,
  onLoadSampleData,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card border rounded-2xl shadow-xs">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-8 ring-primary/5">
        <PackageSearch className="w-8 h-8 stroke-[1.75]" />
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {isFiltered ? "No matching products found" : "No products yet"}
      </h3>

      <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
        {isFiltered
          ? "No items match your active search or filters. Try adjusting or clearing filters."
          : "Add your first item to start managing stock, sales prices, GST slabs, and low-stock alerts."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {isFiltered && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
          >
            Clear Filters
          </button>
        )}
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add your first item</span>
        </button>

        {!isFiltered && onLoadSampleData && (
          <button
            type="button"
            onClick={onLoadSampleData}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-dashed hover:bg-accent hover:border-solid transition-colors text-muted-foreground hover:text-foreground"
          >
            <span>Load Sample Kirana Items</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductEmptyState
