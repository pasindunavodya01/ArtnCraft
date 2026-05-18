import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
  const rating = product.ratingAvg || 0;
  const reviewCount = product.reviewCount || 0;
  const averageRounded = rating ? Math.round(rating) : 0;

  return (
    <div className="group rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-lg overflow-hidden">
      {/* Image Container */}
      <Link to={`/product/${product._id}`} className="relative block h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0] || product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {product.images?.length > 1 && (
          <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            {product.images.length} photos
          </div>
        )}
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
          Sale
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {product.category || 'General'}
        </p>

        {/* Title */}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-red-600">
          <Link to={`/product/${product._id}`} className="block">
            {product.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs text-gray-600">
          {product.description}
        </p>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < averageRounded ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">
            {reviewCount > 0 ? `${rating.toFixed(1)} · ${reviewCount} review${reviewCount > 1 ? 's' : ''}` : 'No reviews yet'}
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">Rs. {parseFloat(product.price).toFixed(2)}</span>
          <span className="text-sm text-gray-500 line-through">Rs. {(parseFloat(product.price) * 1.3).toFixed(2)}</span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAdd(product)}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-md bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 active:scale-95"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
