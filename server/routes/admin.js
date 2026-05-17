import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [userCounts, productCount, orderStats, reviewCount] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Product.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0],
              },
            },
            pending: {
              $sum: {
                $cond: [
                  { $in: ['$paymentStatus', ['pending', 'awaiting_approval']] },
                  1,
                  0,
                ],
              },
            },
            paid: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'rejected'] }, 1, 0] },
            },
          },
        },
      ]),
      Review.countDocuments(),
    ]);

    const usersByRole = userCounts.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {});

    const orders = orderStats[0] || { total: 0, revenue: 0, pending: 0, paid: 0, rejected: 0 };

    res.json({
      users: {
        total: Object.values(usersByRole).reduce((sum, n) => sum + n, 0),
        customers: usersByRole.customer || 0,
        sellers: usersByRole.seller || 0,
        admins: usersByRole.admin || 0,
      },
      products: productCount,
      orders,
      reviews: reviewCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load admin stats' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role && ['customer', 'seller', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }
    const users = await User.find(filter).select('name email role createdAt').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch users' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (String(user._id) === String(req.user.id) && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin access' });
    }

    user.role = role;
    await user.save();
    res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update user role' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (String(user._id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account from the admin panel' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete user' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category) filter.category = new RegExp(`^${category}$`, 'i');
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { description: regex }, { sellerEmail: regex }, { category: regex }];
    }
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch products' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Review.deleteMany({ productId: product._id });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete product' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.paymentStatus = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch orders' });
  }
});

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const allowed = ['pending', 'awaiting_approval', 'paid', 'rejected'];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update order status' });
  }
});

router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(200);
    const productIds = [...new Set(reviews.map((r) => String(r.productId)))];
    const products = await Product.find({ _id: { $in: productIds } }).select('title');
    const productMap = Object.fromEntries(products.map((p) => [String(p._id), p.title]));

    res.json(reviews.map((review) => ({
      ...review.toObject(),
      productTitle: productMap[String(review.productId)] || 'Unknown product',
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch reviews' });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid review id' });
    }
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete review' });
  }
});

export default router;
