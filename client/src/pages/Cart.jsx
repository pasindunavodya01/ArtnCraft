import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { formatPrice, getItemImage, getItemUnitPrice } from '../utils/cart.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Trash2, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, refreshCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) refreshCart();
  }, [user?.email]);

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md">
            <h1 className="text-3xl font-bold text-gray-900">Your cart is empty</h1>
            <p className="mt-4 text-gray-600">Add products from the homepage to start shopping.</p>
            <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-red-600 px-8 py-3 font-bold text-white transition hover:bg-red-700">
              Continue Shopping <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="mt-2 text-gray-600">Review and manage your items</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white shadow-md overflow-hidden">
              {cart.map((item, index) => (
                <div key={item._id} className={`p-6 ${index !== 0 ? 'border-t border-gray-200' : ''}`}>
                  <div className="flex gap-4">
                    {getItemImage(item) ? (
                      <img src={getItemImage(item)} alt={item.title} className="h-24 w-24 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-500">
                        No image
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{item.category}</p>
                      <p className="mt-2 text-lg font-bold text-gray-900">Rs. {formatPrice(getItemUnitPrice(item))}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => updateQuantity(item._id, Number(e.target.value))}
                        className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-center text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-600 hover:text-red-700 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/" className="mt-4 inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
              ← Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md sticky top-24">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

              <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">Rs. {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-gray-900">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">Rs. {(total * 0.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-red-600">Rs. {(total * 1.1).toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-6 w-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={20} />
              </button>

              {!user && (
                <p className="mt-4 text-center text-sm text-gray-600">
                  You'll be asked to log in on the next step
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
