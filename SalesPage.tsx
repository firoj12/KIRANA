import React, { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useProducts, useCreateProduct } from "@/hooks/useProducts"
import { useCustomers, useCreateSale } from "@/hooks/useSales"
import type { Product, ProductFormData } from "@/types/product"
import type { PaymentMethod, Sale } from "@/types/sale"
import { ProductPicker } from "@/components/sales/ProductPicker"
import { SalesCart, type CartLineItem } from "@/components/sales/SalesCart"
import { PrintableInvoiceModal } from "@/components/sales/PrintableInvoiceModal"
import { Loader2, Sparkles } from "lucide-react"

export const SalesPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { data: products = [], isLoading: isLoadingProducts } = useProducts()
  const { data: customers = [] } = useCustomers()
  const createProduct = useCreateProduct()
  const createSale = useCreateSale()

  const [cart, setCart] = useState<CartLineItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)

  // Seed sample products if inventory is empty
  useEffect(() => {
    if (products.length === 0 && !isLoadingProducts) {
      const sampleItems: ProductFormData[] = [
        {
          name: "Tata Tea Gold 500g",
          brand: "Tata",
          category: "Beverages",
          barcode: "8901058004502",
          stock_quantity: 12,
          min_stock_alert: 4,
          unit: "packet",
          purchase_price: 260,
          selling_price: 310,
          gst_rate: 5,
        },
        {
          name: "Aashirvaad Shudh Chakki Atta 5kg",
          brand: "ITC",
          category: "Groceries & Staples",
          barcode: "8901030383821",
          stock_quantity: 18,
          min_stock_alert: 5,
          unit: "packet",
          purchase_price: 210,
          selling_price: 245,
          gst_rate: 0,
        },
        {
          name: "Fortune Sunlite Sunflower Oil 1L",
          brand: "Fortune",
          category: "Groceries & Staples",
          barcode: "8906007281014",
          stock_quantity: 6,
          min_stock_alert: 8,
          unit: "litre",
          purchase_price: 135,
          selling_price: 155,
          gst_rate: 5,
        },
        {
          name: "Maggi 2-Minute Masala Noodles 70g",
          brand: "Nestle",
          category: "Snacks & Biscuits",
          barcode: "8901058862218",
          stock_quantity: 40,
          min_stock_alert: 12,
          unit: "packet",
          purchase_price: 11.5,
          selling_price: 14,
          gst_rate: 12,
        },
        {
          name: "Tata Salt Vacuum Evaporated 1kg",
          brand: "Tata",
          category: "Groceries & Staples",
          barcode: "8901058852219",
          stock_quantity: 5,
          min_stock_alert: 10,
          unit: "packet",
          purchase_price: 22,
          selling_price: 28,
          gst_rate: 0,
        },
      ]

      for (const item of sampleItems) {
        createProduct.mutate(item)
      }
    }
  }, [products.length, isLoadingProducts, createProduct])

  // Support pre-populating cart or triggering test checkout via query param
  useEffect(() => {
    if (searchParams.get("add") && products.length > 0 && cart.length === 0) {
      const target = products[0]
      if (target) {
        setCart([{ product: target, quantity: 1 }])
      }
    }

    if (
      searchParams.get("action") === "checkout" &&
      products.length > 0 &&
      cart.length === 0 &&
      !createSale.isPending &&
      !createSale.isSuccess
    ) {
      const target = products[0]
      if (target) {
        createSale.mutate({
          items: [{ product_id: target.id, quantity: 1 }],
          customer_id: null,
          payment_method: "cash",
          discount: 0,
        })
      }
    }
  }, [searchParams, products, cart.length, createSale])

  // Map of product ID -> quantity in cart for UI badges
  const cartItemQuantities = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of cart) {
      map[item.product.id] = item.quantity
    }
    return map
  }, [cart])

  const handleAddToCart = (product: Product) => {
    const availableStock = Number(product.stock ?? product.stock_quantity) || 0
    if (availableStock <= 0) return

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id)
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity
        if (currentQty >= availableStock) return prevCart

        const newCart = [...prevCart]
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: currentQty + 1,
        }
        return newCart
      } else {
        return [...prevCart, { product, quantity: 1 }]
      }
    })
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === productId)
      if (!existing) return prevCart

      const availableStock = Number(existing.product.stock ?? existing.product.stock_quantity) || 0
      const newQty = existing.quantity + delta

      if (newQty <= 0) {
        return prevCart.filter((item) => item.product.id !== productId)
      }

      const clampedQty = Math.min(newQty, availableStock)
      return prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: clampedQty } : item
      )
    })
  }

  const handleSetQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === productId)
      if (!existing) return prevCart

      const availableStock = Number(existing.product.stock ?? existing.product.stock_quantity) || 0
      if (quantity <= 0) {
        return prevCart.filter((item) => item.product.id !== productId)
      }
      const clampedQty = Math.min(quantity, availableStock)
      return prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: clampedQty } : item
      )
    })
  }

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => {
    setCart([])
  }

  const handleCompleteSale = async ({
    customerId,
    paymentMethod,
    discount,
    amountPaid,
  }: {
    customerId: string | null
    paymentMethod: PaymentMethod
    discount: number
    amountPaid: number
  }) => {
    const result = await createSale.mutateAsync({
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      customer_id: customerId,
      payment_method: paymentMethod,
      discount,
      amount_paid: amountPaid,
    })

    const customer = customers.find((c) => c.id === customerId)
    const newSaleObject: Sale = {
      id: result.sale_id,
      invoice_no: result.invoice_no,
      customer_id: customerId,
      customer_name: customer?.name || "Walk-in Customer",
      items: cart.map((item) => {
        const gstRate = Number(item.product.gst_percent ?? item.product.gst_rate) || 0
        const lineBase = Math.round(item.quantity * item.product.selling_price * 100) / 100
        const lineGst = Math.round((lineBase * gstRate / 100) * 100) / 100
        return {
          product_id: item.product.id,
          name: item.product.name,
          unit: item.product.unit,
          selling_price: item.product.selling_price,
          cost_at_sale: Number(item.product.purchase_price) || 0,
          quantity: item.quantity,
          line_base: lineBase,
          gst_percent: gstRate,
          line_gst: lineGst,
          line_total: lineBase + lineGst,
        }
      }),
      sub_total: result.sub_total,
      discount: result.discount,
      gst_amount: result.gst_amount,
      total_amount: result.total_amount,
      payment_method: paymentMethod,
      payment_status: (result.payment_status as any) || "paid",
      amount_paid: result.amount_paid,
      created_at: new Date().toISOString(),
    }

    setCompletedSale(newSaleObject)
    setCart([])
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      {/* Top Bar Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              New Sale / POS Checkout
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" />
              Atomic RPC Ready
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time stock deduction, multi-rate GST computation, and Khata ledger update.
          </p>
        </div>
      </div>

      {/* Main Two-Column POS Layout */}
      {isLoadingProducts && products.length === 0 ? (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Initializing store inventory & POS register...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-10.5rem)] min-h-[600px]">
          {/* Left Column: Product Picker (7/12 cols) */}
          <div className="lg:col-span-7 h-full">
            <ProductPicker
              products={products}
              onAddToCart={handleAddToCart}
              cartItemQuantities={cartItemQuantities}
            />
          </div>

          {/* Right Column: Cart & Checkout (5/12 cols) */}
          <div className="lg:col-span-5 h-full">
            <SalesCart
              cart={cart}
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={setSelectedCustomerId}
              onUpdateQuantity={handleUpdateQuantity}
              onSetQuantity={handleSetQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCompleteSale={handleCompleteSale}
              isSubmitting={createSale.isPending}
            />
          </div>
        </div>
      )}

      {/* Printable Invoice Sheet Dialog */}
      <PrintableInvoiceModal
        sale={completedSale}
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  )
}

export default SalesPage
