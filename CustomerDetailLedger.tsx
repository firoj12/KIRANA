import React from "react"
import type { Customer } from "@/types/sale"
import { useCustomerLedger } from "@/hooks/useKhata"
import { formatINR } from "@/lib/formatters"
import { format } from "date-fns"
import {
  Phone,
  MessageCircle,
  PlusCircle,
  Receipt,
  Loader2,
  Clock,
} from "lucide-react"

interface CustomerDetailLedgerProps {
  customer: Customer | null
  onOpenPaymentModal: () => void
}

export const CustomerDetailLedger: React.FC<CustomerDetailLedgerProps> = ({
  customer,
  onOpenPaymentModal,
}) => {
  const { data: ledger = [], isLoading } = useCustomerLedger(customer?.id ?? null)

  if (!customer) {
    return (
      <div className="h-full bg-card border rounded-2xl shadow-xs flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Receipt className="w-12 h-12 stroke-[1.5] text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-semibold text-foreground">Select a Customer</h3>
        <p className="text-xs max-w-xs mt-1 text-muted-foreground leading-relaxed">
          Choose a customer from the left list to view their ledger history, record payments, and send WhatsApp reminders.
        </p>
      </div>
    )
  }

  const balance = Number(customer.outstanding_balance) || 0
  const limit = Number(customer.credit_limit) || 2000
  const availableCredit = Math.max(0, limit - balance)

  // Generate WhatsApp reminder link
  const cleanPhone = customer.phone?.replace(/[^0-9]/g, "") || ""
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Namaste ${customer.name} ji,\n\nThis is a friendly reminder from Shree Ganesh Kirana Store. Your Khata balance due is ₹${balance.toLocaleString(
      "en-IN"
    )}.\n\nKindly clear the pending dues via UPI or cash at your convenience. Thank you!`
  )}`

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-xs overflow-hidden">
      {/* Header Profile & Actions */}
      <div className="p-5 border-b bg-muted/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Customer Bio */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                Khata Account
              </span>
            </div>

            {customer.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>{customer.phone}</span>
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            {customer.phone && balance > 0 && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Reminder</span>
              </a>
            )}

            <button
              type="button"
              onClick={onOpenPaymentModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Payment (Jama)</span>
            </button>
          </div>
        </div>

        {/* Balance & Limit KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-background border space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Current Outstanding Balance
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {formatINR(balance)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-background border space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Credit Limit
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-foreground">
              {formatINR(limit)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-background border space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Available Credit
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-600">
              {formatINR(availableCredit)}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Transaction History */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Transaction Ledger History</span>
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {ledger.length} entries
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs">Loading ledger transactions...</p>
            </div>
          ) : ledger.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm font-medium">No ledger transactions yet</p>
              <p className="text-xs mt-1">Credit sales or recorded payments will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground uppercase font-semibold">
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Given (Udhaar)</th>
                  <th className="py-2.5 px-4 text-right">Received (Jama)</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {ledger.map((entry) => {
                  const isCredit = entry.type === "credit"
                  const entryDate = format(new Date(entry.created_at), "dd MMM yyyy, hh:mm a")

                  return (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {entryDate}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <span className="font-sans font-medium text-foreground block">
                          {entry.description}
                        </span>
                        {entry.invoice_no && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {entry.invoice_no}
                          </span>
                        )}
                      </td>

                      {/* Given (Udhaar) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isCredit ? (
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            +{formatINR(entry.amount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Received (Jama) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!isCredit ? (
                          <span className="font-bold text-emerald-600">
                            -{formatINR(entry.amount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Balance After */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-foreground">
                        {formatINR(entry.balance_after)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerDetailLedger
