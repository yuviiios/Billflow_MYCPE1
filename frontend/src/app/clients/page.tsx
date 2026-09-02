'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';

interface Client {
  id: number;
  name: string;
  email: string;
  company?: string;
  address?: string;
  phone?: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
      setLoading(false);
    } catch (error) {
      toast.error('Please log in');
      router.push('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        toast.success('Client updated');
      } else {
        await createClient(formData);
        toast.success('Client created');
      }
      setFormData({ name: '', email: '', company: '', address: '', phone: '' });
      setShowForm(false);
      setEditingClient(null);
      loadClients();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save client');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company || '',
      address: client.address || '',
      phone: client.phone || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      await deleteClient(id);
      toast.success('Client deleted');
      loadClients();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete client');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', company: '', address: '', phone: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
              BillFlow
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/clients" className="text-sm font-medium text-gray-900">
                Clients
              </Link>
              <Link href="/invoices" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Invoices
              </Link>
              <Link href="/settings" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Clients</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Client
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {editingClient ? 'Edit Client' : 'New Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingClient ? 'Update Client' : 'Save Client'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients yet</h3>
            <p className="text-base text-gray-600 mb-6">Add your first client to start creating invoices</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add First Client
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Mobile: Cards */}
            <div className="sm:hidden divide-y divide-gray-200">
              {clients.map((client) => (
                <div key={client.id} className="p-4">
                  <div className="font-medium text-gray-900 mb-1">{client.name}</div>
                  {client.company && <div className="text-sm text-gray-600 mb-1">{client.company}</div>}
                  <div className="text-sm text-gray-600 mb-2">{client.email}</div>
                  {client.phone && <div className="text-sm text-gray-600 mb-2">{client.phone}</div>}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-sm px-3 py-1 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-sm px-3 py-1 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-medium text-sm text-gray-900">Name</th>
                    <th className="px-6 py-4 font-medium text-sm text-gray-900">Company</th>
                    <th className="px-6 py-4 font-medium text-sm text-gray-900">Email</th>
                    <th className="px-6 py-4 font-medium text-sm text-gray-900">Phone</th>
                    <th className="px-6 py-4 font-medium text-sm text-gray-900"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 text-gray-600">{client.company || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{client.email}</td>
                      <td className="px-6 py-4 text-gray-600">{client.phone || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-sm px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg mr-2 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
