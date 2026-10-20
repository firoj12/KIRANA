import React, { useState, useEffect, useMemo } from "react"
import { X, Plus, Trash2, ShoppingBag, IndianRupee, Calendar, FileText, Building2, AlertCircle, Loader2 } from "lucide-react"
import type { Supplier } from "@/types/supplier"
import type { Product } from "@/types/product"
import type { CreatePurchaseParams, PurchasePaymentMethod } from "@/types/purchase"
import { formatINR } from "@/lib/formatters"
import { format } from "date-fns"

interface LineItemDraft {
  id: string
  product_id: string
  quantity: number
  cost_per_unit: number
}

interface NewPurchaseSheetProps {
  isOpen: boolean
  onClose: () => void
  suppliers: Supplier[]
  products: Product[]
  onSubmit: (params: CreatePurchaseParams) => Promise<void>
  isSubmitting?: boolean
  onOpenAddSupplierModal?: () => void
}

export const NewPurchaseSheet: React.FC<NewPurchaseSheetProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onSubmit,
  isSubmitting = false,
  onOpenAddSupplierModal,
}) => {
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const [supplierId, setSupplierId] = useState<string>("")
  const [billNo, setBillNo] = useState<string>("")
  const [purchaseDate, setPurchaseDate] = useState<string>(todayStr)
  const [items, setItems] = useState<LineItemDraft[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>("bank")
  const [amountPaid, setAmountPaid] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Auto-generate Bill No suggestion on open
  useEffect(() => {
    if (isOpen) {
      const dateStr = format(new Date(), "yyyyMMdd")
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      setBillNo(`PB-${dateStr}-${randomSuffix}`)
      setPurchaseDate(todayStr)
      setPaymentMethod("bank")
      setNotes("")
      setError("")

      // Select first supplier if available
      if (suppliers.length > 0) {
        setSupplierId(suppliers[0].id)
      } else {
        setSupplierId("")
      }

      // Initialize with 1 empty line item if products exist
      if (products.length > 0) {
        const firstProd = products[0]
        setItems([
          {
            id: crypto.randomUUID(),
            product_id: firstProd.id,
            quantity: 10,
            cost_per_unit: Number(firstProd.purchase_price) || 50,
          },
        ])
      } else {
        setItems([])
      }
    }
  }, [isOpen, suppliers, products, todayStr])

  // Calculate totals
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0
      const c = Number(item.cost_per_unit) || 0
      return sum + q * c
    }, 0)
  }, [items])

  // Auto-update amount paid when total changes or method changes
  useEffect(() => {
    if (paymentMethod === "credit") {
      setAmountPaid("0")
    } else {
      setAmountPaid(String(Math.round(totalAmount * 100) / 100))
    }
  }, [totalAmount, paymentMethod])

  if (!isOpen) return null

  const handleAddItemRow = () => {
    if (products.length === 0) return
    const firstProd = products[0]
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        product_id: firstProd.id,
        quantity: 5,
        cost_per_unit: Number(firstProd.purchase_price) || 50,
      },
    ])
  }

  const handleRemoveItemRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleProductChange = (rowId: string, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId)
    const cost = Number(prod?.purchase_price) || 0
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? { ...item, product_id: newProductId, cost_per_unit: cost }
          : item
      )
    )
  }

  const handleQtyChange = (rowId: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, quantity: Math.max(1, qty) } : item))
    )
  }

  const handleCostChange = (rowId: string, cost: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, cost_per_unit: Math.max(0, cost) } : item))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      setError("Please select a supplier or add one first.")
      return
    }

    if (items.length === 0) {
      setError("Please add at least one line item to the purchase bill.")
      return
    }

    for (const item of items) {
      if (!item.product_id) {
        setError("All rows must have a selected product.")
        return
      }
      if (item.quantity <= 0) {
        setError("Quantity must be greater than 0 for all items.")
        return
      }
      if (item.cost_per_unit < 0) {
        setError("Cost per unit cannot be negative.")
        return
      }
    }

    const paidNum = parseFloat(amountPaid)
    if (isNaN(paidNum) || paidNum < 0) {
      setError("Please enter a valid amount paid.")
      return
    }

    setError("")
    await onSubmit({
      supplier_id: supplierId,
      bill_no: billNo.trim() || undefined,
      purchase_date: purchaseDate,
      payment_method: paymentMethod,
      amount_paid: paidNum,
      notes: notes.trim() || undefined,
      items: items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        cost_per_unit: i.cost_per_unit,
      })),
    })
    onClose()
  }

  const unpaidDifference = Math.max(0, totalAmount - (parseFloat(amountPaid) || 0))

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-card border-l shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-card">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-base text-foreground">Log New Purchase (Stock-In)</h2>
                <p className="text-xs text-muted-foreground">
                  Record supplier purchase, increment inventory stock, and update costs
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Supplier & Bill Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      Supplier <span className="text-rose-500">*</span>
                    </label>
                    {onOpenAddSupplierModal && (
                      <button
                        type="button"
                        onClick={onOpenAddSupplierModal}
                        className="text-[11px] text-primary hover:underline font-normal"
                      >
                        + Add Supplier
                      </button>
                    )}
                  </div>
                  {suppliers.length === 0 ? (
                    <div className="p-2.5 rounded-lg border border-dashed text-xs text-muted-foreground">
                      No suppliers registered. Please add a supplier first.
                    </div>
                  ) : (
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.outstanding_balance > 0 ? `(Due: ${formatINR(s.outstanding_balance)})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Bill No */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    Bill / Invoice No <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PB-YYYYMMDD-XXXX"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Purchase Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Purchase Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PurchasePaymentMethod)}
                    className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase font-medium"
                  >
                    <option value="bank">Bank / NEFT / RTGS</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit / Udhar (Pay Later)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Line Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Purchased Items ({items.length})
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Stock will be automatically incremented and purchase prices updated
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    disabled={products.length === 0}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border rounded-md hover:bg-muted text-primary transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Row
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, index) => {
                    const lineTotal = (item.quantity || 0) * (item.cost_per_unit || 0)
                    const selectedProd = products.find((p) => p.id === item.product_id)

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border bg-muted/20 flex flex-col sm:flex-row sm:items-center gap-3 text-xs"
                      >
                        <span className="font-mono text-muted-foreground text-[11px] w-5 shrink-0">
                          #{index + 1}
                        </span>

                        {/* Product Picker */}
                        <div className="flex-1 min-w-[180px]">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleProductChange(item.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.unit}) — Current Stock: {p.stock ?? p.stock_quantity}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Qty */}
                        <div className="w-24 shrink-0">
                          <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-0.5 sm:hidden">
                            Qty
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1.5 text-xs font-semibold tabular-nums rounded-md border bg-background text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {selectedProd?.unit || ""}
                            </span>
                          </div>
                        </div>

                        {/* Cost Per Unit */}
                        <div className="w-28 shrink-0">
                          <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-0.5 sm:hidden">
                            Cost / Unit
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={item.cost_per_unit}
                              onChange={(e) =>
                                handleCostChange(item.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-full pl-5 pr-2 py-1.5 text-xs font-semibold tabular-nums rounded-md border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        {/* Line Total */}
                        <div className="w-24 text-right font-bold tabular-nums text-foreground shrink-0">
                          {formatINR(lineTotal)}
                        </div>

                        {/* Remove Row */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          disabled={items.length <= 1}
                          className="p-1 rounded text-muted-foreground hover:text-rose-600 disabled:opacity-30 transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment Amount & Notes */}
              <div className="pt-3 border-t space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount Paid */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Amount Paid (₹)</span>
                      <button
                        type="button"
                        onClick={() => setAmountPaid(String(totalAmount))}
                        className="text-[11px] text-primary hover:underline font-normal"
                      >
                        Set Full Amount
                      </button>
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm font-bold tabular-nums rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Notes / Memo
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Challan #5502, Batch #B4"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Unpaid Warning Banner */}
                {unpaidDifference > 0 && (
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                    <span>Unpaid balance added to supplier credit:</span>
                    <span className="font-bold tabular-nums text-sm">
                      {formatINR(unpaidDifference)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Summary & Submit Button */}
            <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Grand Total</span>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {formatINR(totalAmount)}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium border rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Purchase & Stock-In
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
