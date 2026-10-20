import React, { useState } from "react"
import { AlertTriangle, Trash2, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

const CONFIRM_PHRASE = "DELETE ALL DATA"

export const DangerZoneTab: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmInput, setConfirmInput] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmed = confirmInput.trim() === CONFIRM_PHRASE

  const handleDeleteAll = async () => {
    if (!isConfirmed) return

    setIsDeleting(true)
    try {
      // 1. Clear all local storage keys
      const keysToClear = [
        "kiranatrack_sales_cache",
        "kiranatrack_expenses_cache",
        "kiranatrack_purchases_cache",
        "kiranatrack_products_cache",
        "kiranatrack_suppliers_cache",
        "kiranatrack_profile_cache",
        "kiranatrack_preferences_cache",
      ]
      keysToClear.forEach((key) => localStorage.removeItem(key))

      // 2. Clear remote tables if authenticated Supabase is active
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          await Promise.allSettled([
            supabase.from("sales").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
            supabase.from("expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
            supabase.from("purchases").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
            supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
            supabase.from("suppliers").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
            supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
            supabase.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
          ])
        } catch {
          // Ignore network errors
        }
      }

      toast.error("Account and store data deleted", {
        description: "All products, sales, khata ledgers, and expenses have been reset.",
        duration: 8000,
      })

      setIsDialogOpen(false)
      // Reload page to reset all in-memory query caches
      setTimeout(() => {
        window.location.href = "/"
      }, 800)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-destructive/5 border-2 border-destructive/20 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-destructive">Danger Zone</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Irreversible actions that will permanently delete your store records, inventory catalog, customer Khata books, supplier debts, and expense history.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-destructive/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-foreground block">
              Delete account and all store data
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Permanently wipe all inventory, invoices, ledgers, and transactions.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmInput("")
              setIsDialogOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition shadow-xs shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Data</span>
          </button>
        </div>
      </div>

      {/* Type-to-Confirm Modal Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border-2 border-destructive/30 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-destructive">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold">Confirm Total Data Deletion</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This action <span className="font-bold text-foreground">CANNOT</span> be undone. It will permanently erase all inventory items, sales records, customer Khata balances, and expense entries.
            </p>

            <div className="p-3 bg-muted/40 rounded-xl border space-y-1.5">
              <label className="text-[11px] text-muted-foreground block">
                Please type <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="w-full h-9 px-3 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-accent transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isConfirmed || isDeleting}
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
