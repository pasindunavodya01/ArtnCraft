import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star, Flag } from 'lucide-react';
import api from '../services/api.js';
import ProductCard from '../components/ProductCard.jsx';
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
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('product_issue');
  const [reportSubject, setReportSubject] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

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
    if (!user?.email || !id) return;
    api.post(`/interactions/view/${id}`).catch(() => {});
  }, [id, user?.email]);

  useEffect(() => {
    const loadWishlistStatus = async () => {
      if (!user?.email) {
        setInWishlist(false);
        return;
      }
      try {
        const response = await api.get('/wishlist');
        const ids = (response.data.productIds || []).map(String);
        setInWishlist(ids.includes(String(id)));
      } catch {
        setInWishlist(false);
      }
    };
    loadWishlistStatus();
  }, [id, user?.email]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user?.email) {
        setRecommendations([]);
        return;
      }
      try {
        const response = await api.get(`/recommendations?limit=4&exclude=${id}`);
        setRecommendations(response.data.recommendations || []);
      } catch {
        setRecommendations([]);
      }
    };
    loadRecommendations();
  }, [id, user?.email]);

  const toggleWishlist = async () => {
    if (!user?.email) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${id}`);
        setInWishlist(false);
      } else {
        await api.post(`/wishlist/${id}`);
        setInWishlist(true);
      }
    } catch {
      // keep current state on error
    } finally {
      setWishlistLoading(false);
    }
  };

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

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    setReportMessage('');

    if (!reportSubject.trim() || !reportDescription.trim()) {
      setReportMessage('Please provide a subject and description.');
      return;
    }

    try {
      setReportSubmitting(true);
      await api.post('/reports', {
        type: reportType,
        subject: reportSubject,
        description: reportDescription,
        productId: product._id,
        sellerEmail: product.sellerEmail,
      });
      setReportMessage('Report submitted successfully.');
      setTimeout(() => {
        setShowReportModal(false);
        setReportType('product_issue');
        setReportSubject('');
        setReportDescription('');
        setReportMessage('');
      }, 2000);
    } catch (err) {
      setReportMessage(err.response?.data?.message || 'Unable to submit report.');
    } finally {
      setReportSubmitting(false);
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700"
        >
          <ArrowLeft size={18} /> Back to products
        </button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-5">
              <div className="overflow-hidden rounded-3xl bg-gray-100">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.title}
                    className="h-[340px] w-full object-cover sm:h-[460px] lg:h-[560px]"
                  />
                ) : (
                  <div className="flex h-[340px] items-center justify-center text-gray-500 sm:h-[460px] lg:h-[560px]">No image available</div>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {images.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`overflow-hidden rounded-2xl border bg-gray-100 p-1 transition ${index === activeImage ? 'border-red-600' : 'border-gray-200 hover:border-gray-300'} focus:outline-none`}
                    >
                      <img src={img} alt={`${product.title} ${index + 1}`} className="h-20 w-full rounded-xl object-cover sm:h-24" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Category</p>
                <p className="mt-3 text-xl font-bold text-gray-900">{product.category || 'General'}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  {product.style && <p>Style: {product.style}</p>}
                  {product.medium && <p>Medium: {product.medium}</p>}
                </div>
                {product.tags?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Seller</p>
                <p className="mt-3 break-words text-lg font-bold text-gray-900">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.sellerEmail && (
                    <Link
                      to={`/seller/products?email=${encodeURIComponent(product.sellerEmail)}`}
                      className="inline-flex rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-gray-50 hover:text-red-700"
                    >
                      View seller products
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <Flag size={16} />
                    Report
                  </button>
                </div>
              </div>
            </div>

            {user && recommendations.length > 0 && (
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">You may also like</p>
                    <p className="mt-2 text-sm text-gray-600">Matched to your browsing and purchase preferences</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {recommendations.map((item) => (
                    <ProductCard key={item._id} product={item} onAdd={addToCart} />
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Customer Reviews</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {reviews.length > 0 ? `${(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} out of 5` : 'No reviews yet'}
                  </p>
                </div>
                <p className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
                  {reviews.length > 0 ? `${reviews.length} review${reviews.length > 1 ? 's' : ''}` : 'Be the first to review'}
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  {reviewLoading ? (
                    <div className="rounded-2xl bg-gray-50 p-6 text-center text-gray-600">Loading reviews…</div>
                  ) : reviewError ? (
                    <div className="rounded-2xl bg-red-50 p-6 text-center text-red-700">{reviewError}</div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 p-6 text-center text-gray-600">
                          This product doesn’t have any reviews yet.
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div key={review._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
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
                            <p className="mt-4 leading-7 text-gray-700">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Leave your review</p>
                  {user ? (
                    <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Rating</label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                size={28}
                                className={star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Review</label>
                        <textarea
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          rows="5"
                          placeholder="Share your experience with this product"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      {reviewError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{reviewError}</div>}
                      {reviewSuccess && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{reviewSuccess}</div>}

                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="w-full rounded-2xl bg-red-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
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
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Product details</p>
              <h1 className="mt-3 text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">{product.title}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="rounded-full bg-red-50 px-3 py-1.5 text-base font-bold text-red-700">Rs. {parseFloat(product.price).toFixed(2)}</p>
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

              <p className="mt-5 text-sm sm:text-base leading-relaxed text-gray-700">{product.description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <button
                  onClick={() => addToCart(product)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  disabled={!user || wishlistLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
                    inWishlist
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                  } disabled:opacity-60`}
                >
                  <Heart size={18} className={inWishlist ? 'fill-red-600 text-red-600' : ''} />
                  <span>{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>

              {!user && (
                <p className="mt-4 text-sm text-gray-600">Log in to save items to your wishlist and get personalized recommendations.</p>
              )}
            </div>

            <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-gray-100 p-5">
                <p className="text-sm text-gray-500">Created</p>
                <p className="mt-2 font-semibold text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded-2xl bg-gray-100 p-5">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="mt-2 font-semibold text-gray-900">{new Date(product.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Product features</p>
              <ul className="mt-5 space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-600"></span>
                  Ultra-high quality seller-made item
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-600"></span>
                  Multiple gallery images for better preview
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-600"></span>
                  Fast checkout and secure order flow
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900">Report Issue</h2>
            <p className="mt-2 text-sm text-gray-600">Help us improve by reporting problems with this product or seller.</p>

            <form onSubmit={handleReportSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
                >
                  <option value="product_issue">Product Issue</option>
                  <option value="seller_complaint">Seller Complaint</option>
                  <option value="technical_error">Technical Error</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={reportSubject}
                  onChange={(e) => setReportSubject(e.target.value)}
                  placeholder="Brief subject line"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide details about the issue..."
                  rows="4"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
                  required
                />
              </div>

              {reportMessage && (
                <div className={`rounded-lg p-3 text-sm ${reportMessage.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {reportMessage}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}