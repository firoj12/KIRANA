import React from "react"

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full bg-card border rounded-2xl overflow-hidden shadow-xs animate-pulse">
      {/* Table Header Skeleton */}
      <div className="p-4 border-b bg-muted/20 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted/70 rounded-md"
            style={{ width: `${Math.max(40, 100 / cols)}%` }}
          />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-3.5 bg-muted/50 rounded-md"
                style={{ width: `${Math.max(30, 90 / cols)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border rounded-2xl p-4 shadow-xs animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 bg-muted rounded-md" />
        <div className="w-8 h-8 rounded-xl bg-muted" />
      </div>
      <div className="h-7 w-32 bg-muted/80 rounded-md" />
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-16 bg-muted/50 rounded-md" />
        <div className="h-3 w-12 bg-muted/50 rounded-md" />
      </div>
    </div>
  )
}

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 260 }) => {
  return (
    <div className="bg-card border rounded-2xl p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="h-3 w-48 bg-muted/60 rounded-md" />
        </div>
        <div className="h-4 w-24 bg-muted/50 rounded-md" />
      </div>

      <div
        className="w-full bg-muted/20 border border-dashed rounded-xl flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        <span>Loading chart data...</span>
      </div>
    </div>
  )
}
