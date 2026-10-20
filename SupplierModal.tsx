import React, { useState, useEffect } from "react"
import { X, Building2, Phone, Mail, FileText, MapPin, Loader2 } from "lucide-react"
import type { Supplier, SupplierFormData } from "@/types/supplier"

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: SupplierFormData) => Promise<void>
  supplier?: Supplier | null
  isSubmitting?: boolean
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supplier,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email || "",
        gstin: supplier.gstin || "",
        address: supplier.address || "",
      })
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        gstin: "",
        address: "",
      })
    }
    setErrors({})
  }, [supplier, isOpen])

  if (!isOpen) return null

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = "Supplier name is required"
    if (!formData.phone.trim()) {
      errs.phone = "Phone number is required"
    } else if (!/^[0-9+ -]{7,15}$/.test(formData.phone.trim())) {
      errs.phone = "Enter a valid phone number"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-foreground">
                {supplier ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Wholesale dealer & vendor details for inventory purchases
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Supplier Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              Supplier / Agency Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Metro Cash & Carry, Balaji Traders"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
          </div>

          {/* Phone (Required) & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.phone && <p className="text-xs text-rose-500">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email Address
              </label>
              <input
                type="email"
                placeholder="orders@supplier.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* GSTIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              GSTIN (Tax Identification)
            </label>
            <input
              type="text"
              placeholder="e.g. 27AABCM1234F1Z8"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Office / Warehouse Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Plot 12, APMC Market Yard, Navi Mumbai"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-end gap-2.5">
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {supplier ? "Save Changes" : "Create Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
