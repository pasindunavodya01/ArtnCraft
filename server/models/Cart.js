import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title: String,
  // store price as string to match Product.price, keep numeric for convenience
  price: String,
  priceNumber: Number,
  quantity: { type: Number, default: 1 },
  sellerEmail: String,
  images: [String],
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  items: { type: [CartItemSchema], default: [] },
}, { timestamps: true });

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
export default Cart;
