import React, { useState, useMemo } from "react"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/useProducts"
import type { Product, ProductFormData } from "@/types/product"
import { ProductToolbar } from "@/components/products/ProductToolbar"
import { ProductTable } from "@/components/products/ProductTable"
import { ProductSheet } from "@/components/products/ProductSheet"
import { ProductEmptyState } from "@/components/products/ProductEmptyState"
import { formatINR } from "@/lib/formatters"
import { useSearchParams } from "react-router-dom"
import { Package, AlertTriangle, Layers, Loader2 } from "lucide-react"

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: products = [], isLoading } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [lowStockOnly, setLowStockOnly] = useState(() => searchParams.get("lowStock") === "true")

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(() => searchParams.get("action") === "new")
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)

  const handleLoadSampleData = React.useCallback(async () => {
    const sampleItems: ProductFormData[] = [
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
        name: "Tata Salt Vacuum Evaporated 1kg",
        brand: "Tata",
        category: "Groceries & Staples",
        barcode: "8901058852219",
        stock_quantity: 3,
        min_stock_alert: 10,
        unit: "packet",
        purchase_price: 22,
        selling_price: 28,
        gst_rate: 0,
      },
      {
        name: "Fortune Sunlite Sunflower Oil 1L",
        brand: "Fortune",
        category: "Groceries & Staples",
        barcode: "8906007281014",
        stock_quantity: 4,
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
        stock_quantity: 45,
        min_stock_alert: 12,
        unit: "packet",
        purchase_price: 11.5,
        selling_price: 14,
        gst_rate: 12,
      },
      {
        name: "Amul Butter Pasteurised 100g",
        brand: "Amul",
        category: "Dairy & Bakery",
        barcode: "8901262010052",
        stock_quantity: 0,
        min_stock_alert: 5,
        unit: "piece",
        purchase_price: 50,
        selling_price: 58,
        gst_rate: 12,
      },
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
        name: "Everest Garam Masala 100g",
        brand: "Everest",
        category: "Spices & Masalas",
        barcode: "8901786101014",
        stock_quantity: 15,
        min_stock_alert: 5,
        unit: "box",
        purchase_price: 76,
        selling_price: 92,
        gst_rate: 5,
      },
    ]

    await Promise.all(sampleItems.map((item) => createProduct.mutateAsync(item)))
  }, [createProduct])

  React.useEffect(() => {
    if (searchParams.get("lowStock") === "true") {
      setLowStockOnly(true)
    }
    if (searchParams.get("demo") === "true" && products.length === 0) {
      handleLoadSampleData()
    }
    const editParam = searchParams.get("edit")
    if (editParam && products.length > 0) {
      const target = editParam === "first" ? products[0] : products.find((p) => p.id === editParam)
      if (target) {
        setActiveProduct(target)
        setIsSheetOpen(true)
      }
    }
  }, [searchParams, products])

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const nameMatch = item.name.toLowerCase().includes(query)
        const brandMatch = item.brand?.toLowerCase().includes(query) ?? false
        const barcodeMatch = item.barcode?.toLowerCase().includes(query) ?? false
        if (!nameMatch && !brandMatch && !barcodeMatch) {
          return false
        }
      }

      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false
      }

      // Low stock toggle
      if (lowStockOnly) {
        const isLow = Number(item.stock_quantity) <= Number(item.min_stock_alert)
        if (!isLow) return false
      }

      return true
    })
  }, [products, searchQuery, selectedCategory, lowStockOnly])

  // Aggregate Metrics
  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) => Number(p.stock_quantity) <= Number(p.min_stock_alert)
    ).length
  }, [products])

  const totalInventoryValue = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + (Number(p.purchase_price) || 0) * (Number(p.stock_quantity) || 0),
      0
    )
  }, [products])

  const handleOpenAddSheet = () => {
    setActiveProduct(null)
    setIsSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setIsSheetOpen(false)
    if (searchParams.get("action")) {
      searchParams.delete("action")
      setSearchParams(searchParams, { replace: true })
    }
  }

  const handleOpenEditSheet = (product: Product) => {
    setActiveProduct(product)
    setIsSheetOpen(true)
  }

  const handleSaveProduct = async (formData: ProductFormData, id?: string) => {
    if (id) {
      await updateProduct.mutateAsync({ id, formData })
    } else {
      await createProduct.mutateAsync(formData)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to remove "${product.name}" from inventory?`)) {
      await deleteProduct.mutateAsync(product.id)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("ALL")
    setLowStockOnly(false)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Product Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your kirana store items, sales rates, GST slabs, and low-stock alerts.
          </p>
        </div>

        {/* Quick KPI Badges */}
        {products.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground">Total Items:</span>
              <span className="font-bold font-mono tabular-nums">{products.length}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-muted-foreground">Low Stock:</span>
              <span className="font-bold font-mono tabular-nums text-amber-600">
                {lowStockCount}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-xs">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-muted-foreground">Inventory Value:</span>
              <span className="font-bold font-mono tabular-nums text-foreground">
                {formatINR(totalInventoryValue)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading store inventory...</p>
        </div>
      ) : products.length === 0 ? (
        // Initial Empty State when no products exist in store
        <ProductEmptyState
          onAddClick={handleOpenAddSheet}
          onLoadSampleData={handleLoadSampleData}
        />
      ) : (
        <div className="space-y-4">
          {/* Toolbar with Search, Category Filter, Low Stock Toggle, Add CTA */}
          <ProductToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            lowStockOnly={lowStockOnly}
            onLowStockToggle={() => setLowStockOnly(!lowStockOnly)}
            onAddProduct={handleOpenAddSheet}
            lowStockCount={lowStockCount}
            totalCount={products.length}
          />

          {/* Table or Filtered Empty State */}
          {filteredProducts.length === 0 ? (
            <ProductEmptyState
              onAddClick={handleOpenAddSheet}
              isFiltered
              onResetFilters={handleResetFilters}
            />
          ) : (
            <ProductTable
              products={filteredProducts}
              onSelectProduct={handleOpenEditSheet}
              onEditProduct={handleOpenEditSheet}
              onDeleteProduct={handleDeleteProduct}
            />
          )}
        </div>
      )}

      {/* Slide-over Side Sheet for Add / Edit Product */}
      <ProductSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        product={activeProduct}
        onSave={handleSaveProduct}
        onDelete={async (id) => {
          await deleteProduct.mutateAsync(id)
        }}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
      />
    </div>
  )
}

export default ProductsPage
