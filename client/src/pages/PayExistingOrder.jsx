import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { MapPin, Package, CreditCard, FileImage, AlertCircle, Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export default function PayExistingOrder() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank-slip');
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [address, setAddress] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await api.get('/orders/customer');
        const found = response.data.find((o) => o._id === id);
        if (!found) {
          setError('Order not found or you are not authorized to view it.');
        } else if (found.paymentStatus !== 'pending') {
          setError('This order is not pending payment.');
        } else {
          setOrder(found);
          // Set initial address if already filled (though usually it's placeholder)
          if (found.address && found.address !== 'Pending Payment (Auction Win)') {
            setAddress(found.address);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!address.trim()) {
      setError('Please provide a complete shipping address.');
      return;
    }

    try {
      setSubmitting(true);

      if (paymentMethod === 'bank-slip') {
        if (receiptFiles.length === 0) {
          setError('Please upload at least one bank slip or payment receipt.');
          setSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('address', address.trim());
        receiptFiles.forEach((file) => formData.append('receipts', file));

        await api.post(`/orders/${id}/pay-existing`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setSuccess('Your payment receipt has been uploaded successfully! Waiting for seller approval.');
        setTimeout(() => navigate('/account?tab=orders'), 2000);
      } else if (paymentMethod === 'stripe') {
        const response = await api.post(`/orders/${id}/stripe-session`, {
          address: address.trim(),
          returnUrl: `${window.location.origin}/stripe-success`
        });
        
        window.location.href = response.data.url;
      } else {
        setError('Invalid payment method selected.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Payment submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 text-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600" />
        <p className="mt-4 text-gray-600 text-sm font-medium">Fetching invoice details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4 text-center text-gray-900 flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Checkout Unavailable</h2>
        <p className="text-gray-500 mt-2 max-w-sm">{error || 'This order does not exist or has been paid already.'}</p>
        <Link to="/account?tab=orders" className="mt-6 inline-flex items-center gap-1.5 bg-red-600 px-6 py-2.5 rounded-xl font-bold text-white hover:bg-red-700 transition">
          <ArrowLeft size={16} /> View My Orders
        </Link>
      </div>
    );
  }

  const orderItem = order.items?.[0] || {};

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        
        {/* Back Link */}
        <Link to="/account?tab=orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition mb-6">
          <ArrowLeft size={14} /> Back to My Orders
        </Link>

        <header className="mb-8">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full mb-2">
            Auction Win Invoice
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Masterpiece Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">Order Ref: #{order._id.slice(-6).toUpperCase()} · Secure payment portal</p>
        </header>

        {/* Content Split: Form & Summary */}
        <div className="grid gap-8 lg:grid-cols-12">
                    {/* LEFT: Shipping & Payment Options Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Shipping Address Inputs */}
              <div>
                <h2 className="flex items-center gap-2 text-md font-bold text-gray-900 mb-3">
                  <MapPin size={18} className="text-red-600" />
                  Delivery Shipping Address
                </h2>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase font-semibold">
                  Enter complete delivery coordinates
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="4"
                  placeholder="Street Address, Appt/Suite, City, State, ZIP/Postal Code, Country"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition leading-relaxed"
                  required
                />
              </div>

              {/* Payment Methods Choice */}
              <div>
                <h2 className="flex items-center gap-2 text-md font-bold text-gray-900 mb-3">
                  <CreditCard size={18} className="text-red-600" />
                  Select Payment Mechanism
                </h2>
                
                <div className="space-y-3">
                  {/* Bank Slip Upload */}
                  <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'bank-slip'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank-slip"
                      checked={paymentMethod === 'bank-slip'}
                      onChange={() => setPaymentMethod('bank-slip')}
                      className="h-4 w-4 text-red-655 focus:ring-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Bank Transfer / Receipt Screenshot</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Pay manually to our corporate bank slip and upload screenshot. Order shifts to awaiting seller approval.
                      </p>
                    </div>
                  </label>

                  {/* Credit Card Stripe */}
                  <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'stripe'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="h-4 w-4 text-red-655 focus:ring-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Credit Card (Stripe Checkout)</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Instant secure checkout with Visa, Mastercard, or AMEX. Order resolves immediately as PAID.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Upload Receipt Files (Bank slip only) */}
              {paymentMethod === 'bank-slip' && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                    <FileImage size={14} className="text-gray-500" />
                    Upload Transfer Proof
                  </h3>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setReceiptFiles(e.target.files ? Array.from(e.target.files) : [])}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs text-gray-600 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-red-50 file:text-red-700 file:cursor-pointer hover:file:bg-red-100 transition"
                    required={paymentMethod === 'bank-slip'}
                  />
                  <p className="text-[10px] text-gray-500 mt-1.5">You can upload up to 5 clear transaction receipts screenshots.</p>
                </div>
              )}

              {/* Error and Success Feedback Alerts */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle size={16} className="shrink-0 animate-bounce" />
                  <span>{success}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-3.5 font-bold text-white transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {submitting ? 'Processing Submission...' : paymentMethod === 'stripe' ? 'Redirecting to Stripe...' : 'Complete Payment Upload'}
              </button>

            </form>
          </div>

          {/* RIGHT: Order Summary details */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sticky top-6 space-y-5">
              
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                <Package size={16} className="text-red-600" />
                Purchase Summary
              </h2>

              {/* Product Artwork Item Description */}
              <div className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="h-16 w-16 rounded-lg bg-gray-200 border border-gray-300 overflow-hidden flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">WIN</span>
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{orderItem.title || 'Masterpiece Artwork'}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Quantity: 1 item</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">Seller: {orderItem.sellerEmail}</p>
                </div>
              </div>

              {/* Price Calculation breakdown */}
              <div className="space-y-2.5 text-xs border-b border-gray-100 pb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Winning Bid Amount</span>
                  <span className="font-semibold text-gray-800">Rs. {formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Packaging & Shipping</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">Complimentary</span>
                </div>
              </div>

              {/* Total Price display */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs font-bold text-gray-900 uppercase">Invoice Total</span>
                <span className="text-2xl font-black text-red-600">Rs. {formatPrice(order.total)}</span>
              </div>

              {/* Small Security Badge */}
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex gap-2 items-center text-[10px] text-gray-500">
                <Sparkles size={14} className="text-red-600 shrink-0" />
                <span>Verification guarantee: Artworks are held in seller escrow until payment and shipping completes safely.</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
