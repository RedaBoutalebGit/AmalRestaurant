// pages/index.js
import { useState, useEffect } from 'react';
import ReservationEntry from '../components/ReservationEntry';
import ReservationDashboard from '../components/ReservationDashboard';
import Notifications from '../components/Notification';
import Image from 'next/image';
import logo from '../public/logo.png';
import Link from 'next/link';

export default function Home() {
  const [view, setView] = useState('dashboard');
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    try {
      setError(null);
      const response = await fetch('/api/reservations', {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401 && data.loginUrl) {
          window.location.href = data.loginUrl;
          return;
        }
        throw new Error(data.error || 'Failed to fetch reservations');
      }

      const data = await response.json();
      setReservations(data.map(reservation => ({
        ...reservation,
        checkInStatus: reservation.checkInStatus || null
      })));
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    const intervalId = setInterval(fetchReservations, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleNewReservation = async (data) => {
    await fetchReservations();
    setView('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reservations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchReservations();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (<div className="min-h-screen bg-gray-100">
    <Notifications reservations={reservations} />
    <nav className="bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      <div className="flex items-center space-x-3">
        <Image src={logo} alt="Restaurant Logo" width={100} height={100} />
      </div>
      <div className="flex items-center space-x-4">
        <Link
          href="/"
          className="px-4 py-2 rounded-md text-sm font-medium bg-[#e3902b] text-white"
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
          href="/recipe-calculator"
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
        >
          Recipe Calculator
        </Link>
        <button
          onClick={() => setView('entry')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            view === 'entry'
              ? 'bg-[#e3902b] text-white'
              : 'text-gray-700 hover:bg-[#ffdbb0]'
          }`}
        >
          New Reservation
        </button>
      </div>
    </div>
  </div>
</nav>

    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {view === 'dashboard' ? (
        <ReservationDashboard 
          reservations={reservations} 
          onStatusUpdate={fetchReservations}
        />
      ) : (
        <ReservationEntry onSubmit={handleNewReservation} />
      )}
    </main>

    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </footer>
  </div>
  );
}
