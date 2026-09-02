'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, createInvoice } from '@/lib/api';
import Link from 'next/link';

interface Client {
  id: number;
  name: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_number: `INV-${Date.now()}`,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);

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

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : updated[index].quantity;
      const price = field === 'unit_price' ? Number(value) : updated[index].unit_price;
      updated[index].amount = qty * price;
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id) {
      alert('Select a client');
      return;
    }

    if (lineItems.some(item => !item.description)) {
      alert('All line items need descriptions');
      return;
    }

    setSubmitting(true);
    try {
      await createInvoice({
        client_id: Number(formData.client_id),
        invoice_number: formData.invoice_number,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        notes: formData.notes,
        line_items: lineItems,
      });
      router.push('/invoices');
    } catch (error) {
      console.error('Failed to create invoice', error);
      alert('Failed to create invoice');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const total = calculateTotal();

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-xl font-semibold">BillFlow</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/invoices" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to invoices
          </Link>
          <h1 className="text-3xl font-bold mt-2">New Invoice</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
              >
                + Add Line
              </button>
            </div>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-red-600 text-sm hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t flex justify-end">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold">${total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Payment terms, additional info..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
            <Link
              href="/invoices"
              className="px-6 py-2 border rounded hover:bg-gray-50 inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
