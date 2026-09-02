'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { getMe, logout } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        setLoading(false);
      } catch (error) {
        toast.error('Please log in');
        router.push('/login');
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    logout();
    useAuthStore.setState({ user: null, token: null });
    router.push('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-gray-900">BillFlow</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Welcome to your dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/clients"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Clients</h3>
            <p className="text-gray-600">Manage your clients</p>
          </Link>

          <Link
            href="/invoices"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Invoices</h3>
            <p className="text-gray-600">View and create invoices</p>
          </Link>

          <Link
            href="/settings"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">Configure your account</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
