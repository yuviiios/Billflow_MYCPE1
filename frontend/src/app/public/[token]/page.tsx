'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPublicInvoice, payInvoice } from '@/lib/api';

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

export default function PublicInvoicePage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [params.token]);

  const loadInvoice = async () => {
    try {
      const data = await getPublicInvoice(params.token as string);
      setInvoice(data);
      setLoading(false);
    } catch (error) {
      setError(true);
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePay = async () => {
    if (!invoice) return;
    if (!confirm('Proceed with payment?')) return;
    try {
      const updated = await payInvoice(params.token as string);
      setInvoice(updated);
      alert('Payment successful!');
    } catch (error) {
      alert('Payment failed. Please try again.');
      console.error('Payment error:', error);
    }
  };

  const handleDownload = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.open(`${apiUrl}/invoices/public/${params.token}/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">This invoice link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const canPay = invoice.status === 'sent' || invoice.status === 'overdue';

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white print:bg-white">
        <div className="no-print bg-white border-b border-gray-200 py-4">
          <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
            <div className="text-xl font-semibold text-gray-900">BillFlow</div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Print
              </button>
              {canPay && (
                <button
                  onClick={handlePay}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="print-container max-w-4xl mx-auto px-6 py-12 print:py-0">
          <div className="bg-white border border-gray-200 rounded-lg print:border-0 print:shadow-none p-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <div className="text-lg text-gray-600">{invoice.invoice_number}</div>
              </div>
              {isPaid && (
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold text-sm">
                  ✓ PAID
                </div>
              )}
            </div>

            {/* Dates and Client Info */}
            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Bill To
                </h3>
                <div className="text-base">
                  <div className="font-semibold text-gray-900">{invoice.client_name}</div>
                  <div className="text-gray-600 mt-1">{invoice.client_email}</div>
                  {invoice.client_address && (
                    <div className="text-gray-600 mt-2 whitespace-pre-line">
                      {invoice.client_address}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-3 text-base">
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Issue Date
                    </div>
                    <div className="font-medium text-gray-900">{formatDate(invoice.issue_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Due Date
                    </div>
                    <div className="font-medium text-gray-900">{formatDate(invoice.due_date)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <table className="w-full">
                <thead className="border-b-2 border-gray-900">
                  <tr className="text-left text-sm">
                    <th className="pb-3 font-semibold text-gray-900">Description</th>
                    <th className="pb-3 font-semibold text-gray-900 text-right w-20">Qty</th>
                    <th className="pb-3 font-semibold text-gray-900 text-right w-32">Rate</th>
                    <th className="pb-3 font-semibold text-gray-900 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4 text-gray-900">{item.description}</td>
                      <td className="py-4 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                      <td className="py-4 text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-80">
                <div className="space-y-3 text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t-2 border-gray-900">
                    <span className="font-bold text-gray-900 text-lg">Total</span>
                    <span className="font-bold text-gray-900 text-2xl">
                      {formatCurrency(invoice.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="pt-8 border-t">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Notes
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
