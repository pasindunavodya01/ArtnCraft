import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import cloudinary from '../utils/cloudinary.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: 'ecommerce-products' }, (error, result) => {
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

router.get('/', async (req, res) => {
  try {
    const { sellerEmail } = req.query;
    const filter = {};

    if (sellerEmail) {
      filter.sellerEmail = sellerEmail;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    const productIds = products.map((product) => product._id);
    const reviewSummary = await Review.aggregate([
      { $match: { productId: { $in: productIds } } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);
    const reviewMap = reviewSummary.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});

    const productsWithRatings = products.map((product) => {
      const productObj = product.toObject();
      const summary = reviewMap[product._id.toString()];
      return {
        ...productObj,
        ratingAvg: summary ? Number(summary.avgRating.toFixed(1)) : 0,
        reviewCount: summary ? summary.reviewCount : 0,
      };
    });

    res.json(productsWithRatings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const summary = await Review.aggregate([
      { $match: { productId: product._id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);

    const productObj = product.toObject();
    const ratingSummary = summary[0] || { avgRating: 0, reviewCount: 0 };

    res.json({
      ...productObj,
      ratingAvg: Number(ratingSummary.avgRating.toFixed(1)),
      reviewCount: ratingSummary.reviewCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch product' });
  }
});

router.post('/upload', verifyToken, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only sellers and admins can add products' });
    }

    const { title, description, price, category } = req.body;
    const files = [...(req.files?.images || []), ...(req.files?.image || [])];

    if (!title || !description || !price || files.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const imageUrls = await getUploadedImages(files);

    const product = await Product.create({
      title,
      description,
      category: category || 'General',
      price: Number(price),
      images: imageUrls,
      sellerEmail: req.user.email,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Product creation failed' });
  }
});

router.put('/:id', verifyToken, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.sellerEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const { title, description, price, category, removeImages } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (price) updates.price = Number(price);

    let remainingImages = [...product.images];
    if (removeImages) {
      let removed = removeImages;
      if (typeof removed === 'string') {
        try {
          removed = JSON.parse(removed);
        } catch (parseError) {
          removed = [removed];
        }
      }
      if (Array.isArray(removed)) {
        remainingImages = remainingImages.filter((url) => !removed.includes(url));
      }
    }

    const files = [...(req.files?.images || []), ...(req.files?.image || [])];
    if (files.length > 0) {
      const uploadedUrls = await getUploadedImages(files);
      remainingImages = [...remainingImages, ...uploadedUrls];
    }

    if (remainingImages.length === 0) {
      return res.status(400).json({ message: 'A product must have at least one image' });
    }

    updates.images = remainingImages;
    Object.assign(product, updates);
    await product.save();

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Product update failed' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller or admin
    if (product.sellerEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;
