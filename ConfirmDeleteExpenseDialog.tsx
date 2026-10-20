import React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import type { Expense } from "@/types/expense"
import { formatINR } from "@/lib/formatters"

interface ConfirmDeleteExpenseDialogProps {
  expense: Expense | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting?: boolean
}

export const ConfirmDeleteExpenseDialog: React.FC<ConfirmDeleteExpenseDialogProps> = ({
  expense,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !expense) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="font-bold text-base text-foreground">Delete Expense?</h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Are you sure you want to remove <strong className="text-foreground font-semibold">"{expense.title}"</strong> ({formatINR(expense.amount)})? This will adjust your monthly overheads and net profit calculations.
        </p>

        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-3 py-2 rounded-lg border text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-3 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
