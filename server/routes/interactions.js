import express from 'express';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { recordProductView } from '../services/recommendationService.js';

const router = express.Router();

router.post('/view/:productId', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await recordProductView(req.user.email, product._id);
    res.json({ message: 'View recorded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to record view' });
  }
});

export default router;
