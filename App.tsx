import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { AppShell } from "@/components/layout/AppShell"
import { DashboardPage } from "@/pages/DashboardPage"
import { ProductsPage } from "@/pages/ProductsPage"
import { SalesPage } from "@/pages/SalesPage"
import { KhataPage } from "@/pages/KhataPage"
import { SuppliersPage } from "@/pages/SuppliersPage"
import { PurchasesPage } from "@/pages/PurchasesPage"
import { ExpensesPage } from "@/pages/ExpensesPage"
import { ReportsPage } from "@/pages/ReportsPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="inventory" element={<Navigate to="/products" replace />} />
              <Route path="billing" element={<SalesPage />} />
              <Route path="sales" element={<Navigate to="/billing" replace />} />
              <Route path="khata" element={<KhataPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="analytics" element={<Navigate to="/reports" replace />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
