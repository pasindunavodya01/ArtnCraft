import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Flag,
  MessageSquare,
  Package,
  Shield,
  ShoppingBag,
  Trash2,
  Users,
  TrendingUp,
  FileText,
  AlertCircle,
  Star,
  Search,
  CheckCircle2,
  Calendar,
  X,
  ExternalLink
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'reports', label: 'Reports', icon: Flag },
];

const PAYMENT_STATUSES = ['pending', 'awaiting_approval', 'paid', 'rejected'];

const statusStyles = {
  paid: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
  pending: 'bg-amber-50 border border-amber-200 text-amber-700',
  awaiting_approval: 'bg-blue-50 border border-blue-200 text-blue-700',
  rejected: 'bg-red-50 border border-red-200 text-red-700',
};

const roleStyles = {
  admin: 'bg-purple-50 border border-purple-200 text-purple-750 font-bold',
  seller: 'bg-blue-50 border border-blue-200 text-blue-750 font-bold',
  customer: 'bg-slate-50 border border-slate-200 text-slate-705 font-bold',
};

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('');
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

  const loadReports = useCallback(async () => {
    const params = reportStatusFilter ? `?status=${reportStatusFilter}` : '';
    const res = await api.get(`/reports${params}`);
    setReports(res.data);
  }, [reportStatusFilter]);

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
        await Promise.all([loadStats(), loadOrders(), loadUsers(), loadProducts(), loadReviews(), loadReports()]);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load admin data. Ensure you are logged in as admin.');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [role, loadStats, loadOrders, loadUsers, loadProducts, loadReviews, loadReports]);

  useEffect(() => {
    if (role !== 'admin' || loading) return;
    if (activeTab === 'orders') loadOrders().catch(() => {});
  }, [orderStatusFilter, activeTab, role, loading, loadOrders]);

  useEffect(() => {
    if (role !== 'admin' || loading) return;
    if (activeTab === 'reports') loadReports().catch(() => {});
  }, [reportStatusFilter, activeTab, role, loading, loadReports]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-red-655" />
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
      showMessage('User role updated successfully.');
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
      showMessage('User deleted successfully.');
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
      showMessage('Product deleted successfully.');
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
      showMessage('Review deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete review.');
    } finally {
      setActionId(null);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    setActionId(reportId);
    try {
      const res = await api.patch(`/reports/${reportId}`, { status: newStatus });
      setReports((prev) => prev.map((r) => (r._id === reportId ? res.data : r)));
      showMessage('Report status updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update report.');
    } finally {
      setActionId(null);
    }
  };

  const updateReportNotes = async (reportId, currentNotes) => {
    const notes = window.prompt('Enter admin notes:', currentNotes || '');
    if (notes === null) return;
    setActionId(reportId);
    try {
      const res = await api.patch(`/reports/${reportId}`, { adminNotes: notes });
      setReports((prev) => prev.map((r) => (r._id === reportId ? res.data : r)));
      showMessage('Admin notes updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update notes.');
    } finally {
      setActionId(null);
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;
    setActionId(reportId);
    try {
      await api.delete(`/reports/${reportId}`);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      showMessage('Report deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete report.');
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

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full w-fit">
              <Shield size={12} className="shrink-0" /> Admin Control Center
            </div>
            <h1 className="mt-2.5 text-3xl font-black text-gray-900 leading-tight tracking-tight">Platform Management</h1>
            <p className="mt-1.5 text-sm text-gray-500">Manage users, products, orders, reviews, and reports across the ArtnCraft arena.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 shadow-sm shrink-0">
            <div className="h-2 w-2 rounded-full bg-red-655 animate-ping shrink-0" />
            <div className="text-xs">
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Logged in as</p>
              <p className="font-extrabold text-gray-950 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {(error || message) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 animate-bounce" />
                <span>{message}</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Horizontal Navigation Menu */}
        <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm border border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition active:scale-95 duration-200 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                    : 'bg-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Panels Content */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center rounded-3xl border border-gray-200 bg-white py-20 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-655" />
                <p className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Admin Space...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab: Overview */}
              {activeTab === 'overview' && stats && (
                <section className="space-y-6">
                  
                  {/* Stats Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard 
                      label="Total Users" 
                      value={stats.users.total} 
                      sub={`${stats.users.customers} Customers · ${stats.users.sellers} Sellers`} 
                      icon={Users}
                      color="bg-indigo-50 border border-indigo-100"
                      textColor="text-indigo-600"
                    />
                    <StatCard 
                      label="Listed Artworks" 
                      value={stats.products} 
                      icon={ShoppingBag}
                      color="bg-emerald-50 border border-emerald-100"
                      textColor="text-emerald-600"
                    />
                    <StatCard 
                      label="Total Orders" 
                      value={stats.orders.total} 
                      sub={`${stats.orders.pending} Pending Approval`} 
                      icon={Package}
                      color="bg-orange-50 border border-orange-100"
                      textColor="text-orange-600"
                    />
                    <StatCard 
                      label="Gross Revenue" 
                      value={`Rs. ${stats.orders.revenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`} 
                      sub={`${stats.orders.paid} Paid Transactions`} 
                      icon={TrendingUp}
                      color="bg-red-50 border border-red-100"
                      textColor="text-red-600"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Customer Reviews" value={stats.reviews} icon={MessageSquare} color="bg-blue-50 border border-blue-100" textColor="text-blue-600" />
                    <StatCard label="Rejected Orders" value={stats.orders.rejected} icon={X} color="bg-rose-50 border border-rose-100" textColor="text-rose-600" />
                    <StatCard label="Platform Admins" value={stats.users.admins} icon={Shield} color="bg-purple-50 border border-purple-100" textColor="text-purple-600" />
                  </div>

                  {/* Weekly Charts */}
                  <div className="grid gap-6 xl:grid-cols-2">
                    
                    {/* Revenue Weekly Bar Chart */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weekly Platform Revenue</p>
                        <p className="mt-1 text-3xl font-black text-gray-900 tracking-tight">Rs. {revenueChartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      </div>
                      
                      <div className="mt-8 flex h-48 items-end gap-3 pb-2 overflow-x-auto">
                        {revenueChartData.map((day) => (
                          <div key={day.key} className="flex-1 text-center flex flex-col justify-end h-full min-w-[42px]">
                            <div className="flex-1 flex items-end justify-center relative group">
                              <div
                                className="w-full rounded-t-lg bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-sm"
                                style={{
                                  height: `${(day.revenue / maxRevenue) * 100}%`,
                                  minHeight: day.revenue > 0 ? '6px' : '3px',
                                }}
                              />
                              <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition duration-200 pointer-events-none whitespace-nowrap shadow-md z-10">
                                Rs. {day.revenue.toFixed(0)}
                              </div>
                            </div>
                            <div className="mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">{day.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Registration Weekly Bar Chart */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">User Registrations History</p>
                        <p className="mt-1 text-3xl font-black text-gray-900 tracking-tight">{registrationChartData.reduce((sum, item) => sum + item.count, 0)} new signups</p>
                      </div>
                      
                      <div className="mt-8 flex h-48 items-end gap-3 pb-2 overflow-x-auto">
                        {registrationChartData.map((day) => (
                          <div key={day.key} className="flex-1 text-center flex flex-col justify-end h-full min-w-[42px]">
                            <div className="flex-1 flex items-end justify-center relative group">
                              <div
                                className="w-full rounded-t-lg bg-slate-800 hover:bg-slate-900 transition-all duration-300 shadow-sm"
                                style={{
                                  height: `${(day.count / maxRegistrations) * 100}%`,
                                  minHeight: day.count > 0 ? '6px' : '3px',
                                }}
                              />
                              <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition duration-200 pointer-events-none whitespace-nowrap shadow-md z-10">
                                {day.count} signups
                              </div>
                            </div>
                            <div className="mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">{day.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* System Note */}
                  <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 text-xs text-gray-600 flex gap-3 items-start leading-relaxed">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-gray-900 uppercase tracking-wider text-[10px]">Supervisory System Guidelines</p>
                      <p className="mt-1">Order approval responsibility lies with each respective seller via escrow protocols. Platform administration handles aggregate metrics monitoring, safety reporting review, and security governance.</p>
                    </div>
                  </div>

                </section>
              )}

              {/* Tab: Orders */}
              {activeTab === 'orders' && (
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 mb-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Platform Orders Registry</h2>
                      <p className="mt-1 text-xs text-gray-500">Track purchase records and transaction status indicators ({orders.length} matches).</p>
                    </div>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold focus:border-red-555 focus:outline-none focus:ring-1 focus:ring-red-555 cursor-pointer transition shadow-sm"
                    >
                      <option value="">All payment statuses</option>
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <EmptyState message="No transactions meet current filter conditions." />
                    ) : orders.map((order) => (
                      <article key={order._id} className="rounded-2xl border border-gray-150 p-5 hover:border-gray-300 hover:shadow-sm transition duration-200 bg-gray-50/30">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <span className="inline-block text-[10px] font-extrabold bg-slate-900 text-white rounded-md px-2 py-0.5 uppercase tracking-wide">
                              Ref: #{order._id.slice(-6).toUpperCase()}
                            </span>
                            <h4 className="mt-2 text-sm font-extrabold text-gray-950">{order.customerName || order.customerEmail}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{order.customerEmail} · {formatDate(order.createdAt)}</p>
                            <p className="mt-3 text-lg font-black text-red-600">Rs. {order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                          
                          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${statusStyles[order.paymentStatus] || ''}`}>
                            {order.paymentStatus?.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4 grid gap-3 sm:grid-cols-2 text-xs text-gray-700">
                          <div>
                            <p className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Delivery Address</p>
                            <p className="mt-1 font-medium leading-relaxed">{order.address}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-400 uppercase tracking-widest text-[9px]">Payment Specifications</p>
                            <p className="mt-1 font-extrabold capitalize text-slate-800">{order.paymentMethod?.replace('-', ' ')}</p>
                            {order.receiptUrls?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {order.receiptUrls.map((url, idx) => (
                                  <a 
                                    key={url} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 transition"
                                  >
                                    <ExternalLink size={10} /> View Slip #{idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <p className="font-semibold text-gray-400 uppercase tracking-widest text-[9px] mb-2">Artworks Ordered</p>
                          <ul className="space-y-1.5 text-xs text-gray-700">
                            {order.items.map((item) => (
                              <li key={`${order._id}-${item.productId}`} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
                                <span className="font-medium">{item.title} <span className="text-gray-400 font-bold ml-1.5">× {item.quantity}</span></span>
                                <span className="font-bold text-gray-950">Rs. {(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Tab: Users */}
              {activeTab === 'users' && (
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="border-b border-gray-100 pb-5 mb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Registered Accounts</h2>
                    <p className="mt-1 text-xs text-gray-500">Update system roles and manage administrative access privileges.</p>
                  </div>
                  
                  {/* Search filters */}
                  <div className="flex flex-col gap-3 md:flex-row items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users by name or email coordinates"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="w-full md:w-48 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer shadow-sm"
                    >
                      <option value="">All user types</option>
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button 
                      type="button" 
                      onClick={loadUsers} 
                      className="w-full md:w-32 rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition duration-200 active:scale-95 shadow-sm"
                    >
                      Filter List
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-widest text-[9px]">
                          <th className="pb-3 font-extrabold">Name</th>
                          <th className="pb-3 font-extrabold">Email Address</th>
                          <th className="pb-3 font-extrabold">Security Role</th>
                          <th className="pb-3 font-extrabold">Joined Date</th>
                          <th className="pb-3 font-extrabold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/50 transition">
                            <td className="py-4 font-bold text-gray-900">{u.name}</td>
                            <td className="py-4 font-medium text-gray-500">{u.email}</td>
                            <td className="py-4">
                              <select
                                value={u.role}
                                disabled={actionId === u._id}
                                onChange={(e) => updateUserRole(u._id, e.target.value)}
                                className={`rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide cursor-pointer focus:outline-none ${roleStyles[u.role]}`}
                              >
                                <option value="customer">customer</option>
                                <option value="seller">seller</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                            <td className="py-4 font-medium text-gray-500">{formatDate(u.createdAt)}</td>
                            <td className="py-4 text-right">
                              <button
                                type="button"
                                onClick={() => deleteUser(u._id)}
                                disabled={actionId === u._id}
                                className="rounded-lg border border-red-100 hover:border-red-200 p-2 text-red-655 hover:bg-red-50/50 disabled:opacity-50 transition active:scale-95"
                                title="Delete account"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Tab: Products */}
              {activeTab === 'products' && (
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="border-b border-gray-100 pb-5 mb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Platform Gallery Catalogue</h2>
                    <p className="mt-1 text-xs text-gray-500">Monitor listed items and verify community content guidelines consistency.</p>
                  </div>
                  
                  {/* Search filters */}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search artworks title, descriptions, or category keywords"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={loadProducts} 
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-xs font-bold text-white transition duration-200 active:scale-95 shadow-sm shrink-0"
                    >
                      Search
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4">
                    {products.length === 0 ? (
                      <EmptyState message="No masterpieces match current query criteria." />
                    ) : products.map((product) => (
                      <article key={product._id} className="flex gap-4 rounded-2xl border border-gray-200 p-4 hover:border-gray-300 transition duration-200 bg-gray-50/20">
                        <img
                          src={product.images?.[0]}
                          alt={product.title}
                          className="h-20 w-20 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                        />
                        
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-0.5">
                              {product.category || 'General'}
                            </span>
                            <h4 className="font-extrabold text-gray-900 mt-1 truncate">
                              <Link to={`/product/${product._id}`} className="hover:text-red-600 transition">
                                {product.title}
                              </Link>
                            </h4>
                            <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">Seller: {product.sellerEmail}</p>
                          </div>
                          
                          <p className="mt-2 font-black text-red-655 text-sm">Rs. {parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => deleteProduct(product._id)}
                          disabled={actionId === product._id}
                          className="self-start rounded-xl border border-red-150 p-2.5 text-red-600 hover:bg-red-50/60 disabled:opacity-50 transition active:scale-95"
                          title="Delete artwork"
                        >
                          <Trash2 size={14} />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Tab: Reviews */}
              {activeTab === 'reviews' && (
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="border-b border-gray-100 pb-5 mb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Customer Reviews</h2>
                    <p className="mt-1 text-xs text-gray-500">Supervise user feedback quality standards across listings ({reviews.length} reviews).</p>
                  </div>

                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <EmptyState message="No review comments uploaded yet." />
                    ) : reviews.map((review) => (
                      <article key={review._id} className="rounded-2xl border border-gray-200 p-5 bg-gray-50/20">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-extrabold text-gray-950">{review.userName || 'Anonymous Artist'}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{review.userEmail}</p>
                            
                            <div className="mt-2.5 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star 
                                  key={index} 
                                  size={12} 
                                  className={index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} 
                                />
                              ))}
                              <span className="text-[10px] font-black text-amber-600 ml-1">{review.rating} out of 5</span>
                            </div>

                            <div className="mt-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-fit max-w-xl">
                              <p className="font-semibold text-gray-400 uppercase tracking-widest text-[8px] mb-1">Target Product</p>
                              <Link to={`/product/${review.productId}`} className="text-xs font-bold text-red-655 hover:text-red-700 hover:underline">
                                {review.productTitle || 'View Masterpiece Detail'}
                              </Link>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => deleteReview(review._id)}
                            disabled={actionId === review._id}
                            className="rounded-xl border border-red-100 hover:border-red-200 p-2.5 text-red-655 hover:bg-red-50/50 disabled:opacity-50 transition active:scale-95"
                            title="Delete review"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <p className="mt-4 text-xs font-medium text-gray-700 italic leading-relaxed bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                          &ldquo;{review.comment || 'No feedback comments provided.'}&rdquo;
                        </p>
                        <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={10} /> Verified on {formatDate(review.createdAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Tab: Reports */}
              {activeTab === 'reports' && (
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 mb-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Trust & Safety Reports</h2>
                      <p className="mt-1 text-xs text-gray-500">Investigate community reports and platform violations ({reports.length} cases).</p>
                    </div>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value)}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer shadow-sm"
                    >
                      <option value="">All report cases</option>
                      <option value="open">OPEN CASES</option>
                      <option value="in_review">IN REVIEW</option>
                      <option value="resolved">RESOLVED</option>
                      <option value="dismissed">DISMISSED</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {reports.length === 0 ? (
                      <EmptyState message="No open safety alerts or complaints reported." />
                    ) : reports.map((report) => (
                      <article key={report._id} className="rounded-2xl border border-gray-250 p-5 bg-gray-50/20 hover:border-gray-350 transition duration-200">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <span className="inline-block text-[9px] font-extrabold bg-slate-900 text-white rounded-md px-2 py-0.5 uppercase tracking-wide">
                              ID: #{report._id.slice(-6).toUpperCase()}
                            </span>
                            <h4 className="mt-2 text-sm font-extrabold text-gray-950">{report.subject}</h4>
                            <p className="text-xs text-gray-500">{report.reporterName || report.reporterEmail} · {formatDate(report.createdAt)}</p>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                                report.type === 'product_issue' ? 'bg-rose-50 border border-rose-200 text-rose-700' :
                                report.type === 'seller_complaint' ? 'bg-orange-50 border border-orange-200 text-orange-700' :
                                report.type === 'technical_error' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                                'bg-slate-50 border border-slate-200 text-slate-700'
                              }`}>
                                {report.type?.replace('_', ' ')}
                              </span>
                              
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                                report.priority === 'high' ? 'bg-red-50 border border-red-200 text-red-700 font-black' :
                                report.priority === 'medium' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                                'bg-blue-50 border border-blue-200 text-blue-700'
                              }`}>
                                {report.priority} priority
                              </span>
                            </div>
                          </div>
                          
                          <select
                            value={report.status}
                            disabled={actionId === report._id}
                            onChange={(e) => updateReportStatus(report._id, e.target.value)}
                            className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold focus:border-red-555 focus:outline-none focus:ring-1 focus:ring-red-555 cursor-pointer shadow-sm uppercase tracking-wider"
                          >
                            <option value="open">Open</option>
                            <option value="in_review">In Review</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                        </div>

                        <div className="mt-4 border-t border-gray-150 pt-4">
                          <p className="font-semibold text-gray-400 uppercase tracking-widest text-[9px] mb-1">Details & Context</p>
                          <p className="text-xs font-medium leading-relaxed text-gray-700 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            {report.description}
                          </p>
                          
                          {(report.productId || report.sellerEmail) && (
                            <div className="mt-2.5 flex flex-wrap gap-3 text-[10px] font-bold text-gray-500">
                              {report.productId && <span>Product ID: {report.productId}</span>}
                              {report.sellerEmail && <span>Seller: {report.sellerEmail}</span>}
                            </div>
                          )}
                        </div>

                        {/* Admin Notes Section */}
                        {report.adminNotes && (
                          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm text-xs text-emerald-900 flex gap-2.5 items-start">
                            <FileText size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-extrabold uppercase tracking-wide text-[9px]">Administrative Action Note</p>
                              <p className="mt-1 font-medium italic">{report.adminNotes}</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 border-t border-gray-150 pt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => deleteReport(report._id)}
                            disabled={actionId === report._id}
                            className="rounded-xl border border-red-100 hover:border-red-200 p-2.5 text-red-655 hover:bg-red-50/50 disabled:opacity-50 transition active:scale-95"
                            title="Delete report log"
                          >
                            <Trash2 size={14} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => updateReportNotes(report._id, report.adminNotes)}
                            disabled={actionId === report._id}
                            className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-bold text-slate-800 transition active:scale-95 shadow-sm"
                          >
                            {report.adminNotes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, sub, icon: Icon, color = 'bg-red-50', textColor = 'text-red-600' }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm flex items-start justify-between hover:shadow-md transition duration-200">
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="mt-2 text-2xl font-black text-gray-900 leading-tight tracking-tight">{value}</p>
        {sub && <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{sub}</p>}
      </div>
      {Icon && (
        <div className={`rounded-2xl ${color} p-3 shrink-0`}>
          <Icon size={20} className={textColor} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-xs font-extrabold uppercase tracking-widest text-gray-400 shadow-inner">
      {message}
    </div>
  );
}
