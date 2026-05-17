import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
