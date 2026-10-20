export type TransactionType = "credit" | "payment"

export interface KhataTransaction {
  id: string
  customer_id: string
  type: TransactionType // credit = Udhaar/Sale, payment = Jama/Payment received
  amount: number
  payment_mode?: "cash" | "upi" | "bank"
  description: string
  balance_after: number
  invoice_no?: string
  created_at: string
}

export interface RecordPaymentPayload {
  customer_id: string
  amount: number
  payment_mode: "cash" | "upi" | "bank"
  notes?: string
}

export interface CreateCustomerPayload {
  name: string
  phone: string
  credit_limit: number
}
