import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

const enrichCartItems = async (items) => {
  if (!items?.length) return [];

  const productIds = items
    .map((item) => item.productId)
    .filter(Boolean);

  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
    : [];
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return items.map((item) => {
    const itemObj = item.toObject ? item.toObject() : { ...item };
    const product = productMap.get(String(itemObj.productId));
    const images = (itemObj.images?.length ? itemObj.images : null)
      || (product?.images?.length ? product.images : []);

    return {
      ...itemObj,
      productId: itemObj.productId,
      title: itemObj.title || product?.title,
      category: itemObj.category || product?.category,
      price: itemObj.price || product?.price,
      priceNumber: itemObj.priceNumber ?? product?.priceNumber,
      sellerEmail: itemObj.sellerEmail || product?.sellerEmail,
      images,
    };
  });
};

const sanitizeCartItems = (items) => items.map((item) => ({
  productId: item.productId || item._id,
  title: item.title,
  price: item.price != null ? String(item.price) : undefined,
  priceNumber: item.priceNumber,
  quantity: item.quantity || 1,
  sellerEmail: item.sellerEmail,
  images: Array.isArray(item.images) ? item.images : [],
  category: item.category,
}));

// Get current user's cart (create if missing)
router.get('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    let cart = await Cart.findOne({ userEmail: email });
    if (!cart) {
      cart = await Cart.create({ userEmail: email, items: [] });
    }
    const enrichedItems = await enrichCartItems(cart.items);
    res.json({ ...cart.toObject(), items: enrichedItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch cart' });
  }
});

// Replace entire cart
router.put('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const items = sanitizeCartItems(Array.isArray(req.body.items) ? req.body.items : []);
    const cart = await Cart.findOneAndUpdate(
      { userEmail: email },
      { items },
      { upsert: true, new: true }
    );
    const enrichedItems = await enrichCartItems(cart.items);
    res.json({ ...cart.toObject(), items: enrichedItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update cart' });
  }
});

// Add single item (increments quantity if exists)
router.post('/add', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const item = req.body.item;
    if (!item || !item.productId) return res.status(400).json({ message: 'Invalid item' });

    const cart = await Cart.findOne({ userEmail: email }) || await Cart.create({ userEmail: email, items: [] });
    const existing = cart.items.find((i) => String(i.productId) === String(item.productId));
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      cart.items.push({ ...item, quantity: item.quantity || 1 });
    }
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to add item to cart' });
  }
});

// Clear cart
router.delete('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const cart = await Cart.findOneAndUpdate({ userEmail: email }, { items: [] }, { new: true });
    res.json(cart || { userEmail: email, items: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to clear cart' });
  }
});

export default router;
