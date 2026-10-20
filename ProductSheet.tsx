import React, { useState, useEffect } from "react"
import { X, Save, Trash2, ArrowRight } from "lucide-react"
import type { Product, ProductFormData } from "@/types/product"
import { KIRANA_CATEGORIES, KIRANA_UNITS, GST_RATES } from "@/types/product"
import { calculateMargin, formatINR } from "@/lib/formatters"

interface ProductSheetProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  onSave: (data: ProductFormData, id?: string) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
  isSubmitting?: boolean
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: "",
  brand: "",
  category: KIRANA_CATEGORIES[0],
  barcode: "",
  stock_quantity: 10,
  min_stock_alert: 5,
  unit: "packet",
  purchase_price: 0,
  selling_price: 0,
  gst_rate: 5,
}

export const ProductSheet: React.FC<ProductSheetProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  onDelete,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = Boolean(product?.id)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name ?? "",
        brand: product.brand ?? "",
        category: product.category ?? KIRANA_CATEGORIES[0],
        barcode: product.barcode ?? "",
        stock_quantity: Number(product.stock_quantity) || 0,
        min_stock_alert: Number(product.min_stock_alert) || 5,
        unit: product.unit ?? "packet",
        purchase_price: Number(product.purchase_price) || 0,
        selling_price: Number(product.selling_price) || 0,
        gst_rate: (Number(product.gst_rate) as 0 | 5 | 12 | 18 | 28) ?? 5,
      })
    } else {
      setFormData(DEFAULT_FORM_DATA)
    }
    setErrors({})
  }, [product, isOpen])

  if (!isOpen) return null

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }
    if (formData.selling_price < 0) {
      newErrors.selling_price = "Selling price cannot be negative"
    }
    if (formData.purchase_price < 0) {
      newErrors.purchase_price = "Purchase price cannot be negative"
    }
    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = "Stock quantity cannot be negative"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSave(formData, product?.id)
    onClose()
  }

  const { marginPercent, profit } = calculateMargin(
    formData.purchase_price,
    formData.selling_price
  )

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Side Sheet Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-card border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isEditing ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditing
                  ? `Update details and inventory for "${product?.name}"`
                  : "Enter store item details, GST slab, and purchase/selling rates"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form
            id="product-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Column 1: Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Basic Information
                </h3>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Product Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Aashirvaad Shudh Chakki Atta"
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.brand ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    placeholder="e.g. ITC, Tata, Amul, Parle"
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    {KIRANA_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Barcode / EAN
                  </label>
                  <input
                    type="text"
                    value={formData.barcode ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="e.g. 8901030383821"
                    className="w-full px-3 py-2 text-sm font-mono bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Column 2: Pricing & Tax */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pricing & Taxation
                </h3>

                {/* Unit Dropdown */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Unit of Measurement <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    {KIRANA_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GST Dropdown (0/5/12/18/28) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    GST Rate Slab (%) <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.gst_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gst_rate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}% {rate === 0 ? "(Exempted / Zero GST)" : "GST"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purchase Price (₹) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Purchase Price (₹) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.purchase_price || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchase_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono tabular-nums bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  {errors.purchase_price && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.purchase_price}
                    </p>
                  )}
                </div>

                {/* Selling Price (₹) */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Selling Price / MRP (₹) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.selling_price || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selling_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono tabular-nums bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  {errors.selling_price && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.selling_price}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory & Stock Row */}
            <div className="pt-2 border-t space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inventory & Stock Management
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Stock */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Current Stock Quantity ({formData.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock_quantity ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Minimum Stock Alert */}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-foreground">
                    Low Stock Alert Threshold ({formData.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.min_stock_alert ?? 5}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_stock_alert: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Triggers warning pill when stock falls below this quantity.
                  </p>
                </div>
              </div>
            </div>

            {/* Margin Calculation Preview Card */}
            <div className="p-4 rounded-xl border bg-muted/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">
                  Estimated Profit & Margin
                </span>
                <span className="text-[11px] text-muted-foreground">
                  GST Slab: {formData.gst_rate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                    {formatINR(profit)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    profit / {formData.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Margin:</span>
                  <span
                    className={`text-sm font-bold font-mono tabular-nums px-2 py-0.5 rounded-md ${
                      marginPercent >= 15
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : marginPercent >= 5
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`}
                  </span>
                </div>
              </div>
            </div>
          </form>

          {/* Sheet Footer */}
          <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(`Are you sure you want to delete "${product?.name}"?`)
                    ) {
                      onDelete(product!.id)
                      onClose()
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="product-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? "Save Changes" : "Add Product"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductSheet
