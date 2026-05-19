import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Gavel, Calendar, Clock, Filter, Award } from 'lucide-react';
import api from '../services/api.js';

// Ticking Countdown Component for visual feedback
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
        setTimeLeft('Auction Ended');
      } else {
        const diff = end - now;
        if (diff <= 0) {
          setTimeLeft('Auction Ended');
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

  const isEnded = timeLeft === 'Auction Ended';
  const isUpcoming = timeLeft.startsWith('Starts in:');

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
      isEnded
        ? 'bg-gray-100 text-gray-500 border border-gray-200'
        : isUpcoming
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
    }`}>
      <Clock size={12} />
      {timeLeft}
    </span>
  );
}

export default function AuctionList() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active'); // default show live

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const categories = ['All', 'Painting', 'Sculpture', 'Digital', 'Photography', 'Sketch', 'General'];

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        // Map category filter
        const categoryQuery = selectedCategory && selectedCategory !== 'All' ? `&category=${selectedCategory}` : '';
        const searchQuery = search ? `&search=${search}` : '';
        const statusQuery = selectedStatus ? `status=${selectedStatus}` : '';

        const response = await api.get(`/auctions?${statusQuery}${categoryQuery}${searchQuery}`);
        setAuctions(response.data);
      } catch (err) {
        setError('Failed to load auctions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [selectedCategory, selectedStatus, search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus, search]);

  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Pagination helper calculations
  const totalPages = Math.ceil(auctions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuctions = auctions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Banner Section */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-12 text-center sm:px-12 sm:py-16 shadow-md text-white">
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/30 border border-red-400 px-3 py-1 text-xs font-semibold text-white mb-4">
              <Gavel size={14} /> Live Bidding Arena
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Artwork Auction Arena
            </h1>
            <p className="text-sm sm:text-base text-red-50">
              Discover unique, limited-edition masterpieces and bid in real-time. Secure exclusive creation rights direct from the world's most talented independent creators.
            </p>
          </div>
        </header>

        {/* Filter Section */}
        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'active', label: 'Live Auctions' },
              { id: 'pending', label: 'Upcoming' },
              { id: 'ended', label: 'Completed' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  selectedStatus === tab.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1 lg:max-w-2xl">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search artworks, style, creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
              />
            </div>

            {/* Category Select */}
            <div className="relative">
              <Filter className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white pl-11 pr-8 py-2.5 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 appearance-none transition min-w-[160px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === 'All' ? '' : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Content Listing */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
            <p className="mt-4 text-gray-600 text-sm">Fetching masterpiece listings...</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
            <Gavel className="mx-auto text-gray-400" size={48} />
            <p className="mt-4 text-lg font-bold text-gray-900">No auctions found</p>
            <p className="mt-2 text-gray-500 text-sm max-w-md mx-auto">
              There are currently no {selectedStatus} auctions matching your filters. Check back soon or customize your filters!
            </p>
          </div>
        ) : (
          <div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedAuctions.map((auction) => {
                const product = auction.productId;
                if (!product) return null;

                const isLive = auction.status === 'active';
                const isEnded = auction.status === 'ended';
                const isUpcoming = auction.status === 'pending';

                return (
                  <article
                    key={auction._id}
                    className="group relative rounded-2xl border border-gray-200 bg-white hover:border-red-200 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col"
                  >
                    {/* Image Container */}
                    <Link
                      to={`/auctions/${auction._id}`}
                      className="relative block h-64 w-full overflow-hidden bg-gray-100"
                    >
                      <img
                        src={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkFydG5DcmFmdDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEFydHdvcmsgSW1hZ2U8L3RleHQ+PC9zdmc+'}
                        alt={product.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      
                      {/* Dark overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-80" />

                      {/* Timer Widget */}
                      <div className="absolute bottom-4 left-4">
                        <CountdownTimer
                          endTime={auction.endTime}
                          status={auction.status}
                          startTime={auction.startTime}
                        />
                      </div>

                      {/* Glowing Live/Ended Badge */}
                      <div className="absolute top-4 right-4">
                        {isLive && (
                          <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 shadow-md shadow-red-600/10">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" /> Live
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1">
                            Upcoming
                          </span>
                        )}
                        {isEnded && (
                          <span className="bg-gray-800 text-gray-100 border border-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1">
                            Ended
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Body Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Category and Creator */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-semibold uppercase tracking-wider text-red-600">
                            {product.category || 'General'}
                          </span>
                          <span className="truncate max-w-[150px]">
                            By {product.sellerEmail.split('@')[0]}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="mt-2 text-lg font-bold text-gray-900 group-hover:text-red-600 transition truncate">
                          <Link to={`/auctions/${auction._id}`}>
                            {product.title}
                          </Link>
                        </h3>

                        {/* Medium & Style */}
                        {(product.style || product.medium) && (
                          <p className="mt-1 text-xs text-gray-500 truncate">
                            {product.style} {product.style && product.medium ? '·' : ''} {product.medium}
                          </p>
                        )}

                        {/* Bidding Parameters */}
                        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Starting Bid</p>
                            <p className="text-sm font-semibold text-gray-700">Rs. {formatPrice(auction.startingBid)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                              {isEnded ? 'Winning Bid' : 'Current Bid'}
                            </p>
                            <p className="text-sm font-bold text-red-600">
                              Rs. {formatPrice(auction.highestBid > 0 ? auction.highestBid : auction.startingBid)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={13} />
                          {auction.bids?.length || 0} bid{auction.bids?.length !== 1 ? 's' : ''}
                        </span>

                        {isEnded ? (
                          <Link
                            to={`/auctions/${auction._id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-red-600 transition"
                          >
                            <Award size={14} /> View Results
                          </Link>
                        ) : (
                          <Link
                            to={`/auctions/${auction._id}`}
                            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95 shadow-md shadow-red-600/10"
                          >
                            Place Bid
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-1.5 pb-8 border-t border-gray-250 pt-6">
                {/* Prev Button */}
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

                {/* Next Button */}
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

      </div>
    </main>
  );
}
