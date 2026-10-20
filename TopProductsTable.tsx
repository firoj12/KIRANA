import React from "react"
import type { TopProductReportItem } from "@/types/report"
import { formatINR } from "@/lib/formatters"
import { Package, Trophy } from "lucide-react"

interface TopProductsTableProps {
  products: TopProductReportItem[]
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({ products }) => {
  const hasProducts = products && products.length > 0

  return (
    <div className="bg-card border rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Top Products by Sales</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Best performing catalog items, volumes, and margins in this period
          </p>
        </div>
        {hasProducts && (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border font-medium">
            Top {products.length} Items
          </span>
        )}
      </div>

      {/* Table Canvas */}
      {!hasProducts ? (
        <div className="p-8 text-center border border-dashed rounded-xl m-4 bg-muted/20">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <span className="text-xs font-semibold text-foreground block">
            No sales recorded in this period
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Product sales performance and margins will appear here
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-5 py-3 text-right">Units Sold</th>
                <th className="px-5 py-3 text-right">Revenue (₹)</th>
                <th className="px-5 py-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((p, idx) => {
                const isHighMargin = p.marginPercent >= 20
                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    {/* Rank */}
                    <td className="px-5 py-3 font-bold text-muted-foreground font-mono">
                      {idx + 1}
                    </td>

                    {/* Product Name */}
                    <td className="px-5 py-3 font-semibold text-foreground">
                      <div className="text-xs leading-snug">{p.name}</div>
                      {p.brand && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {p.brand}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border">
                        {p.category}
                      </span>
                    </td>

                    {/* Units Sold */}
                    <td className="px-5 py-3 text-right font-bold text-foreground font-mono tabular-nums whitespace-nowrap">
                      {p.unitsSold} {p.unit}
                    </td>

                    {/* Revenue */}
                    <td className="px-5 py-3 text-right font-extrabold text-foreground font-mono tabular-nums whitespace-nowrap">
                      {formatINR(p.revenue)}
                    </td>

                    {/* Margin % */}
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono tabular-nums font-bold text-[11px] ${
                          isHighMargin
                            ? "bg-emerald-500/10 text-emerald-600"
                            : p.marginPercent > 0
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        +{p.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
