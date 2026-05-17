import express from 'express';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

async function resolveReviewAuthor(req) {
  const email = req.user.email?.toLowerCase().trim();
  if (!email) {
    return null;
  }

  const mongoUser = await User.findOne({ email });
  return {
    email,
    userId: req.user.id || mongoUser?._id || null,
    userName: req.user.name || mongoUser?.name || email,
  };
}

router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch reviews' });
  }
});

router.post('/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const author = await resolveReviewAuthor(req);
    if (!author) {
      return res.status(401).json({ message: 'Unable to identify reviewer' });
    }

    const reviewPayload = {
      productId,
      userId: author.userId,
      userName: author.userName,
      userEmail: author.email,
      rating: Number(rating),
      comment: comment?.trim() || '',
    };

    const existingReview = await Review.findOne({ productId, userEmail: author.email });
    if (existingReview) {
      existingReview.rating = reviewPayload.rating;
      existingReview.comment = reviewPayload.comment;
      await existingReview.save();
      return res.json(existingReview);
    }

    const review = await Review.create(reviewPayload);
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }
    res.status(500).json({ message: 'Unable to save review' });
  }
});

export default router;
