import { ShoppingCart, Star } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
  const rating = Math.floor(Math.random() * 2) + 4; // Random 4-5 stars for demo
  const reviews = Math.floor(Math.random() * 1000) + 100;

  return (
    <div className="group rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-lg overflow-hidden">
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
          Sale
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {product.category || 'General'}
        </p>

        {/* Title */}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-red-600">
          {product.title}
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
                className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">({reviews} reviews)</span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
          <span className="text-sm text-gray-500 line-through">${(product.price * 1.3).toFixed(2)}</span>
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
