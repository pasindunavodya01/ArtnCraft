import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import UserInteraction from '../models/UserInteraction.js';
import Review from '../models/Review.js';

const INTERACTION_WEIGHTS = {
  purchase: 5,
  cart: 4,
  wishlist: 3,
  view: 1,
};

const MATCH_SCORES = {
  category: 12,
  style: 10,
  medium: 10,
  tag: 6,
  price: 8,
};

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

const addToMap = (map, key, weight) => {
  if (!key) return;
  const normalized = String(key).trim();
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) || 0) + weight);
};

const addTagsToMap = (map, tags, weight) => {
  if (!Array.isArray(tags)) return;
  tags.forEach((tag) => addToMap(map, tag, weight));
};

function buildPreferenceProfile(interactedProducts) {
  const categories = new Map();
  const styles = new Map();
  const mediums = new Map();
  const tags = new Map();
  const prices = [];

  interactedProducts.forEach(({ product, weight }) => {
    if (!product) return;
    addToMap(categories, product.category, weight);
    addToMap(styles, product.style, weight);
    addToMap(mediums, product.medium, weight);
    addTagsToMap(tags, product.tags, weight);
    if (typeof product.priceNumber === 'number' && product.priceNumber >= 0) {
      for (let i = 0; i < Math.ceil(weight); i += 1) {
        prices.push(product.priceNumber);
      }
    }
  });

  prices.sort((a, b) => a - b);
  const priceMin = prices.length ? prices[Math.floor(prices.length * 0.15)] : null;
  const priceMax = prices.length ? prices[Math.floor(prices.length * 0.85)] : null;

  return { categories, styles, mediums, tags, priceMin, priceMax };
}

function mapPreferenceScore(map, value) {
  if (!value) return 0;
  const weight = map.get(String(value).trim()) || 0;
  if (weight <= 0) return 0;
  const maxWeight = Math.max(...map.values(), 1);
  return weight / maxWeight;
}

function scoreProduct(product, profile, excludeIds) {
  if (excludeIds.has(String(product._id))) return -1;

  let score = 0;

  score += mapPreferenceScore(profile.categories, product.category) * MATCH_SCORES.category;
  score += mapPreferenceScore(profile.styles, product.style) * MATCH_SCORES.style;
  score += mapPreferenceScore(profile.mediums, product.medium) * MATCH_SCORES.medium;

  if (Array.isArray(product.tags)) {
    product.tags.forEach((tag) => {
      score += mapPreferenceScore(profile.tags, tag) * MATCH_SCORES.tag;
    });
  }

  if (profile.priceMin != null && profile.priceMax != null && typeof product.priceNumber === 'number') {
    if (product.priceNumber >= profile.priceMin && product.priceNumber <= profile.priceMax) {
      score += MATCH_SCORES.price;
    } else {
      const mid = (profile.priceMin + profile.priceMax) / 2;
      const range = Math.max(profile.priceMax - profile.priceMin, 50);
      const distance = Math.abs(product.priceNumber - mid);
      const proximity = Math.max(0, 1 - distance / (range * 1.5));
      score += proximity * (MATCH_SCORES.price * 0.5);
    }
  }

  if (product.ratingAvg >= 4) score += 2;
  if (product.reviewCount >= 3) score += 1;

  return score;
}

async function enrichWithRatings(products) {
  const productIds = products.map((p) => p._id);
  const reviewSummary = await Review.aggregate([
    { $match: { productId: { $in: productIds } } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  const reviewMap = reviewSummary.reduce((acc, item) => {
    acc[item._id.toString()] = item;
    return acc;
  }, {});

  return products.map((product) => {
    const productObj = product.toObject ? product.toObject() : product;
    const summary = reviewMap[product._id.toString()];
    return {
      ...productObj,
      ratingAvg: summary ? Number(summary.avgRating.toFixed(1)) : 0,
      reviewCount: summary ? summary.reviewCount : 0,
    };
  });
}

async function collectBuyerActivity(userEmail) {
  const email = normalizeEmail(userEmail);
  const emailMatch = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  const interacted = [];
  const seenProductIds = new Set();
  const purchasedIds = new Set();

  const [views, wishlist, cart, orders] = await Promise.all([
    UserInteraction.find({ userEmail: emailMatch, type: 'view' }).sort({ updatedAt: -1 }).limit(100),
    Wishlist.findOne({ userEmail: emailMatch }),
    Cart.findOne({ userEmail: emailMatch }),
    Order.find({ customerEmail: emailMatch }),
  ]);

  const addInteraction = (productId, type) => {
    const id = String(productId);
    if (!id || id === 'undefined') return;
    interacted.push({ productId: id, weight: INTERACTION_WEIGHTS[type], type });
    seenProductIds.add(id);
    if (type === 'purchase') purchasedIds.add(id);
  };

  views.forEach((entry) => addInteraction(entry.productId, 'view'));

  if (wishlist?.productIds?.length) {
    wishlist.productIds.forEach((productId) => addInteraction(productId, 'wishlist'));
  }

  if (cart?.items?.length) {
    cart.items.forEach((item) => addInteraction(item.productId, 'cart'));
  }

  orders.forEach((order) => {
    order.items.forEach((item) => addInteraction(item.productId, 'purchase'));
  });

  const productIds = [...seenProductIds];
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
    : [];
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const interactedProducts = interacted
    .map(({ productId, weight, type }) => ({
      product: productMap.get(productId),
      weight,
      type,
    }))
    .filter((entry) => entry.product);

  return { interactedProducts, purchasedIds, activityCount: interacted.length };
}

export async function getRecommendationsForUser(userEmail, { limit = 12, excludeProductId } = {}) {
  const { interactedProducts, purchasedIds, activityCount } = await collectBuyerActivity(userEmail);

  const excludeIds = new Set(purchasedIds);
  if (excludeProductId) excludeIds.add(String(excludeProductId));

  let candidates = await Product.find({}).sort({ createdAt: -1 }).limit(200);
  candidates = await enrichWithRatings(candidates);

  if (activityCount === 0) {
    const fallback = candidates
      .filter((p) => !excludeIds.has(String(p._id)))
      .sort((a, b) => (b.ratingAvg - a.ratingAvg) || (b.reviewCount - a.reviewCount))
      .slice(0, limit);
    return { recommendations: fallback, preferences: null, hasActivity: false };
  }

  const profile = buildPreferenceProfile(interactedProducts);

  const scored = candidates
    .map((product) => ({
      product,
      score: scoreProduct(product, profile, excludeIds),
      recommendationScore: 0,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      ...entry.product,
      recommendationScore: Number(entry.score.toFixed(2)),
    }));

  const preferences = {
    topCategories: [...profile.categories.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, weight]) => ({ name, weight })),
    topStyles: [...profile.styles.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, weight]) => ({ name, weight })),
    topMediums: [...profile.mediums.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, weight]) => ({ name, weight })),
    topTags: [...profile.tags.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, weight]) => ({ name, weight })),
    priceRange: profile.priceMin != null
      ? { min: profile.priceMin, max: profile.priceMax }
      : null,
  };

  return { recommendations: scored, preferences, hasActivity: true };
}

export async function recordProductView(userEmail, productId) {
  const email = normalizeEmail(userEmail);
  await UserInteraction.findOneAndUpdate(
    { userEmail: email, productId, type: 'view' },
    { userEmail: email, productId, type: 'view' },
    { upsert: true, new: true }
  );
}
