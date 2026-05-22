import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Gavel, Clock, History, AlertCircle, Sparkles, Trophy, ShieldAlert, ArrowLeft, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [bidError, setBidError] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  // Timer interval reference
  const timerRef = useRef(null);

  const fetchAuctionDetails = async () => {
    try {
      const response = await api.get(`/auctions/${id}`);
      setAuction(response.data);
      if (response.data.productId?.images?.length) {
        setActiveImage(0);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load auction details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionDetails();
    
    // Polling details every 5 seconds to get live bids without WebSockets
    const pollInterval = setInterval(fetchAuctionDetails, 5000);
    return () => clearInterval(pollInterval);
  }, [id]);

  useEffect(() => {
    if (!auction) return;

    const calculateTime = () => {
      const now = new Date();
      const start = new Date(auction.startTime);
      const end = new Date(auction.endTime);

      if (auction.status === 'pending' && start > now) {
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`Starts in: ${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m ${secs}s`);
      } else if (now > end || auction.status === 'ended') {
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
    timerRef.current = setInterval(calculateTime, 1000);
    return () => clearInterval(timerRef.current);
  }, [auction]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const amount = Number(bidAmount);
    const minBid = auction.bids?.length > 0
      ? auction.highestBid + 1
      : auction.startingBid;

    if (isNaN(amount) || amount < minBid) {
      setBidError(`Your bid must be at least Rs. ${minBid.toFixed(2)}`);
      return;
    }

    try {
      setPlacingBid(true);
      const response = await api.post(`/auctions/${id}/bid`, { amount });
      setAuction(response.data);
      setBidAmount('');
      setBidSuccess('Your bid was placed successfully!');
      setTimeout(() => setBidSuccess(''), 4000);
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to place your bid. Please try again.');
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 text-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600" />
        <p className="mt-4 text-gray-600 text-sm">Loading masterpiece arena...</p>
      </div>
    );
  }

  if (error || !auction || !auction.productId) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 text-center text-gray-900 flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Arena Unavailable</h2>
        <p className="text-gray-500 mt-2 max-w-sm">{error || 'This auction is not available or has been deleted.'}</p>
        <Link to="/auctions" className="mt-6 inline-flex items-center gap-1 bg-red-600 px-6 py-2.5 rounded-xl font-bold text-white hover:bg-red-700 transition">
          <ArrowLeft size={16} /> Return to Arenas
        </Link>
      </div>
    );
  }

  const product = auction.productId;
  const isEnded = timeLeft === 'Auction Ended' || auction.status === 'ended';
  const isUpcoming = timeLeft.startsWith('Starts in:');
  const isLive = !isEnded && !isUpcoming;

  // Next required bid amount
  const minRequiredBid = auction.bids?.length > 0
    ? auction.highestBid + 1
    : auction.startingBid;

  const userIsSeller = user?.email?.toLowerCase() === auction.sellerEmail?.toLowerCase();
  const userIsHighestBidder = user?.email?.toLowerCase() === auction.highestBidder?.toLowerCase();
  const userIsWinner = isEnded && auction.winnerEmail && user?.email?.toLowerCase() === auction.winnerEmail?.toLowerCase();

  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (val) => {
    return new Date(val).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Navigation Breadcrumb */}
        <Link to="/auctions" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition mb-6">
          <ArrowLeft size={14} /> Back to Auction Arena
        </Link>

        {/* Celebration Winner Banner */}
        {userIsWinner && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Trophy size={24} className="animate-bounce" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 mb-1">
                  Congratulations!
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">YOU WON THIS ARTWORK!</h2>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">
                  Your winning bid of <strong className="text-emerald-700 font-bold">Rs. {formatPrice(auction.highestBid)}</strong> was selected. Please complete your payment to finalize shipment.
                </p>
              </div>
            </div>
            {auction.orderId && (
              <Link
                to={`/pay-order/${auction.orderId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700 active:scale-95 shadow-sm text-sm whitespace-nowrap self-start sm:self-center"
              >
                <Sparkles size={16} /> Complete Payment Now
              </Link>
            )}
          </div>
        )}

        {/* Grid Layout: Images & Bid Controls */}
        <div className="grid gap-10 lg:grid-cols-12">
          
          {/* LEFT: Image Gallery & Product Metadata */}
          <div className="lg:col-span-7 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm relative">
              <div className="overflow-hidden rounded-2xl bg-gray-100">
                <img
                  src={product.images?.[activeImage] || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkFydG5DcmFmdDwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEFydHdvcmsgSW1hZ2U8L3RleHQ+PC9zdmc+'}
                  alt={product.title}
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>
              
              {/* Status Badge */}
              <div className="absolute top-8 right-8">
                {isLive && (
                  <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 shadow-md shadow-red-600/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" /> Live Arena
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
            </div>

            {/* Thumbnail Navigation */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 ${
                      activeImage === index ? 'border-red-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Detailed Description */}
            <section className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                {product.category || 'General'}
              </span>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-1">{product.title}</h1>
              <p className="text-gray-500 text-xs mt-1">Created & Owned by {product.sellerEmail}</p>

              <hr className="border-gray-100 my-5" />

              <h3 className="text-sm font-bold text-gray-900">Artwork details & description</h3>
              <p className="text-gray-700 text-sm mt-2 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              {/* Specific specifications */}
              {(product.style || product.medium || product.tags?.length > 0) && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                  {product.style && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Style</p>
                      <p className="text-xs text-gray-800 mt-0.5">{product.style}</p>
                    </div>
                  )}
                  {product.medium && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Medium</p>
                      <p className="text-xs text-gray-800 mt-0.5">{product.medium}</p>
                    </div>
                  )}
                  {product.tags?.length > 0 && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.tags.map((t, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-200">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Bidding Panel & Bid History */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Countdown & Bidding Controls */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 via-transparent to-transparent pointer-events-none" />

              {/* Countdown Ticker */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className={isLive ? 'text-red-500 animate-spin' : ''} /> Time Status
                </span>
                <span className={`text-sm font-bold ${
                  isEnded ? 'text-gray-500' : isUpcoming ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {timeLeft}
                </span>
              </div>

              {/* Bidding Summary parameters */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 border border-gray-100 mb-5">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Starting Bid</p>
                  <p className="text-lg font-bold text-gray-800">Rs. {formatPrice(auction.startingBid)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    {isEnded ? 'Winning Bid' : 'Current Highest Bid'}
                  </p>
                  <p className="text-xl font-black text-red-600">
                    Rs. {formatPrice(auction.highestBid > 0 ? auction.highestBid : auction.startingBid)}
                  </p>
                </div>
              </div>

              {/* Context Feedback Cards */}
              {userIsSeller && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-5 flex gap-2.5 text-xs text-blue-700">
                  <ShieldAlert size={18} className="shrink-0" />
                  <div>
                    <span className="font-bold">You own this artwork.</span> Sellers are not permitted to bid on their own listings to protect auction transparency.
                  </div>
                </div>
              )}

              {userIsHighestBidder && isLive && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mb-5 flex gap-2.5 text-xs text-emerald-700">
                  <Sparkles size={18} className="shrink-0" />
                  <div>
                    <span className="font-bold">You are the highest bidder!</span> You currently hold the leading bid. Keep an eye on it in case someone tries to outbid you!
                  </div>
                </div>
              )}

              {/* Place Bid Interactive Form */}
              {isLive && user && !userIsSeller && (
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Place your bid (Minimum: Rs. {formatPrice(minRequiredBid)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-sm font-bold text-gray-400">Rs.</span>
                      <input
                        type="number"
                        placeholder={minRequiredBid.toFixed(2)}
                        min={minRequiredBid}
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 py-3 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {bidError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      {bidError}
                    </div>
                  )}

                  {bidSuccess && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      {bidSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={placingBid}
                    className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-3 font-bold text-white transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <Gavel size={18} />
                    {placingBid ? 'Submitting Bid...' : 'Place Bid'}
                  </button>
                </form>
              )}

              {/* Login CTA if unauthenticated */}
              {!user && isLive && (
                <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-6 text-center shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />
                  <Gavel className="mx-auto text-red-600 mb-3 animate-pulse" size={32} />
                  <h4 className="text-sm font-bold text-gray-900">Bidding Arena Locked</h4>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                    You must be signed in to your ArtnCraft account to participate and place live bids on this artwork.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <Link
                      to="/login"
                      state={{ from: location }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-755 py-3 font-bold text-white transition active:scale-[0.98] text-sm shadow-sm font-sans"
                    >
                      Sign In to Place Bid
                    </Link>
                    <Link
                      to="/register"
                      state={{ from: location }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 py-3 font-semibold text-gray-700 transition active:scale-[0.98] text-sm shadow-sm"
                    >
                      Create Free Account
                    </Link>
                  </div>
                </div>
              )}

              {/* Upcoming Details */}
              {isUpcoming && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center py-6">
                  <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Auction Upcoming</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">
                    This artwork's bidding arena starts at: {formatDate(auction.startTime)}
                  </p>
                </div>
              )}

              {/* Ended Details */}
              {isEnded && !userIsWinner && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center py-6">
                  <Trophy className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Auction Completed</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">
                    This bidding arena has ended. {auction.winnerEmail ? 'A winner has been declared!' : 'Ended without bids.'}
                  </p>
                </div>
              )}
            </div>

            {/* Bid History list */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3 mb-4">
                <History size={16} className="text-gray-500" />
                Bidding History ({auction.bids?.length || 0})
              </h3>

              {auction.bids?.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No bids have been placed yet. Be the first to place a bid!
                </div>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {[...auction.bids].sort((a, b) => b.amount - a.amount).map((bid, idx) => {
                    const isBidderEmailMe = user?.email?.toLowerCase() === bid.buyerEmail?.toLowerCase();
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs border ${
                          idx === 0
                            ? 'bg-red-50 border-red-200 text-red-900 font-bold'
                            : 'bg-gray-50 border-gray-100 text-gray-800'
                        }`}
                      >
                        <div>
                          <p className="flex items-center gap-1">
                            {bid.buyerName || bid.buyerEmail?.split('@')[0] || 'Anonymous'} 
                            {isBidderEmailMe && (
                              <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 rounded px-1 font-semibold">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {formatDate(bid.timestamp)}
                          </p>
                        </div>
                        <p className="font-mono text-sm font-bold">
                          Rs. {formatPrice(bid.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
