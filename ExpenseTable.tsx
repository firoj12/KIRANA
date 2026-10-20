import React from "react"
import type { Expense, ExpenseCategory, ExpenseMonthGroup } from "@/types/expense"
import { formatINR } from "@/lib/formatters"
import { format, parseISO } from "date-fns"
import {
  Wallet,
  Building,
  Zap,
  Users,
  Truck,
  Box,
  Wrench,
  Megaphone,
  HelpCircle,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react"

interface ExpenseTableProps {
  monthGroups: ExpenseMonthGroup[]
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expense: Expense) => void
  onOpenAddModal: () => void
}

const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  rent: {
    label: "Rent",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: Building,
  },
  electricity: {
    label: "Electricity",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Zap,
  },
  salary: {
    label: "Salary",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Users,
  },
  transport: {
    label: "Transport",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: Truck,
  },
  packaging: {
    label: "Packaging",
    badgeClass: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    icon: Box,
  },
  maintenance: {
    label: "Maintenance",
    badgeClass: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    icon: Wrench,
  },
  marketing: {
    label: "Marketing",
    badgeClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    icon: Megaphone,
  },
  misc: {
    label: "Misc",
    badgeClass: "bg-stone-500/10 text-stone-600 border-stone-500/20",
    icon: HelpCircle,
  },
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  monthGroups,
  onEditExpense,
  onDeleteExpense,
  onOpenAddModal,
}) => {
  if (monthGroups.length === 0) {
    return (
      <div className="border border-dashed rounded-2xl p-12 text-center bg-card">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mb-4">
          <Wallet className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-foreground">No expenses recorded</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Log your first business expense to track shop overheads, bills, and net profit.
        </p>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-xs"
        >
          <span>+ Add Expense</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {monthGroups.map((group) => (
        <div
          key={group.monthKey}
          className="rounded-xl border bg-card shadow-xs overflow-hidden"
        >
          {/* Month Group Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-muted/40 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                {group.monthLabel}
              </h3>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-background border font-medium">
                {group.expenses.length} {group.expenses.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <span>Total for month:</span>
              <span className="font-bold text-foreground font-mono tabular-nums text-sm text-primary">
                {formatINR(group.monthlySubtotal)}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-5 py-3">Title & Notes</th>
                  <th className="px-5 py-3 text-right">Amount (₹)</th>
                  <th className="px-5 py-3">Payment Method</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {group.expenses.map((expense) => {
                  const meta = CATEGORY_META[expense.category] || CATEGORY_META.misc
                  const Icon = meta.icon
                  let dateFormatted = expense.expense_date
                  try {
                    dateFormatted = format(parseISO(expense.expense_date), "dd MMM yyyy")
                  } catch {
                    // fallback
                  }

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Date */}
                      <td className="px-5 py-3 font-medium text-muted-foreground whitespace-nowrap">
                        {dateFormatted}
                      </td>

                      {/* Category Pill */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badgeClass}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      {/* Title & Notes */}
                      <td className="px-5 py-3 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-foreground text-xs leading-snug">
                          {expense.title}
                        </div>
                        {expense.notes && (
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {expense.notes}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3 text-right font-bold text-foreground font-mono tabular-nums text-xs whitespace-nowrap">
                        {formatINR(expense.amount)}
                      </td>

                      {/* Payment Method Badge */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border">
                          {expense.payment_method}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditExpense(expense)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Edit Expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(expense)}
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {/* Monthly Subtotal Row at end of group */}
                <tr className="bg-muted/40 font-bold border-t border-border">
                  <td
                    colSpan={3}
                    className="px-5 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Subtotal for {group.monthLabel}:
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-xs text-foreground font-extrabold">
                    {formatINR(group.monthlySubtotal)}
                  </td>
                  <td colSpan={2} className="px-5 py-3 text-[11px] text-muted-foreground">
                    ({group.expenses.length} {group.expenses.length === 1 ? "expense" : "expenses"})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
