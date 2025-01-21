// src/components/Header.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';

const AppHeader = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Clear PouchDB
      await window.electron.db.prescriptions.clear();
      // Clear tokens
      localStorage.removeItem('token');
      await window.electron.clearToken();
      // Update auth state
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">MedPrecEl</h1>
        <nav className="flex space-x-4">
          <NavLink
            to="/prescriptions"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium ${isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            Prescriptions List
          </NavLink>
          <NavLink
            to="/prescriptions/new"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium ${isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            New Prescription
          </NavLink>
        </nav>
        <button
          onClick={handleLogoutClick}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </button>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
              <p className="mb-6 text-gray-600">
                Are you sure you want to logout? This will clear all locally stored data.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;