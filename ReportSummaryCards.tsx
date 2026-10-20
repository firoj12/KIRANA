import React from "react"
import type { ReportSummary } from "@/types/report"
import { formatINR } from "@/lib/formatters"
import {
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Scale,
} from "lucide-react"

interface ReportSummaryCardsProps {
  summary: ReportSummary
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ summary }) => {
  const { gross_revenue, cogs, gross_profit, net_profit, deltas } = summary

  const renderDelta = (delta: number | null | undefined, reverseGood = false) => {
    if (delta === null || delta === undefined || isNaN(delta)) {
      return (
        <span className="text-[11px] text-muted-foreground font-medium">
          No prior data
        </span>
      )
    }

    const isPositive = delta > 0
    const isZero = delta === 0

    if (isZero) {
      return (
        <span className="text-[11px] text-muted-foreground font-medium">
          0.0% vs prev period
        </span>
      )
    }

    // Usually positive is green, unless reverseGood is true (e.g. COGS or expenses where higher is bad)
    const isGood = reverseGood ? !isPositive : isPositive

    return (
      <div
        className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
          isGood
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 text-destructive"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        <span>
          {isPositive ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
        <span className="text-muted-foreground font-normal text-[10px] ml-0.5">
          vs prev
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Gross Revenue */}
      <div className="bg-card border rounded-2xl p-4 shadow-xs hover:border-primary/30 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Gross Revenue
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
            {formatINR(gross_revenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            {renderDelta(deltas.gross_revenue)}
            <span className="text-[11px] text-muted-foreground">
              {summary.sales_count} {summary.sales_count === 1 ? "bill" : "bills"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. COGS (Cost of Goods Sold) */}
      <div className="bg-card border rounded-2xl p-4 shadow-xs hover:border-primary/30 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Cost of Goods (COGS)
          </span>
          <div className="w-8 h-8 rounded-xl bg-stone-500/10 text-stone-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
            {formatINR(cogs)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            {renderDelta(deltas.cogs, true)}
            <span className="text-[11px] text-muted-foreground">
              {gross_revenue > 0 ? `${Math.round((cogs / gross_revenue) * 100)}% of rev` : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Gross Profit */}
      <div className="bg-card border rounded-2xl p-4 shadow-xs hover:border-primary/30 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Gross Profit
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-extrabold text-foreground font-mono tabular-nums tracking-tight">
            {formatINR(gross_profit)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            {renderDelta(deltas.gross_profit)}
            <span className="text-[11px] text-muted-foreground">
              {gross_revenue > 0
                ? `${Math.round((gross_profit / gross_revenue) * 100)}% margin`
                : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Net Profit */}
      <div className="bg-card border-2 border-primary/20 bg-primary/5 rounded-2xl p-4 shadow-xs hover:border-primary/40 transition">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-primary block">
              Net Profit
            </span>
            <span className="text-[10px] text-muted-foreground">
              Gross Profit − Overheads
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div
            className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight ${
              net_profit >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {formatINR(net_profit)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            {renderDelta(deltas.net_profit)}
            <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
              Overheads: {formatINR(summary.expenses_total, false)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
