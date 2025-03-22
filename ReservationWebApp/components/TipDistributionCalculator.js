// components/TipDistributionCalculator.js
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '../public/logo.png';

const TipDistributionCalculator = () => {
  // Default staff configurations
  const defaultRoles = [
    { id: 1, role: 'Server', count: 3, hours: 192, tipsReceived: false },
    { id: 2, role: 'Chef', count: 11, hours: 192, tipsReceived: false },
    { id: 3, role: 'Khawla', count: 1, hours: 128, tipsReceived: false },
    { id: 4, role: 'Trainee', count: 9, hours: 96, tipsReceived: false },
    { id: 5, role: 'Zelzal', count: 4, hours: 32, tipsReceived: false },
    { id: 6, role: 'Abdellatif', count: 1, hours: 192, tipsReceived: false },
    { id: 7, role: 'Hicham', count: 1, hours: 32, tipsReceived: false },
  ];

  // State variables
  const [roles, setRoles] = useState(defaultRoles);
  const [totalTips, setTotalTips] = useState(1000);
  const [distributions, setDistributions] = useState([]);
  const [historyEntries, setHistoryEntries] = useState([]);

  // Calculate distributions whenever roles or totalTips change
  useEffect(() => {
    calculateDistribution();
  }, [roles, totalTips]);

  // Calculate the distribution based on hours worked
  const calculateDistribution = () => {
    // Distribution based on hours worked
    const totalHoursWeighted = roles.reduce(
      (total, role) => total + role.hours * role.count,
      0
    );

    const newDistributions = roles.map(role => {
      const roleHours = role.hours * role.count;
      const roleTotal = (roleHours / totalHoursWeighted) * totalTips;
      const perPerson = role.count > 0 ? roleTotal / role.count : 0;

      return {
        id: role.id,
        role: role.role,
        hours: role.hours,
        count: role.count,
        totalHours: roleHours,
        totalAmount: roleTotal.toFixed(2),
        perPerson: perPerson.toFixed(2),
        tipsReceived: role.tipsReceived
      };
    });
    setDistributions(newDistributions);
  };

  // Handle count change for a role
  const handleCountChange = (id, value) => {
    const updatedRoles = roles.map(role =>
      role.id === id ? { ...role, count: Number(value) } : role
    );
    setRoles(updatedRoles);
  };

  // Handle hours change for a role
  const handleHoursChange = (id, value) => {
    const updatedRoles = roles.map(role =>
      role.id === id ? { ...role, hours: Number(value) } : role
    );
    setRoles(updatedRoles);
  };

  // Toggle tips received status
  const toggleTipsReceived = (id) => {
    const updatedRoles = roles.map(role =>
      role.id === id ? { ...role, tipsReceived: !role.tipsReceived } : role
    );
    
    // Find the role that was toggled
    const toggledRole = updatedRoles.find(role => role.id === id);
    
    // Create a history entry for the toggle action
    if (toggledRole) {
      const distribution = distributions.find(dist => dist.id === id);
      const timestamp = new Date().toLocaleString();
      const historyEntry = {
        id: Date.now(),
        timestamp: timestamp,
        role: toggledRole.role,
        amount: distribution ? distribution.perPerson : 0,
        action: toggledRole.tipsReceived ? 'Received' : 'Pending'
      };
      
      setHistoryEntries([historyEntry, ...historyEntries]);
    }
    
    setRoles(updatedRoles);
  };

  // Clear tips received status for all roles
  const clearAllTipsReceived = () => {
    const updatedRoles = roles.map(role => ({ ...role, tipsReceived: false }));
    setRoles(updatedRoles);
  };

  // Mark all as tips received
  const markAllTipsReceived = () => {
    const updatedRoles = roles.map(role => ({ ...role, tipsReceived: true }));
    setRoles(updatedRoles);
    
    // Create history entries for all roles marked as received
    const timestamp = new Date().toLocaleString();
    const newHistoryEntries = updatedRoles.map(role => {
      const distribution = distributions.find(dist => dist.id === role.id);
      return {
        id: Date.now() + role.id,
        timestamp: timestamp,
        role: role.role,
        amount: distribution ? distribution.perPerson : 0,
        action: 'Received'
      };
    });
    
    setHistoryEntries([...newHistoryEntries, ...historyEntries]);
  };

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
                href="/recipe-calculator"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Recipe Calculator
              </Link>
              <Link
                href="/tip-calculator"
                className="px-4 py-2 rounded-md text-sm font-medium bg-[#e3902b] text-white"
              >
                Tip Calculator
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Amal Tip Distribution Calculator</h1>

          {/* Total Tips Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Tips Collected (MAD):</label>
            <input
              type="number"
              value={totalTips}
              onChange={e => setTotalTips(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#e3902b] focus:border-[#e3902b]"
              min="0"
              step="0.01"
            />
          </div>

          {/* Staff Configuration */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Staff Configuration</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Per Month</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Staff</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map(role => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={role.hours}
                          onChange={e => handleHoursChange(role.id, e.target.value)}
                          className="w-24 p-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#e3902b] focus:border-[#e3902b]"
                          min="0"
                          step="0.5"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={role.count}
                          onChange={e => handleCountChange(role.id, e.target.value)}
                          className="w-24 p-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#e3902b] focus:border-[#e3902b]"
                          min="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tip Distribution Results</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <button 
                onClick={markAllTipsReceived} 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Mark All as Received
              </button>
              <button 
                onClick={clearAllTipsReceived} 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Clear All Received Status
              </button>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Count</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount (MAD)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Person (MAD)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distributions.map((item) => (
                    <tr key={item.id} className={item.tipsReceived ? 'bg-green-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalHours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MAD {item.totalAmount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MAD {item.perPerson}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => toggleTipsReceived(item.id)} 
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            item.tipsReceived 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.tipsReceived ? 'Received' : 'Pending'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {roles.reduce((sum, role) => sum + role.count, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {roles.reduce((sum, role) => sum + role.hours * role.count, 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      MAD {totalTips.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Tips History */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tips Distribution History</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (MAD)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyEntries.length > 0 ? (
                    historyEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.timestamp}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MAD {parseFloat(entry.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.action === 'Received' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.action}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No history entries yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipDistributionCalculator;