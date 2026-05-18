import express from 'express';
import Report from '../models/Report.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, subject, description, productId, sellerEmail } = req.body;

    if (!type || !subject || !description) {
      return res.status(400).json({ message: 'Type, subject, and description are required' });
    }

    const report = await Report.create({
      reporterEmail: req.user.email,
      reporterName: req.user.name || req.user.email,
      type,
      subject,
      description,
      productId: productId || null,
      sellerEmail: sellerEmail || null,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create report' });
  }
});

router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

router.patch('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, priority, adminNotes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (adminNotes) updates.adminNotes = adminNotes;

    const report = await Report.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
});

export default router;
