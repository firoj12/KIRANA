import React, { useState, useMemo } from "react"
import { usePurchases, useCreatePurchase } from "@/hooks/usePurchases"
import { useSuppliers, useCreateSupplier } from "@/hooks/useSuppliers"
import { useProducts } from "@/hooks/useProducts"
import type { Purchase, CreatePurchaseParams } from "@/types/purchase"
import type { SupplierFormData } from "@/types/supplier"
import { PurchaseTable, PurchaseToolbar, NewPurchaseSheet } from "@/components/purchases"
import { SupplierModal } from "@/components/suppliers"
import { formatINR } from "@/lib/formatters"
import { Loader2, IndianRupee, Layers } from "lucide-react"
import { format, subDays, isAfter } from "date-fns"
import { useSearchParams } from "react-router-dom"

export const PurchasesPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { data: purchases = [], isLoading: loadingPurchases } = usePurchases()
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers()
  const { data: products = [], isLoading: loadingProducts } = useProducts()

  const createPurchase = useCreatePurchase()
  const createSupplier = useCreateSupplier()

  const isEmptyDemo = searchParams.get("empty") === "true"

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [dateRangeDays, setDateRangeDays] = useState(30)

  // Sheet / Modal State
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(
    () => searchParams.get("action") === "new"
  )
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)

  React.useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsNewPurchaseOpen(true)
    }
    if (searchParams.get("demoPurchase") === "true" && purchases.length === 2) {
      const amulButter = products.find((p) => p.name.includes("Amul Butter"))
      const fortuneOil = products.find((p) => p.name.includes("Fortune Sunlite"))
      if (suppliers.length > 0 && amulButter && fortuneOil) {
        createPurchase.mutate({
          supplier_id: suppliers[0].id,
          bill_no: "PB-20260916-8888",
          payment_method: "bank",
          amount_paid: 1850,
          purchase_date: format(new Date(), "yyyy-MM-dd"),
          items: [
            {
              product_id: amulButter.id,
              quantity: 10,
              cost_per_unit: 50,
            },
            {
              product_id: fortuneOil.id,
              quantity: 10,
              cost_per_unit: 135,
            },
          ],
          notes: "Restock: Amul Butter +10 pcs, Sunflower Oil +10 L",
        })
      }
    }
  }, [searchParams, suppliers, products, purchases.length, createPurchase])

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    const cutoffDate = subDays(new Date(), dateRangeDays)

    return purchases.filter((p) => {
      // Search Bill # or Supplier
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchBill = p.bill_no.toLowerCase().includes(q)
        const matchSup = p.supplier_name.toLowerCase().includes(q)
        if (!matchBill && !matchSup) return false
      }

      // Supplier filter
      if (selectedSupplier !== "ALL" && p.supplier_id !== selectedSupplier) {
        return false
      }

      // Payment status filter
      if (selectedStatus !== "ALL" && p.payment_status !== selectedStatus) {
        return false
      }

      // Date range filter
      try {
        if (p.purchase_date) {
          const pDate = new Date(p.purchase_date)
          if (!isAfter(pDate, cutoffDate)) return false
        }
      } catch {
        // keep if invalid date parse
      }

      return true
    })
  }, [purchases, searchQuery, selectedSupplier, selectedStatus, dateRangeDays])

  // Total procurement spend in filtered range
  const totalProcurementSpend = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)
  }, [filteredPurchases])

  const handleCreatePurchase = async (params: CreatePurchaseParams) => {
    await createPurchase.mutateAsync(params)
    setIsNewPurchaseOpen(false)
  }

  const handleCreateSupplier = async (formData: SupplierFormData) => {
    await createSupplier.mutateAsync(formData)
    setIsAddSupplierOpen(false)
  }

  const isLoading = loadingPurchases || loadingSuppliers || loadingProducts

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Purchases & Stock-In
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log procurement bills, restock inventory items, and track wholesale payments.
          </p>
        </div>

        {/* Quick Summary Badges */}
        {purchases.length > 0 && !isEmptyDemo && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground">Total Invoices:</span>
              <span className="font-bold font-mono tabular-nums">{purchases.length}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-muted-foreground">Purchases:</span>
              <span className="font-bold tabular-nums text-foreground">
                {formatINR(totalProcurementSpend, false)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading purchase records...</p>
        </div>
      ) : purchases.length === 0 || isEmptyDemo ? (
        // Empty State
        <PurchaseTable
          purchases={[]}
          onOpenNewPurchase={() => setIsNewPurchaseOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Toolbar with Filters & CTA */}
          <PurchaseToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedSupplier={selectedSupplier}
            onSupplierChange={setSelectedSupplier}
            suppliers={suppliers}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            dateRangeDays={dateRangeDays}
            onDateRangeChange={setDateRangeDays}
            onNewPurchase={() => setIsNewPurchaseOpen(true)}
          />

          {/* Purchases Table */}
          <PurchaseTable
            purchases={filteredPurchases}
            onOpenNewPurchase={() => setIsNewPurchaseOpen(true)}
            onViewDetails={(p) => setViewingPurchase(p)}
          />
        </div>
      )}

      {/* New Purchase Slide-over Sheet */}
      <NewPurchaseSheet
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        suppliers={suppliers}
        products={products}
        onSubmit={handleCreatePurchase}
        isSubmitting={createPurchase.isPending}
        onOpenAddSupplierModal={() => setIsAddSupplierOpen(true)}
      />

      {/* Quick Add Supplier Modal from Purchase Sheet */}
      <SupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onSave={handleCreateSupplier}
        isSubmitting={createSupplier.isPending}
      />

      {/* Purchase Details Modal (Optional View Action) */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Bill {viewingPurchase.bill_no}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Supplier: {viewingPurchase.supplier_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPurchase(null)}
                className="text-xs px-2 py-1 rounded border hover:bg-muted"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Items Purchased
              </span>
              <div className="divide-y divide-border border rounded-lg overflow-hidden text-xs">
                {viewingPurchase.items?.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.quantity} {item.unit} @ {formatINR(item.cost_per_unit)}
                      </p>
                    </div>
                    <span className="font-bold tabular-nums text-foreground">
                      {formatINR(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Payment Status:</span>
              <span className="font-bold uppercase">{viewingPurchase.payment_status} ({viewingPurchase.payment_method})</span>
            </div>

            <div className="flex items-center justify-between text-sm font-bold">
              <span>Total Bill Amount:</span>
              <span className="text-foreground tabular-nums">
                {formatINR(viewingPurchase.total_amount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasesPage
