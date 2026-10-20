import React, { useState, useMemo } from "react"
import type { Product } from "@/types/product"
import { KIRANA_CATEGORIES } from "@/types/product"
import { formatINR } from "@/lib/formatters"
import { Search, Plus, AlertCircle, AlertTriangle, Check, X } from "lucide-react"

interface ProductPickerProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  cartItemQuantities: Record<string, number>
}

export const ProductPicker: React.FC<ProductPickerProps> = ({
  products,
  onAddToCart,
  cartItemQuantities,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = item.name.toLowerCase().includes(q)
        const brandMatch = item.brand?.toLowerCase().includes(q) ?? false
        const barcodeMatch = item.barcode?.toLowerCase().includes(q) ?? false
        if (!nameMatch && !brandMatch && !barcodeMatch) return false
      }

      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false
      }

      return true
    })
  }, [products, searchQuery, selectedCategory])

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-xs overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 border-b space-y-3 bg-muted/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Select Products</h2>
            <p className="text-xs text-muted-foreground">Click any item to add to the cart</p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredProducts.length} available
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, brand, or barcode..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

        {/* Category Tabs / Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Items
          </button>
          {KIRANA_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-sm font-medium">No items match your search</p>
            <p className="text-xs mt-1">Try another keyword or category filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const currentStock = Number(product.stock ?? product.stock_quantity) || 0
              const minAlert = Number(product.low_stock_threshold ?? product.min_stock_alert) || 5
              const isOutOfStock = currentStock <= 0
              const isLowStock = !isOutOfStock && currentStock <= minAlert
              const inCartQty = cartItemQuantities[product.id] || 0
              const isMaxInCart = inCartQty >= currentStock

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (!isOutOfStock && !isMaxInCart) {
                      onAddToCart(product)
                    }
                  }}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                    isOutOfStock
                      ? "opacity-60 bg-muted/30 cursor-not-allowed border-dashed"
                      : isMaxInCart
                      ? "bg-primary/5 border-primary/40 cursor-default"
                      : "bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer active:scale-[0.99]"
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {product.category}
                      </span>
                      {inCartQty > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary text-primary-foreground shrink-0">
                          <Check className="w-3 h-3" />
                          <span>{inCartQty} in cart</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground/80 mt-0.5">{product.brand}</p>
                    )}
                  </div>

                  {/* Pricing & Stock Footer */}
                  <div className="mt-3 pt-2.5 border-t flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold font-mono tabular-nums text-foreground">
                        {formatINR(product.selling_price)}
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        /{product.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                          <AlertCircle className="w-3 h-3" />
                          Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          {currentStock} {product.unit} left
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Stock: {currentStock} {product.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add action hover indicator */}
                  {!isOutOfStock && !isMaxInCart && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductPicker
