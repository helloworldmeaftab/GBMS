import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  Package, 
  FileText, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  PlusCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardCounts {
  employees: number;
  clients: number;
  products: number;
  invoices: {
    total: number;
    unpaid: number;
  };
  recentInvoices: any[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState<DashboardCounts>({
    employees: 0,
    clients: 0,
    products: 0,
    invoices: {
      total: 0,
      unpaid: 0,
    },
    recentInvoices: [],
  });

  useEffect(() => {
    const fetchBusinessId = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching business ID:', error);
        return;
      }

      if (data) {
        setBusinessId(data.id);
      }
    };

    fetchBusinessId();
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!businessId) return;

      setIsLoading(true);
      try {
        // Fetch employee count
        const { count: employeeCount, error: employeeError } = await supabase
          .from('employees')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);

        if (employeeError) throw employeeError;

        // Fetch client count
        const { count: clientCount, error: clientError } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);

        if (clientError) throw clientError;

        // Fetch product count
        const { count: productCount, error: productError } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);

        if (productError) throw productError;

        // Fetch invoice counts
        const { count: invoiceTotal, error: invoiceTotalError } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);

        if (invoiceTotalError) throw invoiceTotalError;

        const { count: invoiceUnpaid, error: invoiceUnpaidError } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('status', 'unpaid');

        if (invoiceUnpaidError) throw invoiceUnpaidError;

        // Fetch recent invoices
        const { data: recentInvoices, error: recentInvoicesError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            issue_date,
            due_date,
            status,
            total_amount,
            clients (
              name
            )
          `)
          .eq('business_id', businessId)
          .order('issue_date', { ascending: false })
          .limit(5);

        if (recentInvoicesError) throw recentInvoicesError;

        setCounts({
          employees: employeeCount || 0,
          clients: clientCount || 0,
          products: productCount || 0,
          invoices: {
            total: invoiceTotal || 0,
            unpaid: invoiceUnpaid || 0,
          },
          recentInvoices: recentInvoices || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [businessId]);

  // Chart data
  const chartData = {
    labels: ['Employees', 'Clients', 'Products', 'Invoices'],
    datasets: [
      {
        label: 'Count',
        data: [counts.employees, counts.clients, counts.products, counts.invoices.total],
        backgroundColor: [
          'rgba(20, 184, 166, 0.6)',
          'rgba(56, 189, 248, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(139, 92, 246, 0.6)',
        ],
        borderColor: [
          'rgb(20, 184, 166)',
          'rgb(56, 189, 248)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Business Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Link
            to="/employees/new"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Employee
          </Link>
          <Link
            to="/clients/new"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Client
          </Link>
          <Link
            to="/invoices/new"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-teal-500 rounded-md p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Employees
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {counts.employees}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/employees"
                className="font-medium text-teal-700 hover:text-teal-900"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clients
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {counts.clients}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/clients"
                className="font-medium text-blue-700 hover:text-blue-900"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Products
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {counts.products}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/products"
                className="font-medium text-amber-700 hover:text-amber-900"
              >
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Invoices
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {counts.invoices.total}
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {counts.invoices.unpaid} unpaid
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link
                to="/invoices"
                className="font-medium text-purple-700 hover:text-purple-900"
              >
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Business Overview</h3>
            <div className="mt-4 h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Invoices</h3>
            <div className="mt-4">
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {counts.recentInvoices.length > 0 ? (
                    counts.recentInvoices.map((invoice) => (
                      <li key={invoice.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-100' : 'bg-amber-100'
                            }`}>
                              {invoice.status === 'paid' ? (
                                <DollarSign className={`h-6 w-6 text-green-600`} />
                              ) : (
                                <Calendar className={`h-6 w-6 text-amber-600`} />
                              )}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              Invoice #{invoice.invoice_number}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {invoice.clients.name}
                            </p>
                          </div>
                          <div>
                            <div className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white">
                              ${invoice.total_amount.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                          <div>
                            <Link
                              to={`/invoices/${invoice.id}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-teal-700 bg-teal-100 hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-gray-500">
                      No invoices found
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;