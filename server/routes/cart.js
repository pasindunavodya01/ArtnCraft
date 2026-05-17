import express from 'express';
import Cart from '../models/Cart.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get current user's cart (create if missing)
router.get('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    let cart = await Cart.findOne({ userEmail: email });
    if (!cart) {
      cart = await Cart.create({ userEmail: email, items: [] });
    }
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch cart' });
  }
});

// Replace entire cart
router.put('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = await Cart.findOneAndUpdate(
      { userEmail: email },
      { items },
      { upsert: true, new: true }
    );
    res.json(cart);
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
