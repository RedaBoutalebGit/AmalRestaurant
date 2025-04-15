// components/ProtectedRoute.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Hard-coded credentials for simplicity
// In a real application, you should use environment variables and proper authentication
const CREDENTIALS = {
  'performance': 'restaurant2025',
  'inventory': 'inventory2025',
  'recipe': 'recipe2025',
  'tips': 'tips2025',
  'strat' : 'strat2025',
  // Add more page-password pairs as needed
};

export default function ProtectedRoute({ children, pageName }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if user is already authenticated for this page
  useEffect(() => {
    const authStatus = sessionStorage.getItem(`auth_${pageName}`);
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, [pageName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if password matches for this page
    if (password === CREDENTIALS[pageName]) {
      // Store auth status in session storage
      sessionStorage.setItem(`auth_${pageName}`, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Protected Page
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            This page requires a password to access.
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter password"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-[#e3902b] hover:bg-[#d38526] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                Access Page
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Return to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If authenticated, show the protected content
  return <>{children}</>;
}