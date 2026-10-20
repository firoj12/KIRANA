import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Purchase, CreatePurchaseParams, CreatePurchaseResult } from "@/types/purchase"
import type { Product } from "@/types/product"
import { incrementLocalProductsStock } from "./useProducts"
import { SUPPLIERS_QUERY_KEY, updateLocalSupplierBalance } from "./useSuppliers"
import { toast } from "sonner"
import { format } from "date-fns"

export const PURCHASES_QUERY_KEY = ["purchases"]
const PRODUCTS_QUERY_KEY = ["products"]
const DASHBOARD_SUMMARY_QUERY_KEY = ["dashboard-summary"]

let purchaseBillCounter = 3

const PURCHASES_STORAGE_KEY = "kiranatrack_purchases_cache"

const initialPurchasesSeed: Purchase[] = [
  {
    id: "pur-00000000-0000-0000-0000-000000000001",
    bill_no: "PB-20260910-0001",
    supplier_id: "sup-00000000-0000-0000-0000-000000000001",
    supplier_name: "Metro Cash & Carry Wholesale",
    items: [
      {
        product_id: "p1000000-0000-0000-0000-000000000001",
        name: "Tata Tea Gold 500g",
        unit: "packet",
        quantity: 24,
        cost_per_unit: 260,
        line_total: 6240,
      },
      {
        product_id: "p4000000-0000-0000-0000-000000000004",
        name: "Maggi 2-Minute Masala Noodles 70g",
        unit: "packet",
        quantity: 96,
        cost_per_unit: 11.5,
        line_total: 1104,
      },
    ],
    total_amount: 7344,
    amount_paid: 7344,
    payment_method: "bank",
    payment_status: "paid",
    purchase_date: "2026-09-10",
    notes: "Monthly staples reorder batch 1",
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "pur-00000000-0000-0000-0000-000000000002",
    bill_no: "PB-20260914-0002",
    supplier_id: "sup-00000000-0000-0000-0000-000000000003",
    supplier_name: "Hindustan FMCG Agencies",
    items: [
      {
        product_id: "p2000000-0000-0000-0000-000000000002",
        name: "Aashirvaad Shudh Chakki Atta 5kg",
        unit: "packet",
        quantity: 20,
        cost_per_unit: 210,
        line_total: 4200,
      },
    ],
    total_amount: 4200,
    amount_paid: 0,
    payment_method: "credit",
    payment_status: "unpaid",
    purchase_date: "2026-09-14",
    notes: "Atta stock replenishment - payment due in 15 days",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
]

export function getStoredPurchases(): Purchase[] {
  try {
    const saved = localStorage.getItem(PURCHASES_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Ignore storage errors
  }
  return initialPurchasesSeed
}

export function savePurchases(purchases: Purchase[]) {
  try {
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases))
  } catch {
    // Ignore storage errors
  }
}

let localPurchasesCache: Purchase[] = getStoredPurchases()

