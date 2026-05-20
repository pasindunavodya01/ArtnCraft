import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerEmail: { type: String, lowercase: true, trim: true },
  title: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
});

const approvalSchema = new mongoose.Schema({
  sellerEmail: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

const orderSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerName: { type: String, trim: true },
  items: [orderItemSchema],
  total: { type: Number, required: true, min: 0 },
  address: { type: String, required: true, trim: true },
  paymentMethod: { type: String, enum: ['stripe', 'bank-slip'], default: 'bank-slip' },
  paymentStatus: { type: String, enum: ['pending', 'awaiting_approval', 'paid', 'rejected'], default: 'pending' },
  receiptUrls: [{ type: String }],
  stripeSessionId: { type: String, trim: true },
  sellerApprovals: [approvalSchema],
  inventoryUpdated: { type: Boolean, default: false }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
