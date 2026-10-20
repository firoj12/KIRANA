import React, { useState, useMemo } from "react"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useRecordSupplierPayment,
} from "@/hooks/useSuppliers"
import type { Supplier, SupplierFormData, RecordSupplierPaymentParams } from "@/types/supplier"
import {
  SupplierTable,
  SupplierModal,
  RecordSupplierPaymentModal,
  ConfirmDeleteDialog,
} from "@/components/suppliers"
import { formatINR } from "@/lib/formatters"
import { Building2, Search, Plus, CreditCard, Loader2 } from "lucide-react"
import { useSearchParams } from "react-router-dom"

export const SuppliersPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { data: suppliers = [], isLoading } = useSuppliers()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()
  const recordPayment = useRecordSupplierPayment()

  const isEmptyDemo = searchParams.get("empty") === "true"

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)

  React.useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddModalOpen(true)
    } else if (searchParams.get("action") === "pay" && suppliers.length > 0) {
      setPaymentSupplier(suppliers[0])
    }
  }, [searchParams, suppliers])

  // Filter suppliers by name, phone, or GSTIN
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.gstin?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [suppliers, searchQuery])

  // Total Outstanding to all suppliers
  const totalOutstanding = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (Number(s.outstanding_balance) || 0), 0)
  }, [suppliers])

  const handleSaveSupplier = async (formData: SupplierFormData) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, formData })
    } else {
      await createSupplier.mutateAsync(formData)
    }
    setEditingSupplier(null)
    setIsAddModalOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (deletingSupplier) {
      await deleteSupplier.mutateAsync(deletingSupplier.id)
      setDeletingSupplier(null)
    }
  }

  const handleRecordPayment = async (params: RecordSupplierPaymentParams) => {
    await recordPayment.mutateAsync(params)
    setPaymentSupplier(null)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Suppliers & Vendors
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage wholesale distributors, procurement contacts, and outstanding dues.
          </p>
        </div>

        {/* Total Outstanding Due Banner */}
        {suppliers.length > 0 && !isEmptyDemo && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-card shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Total Dues to Suppliers
                </span>
                <span className="text-base font-bold text-amber-600 tabular-nums leading-none">
                  {formatINR(totalOutstanding)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSupplier(null)
                setIsAddModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              + Add Supplier
            </button>
          </div>
        )}
      </div>

      {/* Toolbar with Search */}
      {suppliers.length > 0 && !isEmptyDemo && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-3.5 shadow-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span>
              Showing <strong className="text-foreground">{filteredSuppliers.length}</strong> of{" "}
              {suppliers.length} supplier{suppliers.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading suppliers directory...</p>
        </div>
      ) : (
        <SupplierTable
          suppliers={isEmptyDemo ? [] : filteredSuppliers}
          onEdit={(sup) => {
            setEditingSupplier(sup)
            setIsAddModalOpen(true)
          }}
          onDelete={(sup) => setDeletingSupplier(sup)}
          onRecordPayment={(sup) => setPaymentSupplier(sup)}
          onAddSupplier={() => {
            setEditingSupplier(null)
            setIsAddModalOpen(true)
          }}
        />
      )}

      {/* Add / Edit Supplier Modal */}
      <SupplierModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingSupplier(null)
        }}
        onSave={handleSaveSupplier}
        supplier={editingSupplier}
        isSubmitting={createSupplier.isPending || updateSupplier.isPending}
      />

      {/* Record Payment Modal */}
      <RecordSupplierPaymentModal
        isOpen={paymentSupplier !== null}
        onClose={() => setPaymentSupplier(null)}
        supplier={paymentSupplier}
        onRecordPayment={handleRecordPayment}
        isSubmitting={recordPayment.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deletingSupplier !== null}
        title="Delete Supplier"
        description={`Are you sure you want to remove "${deletingSupplier?.name}"? Past recorded purchases will remain intact.`}
        confirmText="Remove Supplier"
        onClose={() => setDeletingSupplier(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteSupplier.isPending}
      />
    </div>
  )
}

export default SuppliersPage
