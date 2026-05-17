import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star } from 'lucide-react';
import api from '../services/api.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError('Unable to load product details.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      setReviewLoading(true);
      setReviewError('');

      try {
        const response = await api.get(`/reviews/product/${id}`);
        setReviews(response.data);

        if (user?.email) {
          const existing = response.data.find((review) => review.userEmail === user.email);
          if (existing) {
            setRating(existing.rating);
            setComment(existing.comment);
          } else {
            setRating(5);
            setComment('');
          }
        }
      } catch (err) {
        setReviewError('Unable to load reviews.');
      } finally {
        setReviewLoading(false);
      }
    };

    loadReviews();
  }, [id, user?.email]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!comment.trim() || rating < 1 || rating > 5) {
      setReviewError('Please provide a rating and a review comment.');
      return;
    }

    try {
      setReviewSubmitting(true);
      await api.post(`/reviews/${id}`, { rating, comment });
      setReviewSuccess('Your review has been submitted.');
      const refreshed = await api.get(`/reviews/product/${id}`);
      setReviews(refreshed.data);
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Unable to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
            <p className="text-lg font-semibold">{error || 'Product not found.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 rounded-md bg-red-600 px-5 py-2.5 text-white transition hover:bg-red-700"
            >
              Back to products
            </button>
          </div>
        </div>
      </main>
    );
  }

  const images = product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [];
  const selectedImage = images[activeImage] || images[0];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
        >
          <ArrowLeft size={18} /> Back to products
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="overflow-hidden rounded-3xl bg-gray-100">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.title}
                    className="h-[480px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[480px] items-center justify-center text-gray-500">No image available</div>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 grid gap-3 grid-cols-4">
                  {images.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`overflow-hidden rounded-2xl border ${index === activeImage ? 'border-red-600' : 'border-gray-200'} focus:outline-none`}
                    >
                      <img src={img} alt={`${product.title} ${index + 1}`} className="h-24 w-full object-cover transition hover:opacity-90" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Category</p>
                <p className="mt-3 text-lg font-semibold text-gray-900">{product.category || 'General'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Seller</p>
                <p className="mt-3 text-lg font-semibold text-gray-900">
                  {product.sellerEmail ? (
                    <Link
                      to={`/seller/products?email=${encodeURIComponent(product.sellerEmail)}`}
                      className="text-red-600 transition hover:text-red-700"
                    >
                      {product.sellerEmail}
                    </Link>
                  ) : (
                    'Unknown'
                  )}
                </p>
                {product.sellerEmail && (
                  <Link
                    to={`/seller/products?email=${encodeURIComponent(product.sellerEmail)}`}
                    className="mt-3 inline-block text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    View all products from this seller
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Product details</p>
              <h1 className="mt-4 text-4xl font-bold text-gray-900">{product.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">${parseFloat(product.price).toFixed(2)}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / (reviews.length || 1))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                  <span>
                    {reviews.length > 0
                      ? `${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} · ${reviews.length} review${reviews.length > 1 ? 's' : ''}`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>

              <p className="mt-6 text-gray-700 leading-8">{product.description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-gray-100 p-5">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="mt-2 text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="rounded-2xl bg-gray-100 p-5">
                  <p className="text-sm text-gray-500">Last updated</p>
                  <p className="mt-2 text-gray-900">{new Date(product.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                onClick={() => addToCart(product)}
                className="mt-8 w-full rounded-2xl bg-red-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-red-700"
              >
                <ShoppingCart size={18} className="inline-block align-text-bottom" />
                <span className="ml-2">Add to Cart</span>
              </button>

              {!user && (
                <p className="mt-4 text-sm text-gray-600">Log in to save this item or checkout faster.</p>
              )}

              <div className="mt-8 rounded-3xl bg-gray-50 p-6 shadow-sm">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Customer Reviews</p>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {reviews.length > 0 ? `${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} out of 5` : 'No reviews yet'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {reviews.length > 0 ? `${reviews.length} review${reviews.length > 1 ? 's' : ''}` : 'Be the first to review'}
                  </p>
                </div>

                {reviewLoading ? (
                  <div className="rounded-2xl bg-white p-6 text-center text-gray-600">Loading reviews…</div>
                ) : reviewError ? (
                  <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">{reviewError}</div>
                ) : (
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <div className="rounded-2xl bg-white p-6 text-center text-gray-600">
                        This product doesn’t have any reviews yet.
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review._id} className="rounded-2xl bg-white p-6 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{review.userName || review.userEmail}</p>
                              <p className="mt-1 text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              {[...Array(5)].map((_, index) => (
                                <Star
                                  key={index}
                                  size={14}
                                  className={index < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-4 text-gray-700">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="mt-8 rounded-2xl bg-white p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Leave your review</p>
                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Rating</label>
                        <select
                          value={rating}
                          onChange={(event) => setRating(Number(event.target.value))}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Review</label>
                        <textarea
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          rows="4"
                          placeholder="Share your experience with this product"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      {reviewError && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{reviewError}</div>
                      )}
                      {reviewSuccess && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{reviewSuccess}</div>
                      )}

                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="rounded-2xl bg-red-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                      >
                        {reviewSubmitting ? 'Saving review…' : 'Submit review'}
                      </button>
                    </form>
                  ) : (
                    <p className="mt-4 text-sm text-gray-600">Please log in to write a review.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Product features</p>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-600"></span>
                  Ultra-high quality seller-made item
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-600"></span>
                  Multiple gallery images for better preview
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-600"></span>
                  Fast checkout and secure order flow
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
