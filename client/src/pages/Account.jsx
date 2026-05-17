import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export default function Account() {
  const { user, updateUserProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '', role: '' });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

    loadProfile();
    loadOrders();
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

  const formatDate = (value) => new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
                <p className="mt-2 text-sm text-gray-600">Manage your profile and view your order status.</p>
              </div>
              <div className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">{profile.role?.toUpperCase()}</div>
            </div>

            <form onSubmit={handleSave} className="mt-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-900">Name</span>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-900">Email</span>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500"
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
                  className="mt-2 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </label>

              {error && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
              )}
              {message && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
            <p className="mt-2 text-sm text-gray-600">Track your recent orders and payment status.</p>

            {loadingOrders ? (
              <div className="mt-8 rounded-3xl bg-gray-100 p-8 text-center text-gray-600">Loading orders…</div>
            ) : orders.length === 0 ? (
              <div className="mt-8 rounded-3xl bg-gray-100 p-8 text-center text-gray-600">No orders found yet.</div>
            ) : (
              <div className="mt-8 space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="rounded-3xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Order #{order._id.slice(-6)}</p>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{order.paymentMethod}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{order.paymentStatus}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{order.items.length} items</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Shipping</p>
                        <p className="mt-1 text-gray-900">{order.address}</p>
                      </div>
                    </div>

                    {order.sellerApprovals?.length > 0 && (
                      <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">Seller approvals</p>
                        <div className="mt-3 space-y-2">
                          {order.sellerApprovals.map((approval) => (
                            <div key={approval.sellerEmail} className="flex items-center justify-between rounded-2xl bg-white p-3 border border-gray-200">
                              <span>{approval.sellerEmail}</span>
                              <span className="text-sm font-semibold text-gray-700">{approval.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
