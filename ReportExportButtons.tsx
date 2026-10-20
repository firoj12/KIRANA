import React from "react"
import { Download, FileSpreadsheet } from "lucide-react"
import { exportToCsv } from "@/lib/csv"
import type { ReportSummary } from "@/types/report"
import type { Sale } from "@/types/sale"
import type { Purchase } from "@/types/purchase"
import type { Expense } from "@/types/expense"
import { toast } from "sonner"

interface ReportExportButtonsProps {
  summary: ReportSummary
  sales: Sale[]
  purchases: Purchase[]
  expenses: Expense[]
  startDate: string
  endDate: string
}

export const ReportExportButtons: React.FC<ReportExportButtonsProps> = ({
  summary,
  sales,
  purchases,
  expenses,
  startDate,
  endDate,
}) => {
  // 1. Export Sales CSV
  const handleExportSales = () => {
    const rows = sales.map((s) => ({
      Invoice_No: s.invoice_no,
      Date: (s.created_at || "").slice(0, 10),
      Customer: s.customer_name || "Walk-in Customer",
      Items_Count: s.items?.length || 0,
      Subtotal: Number(s.sub_total || 0),
      Discount: Number(s.discount || 0),
      GST_Amount: Number(s.gst_amount || 0),
      Total_Amount: Number(s.total_amount || 0),
      Amount_Paid: Number(s.amount_paid || 0),
      Payment_Method: (s.payment_method || "cash").toUpperCase(),
      Payment_Status: (s.payment_status || "paid").toUpperCase(),
    }))

    if (rows.length === 0) {
      toast.error("No sales records to export for this period")
      return
    }

    exportToCsv(`KiranaTrack_Sales_${startDate}_to_${endDate}.csv`, rows)
    toast.success("Sales report exported to CSV")
  }

  // 2. Export Purchases CSV
  const handleExportPurchases = () => {
    const rows = purchases.map((p) => ({
      Bill_No: p.bill_no,
      Purchase_Date: p.purchase_date,
      Supplier: p.supplier_name,
      Items_Count: p.items?.length || 0,
      Total_Amount: Number(p.total_amount || 0),
      Amount_Paid: Number(p.amount_paid || 0),
      Payment_Method: p.payment_method.toUpperCase(),
      Payment_Status: p.payment_status.toUpperCase(),
      Notes: p.notes || "",
    }))

    if (rows.length === 0) {
      toast.error("No purchase bills to export for this period")
      return
    }

    exportToCsv(`KiranaTrack_Purchases_${startDate}_to_${endDate}.csv`, rows)
    toast.success("Purchases report exported to CSV")
  }

  // 3. Export Expenses CSV
  const handleExportExpenses = () => {
    const rows = expenses.map((e) => ({
      Date: e.expense_date,
      Title: e.title,
      Category: e.category.toUpperCase(),
      Amount: Number(e.amount || 0),
      Payment_Method: e.payment_method.toUpperCase(),
      Notes: e.notes || "",
    }))

    if (rows.length === 0) {
      toast.error("No expense records to export for this period")
      return
    }

    exportToCsv(`KiranaTrack_Expenses_${startDate}_to_${endDate}.csv`, rows)
    toast.success("Expenses report exported to CSV")
  }

  // 4. Export Profit Summary CSV
  const handleExportProfitSummary = () => {
    const rows = [
      {
        Metric: "Gross Revenue",
        Amount: summary.gross_revenue,
        Period: `${startDate} to ${endDate}`,
        Notes: "Total sales turnover",
      },
      {
        Metric: "Cost of Goods Sold (COGS)",
        Amount: summary.cogs,
        Period: `${startDate} to ${endDate}`,
        Notes: "Direct inventory purchase cost for items sold",
      },
      {
        Metric: "Gross Profit",
        Amount: summary.gross_profit,
        Period: `${startDate} to ${endDate}`,
        Notes: "Gross Revenue minus COGS",
      },
      {
        Metric: "Total Store Overheads (Expenses)",
        Amount: summary.expenses_total,
        Period: `${startDate} to ${endDate}`,
        Notes: "Rent, power, wages, freight, packaging",
      },
      {
        Metric: "Net Profit",
        Amount: summary.net_profit,
        Period: `${startDate} to ${endDate}`,
        Notes: "Gross Profit minus Overheads",
      },
      {
        Metric: "Inbound Stock Purchases",
        Amount: summary.purchases_total,
        Period: `${startDate} to ${endDate}`,
        Notes: "Total wholesale procurement bills logged",
      },
    ]

    exportToCsv(`KiranaTrack_Profit_Summary_${startDate}_to_${endDate}.csv`, rows)
    toast.success("Profit summary exported to CSV")
  }

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground">Export Financial Reports</h4>
          <p className="text-[11px] text-muted-foreground">
            Download spreadsheet data in CSV format (clean numbers for Excel & Tally)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExportSales}
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Sales CSV</span>
        </button>

        <button
          type="button"
          onClick={handleExportPurchases}
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Purchases CSV</span>
        </button>

        <button
          type="button"
          onClick={handleExportExpenses}
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Expenses CSV</span>
        </button>

        <button
          type="button"
          onClick={handleExportProfitSummary}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Profit Summary CSV</span>
        </button>
      </div>
    </div>
  )
}
