/**
 * Utility to export tabular data to a downloadable CSV file.
 * Preserves monetary amounts as plain numbers (no currency symbols)
 * so spreadsheet applications like Microsoft Excel, Google Sheets,
 * and Tally compute formulas correctly.
 */

export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) {
    console.warn("[KiranaTrack] No data to export to CSV")
    return
  }

  // 1. Extract headers from keys of the first object
  const headers = Object.keys(rows[0])

  // 2. Helper to format a single cell value
  const formatCell = (val: any): string => {
    if (val === null || val === undefined) {
      return ""
    }

    if (typeof val === "number") {
      return isNaN(val) ? "" : String(val)
    }

    if (typeof val === "boolean") {
      return val ? "TRUE" : "FALSE"
    }

    let str = String(val).trim()

    // If string is an INR currency string (e.g. "₹ 1,250.00" or "₹1250"), strip currency symbol
    if (str.startsWith("₹") || str.includes("₹")) {
      str = str.replace(/₹\s?/g, "").replace(/,/g, "").trim()
    }

    // Escape double quotes by doubling them
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`
    }

    return str
  }

  // 3. Assemble CSV string
  const headerLine = headers.map((h) => formatCell(h)).join(",")
  const rowLines = rows.map((row) => headers.map((h) => formatCell(row[h])).join(","))
  const csvContent = "\uFEFF" + [headerLine, ...rowLines].join("\r\n") // \uFEFF BOM for proper UTF-8 Excel support

  // 4. Create Blob and trigger native browser download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const finalFilename = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", finalFilename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 200)
}
