import express from 'express';
import Order from '../models/Order.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { items, total, address } = req.body;
    if (!items || !items.length || !total || !address) {
      return res.status(400).json({ message: 'Incomplete order information' });
    }

    const order = await Order.create({
      customerEmail: req.user.email,
      items,
      total,
      address,
      status: 'pending'
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Checkout failed' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can access orders' });
    }
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch orders' });
  }
});

export default router;
