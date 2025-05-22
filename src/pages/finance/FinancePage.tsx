import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
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

interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  recentTransactions: {
    id: string;
    date: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
  }[];
  monthlyData: {
    revenue: number[];
    expenses: number[];
  };
}

const FinancePage = () => {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    recentTransactions: [],
    monthlyData: {
      revenue: [],
      expenses: [],
    },
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
    const fetchFinanceData = async () => {
      if (!businessId) return;

      setIsLoading(true);
      try {
        // Fetch total revenue from sales
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('business_id', businessId);

        if (salesError) throw salesError;

        const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

        // Fetch total expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('business_id', businessId);

        if (expensesError) throw expensesError;

        const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

        // Fetch recent transactions
        const recentTransactions = [];

        // Recent sales
        const { data: recentSales, error: recentSalesError } = await supabase
          .from('sales')
          .select('id, sale_date, total_amount')
          .eq('business_id', businessId)
          .order('sale_date', { ascending: false })
          .limit(5);

        if (recentSalesError) throw recentSalesError;

        recentTransactions.push(
          ...(recentSales?.map(sale => ({
            id: sale.id,
            date: sale.sale_date,
            type: 'income' as const,
            amount: sale.total_amount,
            description: 'Sale',
          })) || [])
        );

        // Recent expenses
        const { data: recentExpenses, error: recentExpensesError } = await supabase
          .from('expenses')
          .select('id, expense_date, amount, category')
          .eq('business_id', businessId)
          .order('expense_date', { ascending: false })
          .limit(5);

        if (recentExpensesError) throw recentExpensesError;

        recentTransactions.push(
          ...(recentExpenses?.map(expense => ({
            id: expense.id,
            date: expense.expense_date,
            type: 'expense' as const,
            amount: expense.amount,
            description: expense.category,
          })) || [])
        );

        // Sort transactions by date
        recentTransactions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Calculate monthly data (last 6 months)
        const monthlyRevenue = Array(6).fill(0);
        const monthlyExpenses = Array(6).fill(0);

        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        // Monthly sales
        const { data: monthlySales, error: monthlySalesError } = await supabase
          .from('sales')
          .select('sale_date, total_amount')
          .eq('business_id', businessId)
          .gte('sale_date', sixMonthsAgo.toISOString())
          .lte('sale_date', now.toISOString());

        if (monthlySalesError) throw monthlySalesError;

        monthlySales?.forEach(sale => {
          const date = new Date(sale.sale_date);
          const monthIndex = date.getMonth();
          const monthsAgo = now.getMonth() - monthIndex;
          if (monthsAgo >= 0 && monthsAgo < 6) {
            monthlyRevenue[5 - monthsAgo] += sale.total_amount;
          }
        });

        // Monthly expenses
        const { data: monthlyExpensesData, error: monthlyExpensesError } = await supabase
          .from('expenses')
          .select('expense_date, amount')
          .eq('business_id', businessId)
          .gte('expense_date', sixMonthsAgo.toISOString())
          .lte('expense_date', now.toISOString());

        if (monthlyExpensesError) throw monthlyExpensesError;

        monthlyExpensesData?.forEach(expense => {
          const date = new Date(expense.expense_date);
          const monthIndex = date.getMonth();
          const monthsAgo = now.getMonth() - monthIndex;
          if (monthsAgo >= 0 && monthsAgo < 6) {
            monthlyExpenses[5 - monthsAgo] += expense.amount;
          }
        });

        setStats({
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          recentTransactions: recentTransactions.slice(0, 5),
          monthlyData: {
            revenue: monthlyRevenue,
            expenses: monthlyExpenses,
          },
        });
      } catch (error) {
        console.error('Error fetching finance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinanceData();
  }, [businessId]);

  const chartData = {
    labels: Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return format(d, 'MMM yyyy');
    }),
    datasets: [
      {
        label: 'Revenue',
        data: stats.monthlyData.revenue,
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: stats.monthlyData.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Revenue vs Expenses',
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
        <h1 className="text-2xl font-bold text-gray-900">Finance Overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      ${stats.totalRevenue.toFixed(2)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpRight className="self-center flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                      <span className="sr-only">Increased by</span>
                      12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Expenses
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      ${stats.totalExpenses.toFixed(2)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <ArrowDownRight className="self-center flex-shrink-0 h-5 w-5 text-red-500" aria-hidden="true" />
                      <span className="sr-only">Decreased by</span>
                      8%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Net Income
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      ${stats.netIncome.toFixed(2)}
                    </div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.netIncome >= 0 ? (
                        <ArrowUpRight className="self-center flex-shrink-0 h-5 w-5" aria-hidden="true" />
                      ) : (
                        <ArrowDownRight className="self-center flex-shrink-0 h-5 w-5" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {stats.netIncome >= 0 ? 'Increased by' : 'Decreased by'}
                      </span>
                      10%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Financial Overview
              </h3>
            </div>
            <div className="pt-5">
              <Bar data={chartData} options={chartOptions} height={300} />
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Transactions
              </h3>
            </div>
            <div className="flow-root mt-5">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats.recentTransactions.map((transaction) => (
                  <li key={transaction.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'income' ? (
                            <CreditCard className={`h-6 w-6 text-green-600`} />
                          ) : (
                            <Wallet className={`h-6 w-6 text-red-600`} />
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;