import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Customer } from "@/types/sale"
import { updateLocalCustomerBalance } from "@/hooks/useSales"
import type { KhataTransaction, RecordPaymentPayload, CreateCustomerPayload } from "@/types/khata"
import { toast } from "sonner"

const CUSTOMERS_QUERY_KEY = ["customers"]
const KHATA_LEDGER_QUERY_KEY = "khata_ledger"

// In-memory ledger transactions cache
let localLedgerCache: KhataTransaction[] = [
  {
    id: "tx-1",
    customer_id: "c1000000-0000-0000-0000-000000000001",
    type: "credit",
    amount: 850,
    description: "Store Sale (Atta, Oil & Sugar)",
    invoice_no: "INV-20260910-0012",
    balance_after: 850,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tx-2",
    customer_id: "c1000000-0000-0000-0000-000000000001",
    type: "credit",
    amount: 570,
    description: "Store Sale (Tea, Biscuits & Spices)",
    invoice_no: "INV-20260912-0044",
    balance_after: 1420,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "tx-3",
    customer_id: "c2000000-0000-0000-0000-000000000002",
    type: "credit",
    amount: 450,
    description: "Store Sale (Butter & Milk items)",
    invoice_no: "INV-20260911-0023",
    balance_after: 450,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export function useCustomerLedger(customerId: string | null) {
  return useQuery<KhataTransaction[], Error>({
    queryKey: [KHATA_LEDGER_QUERY_KEY, customerId],
    queryFn: async () => {
      if (!customerId) return []
      return localLedgerCache
        .filter((tx) => tx.customer_id === customerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
    enabled: Boolean(customerId),
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RecordPaymentPayload): Promise<{
      customer: Customer
      transaction: KhataTransaction
    }> => {
      const customers = queryClient.getQueryData<Customer[]>(CUSTOMERS_QUERY_KEY) || []
      const customer = customers.find((c) => c.id === payload.customer_id)

      if (!customer) {
        throw new Error("Customer not found")
      }

      if (payload.amount <= 0) {
        throw new Error("Payment amount must be greater than 0")
      }

      const newBalance = Math.max(0, Math.round((customer.outstanding_balance - payload.amount) * 100) / 100)

      const transaction: KhataTransaction = {
        id: crypto.randomUUID(),
        customer_id: payload.customer_id,
        type: "payment",
        amount: payload.amount,
        payment_mode: payload.payment_mode,
        description: payload.notes?.trim()
          ? `Jama: ${payload.notes.trim()} (${payload.payment_mode.toUpperCase()})`
          : `Payment received (${payload.payment_mode.toUpperCase()})`,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      }

      localLedgerCache = [transaction, ...localLedgerCache]

      // Atomically update customer balance in cache and local storage
      updateLocalCustomerBalance(payload.customer_id, newBalance)
      const updatedCustomer: Customer = {
        ...customer,
        outstanding_balance: newBalance,
      }

      queryClient.setQueryData<Customer[]>(CUSTOMERS_QUERY_KEY, (old = []) => {
        return old.map((c) => (c.id === payload.customer_id ? updatedCustomer : c))
      })

      return { customer: updatedCustomer, transaction }
    },
    onSuccess: ({ customer, transaction }) => {
      queryClient.invalidateQueries({ queryKey: [KHATA_LEDGER_QUERY_KEY, customer.id] })
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY })

      toast.success(`Jama of ₹${transaction.amount.toLocaleString("en-IN")} recorded!`, {
        description: `${customer.name} • Remaining balance: ₹${customer.outstanding_balance.toLocaleString("en-IN")}`,
        duration: 8000,
      })
    },
    onError: (error) => {
      toast.error("Failed to record payment", {
        description: error.message,
      })
    },
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload): Promise<Customer> => {
      if (!payload.name.trim()) {
        throw new Error("Customer name is required")
      }

      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        phone: payload.phone.trim() || null,
        credit_limit: Number(payload.credit_limit) || 2000,
        outstanding_balance: 0,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Customer[]>(CUSTOMERS_QUERY_KEY, (old = []) => [
        newCustomer,
        ...old,
      ])

      return newCustomer
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY })
      toast.success(`Customer "${customer.name}" added to Khata book!`, {
        description: `Credit limit set to ₹${customer.credit_limit.toLocaleString("en-IN")}`,
      })
    },
    onError: (error) => {
      toast.error("Failed to add customer", {
        description: error.message,
      })
    },
  })
}
