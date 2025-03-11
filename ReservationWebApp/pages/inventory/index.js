// pages/inventory/index.js
import InventoryDashboard from '../../components/InventoryDashboard';
import Image from 'next/image';
import logo from '../../public/logo.png';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';

function InventoryContent() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src={logo} alt="Restaurant Logo" width={100} height={100} />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Reservations
              </Link>
              <Link
                href="/inventory"
                className="px-4 py-2 rounded-md text-sm font-medium bg-[#e3902b] text-white"
              >
                Inventory
              </Link>
              <Link
                href="/performance"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Performance
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <InventoryDashboard />
      </main>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute pageName="inventory">
      <InventoryContent />
    </ProtectedRoute>
  );
}