import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Product, ProductFormData } from "@/types/product"
import { toast } from "sonner"

const PRODUCTS_QUERY_KEY = ["products"]

const PRODUCTS_STORAGE_KEY = "kiranatrack_products_cache"

// In-memory fallback cache to allow smooth testing even if Supabase table is not yet migrated
const initialProductsSeed: Product[] = [
  {
    id: "p1000000-0000-0000-0000-000000000001",
    name: "Tata Tea Gold 500g",
    brand: "Tata",
    category: "Beverages",
    barcode: "8901058004502",
    stock_quantity: 12,
    stock: 12,
    min_stock_alert: 4,
    low_stock_threshold: 4,
    unit: "packet",
    purchase_price: 260,
    selling_price: 310,
    gst_rate: 5,
    gst_percent: 5,
    is_active: true,
  },
  {
    id: "p2000000-0000-0000-0000-000000000002",
    name: "Aashirvaad Shudh Chakki Atta 5kg",
    brand: "ITC",
    category: "Groceries & Staples",
    barcode: "8901030383821",
    stock_quantity: 18,
    stock: 18,
    min_stock_alert: 5,
    low_stock_threshold: 5,
    unit: "packet",
    purchase_price: 210,
    selling_price: 245,
    gst_rate: 0,
    gst_percent: 0,
    is_active: true,
  },
  {
    id: "p3000000-0000-0000-0000-000000000003",
    name: "Fortune Sunlite Sunflower Oil 1L",
    brand: "Fortune",
    category: "Groceries & Staples",
    barcode: "8906007281014",
    stock_quantity: 6,
    stock: 6,
    min_stock_alert: 8,
    low_stock_threshold: 8,
    unit: "litre",
    purchase_price: 135,
    selling_price: 155,
    gst_rate: 5,
    gst_percent: 5,
    is_active: true,
  },
  {
    id: "p4000000-0000-0000-0000-000000000004",
    name: "Maggi 2-Minute Masala Noodles 70g",
    brand: "Nestle",
    category: "Snacks & Biscuits",
    barcode: "8901058862218",
    stock_quantity: 40,
    stock: 40,
    min_stock_alert: 12,
    low_stock_threshold: 12,
    unit: "packet",
    purchase_price: 11.5,
    selling_price: 14,
    gst_rate: 12,
    gst_percent: 12,
    is_active: true,
  },
  {
    id: "p5000000-0000-0000-0000-000000000005",
    name: "Tata Salt Vacuum Evaporated 1kg",
    brand: "Tata",
    category: "Groceries & Staples",
    barcode: "8901058852219",
    stock_quantity: 5,
    stock: 5,
    min_stock_alert: 10,
    low_stock_threshold: 10,
    unit: "packet",
    purchase_price: 22,
    selling_price: 28,
    gst_rate: 0,
    gst_percent: 0,
    is_active: true,
  },
  {
    id: "p6000000-0000-0000-0000-000000000006",
    name: "Amul Butter Pasteurised 100g",
    brand: "Amul",
    category: "Dairy & Bakery",
    barcode: "8901262010052",
    stock_quantity: 0,
    stock: 0,
    min_stock_alert: 5,
    low_stock_threshold: 5,
    unit: "piece",
    purchase_price: 50,
    selling_price: 58,
    gst_rate: 12,
    gst_percent: 12,
    is_active: true,
  },
]

export function getStoredProducts(): Product[] {
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Ignore storage errors
  }
  return initialProductsSeed
}

export function saveProducts(products: Product[]) {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
  } catch {
    // Ignore storage errors
  }
}

let localProductsCache: Product[] = getStoredProducts()

export function decrementLocalProductsStock(items: { product_id: string; quantity: number }[]) {
  localProductsCache = getStoredProducts().map((prod) => {
    const sold = items.find((i) => i.product_id === prod.id)
    if (sold) {
      const current = Number(prod.stock ?? prod.stock_quantity) || 0
      const updated = Math.max(0, current - sold.quantity)
      return {
        ...prod,
        stock: updated,
        stock_quantity: updated,
        updated_at: new Date().toISOString(),
      }
    }
    return prod
  })
  saveProducts(localProductsCache)
  return localProductsCache
}

