import React from "react"
import { Link } from "react-router-dom"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BookOpen,
  IndianRupee,
  ArrowUpRight,
  PackageX,
  Receipt,
  Clock,
  Loader2,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { useDashboardSummary } from "@/hooks/useDashboardSummary"
import { formatINR } from "@/lib/formatters"

export const DashboardPage: React.FC = () => {
  const { data: summary, isLoading, isError } = useDashboardSummary()

  if (isLoading) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading store dashboard summary...</p>
      </div>
    )
  }

  if (isError || !summary) {
    return (
      <div className="p-8 rounded-xl border bg-card text-center space-y-3 max-w-lg mx-auto mt-12">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-semibold text-base text-foreground">Unable to load dashboard data</h3>
        <p className="text-xs text-muted-foreground">
          There was an issue fetching aggregated store metrics. Please refresh or try again.
        </p>
      </div>
    )
  }

  const { kpis, salesLast14Days, top5Products, recentSales } = summary

  // Helper to render delta percentage badge
  const renderDelta = (deltaPercent: number | null | undefined, subtitle = "vs yesterday") => {
    if (deltaPercent === null || deltaPercent === undefined) {
      return <span className="text-xs text-muted-foreground font-normal">No past baseline</span>
    }

    const isPositive = deltaPercent >= 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const colorClass = isPositive
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800"
      : "text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800"

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border tabular-nums ${colorClass}`}
        >
          <Icon className="w-3 h-3" />
          {isPositive ? "+" : ""}
          {deltaPercent}%
        </span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Store Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time daily sales, profit metrics, inventory alerts, and credit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            New Sale (POS)
          </Link>
        </div>
      </div>

      {/* 1. Four KPI Cards (grid, md:grid-cols-4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Today's Sales */}
        <div className="p-5 rounded-xl border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatINR(kpis.todaySales.value)}
            </div>
            <div>{renderDelta(kpis.todaySales.deltaPercent)}</div>
          </div>
        </div>

        {/* KPI 2: Today's Profit */}
        <div className="p-5 rounded-xl border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatINR(kpis.todayProfit.value)}
            </div>
            <div>{renderDelta(kpis.todayProfit.deltaPercent)}</div>
          </div>
        </div>

        {/* KPI 3: Low Stock Items (Clickable -> /products?lowStock=true) */}
        <Link
          to="/products?lowStock=true"
          className="p-5 rounded-xl border bg-card hover:bg-accent/40 shadow-sm space-y-3 transition-colors group cursor-pointer block"
          title="Click to view low stock items in inventory"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Low Stock Items
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                kpis.lowStockCount > 0
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-emerald-500/10 text-emerald-600"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums flex items-baseline justify-between">
              <span className={kpis.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}>
                {kpis.lowStockCount}
              </span>
              <span className="text-xs font-medium text-primary group-hover:underline inline-flex items-center gap-0.5">
                View items <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.lowStockCount > 0
                ? "Threshold reached · Needs reorder"
                : "All items adequately stocked"}
            </p>
          </div>
        </Link>

        {/* KPI 4: Outstanding Credit */}
        <div className="p-5 rounded-xl border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding Credit
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {formatINR(kpis.outstandingCredit.value)}
            </div>
            <div>
              {kpis.outstandingCredit.deltaAmount && kpis.outstandingCredit.deltaAmount > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border text-amber-700 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 tabular-nums">
                    +{formatINR(kpis.outstandingCredit.deltaAmount, false)} today
                  </span>
                  <span className="text-xs text-muted-foreground">in khata sales</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Total customer ledger</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Below: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (span 2): "Sales — Last 14 days" Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm text-foreground">
                Sales — Last 14 days
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily turnover aggregated across the last two weeks
              </p>
            </div>
          </div>

          {salesLast14Days.length === 0 || salesLast14Days.every((d) => d.sales === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              <Receipt className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium">No sales recorded in the last 14 days</p>
            </div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesLast14Days}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="amberSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(val: any) => [
                      formatINR(typeof val === "number" ? val : Number(val) || 0),
                      "Sales",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#EAB308"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#amberSalesGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: "Top 5 Products" list (name · units · revenue). Plain rows, no bars */}
        <div className="lg:col-span-1 p-5 rounded-xl border bg-card shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-sm text-foreground">
              Top 5 Products
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by total units sold & revenue
            </p>
          </div>

          {top5Products.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              <PackageX className="w-8 h-8 opacity-40" />
              <p className="text-xs font-medium">No product sales recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {top5Products.map((prod) => (
                <div key={prod.id} className="py-3.5 first:pt-1 last:pb-1">
                  {/* name · units · revenue */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium text-foreground truncate min-w-0">
                      {prod.name}
                    </span>
                    <span className="shrink-0 text-muted-foreground whitespace-nowrap">
                      <span>
                        {prod.unitsSold} {prod.unit}
                      </span>
                      <span className="mx-1.5 font-bold text-muted-foreground/60">·</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatINR(prod.revenue)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom: "Recent Sales" Table (last 8 rows) */}
      <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Sales
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest transactions, payment methods, and invoice status
            </p>
          </div>
          <Link
            to="/billing"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Open POS <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
            <Receipt className="w-8 h-8 opacity-40" />
            <p className="text-xs font-medium">No recent sales recorded yet</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {sale.invoice_no}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground truncate max-w-[200px]">
                        {sale.customer_name}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground tabular-nums">
                        {formatINR(sale.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            sale.payment_method === "cash"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : sale.payment_method === "upi"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : sale.payment_method === "credit"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {sale.relative_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
