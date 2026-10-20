import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useCustomers } from "@/hooks/useSales"
import { useRecordPayment, useCreateCustomer } from "@/hooks/useKhata"
import type { Customer } from "@/types/sale"
import type { CreateCustomerPayload } from "@/types/khata"
import { CustomerList } from "@/components/khata/CustomerList"
import { CustomerDetailLedger } from "@/components/khata/CustomerDetailLedger"
import { RecordPaymentModal } from "@/components/khata/RecordPaymentModal"
import { AddCustomerModal } from "@/components/khata/AddCustomerModal"
import { Loader2, Sparkles } from "lucide-react"

export const KhataPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { data: customers = [], isLoading } = useCustomers()
  const recordPayment = useRecordPayment()
  const createCustomer = useCreateCustomer()

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false)

  // Default selection to first customer with balance
  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      const withDue = customers.find((c) => c.outstanding_balance > 0)
      setSelectedCustomerId(withDue ? withDue.id : customers[0].id)
    }
  }, [customers, selectedCustomerId])

  // Support query params for testing
  useEffect(() => {
    if (searchParams.get("payment") === "true") {
      setIsPaymentModalOpen(true)
    }
    if (searchParams.get("add_customer") === "true") {
      setIsAddCustomerModalOpen(true)
    }
    // Automated test trigger for recording a payment of ₹500
    if (
      searchParams.get("action") === "record_test_payment" &&
      customers.length > 0 &&
      !recordPayment.isPending &&
      !recordPayment.isSuccess
    ) {
      const target = customers[0]
      if (target && target.outstanding_balance >= 500) {
        recordPayment.mutate({
          customer_id: target.id,
          amount: 500,
          payment_mode: "upi",
          notes: "GPay Reference #920194",
        })
      }
    }
  }, [searchParams, customers, recordPayment])

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) ?? null
  }, [customers, selectedCustomerId])

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id)
  }

  const handleRecordPayment = async (payload: {
    customer_id: string
    amount: number
    payment_mode: "cash" | "upi" | "bank"
    notes?: string
  }) => {
    await recordPayment.mutateAsync(payload)
  }

  const handleAddCustomer = async (payload: CreateCustomerPayload) => {
    const created = await createCustomer.mutateAsync(payload)
    setSelectedCustomerId(created.id)
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Khata Ledger & Udhaar Book
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Sparkles className="w-3 h-3" />
              WhatsApp Reminders Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track customer credit balances, record Jama payments, and send instant WhatsApp reminders.
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      {isLoading ? (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading customer khata accounts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-10.5rem)] min-h-[600px]">
          {/* Left Column: Customer Accounts List (4/12 cols) */}
          <div className="lg:col-span-4 h-full">
            <CustomerList
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={handleSelectCustomer}
              onOpenAddModal={() => setIsAddCustomerModalOpen(true)}
            />
          </div>

          {/* Right Column: Customer Ledger Detail & History (8/12 cols) */}
          <div className="lg:col-span-8 h-full">
            <CustomerDetailLedger
              customer={selectedCustomer}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={selectedCustomer}
        onRecordPayment={handleRecordPayment}
        isSubmitting={recordPayment.isPending}
      />

      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onAddCustomer={handleAddCustomer}
        isSubmitting={createCustomer.isPending}
      />
    </div>
  )
}

export default KhataPage
