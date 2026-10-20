import React from "react"
import type { Product } from "@/types/product"
import { formatINR, calculateMargin, formatStock } from "@/lib/formatters"
import { AlertCircle, AlertTriangle, Edit3, Trash2 } from "lucide-react"

interface ProductTableProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  "Groceries & Staples": "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  "Snacks & Biscuits": "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  "Dairy & Bakery": "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  "Beverages": "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  "Spices & Masalas": "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  "Personal Care": "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  "Cleaning & Household": "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  "Pooja & Others": "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
}) => {
  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4 text-right">Purchase ₹</th>
              <th className="py-3 px-4 text-right">Sell ₹</th>
              <th className="py-3 px-4 text-right">Margin %</th>
              <th className="py-3 px-4 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const isOutOfStock = Number(product.stock_quantity) <= 0
              const isLowStock =
                !isOutOfStock &&
                Number(product.stock_quantity) <= Number(product.min_stock_alert)

              const { marginPercent } = calculateMargin(
                product.purchase_price,
                product.selling_price
              )

              const categoryColor =
                CATEGORY_COLORS[product.category] ??
                "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300"

              return (
                <tr
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="hover:bg-muted/40 cursor-pointer transition-colors group"
                >
                  {/* Product Name + Brand */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.brand ? (
                          <span className="text-xs text-muted-foreground">
                            {product.brand}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">
                            Generic
                          </span>
                        )}
                        {product.barcode && (
                          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                            {product.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${categoryColor}`}
                    >
                      {product.category}
                    </span>
                  </td>

                  {/* Stock Quantity + Warning Pill */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <span>0 {product.unit} (Out of Stock)</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>{formatStock(product.stock_quantity, product.unit)} (Low)</span>
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {formatStock(product.stock_quantity, product.unit)}
                      </span>
                    )}
                  </td>

                  {/* Purchase Price (en-IN + tabular-nums) */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatINR(product.purchase_price)}
                    </span>
                  </td>

                  {/* Selling Price (en-IN + tabular-nums) */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="font-mono tabular-nums font-semibold text-foreground">
                      {formatINR(product.selling_price)}
                    </span>
                  </td>

                  {/* Margin % */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-mono tabular-nums ${
                        marginPercent >= 15
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : marginPercent >= 5
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                      }`}
                    >
                      {marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`}
                    </span>
                  </td>

                  {/* Actions Menu */}
                  <td
                    className="py-3 px-4 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        title="Edit product"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        title="Delete product"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="px-4 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {products.length} {products.length === 1 ? "item" : "items"}</span>
        <span>Click any row to view details & edit</span>
      </div>
    </div>
  )
}

export default ProductTable
