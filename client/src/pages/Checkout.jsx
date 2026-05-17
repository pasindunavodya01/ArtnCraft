import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import api, { setAuthToken } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { auth } from '../firebaseConfig.js';
import { MapPin, Package } from 'lucide-react';

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('bank-slip');
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!address) {
      setError('Please enter a delivery address.');
      return;
    }

    if (!cart.length) {
      setError('Your cart is empty. Add items before checkout.');
      return;
    }

    try {
      setLoading(true);
      const orderPayload = {
        items: cart.map((item) => ({ productId: item._id, title: item.title, quantity: item.quantity, price: item.price, sellerEmail: item.sellerEmail })),
        total,
        address,
      };

      if (paymentMethod === 'bank-slip') {
        if (receiptFiles.length === 0) {
          setError('Please upload a bank slip or payment screenshot.');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('items', JSON.stringify(orderPayload.items));
        formData.append('total', orderPayload.total.toString());
        formData.append('address', orderPayload.address);
        formData.append('paymentMethod', 'bank-slip');
        receiptFiles.forEach((file) => formData.append('receipts', file));

        await api.post('/orders/checkout', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        clearCart();
        setSuccess('Your order has been placed successfully!');
        setTimeout(() => navigate('/'), 1800);
        return;
      }

      if (paymentMethod === 'stripe') {
        // ensure fresh Firebase ID token before calling server
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const freshToken = await currentUser.getIdToken(true);
            setAuthToken(freshToken);
          }
        } catch (err) {
          console.warn('Failed to refresh Firebase ID token', err);
        }

        const response = await api.post('/orders/stripe-session', {
          items: orderPayload.items,
          total: orderPayload.total,
          address: orderPayload.address,
          returnUrl: `${window.location.origin}/stripe-success`
        });
        window.location.href = response.data.url;
        return;
      }

      setError('Unknown payment method selected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Make sure you are logged in and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="mt-2 text-gray-600">Review your order and complete your purchase</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-8 shadow-md">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6">
                <MapPin size={24} className="text-red-600" />
                Shipping Address
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your complete delivery address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="5"
                  placeholder="Street address, city, state, postal code"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 rounded-lg border border-gray-300 p-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank-slip"
                      checked={paymentMethod === 'bank-slip'}
                      onChange={() => setPaymentMethod('bank-slip')}
                      className="h-4 w-4 text-red-600"
                    />
                    <span>
                      Bank slip / screenshot upload<br />
                      <span className="text-xs text-gray-500">Upload proof after payment and wait for seller approval.</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-gray-300 p-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="h-4 w-4 text-red-600"
                    />
                    <span>
                      Credit / debit card (Stripe)<br />
                      <span className="text-xs text-gray-500">Secure checkout with card payment.</span>
                    </span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'bank-slip' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload bank slip or payment screenshot
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setReceiptFiles(e.target.files ? Array.from(e.target.files) : [])}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">You can upload up to 5 images for the payment receipt.</p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 flex gap-2">
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 flex gap-2">
                  <span>✓</span>
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md sticky top-24">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                <Package size={24} className="text-red-600" />
                Order Summary
              </h2>

              <div className="space-y-3 border-b border-gray-200 pb-4">
                {cart.map((item) => (
                  <div key={item._id} className="flex gap-2">
                    <img src={item.images?.[0] || item.imageUrl} alt={item.title} className="h-12 w-12 rounded object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">${(total * 0.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-red-600">${(total * 1.1).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
