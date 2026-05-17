import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    navigate(`/?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600 sm:px-6">
        <div className="mx-auto flex max-w-7xl justify-between">
          <span>Welcome to ArtnCraft - Your Ultimate marketplace</span>
          <div className="flex gap-4">
            {user ? (
              <span>Hello, <span className="font-semibold text-gray-900">{user.name || 'User'}</span></span>
            ) : (
              <div className="flex gap-3">
                <NavLink to="/register" className="hover:text-red-600">Join now</NavLink>
                <span>|</span>
                <NavLink to="/login" className="hover:text-red-600">Log in</NavLink>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <div className="text-2xl font-bold text-red-600">ArtnCraft</div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-l-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button onClick={handleSearch} className="rounded-r-md bg-red-600 px-6 py-2.5 text-white transition hover:bg-red-700 flex items-center gap-2">
                <Search size={18} />
                Search
              </button>
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-6">
            <NavLink to="/cart" className="group flex flex-col items-center gap-1 text-gray-700 transition hover:text-red-600">
              <ShoppingCart size={24} />
              <span className="text-xs font-semibold">Cart</span>
            </NavLink>

            <div className="flex flex-col items-center gap-1 text-gray-700 transition hover:text-red-600 cursor-pointer">
              <User size={24} />
              <span className="text-xs font-semibold">Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex items-center gap-8 text-sm font-medium text-gray-700">
            <NavLink to="/" end className={({ isActive }) => isActive ? "text-red-600 py-3 border-b-2 border-red-600" : "py-3 hover:text-red-600"}>
              Home
            </NavLink>
            {role === 'seller' && (
              <NavLink to="/seller" className={({ isActive }) => isActive ? "text-red-600 py-3 border-b-2 border-red-600" : "py-3 hover:text-red-600"}>
                Seller Dashboard
              </NavLink>
            )}
            {role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => isActive ? "text-red-600 py-3 border-b-2 border-red-600" : "py-3 hover:text-red-600"}>
                Admin Panel
              </NavLink>
            )}
            {user && (
              <NavLink to="/account" className={({ isActive }) => isActive ? 'text-red-600 py-3 border-b-2 border-red-600' : 'py-3 hover:text-red-600'}>
                <div className="flex flex-col items-center gap-1 text-gray-700 transition hover:text-red-600">
                  <User size={24} />
                  <span className="text-xs font-semibold">Account</span>
                </div>
              </NavLink>
            )}
            {user && (
              <button
                onClick={logout}
                className="ml-auto rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              >
                Sign Out
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
