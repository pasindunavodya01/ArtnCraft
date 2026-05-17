import express from 'express';
import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

const enrichProducts = async (products) => {
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
    const productObj = product.toObject();
    const summary = reviewMap[product._id.toString()];
    return {
      ...productObj,
      ratingAvg: summary ? Number(summary.avgRating.toFixed(1)) : 0,
      reviewCount: summary ? summary.reviewCount : 0,
    };
  });
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();
    const wishlist = await Wishlist.findOne({ userEmail: email });
    if (!wishlist?.productIds?.length) {
      return res.json({ productIds: [], products: [] });
    }
    const products = await Product.find({ _id: { $in: wishlist.productIds } });
    const enriched = await enrichProducts(products);
    res.json({ productIds: wishlist.productIds, products: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch wishlist' });
  }
});

router.post('/:productId', verifyToken, async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const email = req.user.email.toLowerCase().trim();
    const wishlist = await Wishlist.findOneAndUpdate(
      { userEmail: email },
      { $addToSet: { productIds: product._id } },
      { upsert: true, new: true }
    );
    res.json(wishlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to add to wishlist' });
  }
});

router.delete('/:productId', verifyToken, async (req, res) => {
  try {
    const email = req.user.email.toLowerCase().trim();
    const wishlist = await Wishlist.findOneAndUpdate(
      { userEmail: email },
      { $pull: { productIds: req.params.productId } },
      { new: true }
    );
    res.json(wishlist || { userEmail: email, productIds: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to remove from wishlist' });
  }
});

export default router;
