import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { format, parseISO, differenceInCalendarDays, subDays, eachDayOfInterval } from "date-fns"
import type {
  ReportSummary,
  SalesVsPurchasesPoint,
  CategoryExpensePoint,
  TopProductReportItem,
} from "@/types/report"
import { useSales } from "./useSales"
import { usePurchases } from "./usePurchases"
import { useProducts } from "./useProducts"
import { useExpenses } from "./useExpenses"

export const REPORT_SUMMARY_KEY = "report-summary"

const CATEGORY_COLORS: Record<string, string> = {
  rent: "#3B82F6", // Blue
  electricity: "#F59E0B", // Amber
  salary: "#10B981", // Emerald
  transport: "#8B5CF6", // Purple
  packaging: "#EC4899", // Pink
  maintenance: "#64748B", // Slate
  marketing: "#06B6D4", // Cyan
  misc: "#78716C", // Stone
}

const CATEGORY_LABELS: Record<string, string> = {
  rent: "Shop Rent",
  electricity: "Electricity & Utilities",
  salary: "Staff Wages",
  transport: "Freight & Transport",
  packaging: "Bags & Packaging",
  maintenance: "Repairs & Maintenance",
  marketing: "Marketing & Signage",
  misc: "Miscellaneous",
}

export function useReportSummary(startDate: string, endDate: string) {
  const { data: sales = [] } = useSales()
  const { data: purchases = [] } = usePurchases()
  const { data: products = [] } = useProducts()
  const { data: expenses = [] } = useExpenses()

  return useQuery<ReportSummary, Error>({
    queryKey: [REPORT_SUMMARY_KEY, startDate, endDate, sales, purchases, products, expenses],
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase.rpc("get_report_summary", {
            start_date: startDate,
            end_date: endDate,
          })

          if (!error && data) {
            return data as ReportSummary
          }
        } catch {
          // fallback to client-side calculation
        }
      }

      // Client-Side Calculation Engine:
      // 1. Current period filters
      const currentSales = sales.filter((s) => {
        const d = (s.created_at || "").slice(0, 10)
        return d >= startDate && d <= endDate
      })

      const currentExpenses = expenses.filter(
        (e) => e.expense_date >= startDate && e.expense_date <= endDate
      )

      const currentPurchases = purchases.filter(
        (p) => p.purchase_date >= startDate && p.purchase_date <= endDate
      )

      const grossRevenue = currentSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)

      let cogs = 0
      for (const sale of currentSales) {
        for (const item of sale.items || []) {
          const prod = products.find((p) => p.id === item.product_id)
          const unitCost = Number(item.cost_at_sale ?? prod?.purchase_price ?? 0)
          cogs += (Number(item.quantity) || 0) * unitCost
        }
      }
      cogs = Math.round(cogs * 100) / 100

      const grossProfit = Math.round((grossRevenue - cogs) * 100) / 100
      const expensesTotal = currentExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      const purchasesTotal = currentPurchases.reduce(
        (sum, p) => sum + (Number(p.total_amount) || 0),
        0
      )
      const netProfit = Math.round((grossProfit - expensesTotal) * 100) / 100

      // 2. Previous equivalent period bounds
      const startD = parseISO(startDate)
      const endD = parseISO(endDate)
      const periodLength = Math.max(1, differenceInCalendarDays(endD, startD) + 1)

      const prevEndD = subDays(startD, 1)
      const prevStartD = subDays(prevEndD, periodLength - 1)
      const prevStartStr = format(prevStartD, "yyyy-MM-dd")
      const prevEndStr = format(prevEndD, "yyyy-MM-dd")

      const prevSales = sales.filter((s) => {
        const d = (s.created_at || "").slice(0, 10)
        return d >= prevStartStr && d <= prevEndStr
      })

      const prevExpenses = expenses.filter(
        (e) => e.expense_date >= prevStartStr && e.expense_date <= prevEndStr
      )

      const prevGrossRevenue = prevSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)
      let prevCogs = 0
      for (const sale of prevSales) {
        for (const item of sale.items || []) {
          const prod = products.find((p) => p.id === item.product_id)
          const unitCost = Number(item.cost_at_sale ?? prod?.purchase_price ?? 0)
          prevCogs += (Number(item.quantity) || 0) * unitCost
        }
      }
      const prevGrossProfit = prevGrossRevenue - prevCogs
      const prevExpensesTotal = prevExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      const prevNetProfit = prevGrossProfit - prevExpensesTotal

      const computeDelta = (curr: number, prev: number): number | null => {
        if (prev === 0) {
          return curr > 0 ? 100 : null
        }
        return Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10
      }

      return {
        start_date: startDate,
        end_date: endDate,
        previous_start_date: prevStartStr,
        previous_end_date: prevEndStr,
        gross_revenue: grossRevenue,
        cogs,
        gross_profit: grossProfit,
        net_profit: netProfit,
        sales_count: currentSales.length,
        expenses_total: expensesTotal,
        purchases_total: purchasesTotal,
        deltas: {
          gross_revenue: computeDelta(grossRevenue, prevGrossRevenue),
          cogs: computeDelta(cogs, prevCogs),
          gross_profit: computeDelta(grossProfit, prevGrossProfit),
          net_profit: computeDelta(netProfit, prevNetProfit),
        },
      }
    },
  })
}