export function usePurchases() {
  return useQuery<Purchase[], Error>({
    queryKey: PURCHASES_QUERY_KEY,
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (isPlaceholder) {
        return getStoredPurchases()
      }

      try {
        const { data, error } = await supabase
          .from("purchases")
          .select("*")
          .order("purchase_date", { ascending: false })

        if (error) {
          console.warn("[KiranaTrack] Supabase purchases fetch warning:", error.message)
          return localPurchasesCache
        }

        const items = (data as Purchase[]) ?? []
        if (items.length > 0) {
          localPurchasesCache = items
          return items
        }
        return localPurchasesCache
      } catch {
        return localPurchasesCache
      }
    },
  })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreatePurchaseParams): Promise<CreatePurchaseResult> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      // Attempt remote RPC if configured
      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase.rpc("create_purchase", {
            supplier_id: params.supplier_id,
            bill_no: params.bill_no || null,
            items: params.items,
            amount_paid: params.amount_paid ?? null,
            purchase_date: params.purchase_date || null,
            payment_method: params.payment_method,
            notes: params.notes || null,
          })

          if (!error && data) {
            return data as CreatePurchaseResult
          }
        } catch {
          // Fallback to local
        }
      }

      // Local atomic fallback logic:
      const currentProducts = queryClient.getQueryData<Product[]>(PRODUCTS_QUERY_KEY) || []
      const enrichedItems = []
      let totalAmount = 0

      // 1. Process items: increment stock & update purchase_price
      for (const item of params.items) {
        const product = currentProducts.find((p) => p.id === item.product_id)
        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`)
        }

        if (item.quantity <= 0) {
          throw new Error(`Quantity must be greater than 0 for "${product.name}"`)
        }

        if (item.cost_per_unit < 0) {
          throw new Error(`Cost per unit cannot be negative for "${product.name}"`)
        }

        const lineTotal = Math.round(item.quantity * item.cost_per_unit * 100) / 100
        totalAmount += lineTotal

        enrichedItems.push({
          product_id: product.id,
          name: product.name,
          unit: product.unit,
          quantity: item.quantity,
          cost_per_unit: item.cost_per_unit,
          line_total: lineTotal,
        })
      }

      totalAmount = Math.round(totalAmount * 100) / 100

      let amountPaid: number
      if (params.amount_paid === undefined || params.amount_paid === null) {
        amountPaid = params.payment_method === "credit" ? 0 : totalAmount
      } else {
        amountPaid = Math.round(params.amount_paid * 100) / 100
      }

      const paymentStatus =
        amountPaid >= totalAmount ? "paid" : amountPaid > 0 ? "partial" : "unpaid"

      // 2. Generate or accept Bill No
      let billNo = params.bill_no?.trim()
      if (!billNo) {
        const dateStr = format(new Date(), "yyyyMMdd")
        const seq = String(purchaseBillCounter++).padStart(4, "0")
        billNo = `PB-${dateStr}-${seq}`
      }

      // 3. Atomically update product stock and purchase price in query cache
      incrementLocalProductsStock(params.items)
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (old = []) => {
        return old.map((prod) => {
          const item = params.items.find((i) => i.product_id === prod.id)
          if (item) {
            const currentStock = Number(prod.stock ?? prod.stock_quantity) || 0
            const updatedStock = currentStock + item.quantity
            return {
              ...prod,
              stock: updatedStock,
              stock_quantity: updatedStock,
              purchase_price: item.cost_per_unit,
              updated_at: new Date().toISOString(),
            }
          }
          return prod
        })
      })

      // 4. Update supplier outstanding balance if unpaid difference exists
      let unpaidBalance = 0
      if (amountPaid < totalAmount) {
        unpaidBalance = totalAmount - amountPaid
        updateLocalSupplierBalance(params.supplier_id, unpaidBalance)
        queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
      }

      // Fetch supplier name
      let supplierName = "Registered Supplier"
      const suppliers = queryClient.getQueryData<{ id: string; name: string }[]>(
        SUPPLIERS_QUERY_KEY
      )
      if (suppliers) {
        const sup = suppliers.find((s) => s.id === params.supplier_id)
        if (sup) supplierName = sup.name
      }

      // 5. Store created purchase
      const newPurchase: Purchase = {
        id: crypto.randomUUID(),
        bill_no: billNo,
        supplier_id: params.supplier_id,
        supplier_name: supplierName,
        items: enrichedItems,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        payment_method: params.payment_method,
        payment_status: paymentStatus,
        purchase_date: params.purchase_date || format(new Date(), "yyyy-MM-dd"),
        notes: params.notes,
        created_at: new Date().toISOString(),
      }

      localPurchasesCache = [newPurchase, ...getStoredPurchases()]
      savePurchases(localPurchasesCache)
      queryClient.setQueryData(PURCHASES_QUERY_KEY, localPurchasesCache)

      return {
        success: true,
        purchase_id: newPurchase.id,
        bill_no: billNo,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        payment_status: paymentStatus,
        supplier_name: supplierName,
        items_count: enrichedItems.length,
        unpaid_balance_added: unpaidBalance,
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY })

      toast.success(`Purchase Bill ${result.bill_no} recorded!`, {
        description: `Total: ₹${result.total_amount.toLocaleString("en-IN")} • ${result.items_count} item(s) restocked`,
      })
    },
    onError: (error) => {
      toast.error("Purchase Failed", { description: error.message })
    },
  })
}
