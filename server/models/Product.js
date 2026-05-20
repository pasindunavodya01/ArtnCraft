import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, trim: true },
  style: { type: String, trim: true, default: '' },
  medium: { type: String, trim: true, default: '' },
  tags: { type: [String], default: [] },
  // store human-readable price as string (e.g. "10.00")
  price: { type: String, required: true, trim: true },
  // numeric representation to support sorting/filtering
  priceNumber: { type: Number, required: true, min: 0 },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'Please provide at least one image URL',
    },
  },
  sellerEmail: { type: String, trim: true, default: 'unknown' },
  quantity: { type: Number, required: true, default: 1, min: 0 },
  isAuctionProduct: { type: Boolean, default: false }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
