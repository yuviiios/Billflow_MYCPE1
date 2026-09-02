'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { getMe, logout, getDashboardStats } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  earned: number;
  outstanding: number;
  overdue: number;
  client_count: number;
  recent_invoices: Array<{
    id: number;
    invoice_number: string;
    client_name: string;
    total: number;
    status: string;
    issue_date: string;
  }>;
  monthly_income: Array<{
    month: string;
    total: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, statsData] = await Promise.all([getMe(), getDashboardStats()]);
        setUser(userData);
        setStats(statsData);
      } catch (error) {
        toast.error('Please log in');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, setUser]);

  const handleLogout = () => {
    logout();
    useAuthStore.setState({ user: null, token: null });
    router.push('/');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">BillFlow</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Dashboard</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Earned</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(stats.earned)}</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Outstanding</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(stats.outstanding)}</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Overdue</div>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Clients</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.client_count}</div>
          </div>
        </div>

        {/* Income Chart */}
        {stats.monthly_income.length > 0 ? (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Monthly Income (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.monthly_income}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-white p-8 sm:p-12 rounded-lg shadow mb-6 sm:mb-8 text-center">
            <div className="text-4xl sm:text-6xl mb-4">📊</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No income data yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Create and send invoices to see your income chart</p>
            <Link
              href="/invoices/new"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
            >
              Create Invoice
            </Link>
          </div>
        )}

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Invoices</h3>
            <Link href="/invoices" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </Link>
          </div>

          {stats.recent_invoices.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {stats.recent_invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {invoice.invoice_number}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{invoice.client_name}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="text-sm sm:text-base font-semibold text-gray-900">
                        {formatCurrency(invoice.total)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-4xl sm:text-6xl mb-4">📄</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">Get started by creating your first invoice</p>
              <Link
                href="/invoices/new"
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Create Invoice
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <Link
            href="/clients"
            className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Clients</h3>
            <p className="text-sm sm:text-base text-gray-600">Manage your clients</p>
          </Link>

          <Link
            href="/invoices"
            className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Invoices</h3>
            <p className="text-sm sm:text-base text-gray-600">View and create invoices</p>
          </Link>

          <Link
            href="/settings"
            className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Settings</h3>
            <p className="text-sm sm:text-base text-gray-600">Configure your account</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
