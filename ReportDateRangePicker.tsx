import React from "react"
import { Calendar, Filter } from "lucide-react"
import type { DateRangePreset, DateRangeFilter } from "@/types/report"
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"

interface ReportDateRangePickerProps {
  filter: DateRangeFilter
  onChange: (filter: DateRangeFilter) => void
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom" },
]

export const ReportDateRangePicker: React.FC<ReportDateRangePickerProps> = ({
  filter,
  onChange,
}) => {
  const handleSelectPreset = (preset: DateRangePreset) => {
    const today = new Date()
    let startDate = filter.startDate
    let endDate = filter.endDate

    if (preset === "today") {
      const d = format(today, "yyyy-MM-dd")
      startDate = d
      endDate = d
    } else if (preset === "7d") {
      startDate = format(subDays(today, 6), "yyyy-MM-dd")
      endDate = format(today, "yyyy-MM-dd")
    } else if (preset === "30d") {
      startDate = format(subDays(today, 29), "yyyy-MM-dd")
      endDate = format(today, "yyyy-MM-dd")
    } else if (preset === "this_month") {
      startDate = format(startOfMonth(today), "yyyy-MM-dd")
      endDate = format(endOfMonth(today), "yyyy-MM-dd")
    } else if (preset === "last_month") {
      const prev = subMonths(today, 1)
      startDate = format(startOfMonth(prev), "yyyy-MM-dd")
      endDate = format(endOfMonth(prev), "yyyy-MM-dd")
    }

    onChange({
      preset,
      startDate,
      endDate,
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-xs">
      {/* Preset Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
        <span className="text-xs font-semibold text-muted-foreground mr-1 hidden md:inline-flex items-center gap-1">
          <Filter className="w-3 h-3" /> Period:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handleSelectPreset(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filter.preset === p.value
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date Pickers */}
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg border">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) =>
              onChange({
                ...filter,
                preset: "custom",
                startDate: e.target.value,
              })
            }
            className="bg-transparent border-none text-xs text-foreground focus:outline-none cursor-pointer"
          />
          <span className="text-muted-foreground font-medium">to</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) =>
              onChange({
                ...filter,
                preset: "custom",
                endDate: e.target.value,
              })
            }
            className="bg-transparent border-none text-xs text-foreground focus:outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
