import React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import type { SalesVsPurchasesPoint } from "@/types/report"
import { formatINR } from "@/lib/formatters"
import { TrendingUp } from "lucide-react"

interface SalesVsPurchasesChartProps {
  data: SalesVsPurchasesPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-xs border rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[140px]">
        <div className="font-bold text-foreground border-b pb-1 text-[11px]">
          {label}
        </div>
        {payload.map((entry: any, index: number) => {
          const isSales = entry.dataKey === "sales"
          const color = isSales ? "#EAB308" : "#78716C"
          const name = isSales ? "Customer Sales" : "Stock Purchases"
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground text-[11px]">{name}</span>
              </div>
              <span className="font-bold text-foreground font-mono tabular-nums text-[11px]">
                {formatINR(entry.value)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

export const SalesVsPurchasesChart: React.FC<SalesVsPurchasesChartProps> = ({ data }) => {
  const hasData = data.some((d) => d.sales > 0 || d.purchases > 0)

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>Sales vs Purchases</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily turnover compared against inbound procurement costs
          </p>
        </div>

        {/* Muted Indicators (No legend text in chart canvas, clean pill legend in header) */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            <span className="text-muted-foreground text-[11px]">Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#78716C]" />
            <span className="text-muted-foreground text-[11px]">Purchases</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[260px] relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs border border-dashed rounded-xl bg-muted/20">
            <TrendingUp className="w-8 h-8 opacity-40 mb-2" />
            <span className="font-semibold">No sales or purchases in this period</span>
            <span className="text-[11px] mt-0.5">Change date range or record transactions</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                stroke="#888888"
                fontSize={11}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="#888888"
                fontSize={10}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Dual Lines with Muted Colors, no grid lines, no legend text */}
              <Line
                type="monotone"
                dataKey="sales"
                name="Sales"
                stroke="#EAB308"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 1.5, stroke: "#EAB308" }}
              />
              <Line
                type="monotone"
                dataKey="purchases"
                name="Purchases"
                stroke="#78716C"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 1.5, stroke: "#78716C" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
