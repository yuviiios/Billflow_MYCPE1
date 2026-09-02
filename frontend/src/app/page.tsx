import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-semibold text-gray-900 mb-4">BillFlow</h1>
        <p className="text-lg text-gray-600 mb-12">Simple invoicing for freelancers</p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-indigo-600 text-white py-2.5 rounded-lg text-center text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="block w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-center text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
