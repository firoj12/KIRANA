import React from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import type { CategoryExpensePoint } from "@/types/report"
import { formatINR } from "@/lib/formatters"
import { PieChart as PieChartIcon } from "lucide-react"

interface ExpensesByCategoryDonutProps {
  data: CategoryExpensePoint[]
}

const MUTED_PALETTE = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#64748B"]

export const ExpensesByCategoryDonut: React.FC<ExpensesByCategoryDonutProps> = ({ data }) => {
  const hasData = data && data.length > 0
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)

  // Custom label showing percentage
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
    if (percent < 0.05) return null // Hide tiny labels

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">
            Expenses by Category
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Breakdown of store overheads and operational bills
          </p>
        </div>
        {hasData && (
          <span className="text-xs font-bold font-mono tabular-nums text-foreground bg-muted px-2.5 py-1 rounded-lg border">
            {formatINR(totalAmount)}
          </span>
        )}
      </div>

      {/* Donut Chart Canvas */}
      <div className="w-full h-[220px] relative flex items-center justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground text-xs p-6 border border-dashed rounded-xl bg-muted/20 w-full h-full">
            <PieChartIcon className="w-8 h-8 opacity-40 mb-2" />
            <span className="font-semibold">No expenses in this period</span>
            <span className="text-[11px] mt-0.5">Overhead distribution will appear here</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(val: any) => [formatINR(val), "Amount"]}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="amount"
                nameKey="label"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || MUTED_PALETTE[index % MUTED_PALETTE.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category List Breakdown */}
      {hasData && (
        <div className="mt-3 pt-3 border-t divide-y divide-border/50 text-xs">
          {data.slice(0, 5).map((item) => (
            <div key={item.category} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-foreground font-medium text-xs">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                <span className="text-muted-foreground text-[11px]">
                  {item.percentage.toFixed(1)}%
                </span>
                <span className="font-semibold text-foreground">
                  {formatINR(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
