import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  Supplier,
  SupplierFormData,
  RecordSupplierPaymentParams,
  RecordSupplierPaymentResult,
} from "@/types/supplier"
import { toast } from "sonner"

export const SUPPLIERS_QUERY_KEY = ["suppliers"]

const SUPPLIERS_STORAGE_KEY = "kiranatrack_suppliers_cache"

const initialSuppliersSeed: Supplier[] = [
  {
    id: "sup-00000000-0000-0000-0000-000000000001",
    name: "Metro Cash & Carry Wholesale",
    phone: "9811223344",
    email: "orders@metrowholesale.in",
    gstin: "27AABCM1234F1Z8",
    address: "Plot 12, APMC Market Yard, Navi Mumbai",
    outstanding_balance: 12500,
    created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "sup-00000000-0000-0000-0000-000000000002",
    name: "Balaji Provisions & Grains Distributor",
    phone: "9822334455",
    email: "balajigrains@gmail.com",
    gstin: "27AAGCB5678H1ZP",
    address: "Shop 4, Dana Bandar, Masjid Bunder, Mumbai",
    outstanding_balance: 0,
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "sup-00000000-0000-0000-0000-000000000003",
    name: "Hindustan FMCG Agencies",
    phone: "9833445566",
    email: "hul.distributor@fmcgagencies.com",
    gstin: "27AAACH9012K1Z3",
    address: "Unit 102, GIDC Industrial Estate, Vapi",
    outstanding_balance: 4200,
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
]

export function getStoredSuppliers(): Supplier[] {
  try {
    const saved = localStorage.getItem(SUPPLIERS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Ignore storage errors
  }
  return initialSuppliersSeed
}

export function saveSuppliers(suppliers: Supplier[]) {
  try {
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers))
  } catch {
    // Ignore storage errors
  }
}

let localSuppliersCache: Supplier[] = getStoredSuppliers()

export function updateLocalSupplierBalance(supplierId: string, balanceDelta: number) {
  localSuppliersCache = getStoredSuppliers().map((s) =>
    s.id === supplierId
      ? {
          ...s,
          outstanding_balance: Math.max(0, s.outstanding_balance + balanceDelta),
          updated_at: new Date().toISOString(),
        }
      : s
  )
  saveSuppliers(localSuppliersCache)
  return localSuppliersCache
}

export function useSuppliers() {
  return useQuery<Supplier[], Error>({
    queryKey: SUPPLIERS_QUERY_KEY,
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (isPlaceholder) {
        return getStoredSuppliers()
      }

      try {
        const { data, error } = await supabase
          .from("suppliers")
          .select("*")
          .order("name", { ascending: true })

        if (error) {
          console.warn("[KiranaTrack] Supabase suppliers warning:", error.message)
          return localSuppliersCache
        }

        const items = (data as Supplier[]) ?? []
        if (items.length > 0) {
          localSuppliersCache = items
          return items
        }
        return localSuppliersCache
      } catch {
        return localSuppliersCache
      }
    },
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: SupplierFormData): Promise<Supplier> => {
      const newSupplier: Supplier = {
        ...formData,
        id: crypto.randomUUID(),
        outstanding_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        const { data, error } = await supabase
          .from("suppliers")
          .insert([newSupplier])
          .select()
          .single()

        if (error) {
          localSuppliersCache = [newSupplier, ...getStoredSuppliers()]
          saveSuppliers(localSuppliersCache)
          return newSupplier
        }

        localSuppliersCache = [data as Supplier, ...getStoredSuppliers()]
        saveSuppliers(localSuppliersCache)
        return data as Supplier
      } catch {
        localSuppliersCache = [newSupplier, ...getStoredSuppliers()]
        saveSuppliers(localSuppliersCache)
        return newSupplier
      }
    },
    onSuccess: (supplier) => {
      queryClient.setQueryData<Supplier[]>(SUPPLIERS_QUERY_KEY, (old = []) => [
        supplier,
        ...old.filter((s) => s.id !== supplier.id),
      ])
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
      toast.success(`Supplier "${supplier.name}" added`)
    },
    onError: (error) => {
      toast.error("Failed to add supplier", { description: error.message })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string
      formData: Partial<SupplierFormData>
    }): Promise<Supplier> => {
      const updatedFields = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      try {
        const { data, error } = await supabase
          .from("suppliers")
          .update(updatedFields)
          .eq("id", id)
          .select()
          .single()

        if (error) {
          localSuppliersCache = getStoredSuppliers().map((s) =>
            s.id === id ? { ...s, ...updatedFields } : s
          )
          saveSuppliers(localSuppliersCache)
          return localSuppliersCache.find((s) => s.id === id)!
        }

        const result = data as Supplier
        localSuppliersCache = getStoredSuppliers().map((s) => (s.id === id ? result : s))
        saveSuppliers(localSuppliersCache)
        return result
      } catch {
        localSuppliersCache = getStoredSuppliers().map((s) =>
          s.id === id ? { ...s, ...updatedFields } : s
        )
        saveSuppliers(localSuppliersCache)
        return localSuppliersCache.find((s) => s.id === id)!
      }
    },
    onSuccess: (supplier) => {
      queryClient.setQueryData<Supplier[]>(SUPPLIERS_QUERY_KEY, (old = []) =>
        old.map((s) => (s.id === supplier.id ? supplier : s))
      )
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
      toast.success(`Supplier "${supplier.name}" updated`)
    },
    onError: (error) => {
      toast.error("Failed to update supplier", { description: error.message })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        await supabase.from("suppliers").delete().eq("id", id)
      } catch {
        // Continue local deletion
      }
      localSuppliersCache = getStoredSuppliers().filter((s) => s.id !== id)
      saveSuppliers(localSuppliersCache)
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Supplier[]>(SUPPLIERS_QUERY_KEY, (old = []) =>
        old.filter((s) => s.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
      toast.success("Supplier removed")
    },
    onError: (error) => {
      toast.error("Failed to delete supplier", { description: error.message })
    },
  })
}

export function useRecordSupplierPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      params: RecordSupplierPaymentParams
    ): Promise<RecordSupplierPaymentResult> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase.rpc("record_supplier_payment", {
            p_supplier_id: params.supplier_id,
            p_amount: params.amount,
            p_payment_method: params.payment_method,
            p_notes: params.note || null,
          })
          if (!error && data) {
            return data as RecordSupplierPaymentResult
          }
        } catch {
          // Fallback to local
        }
      }

      // Local atomic decrement
      const supplier = localSuppliersCache.find((s) => s.id === params.supplier_id)
      if (!supplier) {
        throw new Error("Supplier not found")
      }

      const newBalance = Math.max(0, supplier.outstanding_balance - params.amount)
      updateLocalSupplierBalance(params.supplier_id, -params.amount)

      return {
        success: true,
        supplier_id: params.supplier_id,
        amount_paid: params.amount,
        new_balance: newBalance,
        payment_method: params.payment_method,
        notes: params.note,
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
      toast.success(`Payment of ₹${result.amount_paid.toLocaleString("en-IN")} recorded!`, {
        description: `Remaining balance: ₹${result.new_balance.toLocaleString("en-IN")}`,
      })
    },
    onError: (error) => {
      toast.error("Payment Failed", { description: error.message })
    },
  })
}
