import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  MessageSquare,
  Package,
  Shield,
  ShoppingBag,
  Trash2,
  Users,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
];

const PAYMENT_STATUSES = ['pending', 'awaiting_approval', 'paid', 'rejected'];

const statusStyles = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  awaiting_approval: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
};

const roleStyles = {
  admin: 'bg-purple-100 text-purple-800',
  seller: 'bg-blue-100 text-blue-800',
  customer: 'bg-gray-100 text-gray-800',
};

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [actionId, setActionId] = useState(null);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadStats = useCallback(async () => {
    const res = await api.get('/admin/stats');
    setStats(res.data);
  }, []);

  const loadOrders = useCallback(async () => {
    const params = orderStatusFilter ? `?status=${orderStatusFilter}` : '';
    const res = await api.get(`/admin/orders${params}`);
    setOrders(res.data);
  }, [orderStatusFilter]);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (userSearch.trim()) params.set('search', userSearch.trim());
    if (userRoleFilter) params.set('role', userRoleFilter);
    const res = await api.get(`/admin/users?${params.toString()}`);
    setUsers(res.data);
  }, [userSearch, userRoleFilter]);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (productSearch.trim()) params.set('search', productSearch.trim());
    const res = await api.get(`/admin/products?${params.toString()}`);
    setProducts(res.data);
  }, [productSearch]);

  const loadReviews = useCallback(async () => {
    const res = await api.get('/admin/reviews');
    setReviews(res.data);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (role !== 'admin') return;

    const loadAll = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadStats(), loadOrders(), loadUsers(), loadProducts(), loadReviews()]);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load admin data. Ensure you are logged in as admin.');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [role, loadStats, loadOrders, loadUsers, loadProducts, loadReviews]);

  useEffect(() => {
    if (role !== 'admin' || loading) return;
    if (activeTab === 'orders') loadOrders().catch(() => {});
  }, [orderStatusFilter, activeTab, role, loading, loadOrders]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
      </main>
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const updateUserRole = async (userId, newRole) => {
    setActionId(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: res.data.user.role } : u)));
      await loadStats();
      showMessage('User role updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update user role.');
    } finally {
      setActionId(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    setActionId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      await loadStats();
      showMessage('User deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete user.');
    } finally {
      setActionId(null);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product and its reviews?')) return;
    setActionId(productId);
    try {
      await api.delete(`/admin/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      await loadStats();
      showMessage('Product deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete product.');
    } finally {
      setActionId(null);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    setActionId(reviewId);
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      await loadStats();
      showMessage('Review deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete review.');
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (value) => new Date(value).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const last7Days = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      return {
        key: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      };
    });
  })();

  const revenueChartData = last7Days.map((day) => ({
    ...day,
    revenue: orders.reduce((sum, order) => {
      if (new Date(order.createdAt).toISOString().slice(0, 10) !== day.key) return sum;
      return sum + (order.paymentStatus === 'paid' ? Number(order.total) : 0);
    }, 0),
  }));

  const registrationChartData = last7Days.map((day) => ({
    ...day,
    count: users.reduce((sum, userItem) => {
      return sum + (new Date(userItem.createdAt).toISOString().slice(0, 10) === day.key ? 1 : 0);
    }, 0),
  }));

  const maxRevenue = Math.max(...revenueChartData.map((item) => item.revenue), 1);
  const maxRegistrations = Math.max(...registrationChartData.map((item) => item.count), 1);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="border-b border-red-100 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Shield size={16} /> Admin Panel
              </p>
              <h1 className="mt-1 text-3xl font-bold text-white">Platform management</h1>
              <p className="mt-2 text-gray-400">Manage users, products, orders, and reviews across ArtnCraft.</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-gray-200">
              Signed in as <span className="font-semibold text-white">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {(error || message) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div>
            {loading ? (
              <div className="flex justify-center rounded-3xl border border-gray-200 bg-white py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && stats && (
                  <section className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard label="Total users" value={stats.users.total} sub={`${stats.users.customers} customers · ${stats.users.sellers} sellers`} />
                      <StatCard label="Products" value={stats.products} />
                      <StatCard label="Orders" value={stats.orders.total} sub={`${stats.orders.pending} pending`} />
                      <StatCard label="Revenue (paid)" value={`Rs. ${stats.orders.revenue?.toFixed(2) || '0.00'}`} sub={`${stats.orders.paid} paid orders`} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <StatCard label="Reviews" value={stats.reviews} icon={MessageSquare} />
                      <StatCard label="Rejected orders" value={stats.orders.rejected} />
                      <StatCard label="Admins" value={stats.users.admins} />
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">Weekly revenue</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">Rs. {revenueChartData.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          {revenueChartData.map((day) => (
                            <div key={day.key} className="rounded-2xl bg-gray-50 p-3 text-center">
                              <p className="text-sm font-medium text-gray-700">{day.label}</p>
                              <p className="mt-2 text-xl font-semibold text-gray-900">Rs. {day.revenue.toFixed(0)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">User registrations</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{registrationChartData.reduce((sum, item) => sum + item.count, 0)}</p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          {registrationChartData.map((day) => (
                            <div key={day.key} className="rounded-2xl bg-gray-50 p-3 text-center">
                              <p className="text-sm font-medium text-gray-700">{day.label}</p>
                              <p className="mt-2 text-xl font-semibold text-gray-900">{day.count}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                      <p className="font-semibold">Admin note</p>
                      <p className="mt-1">Track revenue and user growth on the Overview tab. Order approval is handled by sellers, so admin access remains monitoring-only.</p>
                    </div>
                  </section>
                )}

                {activeTab === 'orders' && (
                  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                        <p className="mt-1 text-sm text-gray-600">{orders.length} order(s)</p>
                      </div>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
                      >
                        <option value="">All statuses</option>
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-6 space-y-4">
                      {orders.length === 0 ? (
                        <EmptyState message="No orders match this filter." />
                      ) : orders.map((order) => (
                        <article key={order._id} className="rounded-2xl border border-gray-200 p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase text-gray-500">#{order._id.slice(-6)}</p>
                              <p className="mt-1 font-semibold text-gray-900">{order.customerName || order.customerEmail}</p>
                              <p className="text-sm text-gray-600">{order.customerEmail} · {formatDate(order.createdAt)}</p>
                              <p className="mt-2 text-xl font-bold text-red-600">Rs. {order.total.toFixed(2)}</p>
                            </div>
                            <span className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold capitalize ${statusStyles[order.paymentStatus] || ''}`}>
                              {order.paymentStatus?.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-gray-700"><span className="font-medium">Address:</span> {order.address}</p>
                          <p className="text-sm text-gray-600 capitalize">Payment: {order.paymentMethod?.replace('-', ' ')}</p>

                          {order.receiptUrls?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {order.receiptUrls.map((url) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-red-600 hover:underline">
                                  View receipt
                                </a>
                              ))}
                            </div>
                          )}

                          <ul className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm text-gray-700">
                            {order.items.map((item) => (
                              <li key={`${order._id}-${item.productId}`} className="flex justify-between">
                                <span>{item.title} × {item.quantity}</span>
                                <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {activeTab === 'users' && (
                  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900">Users</h2>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        placeholder="Search name or email"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm"
                      />
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
                      >
                        <option value="">All roles</option>
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="button" onClick={loadUsers} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                        Search
                      </button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <th className="pb-3 font-semibold">Name</th>
                            <th className="pb-3 font-semibold">Email</th>
                            <th className="pb-3 font-semibold">Role</th>
                            <th className="pb-3 font-semibold">Joined</th>
                            <th className="pb-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u._id} className="border-b border-gray-100">
                              <td className="py-4 font-medium text-gray-900">{u.name}</td>
                              <td className="py-4 text-gray-600">{u.email}</td>
                              <td className="py-4">
                                <select
                                  value={u.role}
                                  disabled={actionId === u._id}
                                  onChange={(e) => updateUserRole(u._id, e.target.value)}
                                  className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${roleStyles[u.role]}`}
                                >
                                  <option value="customer">customer</option>
                                  <option value="seller">seller</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td className="py-4 text-gray-600">{formatDate(u.createdAt)}</td>
                              <td className="py-4">
                                <button
                                  type="button"
                                  onClick={() => deleteUser(u._id)}
                                  disabled={actionId === u._id}
                                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {activeTab === 'products' && (
                  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900">Products</h2>
                    <div className="mt-4 flex gap-3">
                      <input
                        type="text"
                        placeholder="Search products"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm"
                      />
                      <button type="button" onClick={loadProducts} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                        Search
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4">
                      {products.length === 0 ? (
                        <EmptyState message="No products found." />
                      ) : products.map((product) => (
                        <article key={product._id} className="flex gap-4 rounded-2xl border border-gray-200 p-4">
                          <img
                            src={product.images?.[0]}
                            alt={product.title}
                            className="h-20 w-20 rounded-xl object-cover bg-gray-100"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase text-gray-500">{product.category}</p>
                            <Link to={`/product/${product._id}`} className="font-semibold text-gray-900 hover:text-red-600">
                              {product.title}
                            </Link>
                            <p className="text-sm text-gray-600">Seller: {product.sellerEmail}</p>
                            <p className="mt-1 font-bold text-red-600">Rs. {product.price}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product._id)}
                            disabled={actionId === product._id}
                            className="self-start rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {activeTab === 'reviews' && (
                  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                    <p className="mt-1 text-sm text-gray-600">{reviews.length} review(s)</p>
                    <div className="mt-6 space-y-4">
                      {reviews.length === 0 ? (
                        <EmptyState message="No reviews yet." />
                      ) : reviews.map((review) => (
                        <article key={review._id} className="rounded-2xl border border-gray-200 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">{review.userName}</p>
                              <p className="text-sm text-gray-600">{review.userEmail}</p>
                              <Link to={`/product/${review.productId}`} className="mt-1 inline-block text-sm text-red-600 hover:underline">
                                {review.productTitle}
                              </Link>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteReview(review._id)}
                              disabled={actionId === review._id}
                              className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-amber-600">{review.rating} / 5 stars</p>
                          <p className="mt-2 text-gray-700">{review.comment || '(No comment)'}</p>
                          <p className="mt-2 text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {Icon && <Icon className="mb-2 text-gray-400" size={22} />}
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-2 text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-gray-600">
      {message}
    </div>
  );
}

