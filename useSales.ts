import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Customer, CreateSaleParams, CreateSaleResult, Sale } from "@/types/sale"
import type { Product } from "@/types/product"
import { decrementLocalProductsStock } from "./useProducts"
import { initialSalesSeed } from "./seedSales"
import { toast } from "sonner"

const CUSTOMERS_QUERY_KEY = ["customers"]
const SALES_QUERY_KEY = ["sales"]
const PRODUCTS_QUERY_KEY = ["products"]

// Default initial kirana customers for ledger/khata operations
let localCustomersCache: Customer[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "Ramesh Sharma (Shop #4)",
    phone: "9876543210",
    credit_limit: 5000,
    outstanding_balance: 1420,
    created_at: new Date().toISOString(),
  },
  {
    id: "c2000000-0000-0000-0000-000000000002",
    name: "Sunita Verma (Flat 202)",
    phone: "9823012345",
    credit_limit: 3000,
    outstanding_balance: 450,
    created_at: new Date().toISOString(),
  },
  {
    id: "c3000000-0000-0000-0000-000000000003",
    name: "Anil Patel (Electrician)",
    phone: "9712345678",
    credit_limit: 2000,
    outstanding_balance: 0,
    created_at: new Date().toISOString(),
  },
]

const SALES_STORAGE_KEY = "kiranatrack_sales_cache"

const DEFAULT_PRODUCT_PURCHASE_PRICES: Record<string, number> = {
  "p1000000-0000-0000-0000-000000000001": 260, // Tata Tea Gold
  "p2000000-0000-0000-0000-000000000002": 210, // Atta 5kg
  "p3000000-0000-0000-0000-000000000003": 135, // Sunflower Oil
  "p4000000-0000-0000-0000-000000000004": 11.5, // Maggi
  "p5000000-0000-0000-0000-000000000005": 22, // Tata Salt
  "p6000000-0000-0000-0000-000000000006": 50, // Amul Butter
}

export function backfillCostAtSale(sales: Sale[]): Sale[] {
  return sales.map((sale) => ({
    ...sale,
    items: (sale.items || []).map((item) => {
      if (item.cost_at_sale !== undefined && item.cost_at_sale !== null) {
        return item
      }
      const fallbackCost =
        DEFAULT_PRODUCT_PURCHASE_PRICES[item.product_id] ??
        (item.selling_price ? item.selling_price * 0.8 : 0)
      return {
        ...item,
        cost_at_sale: fallbackCost,
      }
    }),
  }))
}

export function getStoredSales(): Sale[] {
  try {
    const saved = localStorage.getItem(SALES_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const migrated = backfillCostAtSale(parsed)
        // If parsed sales only contain the old small 9-item seed, upgrade to full realistic history
        if (migrated.length <= 9) {
          const userCustomSales = migrated.filter(
            (s) =>
              !s.invoice_no.startsWith("INV-20260916-000") &&
              !s.invoice_no.startsWith("INV-20260915-000") &&
              !s.invoice_no.startsWith("INV-20260914-000")
          )
          const merged = [...userCustomSales, ...initialSalesSeed]
          saveSales(merged)
          return merged
        }
        return migrated
      }
    }
  } catch {
    // Ignore storage errors
  }
  return initialSalesSeed
}

export function saveSales(sales: Sale[]) {
  try {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales))
  } catch {
    // Ignore storage errors
  }
}

let localSalesCache: Sale[] = getStoredSales()
let invoiceCounter = 200

export function updateLocalCustomerBalance(customerId: string, newBalance: number) {
  localCustomersCache = localCustomersCache.map((c) =>
    c.id === customerId ? { ...c, outstanding_balance: newBalance } : c
  )
  return localCustomersCache
}

export function useCustomers() {
  return useQuery<Customer[], Error>({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (isPlaceholder) {
        return localCustomersCache
      }

      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("name", { ascending: true })

        if (error) {
          console.warn("[KiranaTrack] Supabase customers warning:", error.message)
          return localCustomersCache
        }

        const items = (data as Customer[]) ?? []
        if (items.length > 0) {
          localCustomersCache = items
          return items
        }
        return localCustomersCache
      } catch {
        return localCustomersCache
      }
    },
  })
}

