# KiranaTrack (किराना ट्रैक) 🛒

> **Fast, Modern, Offline-Ready Progressive Web App (PWA) tailored for Indian Retail & Kirana Stores.**  
> Built with **React 19**, **TypeScript**, **Tailwind CSS**, **TanStack Query**, and **Supabase (PostgreSQL + RLS)**.

---

## 🌟 Overview

**KiranaTrack** is an all-in-one store management platform designed specifically for Indian neighbourhood kirana stores, supermarkets, and local retail businesses. It provides high-speed Point-of-Sale (POS) billing, multi-rate GST compliance, atomic inventory control, customer Udhar Khata (credit ledger), supplier purchase tracking, daily expense logging, financial P&L reporting, and native browser A5 invoice printing.

The app is engineered as a **Progressive Web Application (PWA)** with offline shell caching, a mobile bottom navigation bar, a global `⌘K` / `Ctrl+K` command palette, and dark mode styling (`#0A0A0A` background, `#171717` surface).

---

## 🚀 Key Features

### 1. Point of Sale (POS) & Fast Billing (`/billing`)
- **Instant Item Selection**: Search items by name or category with quick quantity modifiers.
- **Multi-Rate GST Engine**: Automatic base price, SGST, CGST, and IGST calculations across standard Indian slabs (0%, 5%, 12%, 18%, 28%).
- **Split & Flexible Payments**: Supports **Cash**, **UPI**, **Card**, and **Khata / Udhar (Credit)** with instant balance updates.
- **Atomic Checkout**: Powered by PostgreSQL `create_sale` RPC ensuring atomic inventory decrements and customer credit ledger updates.

### 2. Pure Browser-Native Printable Invoice
- **A5 Print Format**: Specially engineered `@media print` stylesheet formatted for standard Indian A5 bills (hairline borders, pure black-and-white, zero background ink waste).
- **No External PDF Libraries**: 100% native `window.print()` integration with zero runtime bloat.
- **Detailed Receipt Layout**: Includes shop name, GSTIN, owner contact, timestamp, invoice number, itemized rates with GST slabs, discount, amount paid, and balance due.

### 3. Inventory & Product Management (`/products`)
- Complete product catalog with category classification, unit types (kg, g, l, ml, pcs, packet, box), purchase price, selling price, and real-time margin percentage calculation:
  $$\text{Margin \%} = \frac{\text{Selling Price} - \text{Purchase Price}}{\text{Selling Price}} \times 100$$
- Low-stock indicator warning pills when inventory falls below threshold.
- Fast slide-over side sheet for creating and updating product details.

### 4. Khata / Customer Credit Ledger (`/khata`)
- Tracks customer phone numbers, credit limits, and outstanding balances.
- Real-time warning badges when outstanding balance exceeds the customer's credit limit.
- One-click **Record Payment** modal to settle customer dues with cash, UPI, or bank transfer.

### 5. Suppliers & Inbound Purchases (`/suppliers`, `/purchases`)
- Supplier directory with GSTIN, phone, address, and outstanding balance ledger.
- Inbound purchase bill creation (`PB-YYYYMMDD-XXXX`) that automatically increments stock levels and updates wholesale purchase costs.

### 6. Expense Management (`/expenses`)
- Categorized operational expenditure tracking (Rent, Electricity, Staff Wages, Transport, Packaging, Maintenance, Marketing, Misc).
- Grouped by month with automated monthly subtotals.

### 7. Financial Reports & Analytics (`/reports`)
- Comprehensive dashboard with date range presets: **Today**, **7 Days**, **30 Days**, **This Month**, **Last Month**, or **Custom**.
- Key Metrics: **Gross Revenue**, **COGS (Cost of Goods Sold)**, **Gross Profit**, **Total Expenses**, and **Net Profit**.
- Visual daily sales vs. net profit trend charts using Recharts.
- One-click CSV exports for accounting.

### 8. Store Settings & Preferences (`/settings`)
- **Store Profile**: Manage Shop Name, Owner Name, Phone, Address, and GSTIN (updates receipt headers and navigation dynamically).
- **Preferences**: Theme switcher (Light, Dark, System), Currency (₹ en-IN), Date formatting.
- **Danger Zone**: Account and local data wipe with strict `"DELETE ALL DATA"` type-to-confirm validation.

---

