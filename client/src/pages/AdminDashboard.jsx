import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(response.data);
      } catch (err) {
        setError('Unable to load orders. Make sure you are logged in as admin.');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  if (role !== 'admin') {
    return (
      <div className="mx-auto my-16 max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 p-10 text-slate-200 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Admin access required</h1>
        <p className="mt-3 text-slate-400">You must register as an admin to view the system dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto my-16 max-w-6xl px-4 sm:px-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-2xl">
        <h1 className="text-3xl font-semibold text-white">System admin dashboard</h1>
        <p className="mt-2 text-slate-400">Review recent checkout orders and manage store activity.</p>

        {loading ? (
          <div className="mt-10 rounded-3xl bg-slate-950 p-10 text-center text-slate-400">Loading orders…</div>
        ) : error ? (
          <div className="mt-10 rounded-3xl bg-rose-900 p-10 text-center text-rose-200">{error}</div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.length === 0 ? (
              <div className="rounded-3xl bg-slate-950 p-8 text-slate-400">No orders have been placed yet.</div>
            ) : orders.map((order) => (
              <div key={order._id} className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Order #{order._id.slice(-6)}</h2>
                    <p className="text-sm text-slate-400">{order.customerEmail}</p>
                  </div>
                  <span className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">{order.status}</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Items</p>
                    <p className="mt-2 text-lg font-semibold text-white">{order.items.length}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="mt-2 text-lg font-semibold text-white">${order.total.toFixed(2)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Address</p>
                    <p className="mt-2 text-sm text-slate-200">{order.address}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
