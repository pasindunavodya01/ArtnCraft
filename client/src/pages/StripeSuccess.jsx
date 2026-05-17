import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function StripeSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Confirming payment...');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const confirm = async () => {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        setError('Missing Stripe session ID.');
        setLoading(false);
        return;
      }

      try {
        const response = await api.post('/orders/stripe-confirm', { sessionId });
        setMessage(`Payment confirmed! Your order #${response.data._id.slice(-6)} is now paid.`);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not confirm Stripe payment.');
      } finally {
        setLoading(false);
      }
    };

    confirm();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          {loading ? (
            <div>
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
              <p className="mt-6 text-gray-600">{message}</p>
            </div>
          ) : error ? (
            <div>
              <p className="text-lg font-semibold text-red-700">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
              >
                Back to shop
              </button>
            </div>
          ) : (
            <div>
              <CheckCircle size={48} className="mx-auto text-red-600" />
              <h1 className="mt-6 text-3xl font-bold text-gray-900">Payment Successful</h1>
              <p className="mt-4 text-gray-600">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
              >
                Back to Marketplace <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
