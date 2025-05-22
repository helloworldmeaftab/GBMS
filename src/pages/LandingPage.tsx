import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowRight,
  Users,
  Building2,
  Package,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [isEmployeeLogin, setIsEmployeeLogin] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('auth_user_id, email')
        .eq('employee_id', employeeId)
        .single();

      if (employeeError || !employee) {
        setError('Invalid employee ID');
        return;
      }

      const { user, error: authError } = await signIn(employee.email, password);
      
      if (authError) {
        setError('Invalid credentials');
        return;
      }

      if (user) {
        // Update last login
        await supabase
          .from('employee_auth')
          .update({ last_login: new Date().toISOString() })
          .eq('employee_id', employee.id);

        navigate('/dashboard');
      }
    } catch (error) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white">
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <LayoutDashboard className="h-8 w-8 text-teal-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  BMS
                </span>
              </div>
              <div>
                {user ? (
                  <Link to="/dashboard" className="inline-flex items-center px-6 py-3 rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition font-medium shadow">
                    Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsEmployeeLogin(!isEmployeeLogin)}
                    className="inline-flex items-center px-6 py-3 rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition font-medium shadow"
                  >
                    {isEmployeeLogin ? 'Admin Login' : 'Employee Login'}
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="py-16 sm:py-24">
            {isEmployeeLogin ? (
              <div className="max-w-md mx-auto">
                <h2 className="text-3xl font-bold text-center mb-8">Employee Login</h2>
                <form onSubmit={handleEmployeeLogin} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      id="employeeId"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                      placeholder="BRANCH-EMP001"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    Sign In
                  </button>
                </form>
              </div>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight text-center">
                  <span className="block">Business Management</span>
                  <span className="block text-teal-600">Simplified & Scalable</span>
                </h1>
                <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-500 text-center">
                  Run your business efficiently with a centralized platform for
                  people, products, and processes.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/login" className="inline-flex items-center px-6 py-3 rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition font-medium shadow">
                    Admin Login
                  </Link>
                  <Link to="/setup" className="inline-flex items-center px-6 py-3 rounded-xl bg-teal-100 text-teal-700 hover:bg-teal-200 transition font-medium shadow">
                    Setup New System
                  </Link>
                </div>
              </>
            )}
          </main>

          {/* Features */}
          <section className="py-20 bg-white border-t border-gray-200">
            <div className="text-center mb-12">
              <h2 className="text-base text-teal-600 font-semibold tracking-wide uppercase">
                Platform Features
              </h2>
              <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
                Tools to streamline your operations
              </p>
              <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
                Every module is designed to simplify management and grow with
                your organization.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                {
                  icon: <Users className="h-6 w-6" />,
                  title: 'Employee Management',
                  desc: 'Track employee records, assign roles, and review performance metrics effortlessly.',
                },
                {
                  icon: <Building2 className="h-6 w-6" />,
                  title: 'Branch Management',
                  desc: 'Manage multiple locations, track performance, and coordinate operations seamlessly.',
                },
                {
                  icon: <Package className="h-6 w-6" />,
                  title: 'Inventory Control',
                  desc: 'Monitor stock levels, track movements, and optimize your inventory across branches.',
                },
                {
                  icon: <FileText className="h-6 w-6" />,
                  title: 'Sales & Invoicing',
                  desc: 'Generate invoices, process sales, and maintain detailed transaction records.',
                },
                {
                  icon: <Settings className="h-6 w-6" />,
                  title: 'Role-Based Access',
                  desc: 'Control system access with customizable roles and permissions for security.',
                },
                {
                  icon: <BarChart3 className="h-6 w-6" />,
                  title: 'Analytics & Reports',
                  desc: 'Get insights with detailed reports and analytics across all business aspects.',
                },
              ].map((feature, i) => (
                <div key={i} className="relative pl-16">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-md bg-teal-500 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600 gap-4">
          <div>
            &copy; {new Date().getFullYear()} BMS System. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-gray-800">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gray-800">
              Terms
            </Link>
            <Link to="/changelog" className="hover:text-gray-800">
              v1.0.0
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;