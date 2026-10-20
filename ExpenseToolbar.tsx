import React from "react"
import { Search, Plus, Calendar } from "lucide-react"

interface ExpenseToolbarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedCategory: string
  onCategoryChange: (c: string) => void
  dateRangeFilter: "current_month" | "last_month" | "all"
  onDateRangeFilterChange: (val: "current_month" | "last_month" | "all") => void
  onOpenAddModal: () => void
}

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Categories" },
  { value: "rent", label: "Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "salary", label: "Staff Salary" },
  { value: "transport", label: "Transport & Freight" },
  { value: "packaging", label: "Packaging" },
  { value: "maintenance", label: "Maintenance" },
  { value: "marketing", label: "Marketing" },
  { value: "misc", label: "Miscellaneous" },
]

export const ExpenseToolbar: React.FC<ExpenseToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  onOpenAddModal,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border shadow-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search expenses by title, notes, or category..."
          className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
      </div>

      {/* Filters & Actions Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Filter Preset */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
          <button
            type="button"
            onClick={() => onDateRangeFilterChange("current_month")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              dateRangeFilter === "current_month"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => onDateRangeFilterChange("last_month")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              dateRangeFilter === "last_month"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => onDateRangeFilterChange("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              dateRangeFilter === "all"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Time
          </button>
        </div>

        {/* Category Dropdown Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-xs h-8 pl-3 pr-8 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-medium"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* + Add Expense CTA */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="h-8 px-3.5 text-xs rounded-lg bg-primary text-primary-foreground font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Expense</span>
        </button>
      </div>
    </div>
  )
}
