import React, { useState } from "react"
import { X, UserPlus } from "lucide-react"
import type { CreateCustomerPayload } from "@/types/khata"

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCustomer: (payload: CreateCustomerPayload) => Promise<void>
  isSubmitting?: boolean
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onAddCustomer,
  isSubmitting = false,
}) => {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [creditLimit, setCreditLimit] = useState(2000)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onAddCustomer({
      name: name.trim(),
      phone: phone.trim(),
      credit_limit: Number(creditLimit) || 2000,
    })

    setName("")
    setPhone("")
    setCreditLimit(2000)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Add New Khata Customer</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Customer Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Gupta"
                className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Mobile Number (for WhatsApp reminders)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 text-sm font-mono bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                min="500"
                step="500"
                value={creditLimit}
                onChange={(e) => setCreditLimit(parseInt(e.target.value, 10) || 0)}
                placeholder="2000"
                className="w-full px-3 py-2 text-sm font-mono bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Maximum credit allowed before warning in billing screen.
              </p>
            </div>

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
                disabled={isSubmitting || !name.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddCustomerModal
