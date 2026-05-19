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
        ? 'bg-slate-800 text-slate-400'
        : isUpcoming
          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 animate-pulse'
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

  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Banner Section */}
        <header className="relative overflow-hidden rounded-3xl border border-red-900/40 bg-gradient-to-r from-red-950 to-slate-900 px-6 py-12 text-center sm:px-12 sm:py-16 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950 border border-red-800 px-3 py-1 text-xs font-semibold text-red-400 mb-4">
              <Gavel size={14} /> Live Bidding Arena
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4 bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
              ARTWORK AUCTION ARENA
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Discover unique, limited-edition masterpieces and bid in real-time. Secure exclusive creation rights direct from the world's most talented independent creators.
            </p>
          </div>
        </header>

        {/* Filter Section */}
        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
                    ? 'bg-red-600 text-white shadow-md shadow-red-900/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search artworks, style, creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition"
              />
            </div>

            {/* Category Select */}
            <div className="relative">
              <Filter className="absolute left-4 top-3 text-slate-400" size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-8 py-2.5 text-sm text-slate-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 appearance-none transition min-w-[160px]"
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
          <div className="mt-8 rounded-xl border border-red-800/40 bg-red-950/20 p-4 text-center text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-red-600" />
            <p className="mt-4 text-slate-400 text-sm">Fetching masterpiece listings...</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center shadow-xl">
            <Gavel className="mx-auto text-slate-600" size={48} />
            <p className="mt-4 text-lg font-bold text-slate-300">No auctions found</p>
            <p className="mt-2 text-slate-400 text-sm max-w-md mx-auto">
              There are currently no {selectedStatus} auctions matching your filters. Check back soon or customize your filters!
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => {
              const product = auction.productId;
              if (!product) return null;

              const isLive = auction.status === 'active';
              const isEnded = auction.status === 'ended';
              const isUpcoming = auction.status === 'pending';

              return (
                <article
                  key={auction._id}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 overflow-hidden shadow-md hover:shadow-2xl hover:border-red-900/40 transition duration-300 flex flex-col"
                >
                  {/* Image Container */}
                  <Link
                    to={`/auctions/${auction._id}`}
                    className="relative block h-64 w-full overflow-hidden bg-slate-950"
                  >
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/400x300'}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

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
                        <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 shadow-md shadow-red-950/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" /> Live
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1">
                          Upcoming
                        </span>
                      )}
                      {isEnded && (
                        <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1">
                          Ended
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category and Creator */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold uppercase tracking-wider text-red-500">
                          {product.category || 'General'}
                        </span>
                        <span className="truncate max-w-[150px]">
                          By {product.sellerEmail.split('@')[0]}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mt-2 text-lg font-bold text-white group-hover:text-red-400 transition truncate">
                        <Link to={`/auctions/${auction._id}`}>
                          {product.title}
                        </Link>
                      </h3>

                      {/* Medium & Style */}
                      {(product.style || product.medium) && (
                        <p className="mt-1 text-xs text-slate-400 truncate">
                          {product.style} {product.style && product.medium ? '·' : ''} {product.medium}
                        </p>
                      )}

                      {/* Bidding Parameters */}
                      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-950/80 p-3.5 border border-slate-800/80">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Starting Bid</p>
                          <p className="text-sm font-semibold text-slate-300">Rs. {formatPrice(auction.startingBid)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            {isEnded ? 'Winning Bid' : 'Current Bid'}
                          </p>
                          <p className="text-sm font-bold text-red-400">
                            Rs. {formatPrice(auction.highestBid > 0 ? auction.highestBid : auction.startingBid)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={13} />
                        {auction.bids?.length || 0} bid{auction.bids?.length !== 1 ? 's' : ''}
                      </span>

                      {isEnded ? (
                        <Link
                          to={`/auctions/${auction._id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition"
                        >
                          <Award size={14} /> View Results
                        </Link>
                      ) : (
                        <Link
                          to={`/auctions/${auction._id}`}
                          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95 shadow-md shadow-red-950/20"
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
        )}

      </div>
    </main>
  );
}
