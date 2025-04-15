// pages/sales-forecast.js
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '../public/logo.png';
import SalesForecastDashboard from '../components/SalesForecastDashboard';
import ProtectedRoute from '../components/ProtectedRoute';

function SalesForecastContent() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
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
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Inventory
              </Link>
              <Link
                href="/performance"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Performance
              </Link>
              <Link
                href="/sales-forecast"
                className="px-4 py-2 rounded-md text-sm font-medium bg-[#e3902b] text-white"
              >
                Sales Forecast
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <SalesForecastDashboard />
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function SalesForecastPage() {
  return (
    <ProtectedRoute pageName="performance">
      <SalesForecastContent />
    </ProtectedRoute>
  );
}