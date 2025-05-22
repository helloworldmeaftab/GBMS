import { useState, useEffect } from 'react';
import { 
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportData {
  salesTrends: {
    labels: string[];
    data: number[];
  };
  topProducts: {
    labels: string[];
    data: number[];
  };
  revenueByBranch: {
    labels: string[];
    data: number[];
  };
  employeePerformance: {
    labels: string[];
    data: number[];
  };
}

const ReportsPage = () => {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [reportData, setReportData] = useState<ReportData>({
    salesTrends: { labels: [], data: [] },
    topProducts: { labels: [], data: [] },
    revenueByBranch: { labels: [], data: [] },
    employeePerformance: { labels: [], data: [] },
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
    const fetchReportData = async () => {
      if (!businessId) return;

      setIsLoading(true);
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, parseInt(dateRange));

        // Fetch sales trends
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('sale_date, total_amount')
          .eq('business_id', businessId)
          .gte('sale_date', startDate.toISOString())
          .lte('sale_date', endDate.toISOString())
          .order('sale_date');

        if (salesError) throw salesError;

        const salesByDate = salesData?.reduce((acc: { [key: string]: number }, sale) => {
          const date = format(new Date(sale.sale_date), 'MMM dd');
          acc[date] = (acc[date] || 0) + sale.total_amount;
          return acc;
        }, {}) || {};

        // Fetch top products
        const { data: productsData, error: productsError } = await supabase
          .from('invoice_items')
          .select(`
            quantity,
            price,
            products (
              name
            )
          `)
          .eq('business_id', businessId)
          .order('quantity', { ascending: false })
          .limit(5);

        if (productsError) throw productsError;

        const productSales = productsData?.reduce((acc: { [key: string]: number }, item) => {
          const productName = item.products?.name || 'Unknown';
          acc[productName] = (acc[productName] || 0) + (item.quantity * item.price);
          return acc;
        }, {}) || {};

        // Fetch revenue by branch
        const { data: branchData, error: branchError } = await supabase
          .from('sales')
          .select(`
            total_amount,
            branches (
              name
            )
          `)
          .eq('business_id', businessId);

        if (branchError) throw branchError;

        const branchRevenue = branchData?.reduce((acc: { [key: string]: number }, sale) => {
          const branchName = sale.branches?.name || 'Unknown';
          acc[branchName] = (acc[branchName] || 0) + sale.total_amount;
          return acc;
        }, {}) || {};

        // Fetch employee performance
        const { data: employeeData, error: employeeError } = await supabase
          .from('sales')
          .select(`
            total_amount,
            employees (
              name
            )
          `)
          .eq('business_id', businessId);

        if (employeeError) throw employeeError;

        const employeePerformance = employeeData?.reduce((acc: { [key: string]: number }, sale) => {
          const employeeName = sale.employees?.name || 'Unknown';
          acc[employeeName] = (acc[employeeName] || 0) + sale.total_amount;
          return acc;
        }, {}) || {};

        setReportData({
          salesTrends: {
            labels: Object.keys(salesByDate),
            data: Object.values(salesByDate),
          },
          topProducts: {
            labels: Object.keys(productSales),
            data: Object.values(productSales),
          },
          revenueByBranch: {
            labels: Object.keys(branchRevenue),
            data: Object.values(branchRevenue),
          },
          employeePerformance: {
            labels: Object.keys(employeePerformance),
            data: Object.values(employeePerformance),
          },
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [businessId, dateRange]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Business Performance Report', 20, 20);
    
    // Date Range
    doc.setFontSize(12);
    doc.text(`Date Range: Last ${dateRange} days`, 20, 30);
    
    // Sales Summary
    doc.setFontSize(16);
    doc.text('Sales Summary', 20, 50);
    doc.setFontSize(12);
    const totalSales = reportData.salesTrends.data.reduce((a, b) => a + b, 0);
    doc.text(`Total Sales: $${totalSales.toFixed(2)}`, 20, 60);
    
    // Top Products
    doc.text('Top Products', 20, 80);
    reportData.topProducts.labels.forEach((label, index) => {
      doc.text(
        `${label}: $${reportData.topProducts.data[index].toFixed(2)}`,
        20,
        90 + (index * 10)
      );
    });
    
    // Revenue by Branch
    doc.text('Revenue by Branch', 20, 150);
    reportData.revenueByBranch.labels.forEach((label, index) => {
      doc.text(
        `${label}: $${reportData.revenueByBranch.data[index].toFixed(2)}`,
        20,
        160 + (index * 10)
      );
    });
    
    // Employee Performance
    doc.text('Employee Performance', 20, 220);
    reportData.employeePerformance.labels.forEach((label, index) => {
      doc.text(
        `${label}: $${reportData.employeePerformance.data[index].toFixed(2)}`,
        20,
        230 + (index * 10)
      );
    });
    
    // Save the PDF
    doc.save('business-report.pdf');
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `$${value.toFixed(2)}`,
        },
      },
    },
  };

  const salesTrendsData = {
    labels: reportData.salesTrends.labels,
    datasets: [
      {
        label: 'Sales',
        data: reportData.salesTrends.data,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const topProductsData = {
    labels: reportData.topProducts.labels,
    datasets: [
      {
        label: 'Revenue',
        data: reportData.topProducts.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const revenueByBranchData = {
    labels: reportData.revenueByBranch.labels,
    datasets: [
      {
        label: 'Revenue by Branch',
        data: reportData.revenueByBranch.data,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };

  const employeePerformanceData = {
    labels: reportData.employeePerformance.labels,
    datasets: [
      {
        label: 'Sales Performance',
        data: reportData.employeePerformance.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
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
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Sales Trends */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <LineChart className="h-6 w-6 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">
                Sales Trends
              </h3>
            </div>
            <div className="mt-4" style={{ height: '300px' }}>
              <Line data={salesTrendsData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <BarChart className="h-6 w-6 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">
                Top Products
              </h3>
            </div>
            <div className="mt-4" style={{ height: '300px' }}>
              <Bar data={topProductsData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Revenue by Branch */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <PieChart className="h-6 w-6 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">
                Revenue by Branch
              </h3>
            </div>
            <div className="mt-4" style={{ height: '300px' }}>
              <Pie data={revenueByBranchData} />
            </div>
          </div>
        </div>

        {/* Employee Performance */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">
                Employee Performance
              </h3>
            </div>
            <div className="mt-4" style={{ height: '300px' }}>
              <Bar data={employeePerformanceData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;