import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
});

const orderSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  items: [orderItemSchema],
  total: { type: Number, required: true, min: 0 },
  address: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed'], default: 'pending' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
