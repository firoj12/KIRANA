import React from "react"
import type { Supplier } from "@/types/supplier"
import { formatINR } from "@/lib/formatters"
import { Building2, Phone, Mail, FileText, Edit2, Trash2, CreditCard, Plus } from "lucide-react"

interface SupplierTableProps {
  suppliers: Supplier[]
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onRecordPayment: (supplier: Supplier) => void
  onAddSupplier: () => void
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  onEdit,
  onDelete,
  onRecordPayment,
  onAddSupplier,
}) => {
  if (suppliers.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center p-6 border rounded-xl bg-card border-dashed space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-semibold text-base text-foreground">No suppliers yet</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add your first supplier to start recording purchases. Track vendor balances, GSTINs, and payment history.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddSupplier}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          + Add Supplier
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
              <th className="py-3 px-4">Supplier Name</th>
              <th className="py-3 px-4">Phone / Contact</th>
              <th className="py-3 px-4">GSTIN</th>
              <th className="py-3 px-4 text-right">Outstanding ₹</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suppliers.map((supplier) => {
              const hasBalance = supplier.outstanding_balance > 0
              return (
                <tr key={supplier.id} className="hover:bg-muted/30 transition-colors">
                  {/* Name */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{supplier.name}</span>
                    </div>
                    {supplier.email && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 ml-6">
                        <Mail className="w-3 h-3 text-muted-foreground/70" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                    {supplier.address && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                        {supplier.address}
                      </p>
                    )}
                  </td>

                  {/* GSTIN */}
                  <td className="py-3 px-4 font-mono">
                    {supplier.gstin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] text-foreground font-medium">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        {supplier.gstin}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>

                  {/* Outstanding Balance */}
                  <td className="py-3 px-4 text-right">
                    <div
                      className={`tabular-nums text-sm ${
                        hasBalance ? "font-bold text-amber-600" : "font-normal text-muted-foreground"
                      }`}
                    >
                      {formatINR(supplier.outstanding_balance)}
                    </div>
                    {hasBalance && (
                      <span className="text-[10px] text-amber-600 uppercase font-semibold">
                        Due to Supplier
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onRecordPayment(supplier)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border bg-background hover:bg-accent text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:border-emerald-300 transition-colors"
                        title="Record Payment to Supplier"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(supplier)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(supplier)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-muted-foreground hover:text-rose-600 transition-colors"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
