import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import cloudinary from '../utils/cloudinary.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch products' });
  }
});

router.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only sellers and admins can add products' });
    }

    const { title, description, price, category } = req.body;
    if (!title || !description || !price || !req.file) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const uploadResult = await cloudinary.uploader.upload_stream({ folder: 'ecommerce-products' }, async (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Image upload failed' });
      }

      const product = await Product.create({
        title,
        description,
        category: category || 'General',
        price: Number(price),
        imageUrl: result.secure_url,
        sellerEmail: req.user.email
      });

      res.status(201).json(product);
    });

    uploadResult.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Product creation failed' });
  }
});

export default router;
