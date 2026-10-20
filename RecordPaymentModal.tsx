import React, { useState, useEffect } from "react"
import type { Customer } from "@/types/sale"
import { formatINR } from "@/lib/formatters"
import { X, CheckCircle2, Banknote, QrCode, Building } from "lucide-react"

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  onRecordPayment: (payload: {
    customer_id: string
    amount: number
    payment_mode: "cash" | "upi" | "bank"
    notes?: string
  }) => Promise<void>
  isSubmitting?: boolean
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onRecordPayment,
  isSubmitting = false,
}) => {
  const [amount, setAmount] = useState<number | "">("")
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "bank">("upi")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (customer) {
      setAmount(customer.outstanding_balance > 0 ? customer.outstanding_balance : "")
    } else {
      setAmount("")
    }
    setNotes("")
  }, [customer, isOpen])

  if (!isOpen || !customer) return null

  const currentBalance = Number(customer.outstanding_balance) || 0
  const paymentAmount = Number(amount) || 0
  const remainingBalance = Math.max(0, currentBalance - paymentAmount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentAmount <= 0) return

    await onRecordPayment({
      customer_id: customer.id,
      amount: paymentAmount,
      payment_mode: paymentMode,
      notes: notes.trim() || undefined,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Record Payment (Jama)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clear pending credit dues for {customer.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Customer & Current Balance info */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  Current Balance Due
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-amber-900 dark:text-amber-200 block">
                  {formatINR(currentBalance)}
                </span>
              </div>
              <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                {customer.name}
              </span>
            </div>

            {/* Payment Amount Input */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Payment Amount (₹) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={currentBalance || undefined}
                  step="1"
                  required
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 text-base font-bold font-mono tabular-nums bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("upi")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMode === "upi"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("cash")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMode === "cash"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("bank")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
                    paymentMode === "bank"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Bank</span>
                </button>
              </div>
            </div>

            {/* Note / Reference */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Notes / Reference (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. GooglePay txn ID, partial clearance"
                className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Remaining Balance Preview */}
            <div className="p-3 rounded-xl bg-muted/40 border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Balance After Payment:</span>
              <span className="font-bold font-mono tabular-nums text-foreground">
                {formatINR(remainingBalance)}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold border rounded-lg hover:bg-accent"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || paymentAmount <= 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment ({formatINR(paymentAmount)})</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RecordPaymentModal
