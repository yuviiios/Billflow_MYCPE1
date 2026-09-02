'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getInvoice, updateInvoice, sendInvoice } from '@/lib/api';
import Link from 'next/link';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_address?: string;
  issue_date: string;
  due_date: string;
  status: string;
  notes?: string;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  public_token: string;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const loadInvoice = async () => {
    try {
      const data = await getInvoice(Number(params.id));
      setInvoice(data);
      setLoading(false);
    } catch (error) {
      router.push('/invoices');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    try {
      await updateInvoice(invoice.id, { status: newStatus });
      setInvoice({ ...invoice, status: newStatus });
    } catch (error) {
      console.error('Failed to update status', error);
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

  const copyPublicLink = () => {
    const url = `${window.location.origin}/public/${invoice?.public_token}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard');
  };

  const handleSend = async () => {
    if (!invoice) return;
    if (!confirm('Send this invoice to the client?')) return;
    try {
      const updated = await sendInvoice(invoice.id);
      setInvoice(updated);
      alert('Invoice sent!');
    } catch (error) {
      console.error('Failed to send invoice', error);
      alert('Failed to send invoice');
    }
  };

  const handleDownload = () => {
    if (!invoice) return;
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.open(`${apiUrl}/invoices/${invoice.id}/download?token=${token}`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!invoice) {
    return <div className="min-h-screen flex items-center justify-center">Invoice not found</div>;
  }

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
          <div className="flex justify-between items-start mt-2">
            <div>
              <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
              <span className={`inline-block mt-2 px-3 py-1 rounded text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <div className="flex gap-2">
              {invoice.status === 'draft' && (
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
                >
                  Send Invoice
                </button>
              )}
              <button
                onClick={handleDownload}
                className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
              >
                Download PDF
              </button>
              <button
                onClick={copyPublicLink}
                className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
              >
                Copy Link
              </button>
              <select
                value={invoice.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black text-sm"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
              <div className="text-sm">
                <div className="font-semibold">{invoice.client_name}</div>
                <div className="text-gray-600">{invoice.client_email}</div>
                {invoice.client_address && (
                  <div className="text-gray-600 mt-1">{invoice.client_address}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-500">Issue Date:</span>{' '}
                  <span className="font-medium">{formatDate(invoice.issue_date)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Due Date:</span>{' '}
                  <span className="font-medium">{formatDate(invoice.due_date)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm">
                  <th className="pb-2 font-medium text-gray-500">Description</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Qty</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Price</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
