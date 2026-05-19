import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Gavel, Clock, History, AlertCircle, Sparkles, Trophy, ShieldAlert, ArrowLeft, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
      navigate('/login');
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center py-20 text-slate-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-red-600" />
        <p className="mt-4 text-slate-400 text-sm">Loading masterpiece arena...</p>
      </div>
    );
  }

  if (error || !auction || !auction.productId) {
    return (
      <div className="min-h-screen bg-slate-950 py-16 px-4 text-center text-slate-100 flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Arena Unavailable</h2>
        <p className="text-slate-400 mt-2 max-w-sm">{error || 'This auction is not available or has been deleted.'}</p>
        <Link to="/auctions" className="mt-6 inline-flex items-center gap-1 bg-red-600 px-6 py-2.5 rounded-xl font-bold text-white hover:bg-red-700">
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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Navigation Breadcrumb */}
        <Link to="/auctions" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition mb-6">
          <ArrowLeft size={14} /> Back to Auction Arena
        </Link>

        {/* Celebration Winner Banner */}
        {userIsWinner && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500 bg-gradient-to-r from-emerald-950 to-slate-950 p-6 sm:p-8 shadow-2xl mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-800">
                <Trophy size={24} className="animate-bounce" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 mb-1">
                  Congratulations!
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">YOU WON THIS ARTWORK!</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Your winning bid of <strong className="text-emerald-400 font-bold">Rs. {formatPrice(auction.highestBid)}</strong> was selected. Please complete your payment to finalize shipment.
                </p>
              </div>
            </div>
            {auction.orderId && (
              <Link
                to={`/pay-order/${auction.orderId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-950/20 text-sm whitespace-nowrap self-start sm:self-center"
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
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl relative">
              <img
                src={product.images?.[activeImage] || 'https://via.placeholder.com/800x600'}
                alt={product.title}
                className="w-full h-auto max-h-[500px] object-contain mx-auto"
              />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {isLive && (
                  <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 shadow-md shadow-red-950/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" /> Live Arena
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
            </div>

            {/* Thumbnail Navigation */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-900 ${
                      activeImage === index ? 'border-red-600' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Detailed Description */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 backdrop-blur shadow-xl">
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                {product.category || 'General'}
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-1">{product.title}</h1>
              <p className="text-slate-400 text-xs mt-1">Created & Owned by {product.sellerEmail}</p>

              <hr className="border-slate-800 my-5" />

              <h3 className="text-sm font-bold text-slate-300">Artwork details & description</h3>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              {/* Specific specifications */}
              {(product.style || product.medium || product.tags?.length > 0) && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800/80 pt-6">
                  {product.style && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Style</p>
                      <p className="text-xs text-slate-300 mt-0.5">{product.style}</p>
                    </div>
                  )}
                  {product.medium && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Medium</p>
                      <p className="text-xs text-slate-300 mt-0.5">{product.medium}</p>
                    </div>
                  )}
                  {product.tags?.length > 0 && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.tags.map((t, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 via-transparent to-transparent pointer-events-none" />

              {/* Countdown Ticker */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className={isLive ? 'text-red-500 animate-spin' : ''} /> Time Status
                </span>
                <span className={`text-sm font-bold ${
                  isEnded ? 'text-slate-400' : isUpcoming ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {timeLeft}
                </span>
              </div>

              {/* Bidding Summary parameters */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-950 p-4 border border-slate-800/80 mb-5">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Starting Bid</p>
                  <p className="text-lg font-bold text-slate-200">Rs. {formatPrice(auction.startingBid)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    {isEnded ? 'Winning Bid' : 'Current Highest Bid'}
                  </p>
                  <p className="text-xl font-black text-red-500">
                    Rs. {formatPrice(auction.highestBid > 0 ? auction.highestBid : auction.startingBid)}
                  </p>
                </div>
              </div>

              {/* Context Feedback Cards */}
              {userIsSeller && (
                <div className="rounded-xl bg-blue-950/20 border border-blue-900/40 p-4 mb-5 flex gap-2.5 text-xs text-blue-400">
                  <ShieldAlert size={18} className="shrink-0" />
                  <div>
                    <span className="font-bold">You own this artwork.</span> Sellers are not permitted to bid on their own listings to protect auction transparency.
                  </div>
                </div>
              )}

              {userIsHighestBidder && isLive && (
                <div className="rounded-xl bg-emerald-950/20 border border-emerald-900/40 p-4 mb-5 flex gap-2.5 text-xs text-emerald-400">
                  <Sparkles size={18} className="shrink-0" />
                  <div>
                    <span className="font-bold">You are the highest bidder!</span> You currently hold the leading bid. Keep an eye on it in case someone tries to outbid you!
                  </div>
                </div>
              )}

              {/* Place Bid Interactive Form */}
              {isLive && !userIsSeller && (
                <form onSubmit={handleBidSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Place your bid (Minimum: Rs. {formatPrice(minRequiredBid)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-sm font-bold text-slate-400">Rs.</span>
                      <input
                        type="number"
                        placeholder={minRequiredBid.toFixed(2)}
                        min={minRequiredBid}
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  {bidError && (
                    <div className="rounded-lg bg-red-950/40 border border-red-900/40 p-3 text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      {bidError}
                    </div>
                  )}

                  {bidSuccess && (
                    <div className="rounded-lg bg-emerald-950/40 border border-emerald-900/40 p-3 text-xs text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      {bidSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={placingBid}
                    className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-3 font-bold text-white transition active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-red-950/30 text-sm"
                  >
                    <Gavel size={18} />
                    {placingBid ? 'Submitting Bid...' : 'Place Bid'}
                  </button>
                </form>
              )}

              {/* Login CTA if unauthenticated */}
              {!user && isLive && (
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 py-3 font-bold text-white transition text-sm shadow-lg shadow-red-950/20"
                >
                  <Gavel size={18} /> Login to Place Bid
                </Link>
              )}

              {/* Upcoming Details */}
              {isUpcoming && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center py-6">
                  <Calendar className="mx-auto text-slate-500 mb-2" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auction Upcoming</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[250px] mx-auto">
                    This artwork's bidding arena starts at: {formatDate(auction.startTime)}
                  </p>
                </div>
              )}

              {/* Ended Details */}
              {isEnded && !userIsWinner && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center py-6">
                  <Trophy className="mx-auto text-slate-600 mb-2" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auction Completed</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[250px] mx-auto">
                    This bidding arena has ended. {auction.winnerEmail ? 'A winner has been declared!' : 'Ended without bids.'}
                  </p>
                </div>
              )}
            </div>

            {/* Bid History list */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-4">
                <History size={16} className="text-slate-400" />
                Bidding History ({auction.bids?.length || 0})
              </h3>

              {auction.bids?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No bids have been placed yet. Be the first to place a bid!
                </div>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {[...auction.bids].sort((a, b) => b.amount - a.amount).map((bid, idx) => {
                    const isBidderEmailMe = user?.email?.toLowerCase() === bid.buyerEmail?.toLowerCase();
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs ${
                          idx === 0
                            ? 'bg-red-950/20 border border-red-900/40 text-red-200 font-bold'
                            : 'bg-slate-950/60 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="flex items-center gap-1">
                            {bid.buyerName || bid.buyerEmail.split('@')[0]}
                            {isBidderEmailMe && (
                              <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 rounded px-1">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
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
