import React, { useState, useEffect } from "react"
import type { Expense, ExpenseCategory, ExpenseFormData, ExpensePaymentMethod } from "@/types/expense"
import { X, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: ExpenseFormData) => Promise<void>
  initialData?: Expense | null
  isSubmitting?: boolean
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Shop Rent" },
  { value: "electricity", label: "Electricity & Utilities" },
  { value: "salary", label: "Staff Salary / Wages" },
  { value: "transport", label: "Transport & Freight" },
  { value: "packaging", label: "Carry Bags & Packaging" },
  { value: "maintenance", label: "Maintenance & Repairs" },
  { value: "marketing", label: "Marketing & Signage" },
  { value: "misc", label: "Miscellaneous / Other" },
]

const PAYMENT_METHODS: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
]

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting = false,
}) => {
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<ExpenseCategory>("misc")
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>("cash")
  const [expenseDate, setExpenseDate] = useState(todayStr)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setCategory(initialData.category)
      setAmount(String(initialData.amount))
      setPaymentMethod(initialData.payment_method)
      setExpenseDate(initialData.expense_date)
      setNotes(initialData.notes || "")
    } else {
      setTitle("")
      setCategory("rent")
      setAmount("")
      setPaymentMethod("cash")
      setExpenseDate(todayStr)
      setNotes("")
    }
    setError("")
  }, [initialData, isOpen, todayStr])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Please enter an expense title")
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than ₹0")
      return
    }

    if (!expenseDate) {
      setError("Please select an expense date")
      return
    }

    try {
      await onSave({
        title: title.trim(),
        category,
        amount: numAmount,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save expense")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div>
            <h2 className="font-bold text-base text-foreground">
              {initialData ? "Edit Business Expense" : "Log Business Expense"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record shop overheads, wages, and utilities
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Expense Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shop Rent, Electricity Bill, Staff Wages"
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs cursor-pointer font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Amount (₹) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500"
                  className="w-full pl-7 pr-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono tabular-nums font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Expense Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
              />
            </div>
          </div>

          {/* Payment Method Segmented Control */}
          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Payment Method <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted rounded-lg border">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`py-1.5 rounded-md text-xs font-semibold transition ${
                    paymentMethod === method.value
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              Notes / Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Receipt #123, UPI Txn ID, Handled by Mohan"
              className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-foreground font-semibold hover:bg-muted transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? "Update Expense" : "Save Expense"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