export function incrementLocalProductsStock(
  items: { product_id: string; quantity: number; cost_per_unit?: number }[]
) {
  localProductsCache = getStoredProducts().map((prod) => {
    const purchased = items.find((i) => i.product_id === prod.id)
    if (purchased) {
      const current = Number(prod.stock ?? prod.stock_quantity) || 0
      const updated = current + purchased.quantity
      return {
        ...prod,
        stock: updated,
        stock_quantity: updated,
        purchase_price:
          purchased.cost_per_unit !== undefined
            ? purchased.cost_per_unit
            : prod.purchase_price,
        updated_at: new Date().toISOString(),
      }
    }
    return prod
  })
  saveProducts(localProductsCache)
  return localProductsCache
}

export function useProducts() {
  return useQuery<Product[], Error>({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (isPlaceholder) {
        return getStoredProducts()
      }

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name", { ascending: true })

        if (error) {
          console.warn("[KiranaTrack] Supabase fetch warning:", error.message)
          return localProductsCache
        }

        const items = (data as Product[]) ?? []
        if (items.length > 0) {
          localProductsCache = items
          return items
        }

        return localProductsCache
      } catch (err) {
        console.warn("[KiranaTrack] Supabase products error:", err)
        return localProductsCache
      }
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: ProductFormData): Promise<Product> => {
      const newProduct: Product = {
        ...formData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        const { data, error } = await supabase
          .from("products")
          .insert([newProduct])
          .select()
          .single()

        if (error) {
          console.warn("[KiranaTrack] Supabase insert warning (using local store):", error.message)
          localProductsCache = [newProduct, ...localProductsCache]
          saveProducts(localProductsCache)
          return newProduct
        }

        localProductsCache = [data as Product, ...localProductsCache.filter((p) => p.id !== data.id)]
        saveProducts(localProductsCache)
        return data as Product
      } catch {
        localProductsCache = [newProduct, ...localProductsCache]
        saveProducts(localProductsCache)
        return newProduct
      }
    },
    onSuccess: (product) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (old = []) => [
        product,
        ...old.filter((p) => p.id !== product.id),
      ])
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      toast.success(`"${product.name}" added to inventory`, {
        description: `Selling price: ₹${product.selling_price} | Stock: ${product.stock_quantity} ${product.unit}`,
      })
    },
    onError: (error) => {
      toast.error("Failed to add product", {
        description: error.message,
      })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string
      formData: Partial<ProductFormData>
    }): Promise<Product> => {
      const updatedFields = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      try {
        const { data, error } = await supabase
          .from("products")
          .update(updatedFields)
          .eq("id", id)
          .select()
          .single()

        if (error) {
          console.warn("[KiranaTrack] Supabase update warning (updating local store):", error.message)
          localProductsCache = localProductsCache.map((item) =>
            item.id === id ? { ...item, ...updatedFields } : item
          )
          saveProducts(localProductsCache)
          const updated = localProductsCache.find((p) => p.id === id)!
          return updated
        }

        const result = data as Product
        localProductsCache = localProductsCache.map((item) => (item.id === id ? result : item))
        saveProducts(localProductsCache)
        return result
      } catch {
        localProductsCache = localProductsCache.map((item) =>
          item.id === id ? { ...item, ...updatedFields } : item
        )
        saveProducts(localProductsCache)
        return localProductsCache.find((p) => p.id === id)!
      }
    },
    onSuccess: (product) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (old = []) =>
        old.map((p) => (p.id === product.id ? product : p))
      )
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      toast.success(`Updated "${product.name}"`)
    },
    onError: (error) => {
      toast.error("Failed to update product", {
        description: error.message,
      })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id)
        if (error) {
          console.warn("[KiranaTrack] Supabase delete warning:", error.message)
        }
      } catch {
        // Continue to remove locally
      }
      localProductsCache = localProductsCache.filter((p) => p.id !== id)
      saveProducts(localProductsCache)
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Product[]>(PRODUCTS_QUERY_KEY, (old = []) =>
        old.filter((p) => p.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      toast.success("Product removed from inventory")
    },
    onError: (error) => {
      toast.error("Failed to delete product", {
        description: error.message,
      })
    },
  })
}