export function useSalesVsPurchases(startDate: string, endDate: string) {
  const { data: sales = [] } = useSales()
  const { data: purchases = [] } = usePurchases()

  return useQuery<SalesVsPurchasesPoint[], Error>({
    queryKey: ["sales-vs-purchases", startDate, endDate, sales, purchases],
    queryFn: async () => {
      const startD = parseISO(startDate)
      const endD = parseISO(endDate)

      if (startD > endD) return []

      const days = eachDayOfInterval({ start: startD, end: endD })

      const points: SalesVsPurchasesPoint[] = days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd")
        const label = format(day, "dd MMM")

        const daySales = sales
          .filter((s) => (s.created_at || "").slice(0, 10) === dateStr)
          .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)

        const dayPurchases = purchases
          .filter((p) => p.purchase_date === dateStr)
          .reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)

        return {
          date: dateStr,
          label,
          sales: Math.round(daySales * 100) / 100,
          purchases: Math.round(dayPurchases * 100) / 100,
        }
      })

      return points
    },
  })
}

export function useExpensesByCategory(startDate: string, endDate: string) {
  const { data: expenses = [] } = useExpenses()

  return useQuery<CategoryExpensePoint[], Error>({
    queryKey: ["expenses-by-category", startDate, endDate, expenses],
    queryFn: async () => {
      const inRange = expenses.filter(
        (e) => e.expense_date >= startDate && e.expense_date <= endDate
      )

      const total = inRange.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      if (total === 0) return []

      const grouped: Record<string, number> = {}
      for (const e of inRange) {
        grouped[e.category] = (grouped[e.category] || 0) + (Number(e.amount) || 0)
      }

      const points: CategoryExpensePoint[] = Object.entries(grouped)
        .map(([category, amount]) => ({
          category,
          label: CATEGORY_LABELS[category] || category.toUpperCase(),
          amount: Math.round(amount * 100) / 100,
          percentage: Math.round((amount / total) * 1000) / 10,
          color: CATEGORY_COLORS[category] || "#78716C",
        }))
        .sort((a, b) => b.amount - a.amount)

      return points
    },
  })
}

export function useTopProductsReport(startDate: string, endDate: string) {
  const { data: sales = [] } = useSales()
  const { data: products = [] } = useProducts()

  return useQuery<TopProductReportItem[], Error>({
    queryKey: ["top-products-report", startDate, endDate, sales, products],
    queryFn: async () => {
      const inRange = sales.filter((s) => {
        const d = (s.created_at || "").slice(0, 10)
        return d >= startDate && d <= endDate
      })

      const productAgg: Record<
        string,
        {
          id: string
          name: string
          brand?: string
          category: string
          unit: string
          unitsSold: number
          revenue: number
          cogs: number
        }
      > = {}

      for (const sale of inRange) {
        for (const item of sale.items || []) {
          const pid = item.product_id
          const prod = products.find((p) => p.id === item.product_id)
          const name = prod?.name || item.name || "Product"
          const unit = prod?.unit || item.unit || "unit"
          const category = prod?.category || "General"
          const unitCost = Number(item.cost_at_sale ?? prod?.purchase_price ?? 0)
          const qty = Number(item.quantity) || 0
          const rev = Number(item.line_total ?? qty * (item.selling_price || 0)) || 0

          if (!productAgg[pid]) {
            productAgg[pid] = {
              id: pid,
              name,
              brand: prod?.brand ?? undefined,
              category,
              unit,
              unitsSold: 0,
              revenue: 0,
              cogs: 0,
            }
          }

          productAgg[pid].unitsSold += qty
          productAgg[pid].revenue += rev
          productAgg[pid].cogs += qty * unitCost
        }
      }

      const items: TopProductReportItem[] = Object.values(productAgg).map((item) => {
        const profit = item.revenue - item.cogs
        const marginPercent =
          item.revenue > 0 ? Math.round((profit / item.revenue) * 1000) / 10 : 0
        return {
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          unitsSold: item.unitsSold,
          unit: item.unit,
          revenue: Math.round(item.revenue * 100) / 100,
          cogs: Math.round(item.cogs * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          marginPercent,
        }
      })

      // Sort descending by revenue, limit top 10
      items.sort((a, b) => b.revenue - a.revenue)
      return items.slice(0, 10)
    },
  })
}
