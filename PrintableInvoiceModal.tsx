import React from "react"
import type { Sale } from "@/types/sale"
import { useProfile } from "@/hooks/useProfile"
import { Printer, X, Receipt } from "lucide-react"
import { format } from "date-fns"

interface PrintableInvoiceModalProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const { data: profile } = useProfile()

  if (!isOpen || !sale) return null

  const handlePrint = () => {
    window.print()
  }

  const shopName = profile?.shop_name || "Shree Ganesh Kirana Store"
  const shopPhone = profile?.phone || "9876543210"
  const shopAddress = profile?.address || "Shop #4, Main Market, APMC Road"
  const shopGstin = profile?.gstin || "27AAAAA0000A1Z5"

  const saleDate = sale.created_at
    ? format(new Date(sale.created_at), "dd MMM yyyy, hh:mm a")
    : format(new Date(), "dd MMM yyyy, hh:mm a")

  const balanceDue = Math.max(0, (sale.total_amount || 0) - (sale.amount_paid || 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      {/* Container */}
      <div className="bg-card border rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden flex flex-col">
        {/* Modal Controls Bar (Hidden during print via no-print) */}
        <div className="no-print p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Tax Invoice Preview</h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                {sale.invoice_no} • A5 Format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              aria-label="Close invoice preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet (Targeted by #printable-invoice-root) */}
        <div className="p-6 bg-white text-black overflow-y-auto max-h-[75vh]">
          <div
            id="printable-invoice-root"
            className="w-full bg-white text-black font-sans leading-tight text-[11px]"
            style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
          >
            {/* Header: Store Identity */}
            <div className="border-b border-black pb-3 text-center">
              <h1 className="text-base font-black tracking-tight uppercase">
                {shopName}
              </h1>
              <p className="text-[11px] text-gray-800 mt-0.5">{shopAddress}</p>
              <div className="flex items-center justify-center gap-4 text-[10px] mt-1 text-gray-700">
                <span>Phone: {shopPhone}</span>
                {shopGstin && <span>GSTIN: {shopGstin}</span>}
              </div>
              <div className="mt-1 text-[11px] font-bold tracking-wider uppercase border border-black inline-block px-2 py-0.5">
                Retail Tax Invoice / Bill of Supply
              </div>
            </div>

            {/* Meta Details Grid */}
            <div className="grid grid-cols-2 gap-3 py-2.5 border-b border-black text-[11px]">
              <div>
                <div className="flex gap-1.5">
                  <span className="font-semibold text-gray-700">Invoice No:</span>
                  <span className="font-bold font-mono">{sale.invoice_no}</span>
                </div>
                <div className="flex gap-1.5 mt-0.5">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span>{saleDate}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex justify-end gap-1.5">
                  <span className="font-semibold text-gray-700">Customer:</span>
                  <span className="font-bold">
                    {sale.customer_name || "Walk-in Customer"}
                  </span>
                </div>
                <div className="flex justify-end gap-1.5 mt-0.5">
                  <span className="font-semibold text-gray-700">Payment:</span>
                  <span className="uppercase font-semibold">{sale.payment_method}</span>
                </div>
              </div>
            </div>

            {/* Items Table: Hairline Borders Only */}
            <table className="w-full text-left my-2 border-collapse">
              <thead>
                <tr className="border-b border-black text-[10px] uppercase font-bold text-gray-900">
                  <th className="py-1.5 w-8">#</th>
                  <th className="py-1.5">Item Description</th>
                  <th className="py-1.5 text-right w-12">Qty</th>
                  <th className="py-1.5 text-right w-16">Rate (₹)</th>
                  <th className="py-1.5 text-right w-14">GST</th>
                  <th className="py-1.5 text-right w-20">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {(sale.items || []).map((item, idx) => (
                  <tr key={idx} className="text-[11px]">
                    <td className="py-1 font-mono text-gray-600">{idx + 1}</td>
                    <td className="py-1 font-semibold pr-2">
                      {item.name}
                      <span className="text-[10px] text-gray-600 font-normal block">
                        Unit: {item.unit}
                      </span>
                    </td>
                    <td className="py-1 text-right font-mono font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {item.selling_price.toFixed(2)}
                    </td>
                    <td className="py-1 text-right font-mono text-[10px]">
                      {item.gst_percent ? `${item.gst_percent}%` : "0%"}
                    </td>
                    <td className="py-1 text-right font-mono font-bold">
                      {item.line_total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary Breakdown */}
            <div className="border-t-2 border-black pt-2 flex justify-end">
              <div className="w-64 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-mono">₹{sale.sub_total.toFixed(2)}</span>
                </div>
                {sale.gst_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">GST Total:</span>
                    <span className="font-mono">₹{sale.gst_amount.toFixed(2)}</span>
                  </div>
                )}
                {sale.discount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{sale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black border-t border-b border-black py-1 my-1">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{sale.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount Paid:</span>
                  <span className="font-mono font-semibold">
                    ₹{sale.amount_paid.toFixed(2)}
                  </span>
                </div>
                {balanceDue > 0 ? (
                  <div className="flex justify-between font-bold text-red-700 border-t border-dotted border-gray-400 pt-0.5">
                    <span>Balance Due (Khata):</span>
                    <span className="font-mono">₹{balanceDue.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-[10px] text-gray-600">
                    <span>Payment Status:</span>
                    <span className="font-bold text-green-800 uppercase">Paid in Full</span>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="border-t border-black mt-4 pt-3 text-center space-y-1">
              <p className="text-xs font-bold tracking-wide">
                Thank you for your business! Please visit again.
              </p>
              <p className="text-[10px] text-gray-600">
                Goods once sold cannot be returned without original bill • Subject to local jurisdiction
              </p>
              <p className="text-[9px] text-gray-500 font-mono pt-1">
                Generated via KiranaTrack • Indian Retail & Daily Ledger
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
