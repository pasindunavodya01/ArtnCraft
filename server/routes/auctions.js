import express from 'express';
import Auction from '../models/Auction.js';
import Product from '../models/Product.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// CREATE an auction (Seller only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only sellers can create auctions' });
    }

    const { productId, startingBid, reservePrice, startTime, endTime } = req.body;

    if (!productId || startingBid === undefined || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required auction details' });
    }

    // Verify product exists and is owned by seller
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    if (product.sellerEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized: You do not own this artwork' });
    }

    if (!product.isAuctionProduct) {
      return res.status(400).json({ message: 'This artwork is not designated for auction listings. Please create it as an auction product first.' });
    }

    // Verify no active or pending auction exists for this product
    const existingAuction = await Auction.findOne({
      productId,
      status: { $in: ['pending', 'active'] }
    });

    if (existingAuction) {
      return res.status(400).json({ message: 'An active or pending auction already exists for this artwork' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'Auction end time must be after start time' });
    }

    const now = new Date();
    // A small buffer for start time in case of clock drift, but it can be in the past too (starting immediately)
    const status = start <= now ? 'active' : 'pending';

    const auction = await Auction.create({
      productId,
      sellerEmail: req.user.email,
      startingBid: Number(startingBid),
      reservePrice: reservePrice ? Number(reservePrice) : undefined,
      startTime: start,
      endTime: end,
      status,
      highestBid: 0,
      highestBidder: undefined,
      bids: []
    });

    res.status(201).json(auction);
  } catch (error) {
    console.error('[AuctionRoute] Error creating auction:', error);
    res.status(500).json({ message: 'Failed to create auction' });
  }
});

// LIST all auctions
router.get('/', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    let productFilters = {};
    if (category) {
      productFilters.category = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      productFilters.$or = [
        { title: regex },
        { description: regex },
        { style: regex },
        { medium: regex },
        { category: regex }
      ];
    }

    let matchedProductIds = null;
    if (category || search) {
      const matchedProducts = await Product.find(productFilters).select('_id');
      matchedProductIds = matchedProducts.map(p => p._id);
      filter.productId = { $in: matchedProductIds };
    }

    const auctions = await Auction.find(filter)
      .populate('productId')
      .sort({ createdAt: -1 });

    // Filter out populated products that couldn't be loaded (e.g. if deleted)
    const validAuctions = auctions.filter(a => a.productId);

    res.json(validAuctions);
  } catch (error) {
    console.error('[AuctionRoute] Error fetching auctions:', error);
    res.status(500).json({ message: 'Failed to fetch auctions' });
  }
});

// GET single auction details
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('productId');
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auction);
  } catch (error) {
    console.error('[AuctionRoute] Error fetching auction detail:', error);
    res.status(500).json({ message: 'Failed to fetch auction details' });
  }
});

// PLACE A BID on active auction
router.post('/:id/bid', verifyToken, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const now = new Date();
    if (auction.status !== 'active' || now < auction.startTime || now > auction.endTime) {
      return res.status(400).json({ message: 'Bidding is only allowed on active, ongoing auctions' });
    }

    if (auction.sellerEmail === req.user.email) {
      return res.status(400).json({ message: 'You cannot place a bid on your own auction' });
    }

    const amount = Number(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid bid amount' });
    }

    // Determine the minimum required bid
    const minBidRequired = auction.bids.length > 0
      ? auction.highestBid + 1 // Must be higher than the current highest bid by at least Rs. 1
      : auction.startingBid;    // Must be at least the starting bid

    if (amount < minBidRequired) {
      return res.status(400).json({
        message: `Your bid must be at least Rs. ${minBidRequired.toFixed(2)}`
      });
    }

    // Record the new bid
    const newBid = {
      buyerEmail: req.user.email,
      buyerName: req.user.name || req.user.email,
      amount,
      timestamp: now
    };

    auction.bids.push(newBid);
    auction.highestBid = amount;
    auction.highestBidder = req.user.email;

    await auction.save();

    const populated = await Auction.findById(auction._id).populate('productId');
    res.json(populated);
  } catch (error) {
    console.error('[AuctionRoute] Error placing bid:', error);
    res.status(500).json({ message: 'Failed to place bid' });
  }
});

export default router;
