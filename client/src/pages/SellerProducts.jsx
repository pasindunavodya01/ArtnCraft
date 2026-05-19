import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Store } from 'lucide-react';
import api from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../contexts/CartContext.jsx';

export default function SellerProducts() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const sellerEmail = searchParams.get('email') || '';

  useEffect(() => {
    const loadSellerProducts = async () => {
      if (!sellerEmail) {
        setError('Seller email is required to view this shop.');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/products?sellerEmail=${encodeURIComponent(sellerEmail)}`);
        setProducts(response.data);
      } catch (err) {
        setError('Unable to load seller products.');
      } finally {
        setLoading(false);
      }
    };

    loadSellerProducts();
  }, [sellerEmail]);

  const handleAdd = (product) => addToCart(product);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-red-600">
              <Store size={18} /> Seller Shop
            </p>
            <h1 className="mt-3 text-4xl font-bold text-gray-900">{sellerEmail || 'Unknown Seller'}</h1>
            <p className="mt-2 text-gray-600">Browse all products from this seller in one place.</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-600 hover:text-red-600"
          >
            <ArrowLeft size={18} /> Back to marketplace
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
            <p className="mt-4 text-gray-600">Loading products…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-red-50 p-10 text-center text-red-700 shadow-sm">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-semibold text-gray-900">No products found for this seller.</p>
            <p className="mt-3 text-gray-600">The seller may not have added any items yet.</p>
          </div>
        ) : (
          <div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} onAdd={handleAdd} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-1.5 pb-8 border-t border-gray-255 pt-6">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 px-4 items-center justify-center rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  Prev
                </button>

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
