'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, updateSettings } from '@/lib/api';
import Link from 'next/link';

interface Settings {
  business_name: string;
  business_email: string;
  business_address?: string;
  business_phone?: string;
  tax_rate: number;
  currency: string;
  payment_terms?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Settings>({
    business_name: '',
    business_email: '',
    business_address: '',
    business_phone: '',
    tax_rate: 0,
    currency: 'USD',
    payment_terms: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      if (data) {
        setFormData(data);
      }
      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setLoading(false);
      } else {
        router.push('/login');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      alert('Settings saved');
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-2">Settings</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Business Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Email</label>
                <input
                  type="email"
                  required
                  value={formData.business_email}
                  onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Address</label>
                <input
                  type="text"
                  value={formData.business_address || ''}
                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Phone</label>
                <input
                  type="text"
                  value={formData.business_phone || ''}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Invoice Defaults</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                <textarea
                  value={formData.payment_terms || ''}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  rows={4}
                  placeholder="Payment due within 30 days..."
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <Link
              href="/dashboard"
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
