import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Gavel, ArrowRight, Clock } from 'lucide-react';
import api from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

function CountdownTimer({ endTime, status, startTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (status === 'pending' && start > now) {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`Starts in: ${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m ${secs}s`);
      } else if (now > end || status === 'ended') {
        setTimeLeft('Ended');
      } else {
        const diff = end - now;
        if (diff <= 0) {
          setTimeLeft('Ended');
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m ${secs}s left`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime, startTime, status]);

  const isEnded = timeLeft === 'Ended';
  const isUpcoming = timeLeft.startsWith('Starts in:');

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      isEnded
        ? 'bg-gray-100 text-gray-500'
        : isUpcoming
          ? 'bg-amber-50 text-amber-700'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse'
    }`}>
      <Clock size={10} />
      {timeLeft}
    </span>
  );
}

export default function Homepage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [categories, setCategories] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
      if (!user?.email || role !== 'customer') {
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
  }, [user?.email, role]);

  useEffect(() => {
    const loadLiveAuctions = async () => {
      try {
        setAuctionsLoading(true);
        const response = await api.get('/auctions?status=active');
        setLiveAuctions(response.data.slice(0, 2));
      } catch (err) {
        console.warn('Unable to load live auctions for homepage hero.', err);
      } finally {
        setAuctionsLoading(false);
      }
    };
    loadLiveAuctions();
  }, []);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Support Local Artisans & Crafters</h1>
              <p className="mt-4 text-lg text-red-50">Discover unique, handcrafted items from painters, hand crafters, and independent artists.</p>
              <p className="mt-2 text-sm text-red-100">Shop directly from creators and empower local businesses today.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#products" className="rounded-md bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-gray-50">
                  Shop Now
                </a>
                <Link to="/auctions" className="rounded-md border-2 border-white px-6 py-3 font-bold text-white transition hover:bg-white hover:text-red-600 flex items-center gap-2">
                  <Gavel size={18} /> Visit Auctions
                </Link>
                {!user && (
                  <a href="/register" className="rounded-md border-2 border-white px-6 py-3 font-bold text-white transition hover:bg-white hover:text-red-600">
                    Sign Up
                  </a>
                )}
              </div>
            </div>
            {!auctionsLoading && liveAuctions.length > 0 ? (
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-red-100 flex flex-col justify-between h-full min-h-[350px]">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                      Live Bidding Arena
                    </span>
                    <Link
                      to="/auctions"
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 group transition"
                    >
                      View All <ArrowRight size={12} className="group-hover:translate-x-0.5 transition duration-300" />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {liveAuctions.map((auction) => {
                      const product = auction.productId;
                      if (!product) return null;
                      return (
                        <Link
                          key={auction._id}
                          to={`/auctions/${auction._id}`}
                          className="group flex gap-3 p-2.5 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50/20 transition duration-300"
                        >
                          <img
                            src={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=='}
                            alt={product.title}
                            className="h-14 w-14 rounded-xl object-cover border border-gray-100 shadow-sm flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-red-600 transition">
                              {product.title}
                            </h4>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-xs font-black text-red-600">
                                Rs. {(auction.highestBid > 0 ? auction.highestBid : auction.startingBid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <CountdownTimer
                                endTime={auction.endTime}
                                status={auction.status}
                                startTime={auction.startTime}
                              />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/auctions"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3.5 font-bold text-white transition duration-300 hover:from-red-700 hover:to-red-800 active:scale-95 shadow-md shadow-red-600/10 group text-sm"
                  >
                    <Gavel size={16} className="group-hover:rotate-12 transition duration-300" />
                    Enter Bidding Arena
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition duration-300" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-red-100 flex flex-col justify-between h-full min-h-[350px]">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                    Live Auctions Arena
                  </span>
                  <h3 className="mt-4 text-2xl font-black text-gray-900 leading-tight">
                    Bid Real-Time on Handcrafted Masterpieces
                  </h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    Join dynamic live auctions for premium, one-of-a-kind local creations. Connect directly with independent creators and place your winning bid today.
                  </p>
                </div>
                <div className="mt-8">
                  <Link
                    to="/auctions"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 font-bold text-white transition duration-300 hover:from-red-700 hover:to-red-800 active:scale-95 shadow-md shadow-red-600/10 group"
                  >
                    <Gavel size={18} className="group-hover:rotate-12 transition duration-300" />
                    Enter Bidding Arena
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition duration-300" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {user && role === 'customer' && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Recommended for You</h2>
              <p className="mt-2 text-gray-600">
                Based on your views, wishlist, cart, and purchases
              </p>
              {preferences?.topCategories?.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Preferences: {preferences.topCategories.map((c) => c.name).join(', ')}
                  {preferences.priceRange && ` · Rs.${preferences.priceRange.min.toFixed(0)}–Rs.${preferences.priceRange.max.toFixed(0)}`}
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
                Browse local crafts and artworks, add items to your wishlist or cart, and we&apos;ll personalize recommendations just for you.
              </p>
            )}
          </section>
        )}

        {/* Products Section */}
        <section id="products">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Local Creations</h2>
              <p className="mt-2 text-gray-600">Discover unique items made by local artists and creators</p>
            </div>
            <form onSubmit={handleFilterSubmit} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] w-full max-w-7xl">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search artworks, crafts, or local sellers"
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
                <option value="0-50">Rs. 0 - Rs. 50</option>
                <option value="50-100">Rs. 50 - Rs. 100</option>
                <option value="100-200">Rs. 100 - Rs. 200</option>
                <option value="200-500">Rs. 200 - Rs. 500</option>
                <option value="500+">Rs. 500+</option>
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
            <div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} onAdd={handleAdd} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-1.5 pb-8 border-t border-gray-250 pt-6">
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
                  >
                    Prev
                  </button>

                  {/* Mobile Page Indicator */}
                  <span className="inline-flex sm:hidden items-center justify-center h-10 px-4 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  {/* Desktop Page Number Buttons */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNum = index + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-10 w-10 inline-flex items-center justify-center rounded-xl text-xs font-bold transition active:scale-95 ${
                            currentPage === pageNum
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
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
