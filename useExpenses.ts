import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Expense, ExpenseFormData } from "@/types/expense"
import { toast } from "sonner"

export const EXPENSES_QUERY_KEY = ["expenses"]
export const REPORT_SUMMARY_QUERY_KEY = ["report-summary"]
const DASHBOARD_SUMMARY_QUERY_KEY = ["dashboard-summary"]

const EXPENSES_STORAGE_KEY = "kiranatrack_expenses_cache"

const initialExpensesSeed: Expense[] = [
  {
    id: "exp-00000000-0000-0000-0000-000000000001",
    title: "Main Street Kirana Shop Monthly Rent",
    category: "rent",
    amount: 6000,
    payment_method: "bank",
    expense_date: "2026-09-01",
    notes: "September 2026 landlord rent transfer",
    created_at: "2026-09-01T09:00:00.000Z",
  },
  {
    id: "exp-00000000-0000-0000-0000-000000000002",
    title: "Store Electricity & Freezer Power Bill",
    category: "electricity",
    amount: 1450,
    payment_method: "upi",
    expense_date: "2026-09-05",
    notes: "MSEDCL bill payment via Google Pay",
    created_at: "2026-09-05T11:30:00.000Z",
  },
  {
    id: "exp-00000000-0000-0000-0000-000000000003",
    title: "Store Helper Salary (Chhotu)",
    category: "salary",
    amount: 2000,
    payment_method: "cash",
    expense_date: "2026-09-08",
    notes: "First half monthly wage payout",
    created_at: "2026-09-08T18:00:00.000Z",
  },
  {
    id: "exp-00000000-0000-0000-0000-000000000004",
    title: "Tempo Freight from APMC Grain Mandi",
    category: "transport",
    amount: 450,
    payment_method: "cash",
    expense_date: "2026-09-10",
    notes: "Atta and oil sacks delivery charges",
    created_at: "2026-09-10T14:15:00.000Z",
  },
  {
    id: "exp-00000000-0000-0000-0000-000000000005",
    title: "Bio-Plastic Carry Bags & Kraft Paper Roll",
    category: "packaging",
    amount: 320,
    payment_method: "upi",
    expense_date: "2026-09-12",
    notes: "Pack of 500 grocery carry pouches",
    created_at: "2026-09-12T16:45:00.000Z",
  },
  {
    id: "exp-00000000-0000-0000-0000-000000000006",
    title: "Store Cleaning Supplies & Filter Water Jar",
    category: "misc",
    amount: 180,
    payment_method: "cash",
    expense_date: "2026-09-15",
    notes: "20L Bisleri can + floor disinfectant",
    created_at: "2026-09-15T10:20:00.000Z",
  },
  {
    id: "exp-00000000-0000-0000-0000-000000000007",
    title: "August Shop Rent",
    category: "rent",
    amount: 6000,
    payment_method: "bank",
    expense_date: "2026-08-01",
    notes: "August rent paid",
    created_at: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "exp-00000000-0000-0000-0000-000000000008",
    title: "August Electricity Bill",
    category: "electricity",
    amount: 1380,
    payment_method: "upi",
    expense_date: "2026-08-06",
    notes: "August electricity",
    created_at: "2026-08-06T12:00:00.000Z",
  },
]

export function getStoredExpenses(): Expense[] {
  try {
    const saved = localStorage.getItem(EXPENSES_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Ignore storage errors
  }
  return initialExpensesSeed
}

export function saveExpenses(expenses: Expense[]) {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses))
  } catch {
    // Ignore storage errors
  }
}

let localExpensesCache: Expense[] = getStoredExpenses()

export function useExpenses(
  filters?: {
    startDate?: string
    endDate?: string
    category?: string
  }
) {
  return useQuery<Expense[], Error>({
    queryKey: [...EXPENSES_QUERY_KEY, filters?.startDate, filters?.endDate, filters?.category],
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      let expensesList = getStoredExpenses()

      if (!isPlaceholder) {
        try {
          let query = supabase.from("expenses").select("*").order("expense_date", { ascending: false })

          if (filters?.startDate) {
            query = query.gte("expense_date", filters.startDate)
          }
          if (filters?.endDate) {
            query = query.lte("expense_date", filters.endDate)
          }
          if (filters?.category && filters.category !== "ALL") {
            query = query.eq("category", filters.category)
          }

          const { data, error } = await query

          if (!error && data && data.length > 0) {
            expensesList = data as Expense[]
            localExpensesCache = expensesList
            saveExpenses(expensesList)
            return expensesList
          }
        } catch {
          // fallback to local
        }
      }

      // Filter locally
      let result = [...expensesList]

      if (filters?.startDate) {
        result = result.filter((e) => e.expense_date >= filters.startDate!)
      }
      if (filters?.endDate) {
        result = result.filter((e) => e.expense_date <= filters.endDate!)
      }
      if (filters?.category && filters.category !== "ALL") {
        result = result.filter((e) => e.category === filters.category)
      }

      // Sort descending by date
      result.sort((a, b) => b.expense_date.localeCompare(a.expense_date))
      return result
    },
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: ExpenseFormData): Promise<Expense> => {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        category: formData.category,
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
        expense_date: formData.expense_date,
        notes: formData.notes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase
            .from("expenses")
            .insert([newExpense])
            .select()
            .single()

          if (!error && data) {
            const created = data as Expense
            localExpensesCache = [created, ...getStoredExpenses()]
            saveExpenses(localExpensesCache)
            return created
          }
        } catch {
          // fallback
        }
      }

      localExpensesCache = [newExpense, ...getStoredExpenses()]
      saveExpenses(localExpensesCache)
      return newExpense
    },
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: REPORT_SUMMARY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY })

      toast.success(`Expense logged: ${expense.title}`, {
        description: `Amount: ₹${expense.amount.toLocaleString("en-IN")} • ${expense.category.toUpperCase()}`,
      })
    },
    onError: (error) => {
      toast.error("Failed to log expense", { description: error.message })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string
      formData: Partial<ExpenseFormData>
    }): Promise<Expense> => {
      const existing = getStoredExpenses().find((e) => e.id === id)
      if (!existing) throw new Error("Expense not found")

      const updatedExpense: Expense = {
        ...existing,
        ...formData,
        amount: formData.amount !== undefined ? Number(formData.amount) : existing.amount,
        updated_at: new Date().toISOString(),
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase
            .from("expenses")
            .update(updatedExpense)
            .eq("id", id)
            .select()
            .single()

          if (!error && data) {
            const updated = data as Expense
            localExpensesCache = getStoredExpenses().map((e) => (e.id === id ? updated : e))
            saveExpenses(localExpensesCache)
            return updated
          }
        } catch {
          // fallback
        }
      }

      localExpensesCache = getStoredExpenses().map((e) => (e.id === id ? updatedExpense : e))
      saveExpenses(localExpensesCache)
      return updatedExpense
    },
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: REPORT_SUMMARY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY })
      toast.success(`Updated expense "${expense.title}"`)
    },
    onError: (error) => {
      toast.error("Failed to update expense", { description: error.message })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          await supabase.from("expenses").delete().eq("id", id)
        } catch {
          // fallback
        }
      }

      localExpensesCache = getStoredExpenses().filter((e) => e.id !== id)
      saveExpenses(localExpensesCache)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: REPORT_SUMMARY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY })
      toast.success("Expense removed")
    },
    onError: (error) => {
      toast.error("Failed to delete expense", { description: error.message })
    },
  })
}
