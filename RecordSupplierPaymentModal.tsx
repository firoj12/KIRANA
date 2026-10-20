import React, { useState, useEffect } from "react"
import { X, CreditCard, IndianRupee, FileText, Loader2 } from "lucide-react"
import type { Supplier, SupplierPaymentMethod, RecordSupplierPaymentParams } from "@/types/supplier"
import { formatINR } from "@/lib/formatters"

interface RecordSupplierPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
  onRecordPayment: (params: RecordSupplierPaymentParams) => Promise<void>
  isSubmitting?: boolean
}

export const RecordSupplierPaymentModal: React.FC<RecordSupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onRecordPayment,
  isSubmitting = false,
}) => {
  const [amount, setAmount] = useState<string>("")
  const [method, setMethod] = useState<SupplierPaymentMethod>("bank")
  const [note, setNote] = useState<string>("")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (supplier) {
      // Suggest full outstanding or default empty
      setAmount(supplier.outstanding_balance > 0 ? String(supplier.outstanding_balance) : "")
      setMethod("bank")
      setNote("")
      setError("")
    }
  }, [supplier, isOpen])

  if (!isOpen || !supplier) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0")
      return
    }

    if (numericAmount > supplier.outstanding_balance) {
      if (
        !confirm(
          `The entered amount (₹${numericAmount}) exceeds the current balance (₹${supplier.outstanding_balance}). Proceed anyway?`
        )
      ) {
        return
      }
    }

    setError("")
    await onRecordPayment({
      supplier_id: supplier.id,
      amount: numericAmount,
      payment_method: method,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-foreground">Record Supplier Payment</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                Paying: <span className="font-medium text-foreground">{supplier.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Outstanding Balance Banner */}
          <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Current Outstanding Balance:</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                supplier.outstanding_balance > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {formatINR(supplier.outstanding_balance)}
            </span>
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Amount to Pay (₹) <span className="text-rose-500">*</span></span>
              {supplier.outstanding_balance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(supplier.outstanding_balance))}
                  className="text-[11px] text-primary hover:underline font-normal"
                >
                  Pay Full Balance
                </button>
              )}
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError("")
                }}
                className="w-full pl-9 pr-3 py-2 text-base font-bold tabular-nums rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["bank", "upi", "cash", "card"] as SupplierPaymentMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2 text-xs font-semibold uppercase rounded-lg border transition-colors ${
                    method === m
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Note / Transaction Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Note / Reference No.
            </label>
            <input
              type="text"
              placeholder="e.g. NEFT ref #99812, UPI ref #3321"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium border rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
