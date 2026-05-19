import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  buyerEmail: { type: String, required: true, lowercase: true, trim: true },
  buyerName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  timestamp: { type: Date, default: Date.now }
});

const auctionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerEmail: { type: String, required: true, lowercase: true, trim: true },
  startingBid: { type: Number, required: true, min: 0 },
  reservePrice: { type: Number, min: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  bids: [bidSchema],
  highestBid: { type: Number, default: 0 },
  highestBidder: { type: String, lowercase: true, trim: true },
  winnerEmail: { type: String, lowercase: true, trim: true },
  winnerName: { type: String, trim: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  status: { type: String, enum: ['pending', 'active', 'ended'], default: 'pending' }
}, { timestamps: true });

const Auction = mongoose.models.Auction || mongoose.model('Auction', auctionSchema);
export default Auction;
