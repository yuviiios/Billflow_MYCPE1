'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInvoices, getClients, deleteInvoice } from '@/lib/api';
import Link from 'next/link';

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
    loadInvoices();
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
    } catch (error) {
      console.error('Failed to load invoices', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      loadInvoices();
    } catch (error) {
      console.error('Failed to delete', error);
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
      case 'paid': return 'bg-green-100 text-green-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-xl font-semibold">BillFlow</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            New Invoice
          </Link>
        </div>

        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
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
                placeholder="Invoice number..."
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No invoices found. Create one to get started.
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Number</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Issue Date</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">
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
        )}
      </div>
    </main>
  );
}
