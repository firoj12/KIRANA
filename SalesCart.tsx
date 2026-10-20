import React, { useState, useEffect } from "react"
import type { Customer, PaymentMethod } from "@/types/sale"
import type { Product } from "@/types/product"
import { formatINR } from "@/lib/formatters"
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  User,
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
  ArrowRight,
  Receipt,
  Sparkles,
} from "lucide-react"

export interface CartLineItem {
  product: Product
  quantity: number
}

interface SalesCartProps {
  cart: CartLineItem[]
  customers: Customer[]
  selectedCustomerId: string | null
  onSelectCustomer: (id: string | null) => void
  onUpdateQuantity: (productId: string, delta: number) => void
  onSetQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onCompleteSale: (payload: {
    customerId: string | null
    paymentMethod: PaymentMethod
    discount: number
    amountPaid: number
  }) => Promise<void>
  isSubmitting?: boolean
}

export const SalesCart: React.FC<SalesCartProps> = ({
  cart,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteSale,
  isSubmitting = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [discount, setDiscount] = useState<number>(0)
  const [amountPaid, setAmountPaid] = useState<number | "">("")

  // Financial Computations
  const subTotal = cart.reduce((sum, item) => {
    return sum + item.quantity * Number(item.product.selling_price)
  }, 0)

  const gstAmount = cart.reduce((sum, item) => {
    const rate = Number(item.product.gst_percent ?? item.product.gst_rate) || 0
    const base = item.quantity * Number(item.product.selling_price)
    return sum + (base * rate) / 100
  }, 0)

  const discountVal = Number(discount) || 0
  const grandTotal = Math.max(0, Math.round((subTotal - discountVal + gstAmount) * 100) / 100)

  // Sync Amount Paid when payment method or grand total changes
  useEffect(() => {
    if (paymentMethod === "credit") {
      setAmountPaid(0)
    } else {
      setAmountPaid(grandTotal)
    }
  }, [paymentMethod, grandTotal])

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    if (paymentMethod === "credit" && !selectedCustomerId) {
      alert("Please select a customer for Credit / Khata transactions")
      return
    }

    const paidNum = amountPaid === "" ? grandTotal : Number(amountPaid)

    await onCompleteSale({
      customerId: selectedCustomerId,
      paymentMethod,
      discount: discountVal,
      amountPaid: paidNum,
    })
  }

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-xs overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Current Sale</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {cart.length} {cart.length === 1 ? "item" : "items"} in cart
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-muted"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Customer Selector */}
      <div className="px-4 py-3 border-b bg-muted/5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Customer / Khata</span>
          </label>
          {selectedCustomer && (
            <span className="text-[11px] font-medium font-mono text-amber-600 dark:text-amber-400">
              Khata Due: {formatINR(selectedCustomer.outstanding_balance)}
            </span>
          )}
        </div>

        <select
          value={selectedCustomerId ?? ""}
          onChange={(e) => onSelectCustomer(e.target.value || null)}
          className="w-full px-3 py-2 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
        >
          <option value="">Walk-in Customer (Standard Billing)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.phone ? `(${c.phone})` : ""} — Due: ₹{c.outstanding_balance}
            </option>
          ))}
        </select>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6 stroke-[1.5] text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">Cart is empty</p>
            <p className="text-xs max-w-xs mt-1 text-muted-foreground leading-relaxed">
              Click items on the left product picker to add them to this sale.
            </p>
          </div>
        ) : (
          cart.map(({ product, quantity }) => {
            const availableStock = Number(product.stock ?? product.stock_quantity) || 0
            const lineTotal = quantity * Number(product.selling_price)
            const isAtMaxStock = quantity >= availableStock

            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-background/80 hover:bg-muted/20 transition-colors gap-3"
              >
                {/* Product Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-foreground truncate">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      {formatINR(product.selling_price)}/{product.unit}
                    </span>
                    {(product.gst_percent ?? product.gst_rate) ? (
                      <span className="text-[10px] px-1 rounded bg-muted text-muted-foreground font-mono">
                        +{product.gst_percent ?? product.gst_rate}% GST
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(product.id, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-background text-foreground transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-8 text-center text-xs font-bold font-mono tabular-nums">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    disabled={isAtMaxStock}
                    onClick={() => onUpdateQuantity(product.id, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-background text-foreground transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total & Remove */}
                <div className="text-right shrink-0">
                  <span className="block text-xs font-bold font-mono tabular-nums text-foreground">
                    {formatINR(lineTotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.id)}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bill Computation & Checkout Controls */}
      {cart.length > 0 && (
        <form onSubmit={handleCheckout} className="border-t bg-muted/10 p-4 space-y-3.5">
          {/* Discount & Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Items Subtotal</span>
              <span className="font-mono tabular-nums">{formatINR(subTotal)}</span>
            </div>

            {/* Discount input */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Discount (₹)
              </span>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max={subTotal}
                  step="1"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full text-right px-2 py-0.5 text-xs font-mono tabular-nums bg-background border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>GST Total</span>
              <span className="font-mono tabular-nums">+{formatINR(gstAmount)}</span>
            </div>

            {/* Grand Total */}
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Grand Total</span>
              <span className="text-xl font-extrabold font-mono tabular-nums text-primary">
                {formatINR(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Segmented Control */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground block">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/50 rounded-xl border">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "cash"
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Banknote className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "upi"
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="w-4 h-4 mb-1 text-blue-600" />
                <span>UPI</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("credit")}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "credit"
                    ? "bg-card text-foreground shadow-xs border ring-1 ring-amber-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-4 h-4 mb-1 text-amber-600" />
                <span>Khata</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "card"
                    ? "bg-card text-foreground shadow-xs border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1 text-purple-600" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Amount Paid input */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground font-medium">
              {paymentMethod === "credit" ? "Immediate Downpayment (₹)" : "Amount Paid (₹)"}
            </span>
            <div className="w-32">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid === "" ? "" : amountPaid}
                onChange={(e) =>
                  setAmountPaid(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)
                }
                placeholder={String(grandTotal)}
                className="w-full text-right px-2.5 py-1 text-xs font-mono font-semibold tabular-nums bg-background border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Checkout Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 shadow-sm active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>Complete Sale</span>
            <span className="font-mono tabular-nums">({formatINR(grandTotal)})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  )
}

export default SalesCart
