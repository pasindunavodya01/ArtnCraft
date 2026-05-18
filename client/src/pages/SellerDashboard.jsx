import { useAuth } from '../contexts/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api.js';
import { Upload, Package, Trash2, Edit, Plus, TrendingUp } from 'lucide-react';

export default function SellerDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    images: [],
    existingImages: [],
    removedImages: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  if (authLoading) {
    return null;
  }

  if (role !== 'seller') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (role === 'seller' && user?.email) {
      loadSellerProducts();
      loadSellerOrders();
    }
  }, [role, user?.email]);

  const loadSellerProducts = async () => {
    try {
      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(`/products?sellerEmail=${encodeURIComponent(user.email)}`);
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'images') {
      setForm((prev) => ({ ...prev, images: files ? Array.from(files) : [] }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (product) => {
    setEdit(product);
    setShowForm(true);
    setForm({
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      images: [],
      existingImages: product.images || [],
      removedImages: [],
    });
    setError('');
    setSuccess('');
  };

  const handleRemoveExistingImage = (imageUrl) => {
    setForm((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((url) => url !== imageUrl),
      removedImages: [...prev.removedImages, imageUrl],
    }));
  };

  const resetForm = () => {
    setEdit(null);
    setShowForm(false);
    setForm({ title: '', description: '', category: '', price: '', images: [], existingImages: [], removedImages: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title || !form.description || !form.price || !form.category) {
      setError('Please fill all fields');
      return;
    }

    if (!edit && form.images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    if (edit && form.images.length === 0 && form.existingImages.length === 0) {
      setError('Please keep or upload at least one image');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('price', form.price);
      form.images.forEach((image) => formData.append('images', image));
      if (form.removedImages.length) {
        formData.append('removeImages', JSON.stringify(form.removedImages));
      }

      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      if (edit) {
        await api.put(`/products/${edit._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Product updated successfully!');
      } else {
        await api.post('/products/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Product added successfully!');
      }

      resetForm();
      loadSellerProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      await api.delete(`/products/${productId}`);
      setSuccess('Product deleted successfully!');
      loadSellerProducts();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const loadSellerOrders = async () => {
    try {
      setLoadingOrders(true);
      setOrderError('');
      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      const response = await api.get('/orders/seller');
      setOrders(response.data);
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Failed to load your orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleApprove = async (orderId, approve) => {
    try {
      setOrderError('');
      setOrderMessage('');
      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      const response = await api.post(`/orders/${orderId}/seller-approve`, { approve });
      setOrders((prev) => prev.map((order) => (order._id === response.data._id ? response.data : order)));
      setOrderMessage(`Order ${approve ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Approval update failed');
    }
  };

  const orderStats = [
    {
      label: 'Total Orders',
      value: orders.length,
      icon: Package,
      color: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Seller Revenue',
      value: `Rs. ${orders.reduce((sum, order) => {
        const sellerItems = order.items?.filter((item) => item.sellerEmail?.toLowerCase() === user?.email?.toLowerCase()) || [];
        return sum + sellerItems.reduce((itemSum, item) => itemSum + parseFloat(item.price || 0) * item.quantity, 0);
      }, 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      label: 'Items Sold',
      value: orders.reduce((sum, order) => {
        const sellerItems = order.items?.filter((item) => item.sellerEmail?.toLowerCase() === user?.email?.toLowerCase()) || [];
        return sum + sellerItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0),
      icon: Upload,
      color: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
    {
      label: 'Pending Approvals',
      value: orders.reduce((sum, order) => {
        const approval = order.sellerApprovals?.find((approvalItem) => approvalItem.sellerEmail?.toLowerCase() === user?.email?.toLowerCase());
        return sum + (approval?.status === 'pending' ? 1 : 0);
      }, 0),
      icon: Plus,
      color: 'bg-red-100',
      textColor: 'text-red-600',
    },
  ];

  const dailyRevenueData = (() => {
    const sellerEmail = user?.email?.toLowerCase();
    const dateMap = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      dateMap[key] = {
        label: day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        revenue: 0,
      };
    }

    orders.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!dateMap[key]) return;
      const sellerItems = order.items?.filter((item) => item.sellerEmail?.toLowerCase() === sellerEmail) || [];
      dateMap[key].revenue += sellerItems.reduce((sum, item) => sum + parseFloat(item.price || 0) * item.quantity, 0);
    });

    return Object.values(dateMap);
  })();

  const maxDailyRevenue = Math.max(...dailyRevenueData.map((day) => day.revenue), 1);

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Value',
      value: `Rs. ${products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-100',
      textColor: 'text-green-600',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user?.name}! Manage your products and store orders.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'products' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'orders' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Seller Orders
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {(activeTab === 'products' ? stats : orderStats).map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg ${stat.color} p-3`}>
                    <Icon size={24} className={stat.textColor} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {activeTab === 'orders' && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily revenue</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">Last 7 days</h2>
              </div>
              <p className="text-sm font-semibold text-gray-900">Total: Rs. {dailyRevenueData.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}</p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <div className="flex h-52 items-end gap-3 pb-4">
                {dailyRevenueData.map((day) => (
                  <div key={day.label} className="flex-1 text-center">
                    <div
                      className="mx-auto flex h-full items-end justify-center"
                      style={{ minHeight: '1rem' }}
                    >
                      <div
                        className="w-full rounded-t-2xl bg-red-600 transition-all"
                        style={{
                          height: `${(day.revenue / maxDailyRevenue) * 100}%`,
                          minHeight: day.revenue > 0 ? '1rem' : '0.5rem',
                        }}
                      />
                    </div>
                    <div className="mt-3 text-xs text-gray-600">
                      <p className="font-semibold text-gray-900">Rs. {day.revenue.toFixed(0)}</p>
                      <p>{day.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Add Product Form */}
        {showForm && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Upload size={24} className="text-red-600" />
                {edit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Wireless Headphones"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Electronics"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (Rs.) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product..."
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images *
                </label>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-red-500 transition">
                  <input
                    type="file"
                    name="images"
                    onChange={handleInputChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="imageInput"
                    required={!edit && form.images.length === 0}
                  />
                  <label htmlFor="imageInput" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB per image</p>
                    {form.images.length > 0 && (
                      <div className="mt-2 text-left text-sm text-gray-700">
                        <p className="font-semibold text-red-600">New images:</p>
                        <ul className="list-disc pl-5">
                          {form.images.map((file) => (
                            <li key={file.name}>{file.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {form.existingImages.length > 0 && (
                      <div className="mt-2 text-left text-sm text-gray-700">
                        <p className="font-semibold text-red-600">Existing images:</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {form.existingImages.map((imageUrl) => (
                            <div key={imageUrl} className="relative rounded-lg overflow-hidden border border-gray-200">
                              <img src={imageUrl} alt="Existing product" className="h-20 w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingImage(imageUrl)}
                                className="absolute top-1 right-1 rounded-full bg-white p-1 text-red-600 shadow-sm hover:bg-red-50"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting ? (edit ? 'Saving...' : 'Publishing...') : (edit ? 'Update Product' : 'Publish Product')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'products' ? (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Your Products</h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No products yet. Click "Add Product" to get started!</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div key={product._id} className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition">
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      <img
                        src={product.images?.[0] || product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                      {product.images?.length > 1 && (
                        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                          {product.images.length} photos
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">{product.category}</p>
                      <p className="mt-2 text-lg font-bold text-red-600">
                        Rs. {parseFloat(product.price).toFixed(2)}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-gray-700 hover:bg-gray-50 transition font-medium"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2 text-red-600 hover:bg-red-100 transition font-medium"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Seller Orders</h2>

            {orderMessage && (
              <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">{orderMessage}</div>
            )}
            {orderError && (
              <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">{orderError}</div>
            )}

            {loadingOrders ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No orders received yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const approval = order.sellerApprovals?.find((approvalItem) => approvalItem.sellerEmail?.toLowerCase() === user.email.toLowerCase());
                  const sellerItems = order.items?.filter((item) => item.sellerEmail?.toLowerCase() === user.email.toLowerCase()) || [];

                  return (
                    <div key={order._id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Order #{order._id.slice(-6)}</p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{order.paymentMethod}</span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{order.paymentStatus}</span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{sellerItems.length} item{sellerItems.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="mt-1 text-gray-900">{order.customerName || order.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="mt-1 text-gray-900">Rs. {order.total.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">Your items in this order</p>
                        <div className="mt-3 space-y-2">
                          {sellerItems.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between rounded-2xl bg-white p-3 border border-gray-200">
                              <span>{item.title}</span>
                              <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.paymentMethod === 'bank-slip' && order.receiptUrls?.length > 0 && (
                        <div className="mt-4 rounded-2xl bg-white p-4 border border-gray-200">
                          <p className="font-semibold text-gray-900">Slip / screenshot</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {order.receiptUrls.map((url, index) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                                <img src={url} alt={`Receipt ${index + 1}`} className="h-44 w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {order.paymentMethod === 'bank-slip' && approval && (
                        <div className="mt-4 rounded-2xl bg-white p-4 border border-gray-200">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Approval status</p>
                              <p className="mt-1 font-semibold text-gray-900">{approval.status}</p>
                            </div>
                            {approval.status === 'pending' ? (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleApprove(order._id, true)}
                                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApprove(order._id, false)}
                                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
