'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/api';
import Link from 'next/link';

interface Client {
  id: number;
  name: string;
  email: string;
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
      router.push('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      setFormData({ name: '', email: '', address: '', phone: '' });
      setShowForm(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error('Failed to save client', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      address: client.address || '',
      phone: client.phone || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client?')) return;
    try {
      await deleteClient(id);
      loadClients();
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', address: '', phone: '' });
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

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Clients</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Add Client
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingClient ? 'Edit Client' : 'New Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No clients yet. Add one to get started.
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b last:border-0">
                    <td className="px-6 py-4">{client.name}</td>
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
        )}
      </div>
    </main>
  );
}
