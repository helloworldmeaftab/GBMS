import { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage'));
const EmployeeFormPage = lazy(() => import('./pages/employees/EmployeeFormPage'));
const ClientsPage = lazy(() => import('./pages/clients/ClientsPage'));
const ClientFormPage = lazy(() => import('./pages/clients/ClientFormPage'));
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'));
const ProductFormPage = lazy(() => import('./pages/products/ProductFormPage'));
const InventoryDashboard = lazy(() => import('./pages/products/inventery'));
const InvoicesPage = lazy(() => import('./pages/invoices/InvoicesPage'));
const InvoiceFormPage = lazy(() => import('./pages/invoices/InvoiceFormPage'));
const InvoiceViewPage = lazy(() => import('./pages/invoices/InvoiceViewPage'));
const BranchesPage = lazy(() => import('./pages/branches/BranchesPage'));
const BranchFormPage = lazy(() => import('./pages/branches/BranchFormPage'));
const FinancePage = lazy(() => import('./pages/finance/FinancePage'));
const PermissionsPage = lazy(() => import('./pages/permissions/PermissionsPage'));
const SalesPage = lazy(() => import('./pages/sales/SalesPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
  </div>
);

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeesPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/employees/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeeFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/employees/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <EmployeeFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <Layout>
                    <ClientsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/clients/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <ClientFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/clients/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <ClientFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/products"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProductsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/products/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProductFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/products/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProductFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <PrivateRoute>
                  <Layout>
                    <InventoryDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <PrivateRoute>
                  <Layout>
                    <InvoicesPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/invoices/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <InvoiceFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/invoices/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <InvoiceViewPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/branches"
              element={
                <PrivateRoute>
                  <Layout>
                    <BranchesPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/branches/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <BranchFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/branches/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <BranchFormPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/finance"
              element={
                <PrivateRoute>
                  <Layout>
                    <FinancePage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/permissions"
              element={
                <PrivateRoute>
                  <Layout>
                    <PermissionsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/sales"
              element={
                <PrivateRoute>
                  <Layout>
                    <SalesPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Layout>
                    <ReportsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;