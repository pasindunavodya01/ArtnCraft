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

  if (authLoading) {
    return null;
  }

  if (role !== 'seller') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (role === 'seller' && user?.email) {
      loadSellerProducts();
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
      value: `$${products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-100',
      textColor: 'text-green-600',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user?.name}! Manage your products here.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {stats.map((stat) => {
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
                  Price ($) *
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

        {/* Products List */}
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
                      ${parseFloat(product.price).toFixed(2)}
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
      </div>
    </main>
  );
}
