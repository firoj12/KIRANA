import React, { useState } from "react"
import {
  useReportSummary,
  useSalesVsPurchases,
  useExpensesByCategory,
  useTopProductsReport,
} from "@/hooks/useReports"
import { useSales } from "@/hooks/useSales"
import { usePurchases } from "@/hooks/usePurchases"
import { useExpenses } from "@/hooks/useExpenses"
import type { DateRangeFilter } from "@/types/report"
import {
  ReportDateRangePicker,
  ReportSummaryCards,
  SalesVsPurchasesChart,
  ExpensesByCategoryDonut,
  TopProductsTable,
  ReportExportButtons,
} from "@/components/reports"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { BarChart3, Loader2 } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import type { DateRangePreset } from "@/types/report"

const computePresetDates = (preset: DateRangePreset): { startDate: string; endDate: string } => {
  const t = new Date()
  if (preset === "today") {
    const d = format(t, "yyyy-MM-dd")
    return { startDate: d, endDate: d }
  }
  if (preset === "7d") {
    return { startDate: format(subDays(t, 6), "yyyy-MM-dd"), endDate: format(t, "yyyy-MM-dd") }
  }
  if (preset === "this_month") {
    return {
      startDate: format(startOfMonth(t), "yyyy-MM-dd"),
      endDate: format(endOfMonth(t), "yyyy-MM-dd"),
    }
  }
  if (preset === "last_month") {
    const prev = subMonths(t, 1)
    return {
      startDate: format(startOfMonth(prev), "yyyy-MM-dd"),
      endDate: format(endOfMonth(prev), "yyyy-MM-dd"),
    }
  }
  return { startDate: format(subDays(t, 29), "yyyy-MM-dd"), endDate: format(t, "yyyy-MM-dd") }
}

export const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const isEmptyDemo = searchParams.get("empty") === "true"

  const initialPreset = (searchParams.get("preset") as DateRangePreset) || "30d"
  const initialDates = computePresetDates(initialPreset)

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    preset: initialPreset,
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
  })

  // Queries
  const { data: rawSummary, isLoading: loadingSummary } = useReportSummary(
    dateFilter.startDate,
    dateFilter.endDate
  )
  const { data: rawSalesVsPurchases = [], isLoading: loadingSalesVsPurchases } =
    useSalesVsPurchases(dateFilter.startDate, dateFilter.endDate)
  const { data: rawCategoryExpenses = [], isLoading: loadingExpensesByCategory } =
    useExpensesByCategory(dateFilter.startDate, dateFilter.endDate)
  const { data: rawTopProducts = [], isLoading: loadingTopProducts } = useTopProductsReport(
    dateFilter.startDate,
    dateFilter.endDate
  )

  const { data: allSales = [] } = useSales()
  const { data: allPurchases = [] } = usePurchases()
  const { data: allExpenses = [] } = useExpenses()

  // Empty state override for testing
  const summary = isEmptyDemo
    ? {
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate,
        gross_revenue: 0,
        cogs: 0,
        gross_profit: 0,
        net_profit: 0,
        sales_count: 0,
        expenses_total: 0,
        purchases_total: 0,
        deltas: {
          gross_revenue: null,
          cogs: null,
          gross_profit: null,
          net_profit: null,
        },
      }
    : rawSummary || {
        start_date: dateFilter.startDate,
        end_date: dateFilter.endDate,
        gross_revenue: 0,
        cogs: 0,
        gross_profit: 0,
        net_profit: 0,
        sales_count: 0,
        expenses_total: 0,
        purchases_total: 0,
        deltas: {
          gross_revenue: null,
          cogs: null,
          gross_profit: null,
          net_profit: null,
        },
      }

  const salesVsPurchases = isEmptyDemo ? [] : rawSalesVsPurchases
  const categoryExpenses = isEmptyDemo ? [] : rawCategoryExpenses
  const topProducts = isEmptyDemo ? [] : rawTopProducts

  // Filtered raw items for CSV export in date range
  const rangeSales = isEmptyDemo
    ? []
    : allSales.filter((s) => {
        const d = (s.created_at || "").slice(0, 10)
        return d >= dateFilter.startDate && d <= dateFilter.endDate
      })

  const rangePurchases = isEmptyDemo
    ? []
    : allPurchases.filter(
        (p) => p.purchase_date >= dateFilter.startDate && p.purchase_date <= dateFilter.endDate
      )

  const rangeExpenses = isEmptyDemo
    ? []
    : allExpenses.filter(
        (e) => e.expense_date >= dateFilter.startDate && e.expense_date <= dateFilter.endDate
      )

  const isLoading =
    loadingSummary || loadingSalesVsPurchases || loadingExpensesByCategory || loadingTopProducts

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-primary" />
            <span>Financial Reports & Analytics</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time profit & loss, COGS margins, overhead breakdowns, and ledger exports.
          </p>
        </div>
      </div>

      {/* Date Range Picker with Presets */}
      <ReportDateRangePicker filter={dateFilter} onChange={setDateFilter} />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Four Summary KPI Cards */}
          <ReportSummaryCards summary={summary} />

          {/* 2. Charts 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales vs Purchases (Span 2) */}
            <div className="lg:col-span-2">
              <SalesVsPurchasesChart data={salesVsPurchases} />
            </div>

            {/* Expenses by Category Donut (Span 1) */}
            <div>
              <ExpensesByCategoryDonut data={categoryExpenses} />
            </div>
          </div>

          {/* 3. Top 10 Products Table */}
          <TopProductsTable products={topProducts} />

          {/* 4. Export CSV Buttons */}
          <ReportExportButtons
            summary={summary}
            sales={rangeSales}
            purchases={rangePurchases}
            expenses={rangeExpenses}
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
          />
        </div>
      )}
    </div>
  )
}
