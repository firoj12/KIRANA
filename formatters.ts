/**
 * Formats a number as Indian Rupee (₹) currency string using en-IN locale.
 * Example: 12500 -> ₹12,500.00
 */
export function formatINR(amount: number | null | undefined, showDecimals = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0.00"
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
}

/**
 * Calculates gross profit margin percentage and unit profit.
 * Margin % = ((Selling Price - Purchase Price) / Selling Price) * 100
 */
export function calculateMargin(
  purchasePrice: number,
  sellingPrice: number
): { marginPercent: number; profit: number } {
  const purchase = Number(purchasePrice) || 0
  const selling = Number(sellingPrice) || 0

  const profit = selling - purchase
  if (selling <= 0) {
    return { marginPercent: 0, profit }
  }

  const marginPercent = Math.round(((profit / selling) * 100) * 10) / 10
  return { marginPercent, profit }
}

/**
 * Formats stock count with its unit label.
 */
export function formatStock(quantity: number, unit: string): string {
  const qty = Number(quantity) || 0
  return `${qty} ${unit}`
}
