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
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base"
            >
              + Add Client
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              {editingClient ? 'Edit Client' : 'New Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base"
                >
                  {editingClient ? 'Update Client' : 'Save Client'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">👥</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No clients yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Add your first client to start creating invoices</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Add First Client
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Mobile: Cards */}
            <div className="sm:hidden divide-y">
              {clients.map((client) => (
                <div key={client.id} className="p-4">
                  <div className="font-semibold text-gray-900 mb-1">{client.name}</div>
                  {client.company && <div className="text-sm text-gray-600 mb-1">{client.company}</div>}
                  <div className="text-sm text-gray-600 mb-2">{client.email}</div>
                  {client.phone && <div className="text-sm text-gray-600 mb-2">{client.phone}</div>}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-sm px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
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
                <thead className="border-b bg-gray-50">
                  <tr className="text-left">
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Name</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Company</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Email</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700">Phone</th>
                    <th className="px-6 py-3 font-medium text-sm text-gray-700"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">{client.name}</td>
                      <td className="px-6 py-4 text-gray-600">{client.company || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{client.email}</td>
                      <td className="px-6 py-4 text-gray-600">{client.phone || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-sm px-3 py-1 hover:bg-gray-100 rounded mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
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
          </div>
        )}
      </div>
    </main>
  );
}
