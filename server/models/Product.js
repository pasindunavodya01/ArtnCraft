import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'Please provide at least one image URL',
    },
  },
  sellerEmail: { type: String, trim: true, default: 'unknown' }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
