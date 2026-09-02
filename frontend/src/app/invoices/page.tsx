'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInvoices, getClients, deleteInvoice } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name?: string;
  issue_date: string;
  due_date: string;
  status: string;
  total: number;
}

interface Client {
  id: number;
  name: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    client_id: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadInvoices();
    }
  }, [filters]);

  const loadData = async () => {
    try {
      const [invoicesData, clientsData] = await Promise.all([
        getInvoices(),
        getClients(),
      ]);
      setInvoices(invoicesData);
      setClients(clientsData);
      setLoading(false);
    } catch (error) {
      toast.error('Please log in');
      router.push('/login');
    }
  };

  const loadInvoices = async () => {
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.client_id) params.client_id = filters.client_id;
      if (filters.search) params.search = filters.search;
      const data = await getInvoices(params);
      setInvoices(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load invoices');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted');
      loadInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete invoice');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
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
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6 border-b last:border-0">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-lg sm:text-xl font-semibold">
            BillFlow
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base"
          >
            + New Invoice
          </Link>
        </div>

        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client</label>
              <select
                value={filters.client_id}
                onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Invoice number or client..."
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">📄</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {filters.status || filters.client_id || filters.search
                ? 'No invoices match your filters'
                : 'No invoices yet'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {filters.status || filters.client_id || filters.search
                ? 'Try adjusting your filters to see more results'
                : 'Create your first invoice to get started'}
            </p>
            {!filters.status && !filters.client_id && !filters.search && (
              <Link
                href="/invoices/new"
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Create First Invoice
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="sm:hidden space-y-4">
              {invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="block bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{invoice.invoice_number}</div>
                      <div className="text-sm text-gray-600">{invoice.client_name}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>Due: {formatDate(invoice.due_date)}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(invoice.id);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </Link>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block bg-white rounded-lg border overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr className="text-left">
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Number</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Client</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Issue Date</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Due Date</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Status</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700 text-right">Amount</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline text-blue-600">
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{invoice.client_name}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(invoice.issue_date)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(invoice.due_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(invoice.total)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-sm px-3 py-1 hover:bg-red-50 text-red-600 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
