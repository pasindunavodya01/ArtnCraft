import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
  Package,
  ShoppingCart,
  Trash2,
  User,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import api from '../services/api.js';
import { formatPrice, getItemImage, getItemUnitPrice } from '../utils/cart.js';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
];

const paymentStatusStyles = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  awaiting_approval: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function Account() {
  const { user, role, updateUserProfile } = useAuth();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const visibleTabs = role === 'customer'
    ? TABS
    : TABS.filter((tab) => tab.id !== 'wishlist');
  const allowedTabIds = visibleTabs.map((tab) => tab.id);
  const tabFromUrl = searchParams.get('tab');
  const initialTab = allowedTabIds.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '', role: '' });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (allowedTabIds.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, allowedTabIds.join(',')]);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setProfile(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load account details.');
      }
    };

    const loadOrders = async () => {
      try {
        const response = await api.get('/orders/customer');
        setOrders(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load your orders.');
      } finally {
        setLoadingOrders(false);
      }
    };

    const loadWishlist = async () => {
      try {
        const response = await api.get('/wishlist');
        setWishlist(response.data.products || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load your wishlist.');
      } finally {
        setLoadingWishlist(false);
      }
    };

    loadProfile();
    loadOrders();
    loadWishlist();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!profile.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const payload = { name: profile.name.trim() };
      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await api.put('/auth/me', payload);
      setProfile(response.data.user);
      updateUserProfile({ name: response.data.user.name });
      setPassword('');
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    setRemovingId(productId);
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((prev) => prev.filter((item) => String(item._id) !== String(productId)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove item from wishlist.');
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (value) => new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const initials = (profile.name || user.name || user.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="border-b border-red-100 bg-gradient-to-r from-red-600 to-red-700">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white backdrop-blur">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-red-100">My Account</p>
                <h1 className="text-3xl font-bold text-white">{profile.name || user.name}</h1>
                <p className="mt-1 text-red-100">{profile.email || user.email}</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              <Sparkles size={16} />
              {profile.role?.toUpperCase() || role?.toUpperCase()}
            </span>
          </div>

          <div className={`mt-8 grid gap-4 ${role === 'customer' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-red-100">Total orders</p>
              <p className="mt-1 text-2xl font-bold text-white">{orders.length}</p>
            </div>
            {role === 'customer' && (
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-sm text-red-100">Wishlist items</p>
                <p className="mt-1 text-2xl font-bold text-white">{wishlist.length}</p>
              </div>
            )}
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-red-100">Account type</p>
              <p className="mt-1 text-2xl font-bold capitalize text-white">{profile.role || role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                      isActive
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                    {tab.id === 'wishlist' && wishlist.length > 0 && (
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                        {wishlist.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-6">
            {(error || message) && (
              <div className="space-y-3">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {message}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">Profile settings</h2>
                <p className="mt-2 text-sm text-gray-600">Update your personal information and password.</p>

                <form onSubmit={handleSave} className="mt-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-900">Full name</span>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-900">Email</span>
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-900">New password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </form>
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">Order history</h2>
                <p className="mt-2 text-sm text-gray-600">Track your purchases and payment status.</p>

                {loadingOrders ? (
                  <div className="mt-8 flex justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                    <Package className="mx-auto text-gray-400" size={40} />
                    <p className="mt-4 font-medium text-gray-900">No orders yet</p>
                    <p className="mt-2 text-sm text-gray-600">When you buy something, it will show up here.</p>
                    <Link to="/" className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                      Browse artworks
                    </Link>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    {orders.map((order) => (
                      <article key={order._id} className="rounded-2xl border border-gray-200 p-6 transition hover:border-red-200 hover:shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Order #{order._id.slice(-6).toUpperCase()}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                            <p className="mt-2 text-2xl font-bold text-red-600">${order.total.toFixed(2)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                              {order.paymentMethod?.replace('-', ' ')}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentStatusStyles[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                              {order.paymentStatus?.replace('_', ' ')}
                            </span>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-gray-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Shipping address</p>
                          <p className="mt-1 text-sm text-gray-800">{order.address}</p>
                        </div>

                        {order.items?.length > 0 && (
                          <ul className="mt-4 space-y-2">
                            {order.items.map((item) => (
                              <li key={`${order._id}-${item.productId}`} className="flex justify-between text-sm text-gray-700">
                                <span>{item.title} × {item.quantity}</span>
                                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'wishlist' && (
              <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">My wishlist</h2>
                    <p className="mt-2 text-sm text-gray-600">Save artworks you love and add them to your cart anytime.</p>
                  </div>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Discover more <ExternalLink size={16} />
                  </Link>
                </div>

                {loadingWishlist ? (
                  <div className="mt-8 flex justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                    <Heart className="mx-auto text-gray-400" size={40} />
                    <p className="mt-4 font-medium text-gray-900">Your wishlist is empty</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Tap the heart on any artwork to save it here for later.
                    </p>
                    <Link to="/" className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                      Explore artworks
                    </Link>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-4">
                    {wishlist.map((product) => {
                      const image = getItemImage(product);
                      return (
                        <article
                          key={product._id}
                          className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 transition hover:border-red-200 hover:shadow-sm sm:flex-row sm:items-center"
                        >
                          <Link
                            to={`/product/${product._id}`}
                            className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-28"
                          >
                            {image ? (
                              <img src={image} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-gray-500">No image</div>
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {product.category || 'General'}
                            </p>
                            <Link to={`/product/${product._id}`} className="mt-1 block truncate text-lg font-semibold text-gray-900 hover:text-red-600">
                              {product.title}
                            </Link>
                            {product.style && (
                              <p className="mt-1 text-sm text-gray-600">{product.style}{product.medium ? ` · ${product.medium}` : ''}</p>
                            )}
                            <p className="mt-2 text-xl font-bold text-red-600">
                              ${formatPrice(getItemUnitPrice(product))}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 sm:flex-none"
                            >
                              <ShoppingCart size={16} />
                              Add to cart
                            </button>
                            <Link
                              to={`/product/${product._id}`}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:flex-none"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeFromWishlist(product._id)}
                              disabled={removingId === product._id}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 sm:flex-none"
                            >
                              <Trash2 size={16} />
                              {removingId === product._id ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
