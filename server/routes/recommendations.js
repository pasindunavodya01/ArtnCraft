import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { getRecommendationsForUser } from '../services/recommendationService.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 24);
    const excludeProductId = req.query.exclude || null;
    const result = await getRecommendationsForUser(req.user.email, { limit, excludeProductId });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to generate recommendations' });
  }
});

export default router;
