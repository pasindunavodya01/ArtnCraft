import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Homepage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productForm, setProductForm] = useState({
    title: '', description: '', category: '', style: '', medium: '', tags: '', price: '', images: [],
  });
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [sellerFilter, setSellerFilter] = useState(searchParams.get('seller') || '');
  const [priceFilter, setPriceFilter] = useState(searchParams.get('price') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'newest');
  const { addToCart } = useCart();
  const { role, user } = useAuth();

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setCategoryFilter(searchParams.get('category') || '');
    setSellerFilter(searchParams.get('seller') || '');
    setPriceFilter(searchParams.get('price') || '');
    setSortOrder(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchParams.get('search')) params.set('search', searchParams.get('search'));
        if (searchParams.get('category')) params.set('category', searchParams.get('category'));
        if (searchParams.get('seller')) params.set('seller', searchParams.get('seller'));
        if (searchParams.get('price')) params.set('price', searchParams.get('price'));
        if (searchParams.get('sort')) params.set('sort', searchParams.get('sort'));

        const response = await api.get(`/products?${params.toString()}`);
        setProducts(response.data);
        const categoryOptions = Array.from(new Set(response.data.map((product) => product.category || 'General'))).filter(Boolean).sort();
        setCategories(categoryOptions);
      } catch (err) {
        setError('Unable to load products.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [searchParams]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user?.email) {
        setRecommendations([]);
        setPreferences(null);
        return;
      }
      try {
        setRecLoading(true);
        const response = await api.get('/recommendations?limit=8');
        setRecommendations(response.data.recommendations || []);
        setPreferences(response.data.preferences || null);
      } catch {
        setRecommendations([]);
      } finally {
        setRecLoading(false);
      }
    };
    loadRecommendations();
  }, [user?.email]);

  const handleAdd = (product) => addToCart(product);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    const params = {};
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (categoryFilter) params.category = categoryFilter;
    if (sellerFilter.trim()) params.seller = sellerFilter.trim();
    if (priceFilter) params.price = priceFilter;
    if (sortOrder) params.sort = sortOrder;
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSellerFilter('');
    setPriceFilter('');
    setSortOrder('newest');
    setSearchParams({});
  };

  const handleInput = (event) => {
    const { name, value, files } = event.target;
    if (name === 'images') {
      setProductForm((prev) => ({ ...prev, images: files ? Array.from(files) : [] }));
      return;
    }
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    if (!productForm.images?.length) {
      setError('Please choose at least one image for the product.');
      return;
    }

    const formData = new FormData();
    formData.append('title', productForm.title);
    formData.append('description', productForm.description);
    formData.append('category', productForm.category);
    formData.append('style', productForm.style);
    formData.append('medium', productForm.medium);
    formData.append('tags', productForm.tags);
    formData.append('price', productForm.price);
    productForm.images.forEach((image) => formData.append('images', image));

    try {
      const token = authTokenFromStorage();
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      const response = await api.post('/products/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProducts((prev) => [response.data, ...prev]);
      setSuccess('Product added successfully.');
      setProductForm({
        title: '', description: '', category: '', style: '', medium: '', tags: '', price: '', images: [],
      });
    } catch (err) {
      setError('Unable to add product. Ensure you are logged in as a seller.');
    }
  };

  const authTokenFromStorage = () => localStorage.getItem('ecommerce-api-token');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl font-bold sm:text-5xl">Summer Mega Sale</h1>
              <p className="mt-4 text-lg text-red-50">Up to 70% off on our best sellers!</p>
              <p className="mt-2 text-sm text-red-100">Limited time offer - Shop now and save big</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#products" className="rounded-md bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-gray-50">
                  Shop Now
                </a>
                {!user && (
                  <a href="/register" className="rounded-md border-2 border-white px-6 py-3 font-bold text-white transition hover:bg-white hover:text-red-600">
                    Sign Up
                  </a>
                )}
              </div>
            </div>
            <div className="rounded-lg overflow-hidden bg-white p-6 shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-2xl font-bold text-red-600">{products.length}</p>
                  <p className="text-sm text-gray-600">Products</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="text-2xl font-bold text-red-600">{user ? role.charAt(0).toUpperCase() + role.slice(1) : 'Join'}</p>
                  <p className="text-sm text-gray-600">Your Role</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Seller Dashboard */}
        {role === 'seller' && (
          <div className="mb-12 rounded-lg border border-gray-200 bg-white p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900">Upload New Product</h2>
            <p className="mt-2 text-gray-600">Add your products to our marketplace</p>
            <form onSubmit={handleProductSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                name="title"
                value={productForm.title}
                onChange={handleInput}
                placeholder="Product title"
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="category"
                value={productForm.category}
                onChange={handleInput}
                placeholder="Category (e.g. Paintings)"
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="style"
                value={productForm.style}
                onChange={handleInput}
                placeholder="Style (e.g. Abstract)"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="medium"
                value={productForm.medium}
                onChange={handleInput}
                placeholder="Medium (e.g. Oil on canvas)"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="tags"
                value={productForm.tags}
                onChange={handleInput}
                placeholder="Tags (comma-separated)"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="price"
                value={productForm.price}
                onChange={handleInput}
                placeholder="Price"
                type="number"
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                name="images"
                onChange={handleInput}
                type="file"
                accept="image/*"
                multiple
                required
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <textarea
                name="description"
                value={productForm.description}
                onChange={handleInput}
                rows="4"
                placeholder="Product description"
                required
                className="col-span-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              ></textarea>
              <button
                type="submit"
                className="col-span-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700"
              >
                Upload Product
              </button>
            </form>
            {success && <p className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">{success}</p>}
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
          </div>
        )}

        {user && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Recommended for You</h2>
              <p className="mt-2 text-gray-600">
                Based on your views, wishlist, cart, and purchases
              </p>
              {preferences?.topCategories?.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Preferences: {preferences.topCategories.map((c) => c.name).join(', ')}
                  {preferences.priceRange && ` · $${preferences.priceRange.min.toFixed(0)}–$${preferences.priceRange.max.toFixed(0)}`}
                </p>
              )}
            </div>
            {recLoading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-red-600" />
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recommendations.map((product) => (
                  <ProductCard key={product._id} product={product} onAdd={handleAdd} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
                Browse artworks, add items to your wishlist or cart, and we&apos;ll personalize recommendations.
              </p>
            )}
          </section>
        )}

        {/* Products Section */}
        <section id="products">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="mt-2 text-gray-600">Discover our best-selling items</p>
            </div>
            <form onSubmit={handleFilterSubmit} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] w-full max-w-7xl">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products or sellers"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                type="text"
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                placeholder="Seller email"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">All categories</option>
                {categories.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>{categoryOption}</option>
                ))}
              </select>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">All prices</option>
                <option value="0-50">$0 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="200-500">$200 - $500</option>
                <option value="500+">$500+</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="newest">Newest</option>
                <option value="priceAsc">Price: low to high</option>
                <option value="priceDesc">Price: high to low</option>
              </select>
              <div className="sm:col-span-1 flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                <p className="mt-4 text-gray-600">Loading products…</p>
              </div>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-lg bg-red-50 p-12 text-center text-red-800">{error}</div>
          ) : products.length === 0 ? (
            <div className="mt-8 text-center py-12">
              <p className="text-gray-600">No products available yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} onAdd={handleAdd} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
