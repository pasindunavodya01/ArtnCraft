import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Heart, LayoutDashboard, Search, Shield, ShoppingCart, User } from 'lucide-react';
import { useState } from 'react';

const navLinkClass = ({ isActive }) =>
  isActive
    ? 'text-red-600 font-semibold'
    : 'text-gray-700 font-medium hover:text-red-600';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const isCustomer = !user || role === 'customer';
  const isSeller = role === 'seller';
  const isAdmin = role === 'admin';

  const homePath = isAdmin ? '/admin' : isSeller ? '/seller' : '/';
  const accountPath = isAdmin ? '/admin' : isSeller ? '/seller' : '/account';

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    navigate(`/?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <span className="hidden sm:inline">Welcome to ArtnCraft — Your art marketplace</span>
          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <>
                <span>
                  Hello, <span className="font-semibold text-gray-900">{user.name || 'User'}</span>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="font-semibold text-red-600 hover:text-red-700"
                >
                  Sign out
                </button>
              </>
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

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex items-center justify-between gap-4 lg:justify-start">
            <Link to={homePath} className="shrink-0">
              <div className="text-2xl font-bold text-red-600">ArtnCraft</div>
            </Link>

            <div className="flex items-center gap-4 lg:hidden">
              {isCustomer && (
                <NavLink to="/cart" className="text-gray-700 hover:text-red-600" aria-label="Cart">
                  <ShoppingCart size={24} />
                </NavLink>
              )}
              {isCustomer && user && (
                <NavLink to="/account?tab=wishlist" className="text-gray-700 hover:text-red-600" aria-label="Wishlist">
                  <Heart size={24} />
                </NavLink>
              )}
              <NavLink to={accountPath} className="text-gray-700 hover:text-red-600" aria-label="Account">
                {isAdmin ? <Shield size={24} /> : isSeller ? <LayoutDashboard size={24} /> : <User size={24} />}
              </NavLink>
            </div>
          </div>

          {isCustomer && (
            <div className="flex-1">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search artworks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-l-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex items-center gap-2 rounded-r-md bg-red-600 px-5 py-2.5 text-white transition hover:bg-red-700"
                >
                  <Search size={18} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          )}

          <nav className="hidden items-center gap-6 lg:flex">
            {isCustomer && (
              <>
                <NavLink to="/" end className={navLinkClass}>
                  Shop
                </NavLink>
                <NavLink to="/auctions" className={navLinkClass}>
                  Auctions
                </NavLink>
                <NavLink to="/cart" className="group flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-600">
                  <ShoppingCart size={22} />
                  <span className="text-xs font-semibold">Cart</span>
                </NavLink>
                {user && (
                  <NavLink to="/account?tab=wishlist" className="group flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-600">
                    <Heart size={22} />
                    <span className="text-xs font-semibold">Wishlist</span>
                  </NavLink>
                )}
                <NavLink
                  to={user ? '/account' : '/login'}
                  className="group flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-600"
                >
                  <User size={22} />
                  <span className="text-xs font-semibold">{user ? 'Account' : 'Log in'}</span>
                </NavLink>
              </>
            )}

            {isSeller && (
              <>
                <NavLink to="/seller" className={navLinkClass}>
                  Seller Dashboard
                </NavLink>
                <NavLink to="/account" className={navLinkClass}>
                  Profile
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink to="/admin" className={navLinkClass}>
                  Admin Panel
                </NavLink>
                <NavLink to="/account" className={navLinkClass}>
                  Profile
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {isCustomer && (
          <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 lg:hidden">
            <NavLink to="/" end className={navLinkClass}>
              Shop
            </NavLink>
            <NavLink to="/auctions" className={navLinkClass}>
              Auctions
            </NavLink>
            {user && (
              <NavLink to="/account" className={navLinkClass}>
                Account
              </NavLink>
            )}
          </div>
        )}

        {isSeller && (
          <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 lg:hidden">
            <NavLink to="/seller" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/account" className={navLinkClass}>
              Profile
            </NavLink>
          </div>
        )}

        {isAdmin && (
          <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 lg:hidden">
            <NavLink to="/admin" className={navLinkClass}>
              Admin Panel
            </NavLink>
            <NavLink to="/account" className={navLinkClass}>
              Profile
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}

