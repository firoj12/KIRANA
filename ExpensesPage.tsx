import React, { useState, useMemo } from "react"
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/useExpenses"
import type { Expense, ExpenseFormData, ExpenseMonthGroup } from "@/types/expense"
import {
  ExpenseTable,
  ExpenseToolbar,
  ExpenseModal,
  ConfirmDeleteExpenseDialog,
} from "@/components/expenses"
import { formatINR } from "@/lib/formatters"
import { TrendingDown, Loader2 } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { useSearchParams } from "react-router-dom"

export const ExpensesPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const isEmptyDemo = searchParams.get("empty") === "true"

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [dateRangeFilter, setDateRangeFilter] = useState<"current_month" | "last_month" | "all">(
    "current_month"
  )

  // Compute start/end dates based on dateRangeFilter
  const dateBounds = useMemo(() => {
    const now = new Date()
    if (dateRangeFilter === "current_month") {
      return {
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      }
    }
    if (dateRangeFilter === "last_month") {
      const prev = subMonths(now, 1)
      return {
        startDate: format(startOfMonth(prev), "yyyy-MM-dd"),
        endDate: format(endOfMonth(prev), "yyyy-MM-dd"),
      }
    }
    return {} // "all"
  }, [dateRangeFilter])

  const { data: rawExpenses = [], isLoading } = useExpenses({
    startDate: dateBounds.startDate,
    endDate: dateBounds.endDate,
    category: selectedCategory,
  })

  const expenses = isEmptyDemo ? [] : rawExpenses

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(
    () => searchParams.get("action") === "add"
  )
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)

  React.useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddModalOpen(true)
    }
    if (searchParams.get("demoExpense") === "true") {
      createExpense.mutate({
        title: "Store Biodegradable Packaging Rolls",
        category: "packaging",
        amount: 500,
        payment_method: "upi",
        expense_date: format(new Date(), "yyyy-MM-dd"),
        notes: "Restock of 500 grocery pouches",
      })
    }
  }, [searchParams])

  // Filter search query client-side
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses
    const q = searchQuery.toLowerCase().trim()
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
    )
  }, [expenses, searchQuery])

  // Group by Month
  const monthGroups: ExpenseMonthGroup[] = useMemo(() => {
    const map = new Map<string, Expense[]>()

    for (const exp of filteredExpenses) {
      const monthKey = exp.expense_date.slice(0, 7) // "2026-09"
      if (!map.has(monthKey)) {
        map.set(monthKey, [])
      }
      map.get(monthKey)!.push(exp)
    }

    const groups: ExpenseMonthGroup[] = []
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a))

    for (const key of sortedKeys) {
      const list = map.get(key)!
      let monthLabel = key
      try {
        monthLabel = format(parseISO(`${key}-01`), "MMMM yyyy")
      } catch {
        // fallback
      }
      const subtotal = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
      groups.push({
        monthKey: key,
        monthLabel,
        expenses: list,
        monthlySubtotal: Math.round(subtotal * 100) / 100,
      })
    }

    return groups
  }, [filteredExpenses])

  // Aggregate stats
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  }, [filteredExpenses])

  const handleSaveExpense = async (formData: ExpenseFormData) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, formData })
    } else {
      await createExpense.mutateAsync(formData)
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingExpense) {
      await deleteExpense.mutateAsync(deletingExpense.id)
      setDeletingExpense(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Store Expenses & Overheads
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log shop operational bills, staff salaries, rent, and overhead costs.
          </p>
        </div>

        {/* Total Expense Banner */}
        {expenses.length > 0 && !isEmptyDemo && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-card shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {dateRangeFilter === "current_month"
                    ? "This Month's Overheads"
                    : dateRangeFilter === "last_month"
                    ? "Last Month's Overheads"
                    : "Total Overheads"}
                </span>
                <span className="text-base font-extrabold text-foreground font-mono tabular-nums leading-none">
                  {formatINR(totalExpenseAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <ExpenseToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            dateRangeFilter={dateRangeFilter}
            onDateRangeFilterChange={setDateRangeFilter}
            onOpenAddModal={() => {
              setEditingExpense(null)
              setIsAddModalOpen(true)
            }}
          />

          {/* Grouped Expense Table */}
          <ExpenseTable
            monthGroups={monthGroups}
            onEditExpense={(exp) => {
              setEditingExpense(exp)
              setIsAddModalOpen(true)
            }}
            onDeleteExpense={(exp) => setDeletingExpense(exp)}
            onOpenAddModal={() => {
              setEditingExpense(null)
              setIsAddModalOpen(true)
            }}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <ExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingExpense(null)
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        isSubmitting={createExpense.isPending || updateExpense.isPending}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteExpenseDialog
        expense={deletingExpense}
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteExpense.isPending}
      />
    </div>
  )
}
