import React from "react"
import type { Purchase } from "@/types/purchase"
import { formatINR } from "@/lib/formatters"
import { format } from "date-fns"
import { PackageOpen, Plus, Eye, Calendar, FileText } from "lucide-react"

interface PurchaseTableProps {
  purchases: Purchase[]
  onOpenNewPurchase: () => void
  onViewDetails?: (purchase: Purchase) => void
}

export const PurchaseTable: React.FC<PurchaseTableProps> = ({
  purchases,
  onOpenNewPurchase,
  onViewDetails,
}) => {
  if (purchases.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center p-6 border rounded-xl bg-card border-dashed space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <PackageOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-semibold text-base text-foreground">No purchases recorded</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Log your first stock-in to update inventory. Record purchase bills, supplier dues, and acquisition costs atomically.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewPurchase}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          + New Purchase
        </button>
      </div>
    )
  }

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Bill No</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4 text-right">Total ₹</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {purchases.map((purchase) => {
              const itemsCount = purchase.items?.length || 0
              let formattedDate = purchase.purchase_date
              try {
                formattedDate = format(new Date(purchase.purchase_date), "dd MMM yyyy")
              } catch {
                formattedDate = purchase.purchase_date
              }

              return (
                <tr key={purchase.id} className="hover:bg-muted/30 transition-colors">
                  {/* Bill No */}
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{purchase.bill_no}</span>
                    </div>
                  </td>

                  {/* Supplier */}
                  <td className="py-3 px-4 font-medium text-foreground">
                    <span className="truncate max-w-[180px] block" title={purchase.supplier_name}>
                      {purchase.supplier_name}
                    </span>
                  </td>

                  {/* Items count */}
                  <td className="py-3 px-4 text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">{itemsCount}</span>{" "}
                    item{itemsCount === 1 ? "" : "s"}
                  </td>

                  {/* Total ₹ */}
                  <td className="py-3 px-4 text-right font-semibold text-foreground tabular-nums text-sm">
                    {formatINR(purchase.total_amount)}
                  </td>

                  {/* Payment badge */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          purchase.payment_status === "paid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : purchase.payment_status === "partial"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {purchase.payment_status}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        ({purchase.payment_method})
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>{formattedDate}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    {onViewDetails ? (
                      <button
                        type="button"
                        onClick={() => onViewDetails(purchase)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
