export interface Product {
  id: string
  user_id?: string
  name: string
  brand?: string | null
  category: string
  barcode?: string | null
  stock_quantity: number
  stock?: number
  min_stock_alert: number
  low_stock_threshold?: number
  unit: string
  purchase_price: number
  selling_price: number
  gst_rate: number
  gst_percent?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type ProductFormData = Omit<Product, "id" | "created_at" | "updated_at">

export const KIRANA_CATEGORIES = [
  "Groceries & Staples",
  "Snacks & Biscuits",
  "Dairy & Bakery",
  "Beverages",
  "Spices & Masalas",
  "Personal Care",
  "Cleaning & Household",
  "Pooja & Others",
] as const

export type KiranaCategory = typeof KIRANA_CATEGORIES[number]

export const KIRANA_UNITS = [
  { label: "Kilogram (kg)", value: "kg" },
  { label: "Gram (g)", value: "g" },
  { label: "Litre (L)", value: "litre" },
  { label: "Millilitre (ml)", value: "ml" },
  { label: "Piece (pc)", value: "piece" },
  { label: "Packet (pkt)", value: "packet" },
  { label: "Box", value: "box" },
  { label: "Dozen", value: "dozen" },
] as const

export const GST_RATES = [0, 5, 12, 18, 28] as const
export type GSTRate = typeof GST_RATES[number]
