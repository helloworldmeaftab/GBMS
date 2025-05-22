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
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import Dashboard from './pages/Dashboard';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeFormPage from './pages/employees/EmployeeFormPage';
import ClientsPage from './pages/clients/ClientsPage';
import ClientFormPage from './pages/clients/ClientFormPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductFormPage from './pages/products/ProductFormPage';
import InventoryDashboard from './pages/products/inventery';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceFormPage from './pages/invoices/InvoiceFormPage';
import InvoiceViewPage from './pages/invoices/InvoiceViewPage';
import BranchesPage from './pages/branches/BranchesPage';
import BranchFormPage from './pages/branches/BranchFormPage';
import FinancePage from './pages/finance/FinancePage';
import PermissionsPage from './pages/permissions/PermissionsPage';
import SalesPage from './pages/sales/SalesPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
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
      </Router>
    </AuthProvider>
  );
}

export default App;