## 🏛️ Critical Architectural Decision: COGS `cost_at_sale` Snapshot Pattern

### The Problem in Traditional Kirana Accounting
In naive database designs, financial reports calculate **Cost of Goods Sold (COGS)** by joining historical sales items to the current `products.purchase_price`:
$$\text{COGS}_{\text{naive}} = \sum (\text{item.quantity} \times \text{products.purchase\_price})$$

However, wholesale inventory costs in India fluctuate frequently due to inflation, seasonal shifts, or supplier changes. When a merchant purchases new stock of a product at a higher wholesale price (e.g., buying mustard oil at ₹160/L instead of ₹110/L), joining against `products.purchase_price` retroactively inflates the cost of sales made weeks earlier. In small test stores, this caused net profits to collapse into unrealistic negative values (e.g., `-₹10,368`).

### The Solution: Immutable Cost Snapshots
KiranaTrack captures the wholesale purchase price **at the exact moment each sale is rung up**:

1. **RPC Level Capture (`create_sale`)**:
   During the atomic transaction, the server reads the current `purchase_price` of each item and embeds it directly into the JSONB item record as `cost_at_sale`:
   ```json
   {
     "product_id": "8b0821b0-2b1d-4072-a0e2-6bf67117de2e",
     "name": "Tata Salt",
     "quantity": 2,
     "selling_price": 28,
     "cost_at_sale": 20,
     "gst_percent": 5
   }
   ```

2. **Report Computation (`get_report_summary`)**:
   The report aggregation function calculates COGS by parsing the immutable snapshot:
   ```sql
   COALESCE(
     SUM(
       (item->>'quantity')::numeric * 
       COALESCE((item->>'cost_at_sale')::numeric, p.purchase_price)
     ),
     0
   )
   ```
   For legacy sales created before the migration, the query falls back gracefully to `p.purchase_price`.

3. **Result**:
   Historical profit margins remain completely immutable and mathematically accurate, regardless of future wholesale price changes.

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build & Bundler** | [Vite 8](https://vitejs.dev/) + [Rolldown](https://rolldown.rs/) |
| **Styling & Icons** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) |
| **Server State** | [TanStack Query v5](https://tanstack.com/query) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15, RLS, PL/pgSQL RPCs) |
| **Charts** | [Recharts 3](https://recharts.org/) |
| **PWA Engine** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Service Worker + CacheFirst) |
| **Date & Formatting** | [date-fns](https://date-fns.org/) + `Intl.NumberFormat('en-IN')` |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm 9+ or pnpm

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-repo/kiranatrack.git
cd kiranatrack
npm install --legacy-peer-deps
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> *Note: If no Supabase credentials are provided, KiranaTrack gracefully operates using local caching for immediate offline preview and evaluation.*

### 3. Database Migrations (Supabase)
Run the SQL migration scripts in sequence in the Supabase SQL Editor:
1. `supabase/migrations/20260916000000_create_sales_rpc.sql` — Products, Customers, Sales tables & `create_sale` RPC.
2. `supabase/migrations/20260916000001_create_suppliers_purchases_schema.sql` — Suppliers, Purchases & `create_purchase` RPC.
3. `supabase/migrations/20260916000002_create_expenses_reports_schema.sql` — Expenses, Reports & `get_report_summary` RPC.
4. `supabase/migrations/20260916000003_fix_cogs_cost_at_sale.sql` — Cost-at-sale snapshot migration.
5. `supabase/migrations/20260916000004_create_profiles_schema.sql` — Store settings & profile configuration.

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📦 Production Build & Vercel Deployment

### Build
```bash
npm run build
```
This runs TypeScript checking (`tsc -b`) and bundles production assets into `dist/` alongside the service worker (`sw.js`).

### Vercel Deployment
KiranaTrack includes a preconfigured `vercel.json` for single-page application routing:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Deploy via the Vercel CLI:
```bash
vercel
```
Or link your repository directly to [Vercel](https://vercel.com/) with build command `npm run build` and output directory `dist`.

---

## 📱 PWA Installation
1. Open KiranaTrack in Chrome, Edge, or Safari on desktop or mobile.
2. Click the **"Install App"** prompt in the topbar or select **"Add to Home Screen"** in browser settings.
3. KiranaTrack runs standalone with its custom icon, offline application shell, and instant load times.

---

## 📄 License
MIT © 2026 KiranaTrack
