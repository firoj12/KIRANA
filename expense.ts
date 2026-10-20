export type ExpenseCategory =
  | "rent"
  | "electricity"
  | "salary"
  | "transport"
  | "packaging"
  | "maintenance"
  | "marketing"
  | "misc"

export type ExpensePaymentMethod = "cash" | "upi" | "card" | "bank"

export interface Expense {
  id: string
  user_id?: string
  title: string
  category: ExpenseCategory
  amount: number
  payment_method: ExpensePaymentMethod
  expense_date: string // YYYY-MM-DD
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface ExpenseFormData {
  title: string
  category: ExpenseCategory
  amount: number
  payment_method: ExpensePaymentMethod
  expense_date: string
  notes?: string
}

export interface ExpenseMonthGroup {
  monthKey: string // "2026-09"
  monthLabel: string // "September 2026"
  expenses: Expense[]
  monthlySubtotal: number
}
