import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">BillFlow</h1>
        <p className="text-gray-600 mb-8">Simple invoicing for freelancers</p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-indigo-600 text-white py-2 rounded-lg text-center font-semibold hover:bg-indigo-700"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block w-full bg-gray-200 text-gray-900 py-2 rounded-lg text-center font-semibold hover:bg-gray-300"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