export function useSales() {
  return useQuery<Sale[], Error>({
    queryKey: SALES_QUERY_KEY,
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase
            .from("sales")
            .select("*")
            .order("created_at", { ascending: false })

          if (!error && data && data.length > 0) {
            const migrated = backfillCostAtSale(data as Sale[])
            localSalesCache = migrated
            return migrated
          }
        } catch {
          // Fall back to local
        }
      }
      return localSalesCache
    },
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateSaleParams): Promise<CreateSaleResult> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      // Attempt remote RPC if configured
      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase.rpc("create_sale", {
            items: params.items,
            customer_id: params.customer_id || null,
            payment_method: params.payment_method,
            discount: params.discount || 0,
            amount_paid: params.amount_paid ?? null,
          })

          if (!error && data) {
            return data as CreateSaleResult
          }
          console.warn("[KiranaTrack] Supabase RPC warning, executing local atomic fallback:", error?.message)
        } catch (err) {
          console.warn("[KiranaTrack] Supabase RPC exception, executing local atomic fallback:", err)
        }
      }

      // Local atomic fallback executing the exact same business logic:
      // 1. Fetch products from query cache or fallback
      const currentProducts = queryClient.getQueryData<Product[]>(PRODUCTS_QUERY_KEY) || []

      let subTotal = 0
      let gstTotal = 0
      const enrichedItems = []

      // 1. Validate stock & compute totals
      for (const item of params.items) {
        const product = currentProducts.find((p) => p.id === item.product_id)
        if (!product) {
          throw new Error(`Product not found in inventory: ${item.product_id}`)
        }

        const availableStock = Number(product.stock ?? product.stock_quantity) || 0
        if (availableStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${availableStock} ${product.unit}, Requested: ${item.quantity}`
          )
        }

        const lineBase = Math.round(item.quantity * product.selling_price * 100) / 100
        const gstRate = Number(product.gst_percent ?? product.gst_rate) || 0
        const lineGst = Math.round((lineBase * gstRate / 100) * 100) / 100

        subTotal += lineBase
        gstTotal += lineGst

        enrichedItems.push({
          product_id: product.id,
          name: product.name,
          unit: product.unit,
          selling_price: product.selling_price,
          cost_at_sale: Number(product.purchase_price) || 0,
          quantity: item.quantity,
          line_base: lineBase,
          gst_percent: gstRate,
          line_gst: lineGst,
          line_total: lineBase + lineGst,
        })
      }

      const discount = Math.round((params.discount || 0) * 100) / 100
      const totalAmount = Math.max(0, Math.round((subTotal - discount + gstTotal) * 100) / 100)

      let amountPaid: number
      if (params.amount_paid === undefined || params.amount_paid === null) {
        amountPaid = params.payment_method === "credit" ? 0 : totalAmount
      } else {
        amountPaid = Math.round(params.amount_paid * 100) / 100
      }

      const paymentStatus =
        amountPaid >= totalAmount ? "paid" : amountPaid > 0 ? "partial" : "unpaid"

      // 2. Generate invoice number: INV-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      const seqStr = String(invoiceCounter++).padStart(4, "0")
      const invoiceNo = `INV-${dateStr}-${seqStr}`

      let customerName = "Walk-in Customer"
      if (params.customer_id) {
        const customer = localCustomersCache.find((c) => c.id === params.customer_id)
        if (customer) {
          customerName = customer.name
        }
      }

      // 3. Atomically decrement products stock in cache & local storage
      decrementLocalProductsStock(params.items)
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (oldProducts = []) => {
        return oldProducts.map((prod) => {
          const cartItem = params.items.find((i) => i.product_id === prod.id)
          if (cartItem) {
            const currentStock = Number(prod.stock ?? prod.stock_quantity) || 0
            const newStock = Math.max(0, currentStock - cartItem.quantity)
            return {
              ...prod,
              stock_quantity: newStock,
              stock: newStock,
              updated_at: new Date().toISOString(),
            }
          }
          return prod
        })
      })

      // 4. Update customer outstanding balance if credit or partial payment
      if (params.payment_method === "credit" || amountPaid < totalAmount) {
        if (!params.customer_id) {
          throw new Error("Customer must be selected for Credit / Khata transactions")
        }
        const unpaid = totalAmount - amountPaid
        localCustomersCache = localCustomersCache.map((c) => {
          if (c.id === params.customer_id) {
            return {
              ...c,
              outstanding_balance: c.outstanding_balance + unpaid,
            }
          }
          return c
        })
        queryClient.setQueryData(CUSTOMERS_QUERY_KEY, localCustomersCache)
      }

      // 5. Store created sale
      const newSale: Sale = {
        id: crypto.randomUUID(),
        invoice_no: invoiceNo,
        customer_id: params.customer_id || null,
        customer_name: customerName,
        items: enrichedItems,
        sub_total: subTotal,
        discount,
        gst_amount: gstTotal,
        total_amount: totalAmount,
        payment_method: params.payment_method,
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        created_at: new Date().toISOString(),
      }
      localSalesCache = [newSale, ...localSalesCache]
      saveSales(localSalesCache)
      queryClient.setQueryData(SALES_QUERY_KEY, localSalesCache)

      return {
        success: true,
        sale_id: newSale.id,
        invoice_no: invoiceNo,
        total_amount: totalAmount,
        sub_total: subTotal,
        discount,
        gst_amount: gstTotal,
        payment_method: params.payment_method,
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        customer_name: customerName,
        items_count: enrichedItems.length,
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY })

      toast.success(`Invoice ${result.invoice_no} generated!`, {
        description: `Total: ₹${result.total_amount.toLocaleString("en-IN")} • Paid via ${result.payment_method.toUpperCase()}`,
        duration: 15000,
      })
    },
    onError: (error) => {
      toast.error("Sale Failed", {
        description: error.message,
      })
    },
  })
}
