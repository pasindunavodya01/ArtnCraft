import { useAuth } from '../contexts/AuthContext.jsx';
import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { Upload, Package, Trash2, Edit, Plus, TrendingUp, Gavel, Calendar, Clock } from 'lucide-react';

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
    style: '',
    medium: '',
    tags: '',
    images: [],
    existingImages: [],
    removedImages: [],
    quantity: '1',
    isAuctionProduct: 'false',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  // Auction specific states
  const [auctions, setAuctions] = useState([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [auctionForm, setAuctionForm] = useState({
    productId: '',
    startingBid: '',
    reservePrice: '',
    startTime: '',
    endTime: ''
  });
  const [auctionError, setAuctionError] = useState('');
  const [auctionSuccess, setAuctionSuccess] = useState('');
  const [submittingAuction, setSubmittingAuction] = useState(false);

  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [auctionsPage, setAuctionsPage] = useState(1);
  const itemsPerPage = 12;

  // Products pagination helper calculations
  const totalProductsPages = Math.ceil(products.length / itemsPerPage);
  const productsStartIndex = (productsPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(productsStartIndex, productsStartIndex + itemsPerPage);

  const handleProductsPageChange = (pageNumber) => {
    setProductsPage(pageNumber);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Auctions pagination helper calculations
  const totalAuctionsPages = Math.ceil(auctions.length / itemsPerPage);
  const auctionsStartIndex = (auctionsPage - 1) * itemsPerPage;
  const paginatedAuctions = auctions.slice(auctionsStartIndex, auctionsStartIndex + itemsPerPage);

  const handleAuctionsPageChange = (pageNumber) => {
    setAuctionsPage(pageNumber);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    if (role === 'seller' && user?.email) {
      loadSellerProducts();
      loadSellerOrders();
      loadSellerAuctions();
    }
  }, [role, user?.email]);

  if (authLoading) {
    return null;
  }

  if (role !== 'seller') {
    return <Navigate to="/" replace />;
  }

  const loadSellerProducts = async () => {
    try {
      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      const response = await api.get(`/products?sellerEmail=${encodeURIComponent(user.email)}&all=true`);
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
      style: product.style || '',
      medium: product.medium || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      images: [],
      existingImages: product.images || [],
      removedImages: [],
      quantity: product.quantity !== undefined ? String(product.quantity) : '1',
      isAuctionProduct: product.isAuctionProduct ? 'true' : 'false',
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
    setForm({
      title: '',
      description: '',
      category: '',
      price: '',
      style: '',
      medium: '',
      tags: '',
      images: [],
      existingImages: [],
      removedImages: [],
      quantity: '1',
      isAuctionProduct: 'false',
    });
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
      formData.append('quantity', form.quantity || '1');
      formData.append('isAuctionProduct', form.isAuctionProduct || 'false');
      formData.append('style', form.style);
      formData.append('medium', form.medium);
      // Convert comma-separated tags to array
      const tagsArray = form.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      formData.append('tags', JSON.stringify(tagsArray));
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

  const loadSellerAuctions = async () => {
    try {
      setLoadingAuctions(true);
      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      const response = await api.get('/auctions');
      const sellerEmail = user?.email?.toLowerCase();
      const filtered = response.data.filter(a => a.sellerEmail?.toLowerCase() === sellerEmail);
      setAuctions(filtered);
    } catch (err) {
      console.error(err);
      setAuctionError('Failed to load your auctions');
    } finally {
      setLoadingAuctions(false);
    }
  };

  const handleAuctionSubmit = async (e) => {
    e.preventDefault();
    setAuctionError('');
    setAuctionSuccess('');

    const { productId, startingBid, reservePrice, startTime, endTime } = auctionForm;

    if (!productId || !startingBid || !startTime || !endTime) {
      setAuctionError('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingAuction(true);
      const token = localStorage.getItem('ecommerce-api-token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      await api.post('/auctions', {
        productId,
        startingBid: Number(startingBid),
        reservePrice: reservePrice ? Number(reservePrice) : undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      });
      setAuctionSuccess('Auction created successfully!');
      setAuctionForm({ productId: '', startingBid: '', reservePrice: '', startTime: '', endTime: '' });
      setShowAuctionForm(false);
      loadSellerAuctions();
      setTimeout(() => setAuctionSuccess(''), 3000);
    } catch (err) {
      setAuctionError(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setSubmittingAuction(false);
    }
  };

  const handleAuctionInputChange = (e) => {
    const { name, value } = e.target;
    setAuctionForm((prev) => ({ ...prev, [name]: value }));
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
            <p className="mt-2 text-gray-600">Welcome back, {user?.name}! Manage your products, store orders, and active auctions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setShowForm(!showForm); setShowAuctionForm(false); }}
              className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-5 py-2.5 font-bold text-white transition hover:bg-slate-700"
            >
              <Plus size={18} />
              Add Product
            </button>
            <button
              onClick={() => { setShowAuctionForm(!showAuctionForm); setShowForm(false); }}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-bold text-white transition hover:bg-red-700 shadow-md shadow-red-950/20"
            >
              <Gavel size={18} />
              Create Auction
            </button>
          </div>
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
          <button
            type="button"
            onClick={() => setActiveTab('auctions')}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === 'auctions' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            My Auctions
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
              <div className="flex h-48 items-end gap-3 pb-2">
                {dailyRevenueData.map((day) => (
                  <div key={day.label} className="flex-1 text-center flex flex-col justify-end h-full min-w-[42px]">
                    <div className="flex-1 flex items-end justify-center relative group">
                      <div
                        className="w-full rounded-t-lg bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-sm"
                        style={{
                          height: `${(day.revenue / maxDailyRevenue) * 100}%`,
                          minHeight: day.revenue > 0 ? '6px' : '3px',
                        }}
                      />
                      <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition duration-200 pointer-events-none whitespace-nowrap shadow-md z-10">
                        Rs. {day.revenue.toFixed(0)}
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-gray-500">
                      <p className="font-bold text-gray-900">Rs. {day.revenue.toFixed(0)}</p>
                      <p className="font-semibold text-gray-400 uppercase tracking-widest text-[8px] mt-0.5">{day.label}</p>
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

        {auctionError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-medium">Auction Error</p>
            <p className="text-sm">{auctionError}</p>
          </div>
        )}
        {auctionSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            <p className="font-medium">Auction Success</p>
            <p className="text-sm">{auctionSuccess}</p>
          </div>
        )}

        {/* Create Auction Form */}
        {showAuctionForm && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Gavel size={24} className="text-red-600" />
                Create New Auction
              </h2>
              <button
                onClick={() => setShowAuctionForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAuctionSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Artwork *
                </label>
                <select
                  name="productId"
                  value={auctionForm.productId}
                  onChange={handleAuctionInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                  required
                >
                  <option value="">-- Choose one of your artworks --</option>
                  {products.filter((p) => p.isAuctionProduct === true).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} (Rs. {parseFloat(p.price).toFixed(2)})
                    </option>
                  ))}
                </select>
                {products.filter((p) => p.isAuctionProduct === true).length === 0 && (
                  <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                    ⚠️ You do not have any artworks designated for auctions. Add or edit an artwork, selecting "Auction Listing" as its listing type first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid (Rs.) *
                </label>
                <input
                  type="number"
                  name="startingBid"
                  value={auctionForm.startingBid}
                  onChange={handleAuctionInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reserve Price (Rs.) - Optional
                </label>
                <input
                  type="number"
                  name="reservePrice"
                  value={auctionForm.reservePrice}
                  onChange={handleAuctionInputChange}
                  placeholder="No reserve price"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auction Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={auctionForm.startTime}
                  onChange={handleAuctionInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auction End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={auctionForm.endTime}
                  onChange={handleAuctionInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="sm:col-span-2 flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={submittingAuction}
                  className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {submittingAuction ? 'Creating...' : 'Start Auction'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuctionForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Type *
                </label>
                <div className="flex gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isAuctionProduct"
                      value="false"
                      checked={form.isAuctionProduct === 'false'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    Direct Sale (Shop)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isAuctionProduct"
                      value="true"
                      checked={form.isAuctionProduct === 'true'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    Auction Listing
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="0"
                  disabled={form.isAuctionProduct === 'true'}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style
                </label>
                <input
                  type="text"
                  name="style"
                  value={form.style}
                  onChange={handleInputChange}
                  placeholder="e.g., Modern, Vintage, Contemporary"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medium
                </label>
                <input
                  type="text"
                  name="medium"
                  value={form.medium}
                  onChange={handleInputChange}
                  placeholder="e.g., Acrylic, Oil, Watercolor"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., handmade, limited edition, personalized"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
        {activeTab === 'products' && (
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
              <div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedProducts.map((product) => (
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
                        <div className="mt-2.5 mb-3 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            product.isAuctionProduct 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {product.isAuctionProduct ? 'Auction Only' : 'Direct Sale'}
                          </span>
                          {!product.isAuctionProduct && (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              product.quantity > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800 animate-pulse'
                            }`}>
                              {product.quantity > 0 ? `Stock: ${product.quantity}` : 'Out of Stock'}
                            </span>
                          )}
                        </div>
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

                {/* Pagination Controls */}
                {totalProductsPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-1.5 pb-8 border-t border-gray-200 pt-6">
                    <button
                      type="button"
                      onClick={() => handleProductsPageChange(Math.max(productsPage - 1, 1))}
                      disabled={productsPage === 1}
                      className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Prev
                    </button>

                    {/* Mobile Page Indicator */}
                    <span className="inline-flex sm:hidden items-center justify-center h-10 px-4 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700">
                      Page {productsPage} of {totalProductsPages}
                    </span>

                    {/* Desktop Page Number Buttons */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {Array.from({ length: totalProductsPages }, (_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handleProductsPageChange(pageNum)}
                            className={`h-10 w-10 inline-flex items-center justify-center rounded-xl text-xs font-bold transition active:scale-95 ${
                              productsPage === pageNum
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleProductsPageChange(Math.min(productsPage + 1, totalProductsPages))}
                      disabled={productsPage === totalProductsPages}
                      className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
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

        {activeTab === 'auctions' && (
          <div className="mt-4">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Your Auctions</h2>

            {loadingAuctions ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                  <p className="mt-4 text-gray-600">Loading auctions...</p>
                </div>
              </div>
            ) : auctions.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
                <Gavel size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No auctions created yet. Click "Create Auction" to start listing artworks for bidding!</p>
              </div>
            ) : (
              <div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedAuctions.map((auction) => {
                    const product = auction.productId;
                    if (!product) return null;

                    return (
                      <div key={auction._id} className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden hover:shadow-lg transition flex flex-col justify-between">
                        <div>
                          <div className="relative h-40 overflow-hidden bg-gray-100 border-b border-gray-200">
                            <img
                              src={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkFydG5DcmFmdDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEFydHdvcmsgSW1hZ2U8L3RleHQ+PC9zdmc+'}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider text-white shadow-md ${
                                auction.status === 'active' ? 'bg-green-600' : auction.status === 'pending' ? 'bg-blue-600' : 'bg-slate-700'
                              }`}>
                                {auction.status}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                            
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs border border-gray-100 rounded-lg p-2.5 bg-gray-50">
                              <div>
                                <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wide">Starting Bid</p>
                                <p className="font-semibold text-gray-700 mt-0.5">Rs. {auction.startingBid.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wide">Highest Bid</p>
                                <p className="font-bold text-red-600 mt-0.5">Rs. {auction.highestBid.toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="mt-3 space-y-1 text-xs text-gray-600">
                              <p className="flex items-center gap-1.5"><Clock size={13} className="text-gray-400" /> Start: {new Date(auction.startTime).toLocaleString()}</p>
                              <p className="flex items-center gap-1.5"><Clock size={13} className="text-gray-400" /> End: {new Date(auction.endTime).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <Link
                            to={`/auctions/${auction._id}`}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-800 transition"
                          >
                            <Gavel size={14} /> View Arena & Bids ({auction.bids?.length || 0})
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalAuctionsPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-1.5 pb-8 border-t border-gray-200 pt-6">
                    <button
                      type="button"
                      onClick={() => handleAuctionsPageChange(Math.max(auctionsPage - 1, 1))}
                      disabled={auctionsPage === 1}
                      className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Prev
                    </button>

                    {/* Mobile Page Indicator */}
                    <span className="inline-flex sm:hidden items-center justify-center h-10 px-4 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700">
                      Page {auctionsPage} of {totalAuctionsPages}
                    </span>

                    {/* Desktop Page Number Buttons */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {Array.from({ length: totalAuctionsPages }, (_, index) => {
                        const pageNum = index + 1;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handleAuctionsPageChange(pageNum)}
                            className={`h-10 w-10 inline-flex items-center justify-center rounded-xl text-xs font-bold transition active:scale-95 ${
                              auctionsPage === pageNum
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAuctionsPageChange(Math.min(auctionsPage + 1, totalAuctionsPages))}
                      disabled={auctionsPage === totalAuctionsPages}
                      className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
