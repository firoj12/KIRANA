import React, { useState, useEffect } from "react"
import { useProfile, useUpdateProfile } from "@/hooks/useProfile"
import type { StoreProfileFormData } from "@/types/profile"
import { Store, User, Phone, MapPin, FileText, Save, Loader2 } from "lucide-react"

export const ProfileSettingsTab: React.FC = () => {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [formData, setFormData] = useState<StoreProfileFormData>({
    shop_name: "",
    owner_name: "",
    phone: "",
    address: "",
    gstin: "",
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        shop_name: profile.shop_name || "",
        owner_name: profile.owner_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        gstin: profile.gstin || "",
      })
    }
  }, [profile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-muted-foreground text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Loading store profile...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-card border rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-foreground">Kirana Store Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            This business information appears on customer invoices, receipts, and reports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Shop Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Shop Name *</span>
            </label>
            <input
              type="text"
              required
              value={formData.shop_name}
              onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
              placeholder="e.g. Shree Ganesh Kirana Store"
              className="w-full h-10 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Owner Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Owner / Manager Name *</span>
            </label>
            <input
              type="text"
              required
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              placeholder="e.g. Ramesh Gupta"
              className="w-full h-10 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Contact Phone (10 digits) *</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="9876543210"
              className="w-full h-10 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>

          {/* GSTIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span>GSTIN Number (Optional)</span>
            </label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              placeholder="27AAAAA0000A1Z5"
              className="w-full h-10 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono uppercase"
            />
          </div>

          {/* Store Address */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Physical Store Address *</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Shop #4, Main Market, APMC Road, Mumbai, Maharashtra 400001"
              className="w-full p-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-xs disabled:opacity-50"
          >
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </form>
  )
}
