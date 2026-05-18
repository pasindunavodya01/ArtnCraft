import express from 'express';
import multer from 'multer';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { verifyToken } from '../middleware/verifyToken.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const uploadBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: 'ecommerce-order-receipts' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    uploadStream.end(buffer);
  });
};

const getUploadedImages = async (files) => {
  const uploads = files.map((file) => uploadBuffer(file.buffer));
  const results = await Promise.all(uploads);
  return results.map((result) => result.secure_url);
};

const buildSellerApprovals = (items) => {
  const sellerMap = {};
  items.forEach((item) => {
    const sellerEmail = item.sellerEmail?.toLowerCase?.() || item.sellerEmail || '';
    if (sellerEmail) {
      sellerMap[sellerEmail] = true;
    }
  });
  return Object.keys(sellerMap).map((sellerEmail) => ({ sellerEmail, status: 'pending' }));
};

const parseOrderItems = (items) => {
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return items;
};

router.post('/checkout', verifyToken, upload.array('receipts', 5), async (req, res) => {
  try {
    const paymentMethod = req.body.paymentMethod || 'bank-slip';
    let items = parseOrderItems(req.body.items);
    const total = Number(req.body.total);
    const address = req.body.address;

    if (!items || !items.length || !total || !address) {
      return res.status(400).json({ message: 'Incomplete order information' });
    }

    if (paymentMethod === 'bank-slip' && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Please upload a bank slip or payment screenshot' });
    }

    const receiptUrls = req.files?.length ? await getUploadedImages(req.files) : [];
    // ensure numeric price values for order items
    items = (items || []).map((it) => ({ ...it, price: Number(it.price) }));
    const sellerApprovals = buildSellerApprovals(items);

    const order = await Order.create({
      customerEmail: req.user.email,
      customerName: req.user.name || req.user.email,
      items,
      total,
      address,
      paymentMethod,
      paymentStatus: paymentMethod === 'bank-slip' ? 'awaiting_approval' : 'pending',
      receiptUrls,
      sellerApprovals
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Checkout failed' });
  }
});

router.post('/stripe-session', verifyToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured on the server' });
    }

    const { items, total, address, returnUrl } = req.body;
    const parsedItems = parseOrderItems(items);

    if (!parsedItems || !parsedItems.length || !total || !address || !returnUrl) {
      return res.status(400).json({ message: 'Incomplete Stripe checkout details' });
    }

    const lineItems = parsedItems.map((item) => ({
      price_data: {
        currency: 'lkr',
        product_data: {
          name: item.title,
          metadata: { productId: item._id }
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      customer_email: req.user.email,
      metadata: {
        orderPayload: JSON.stringify({
          customerEmail: req.user.email,
          customerName: req.user.name || req.user.email,
          items: parsedItems,
          total,
          address,
          paymentMethod: 'stripe'
        })
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to initialize Stripe checkout' });
  }
});

router.post('/stripe-confirm', verifyToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured on the server' });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Stripe session id is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Stripe payment not completed yet' });
    }

    const existingOrder = await Order.findOne({ stripeSessionId: session.id });
    if (existingOrder) {
      return res.json(existingOrder);
    }

    const payload = JSON.parse(session.metadata?.orderPayload || '{}');
    let itemsFromPayload = payload.items || [];
    itemsFromPayload = itemsFromPayload.map((it) => ({ ...it, price: Number(it.price) }));
    const sellerApprovals = buildSellerApprovals(itemsFromPayload).map((approval) => ({ ...approval, status: 'approved' }));

    const order = await Order.create({
      customerEmail: req.user.email,
      customerName: req.user.name || req.user.email,
      items: itemsFromPayload,
      total: Number(payload.total),
      address: payload.address,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      stripeSessionId: session.id,
      sellerApprovals
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to confirm Stripe payment' });
  }
});

router.get('/customer', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ customerEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch customer orders' });
  }
});

router.get('/seller', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can access seller orders' });
    }

    const sellerEmail = req.user.email.toLowerCase();
    const orders = await Order.find({
      $or: [
        { 'items.sellerEmail': sellerEmail },
        { 'sellerApprovals.sellerEmail': sellerEmail }
      ]
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch seller orders' });
  }
});

router.post('/:id/seller-approve', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can approve payments' });
    }

    const { id } = req.params;
    const { approve } = req.body;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'bank-slip') {
      return res.status(400).json({ message: 'Only bank slip payments require seller approval' });
    }

    const lowerEmail = req.user.email.toLowerCase();
    let approval = order.sellerApprovals.find((a) => a.sellerEmail?.toLowerCase() === lowerEmail);
    if (!approval) {
      const sellerItems = order.items.filter((item) => item.sellerEmail?.toLowerCase() === lowerEmail);
      if (sellerItems.length > 0) {
        approval = { sellerEmail: lowerEmail, status: approve === false ? 'rejected' : 'approved' };
        order.sellerApprovals.push(approval);
      }
    }

    if (!approval) {
      return res.status(403).json({ message: 'No approval responsibility for this seller' });
    }

    approval.status = approve === false ? 'rejected' : 'approved';
    const allApproved = order.sellerApprovals.every((a) => a.status === 'approved');
    const anyRejected = order.sellerApprovals.some((a) => a.status === 'rejected');

    if (anyRejected) {
      order.paymentStatus = 'rejected';
    } else if (allApproved) {
      order.paymentStatus = 'paid';
    } else {
      order.paymentStatus = 'awaiting_approval';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update approval status' });
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
