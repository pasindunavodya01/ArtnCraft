import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterEmail: String,
    reporterName: String,
    type: { type: String, enum: ['seller_complaint', 'product_issue', 'technical_error', 'other'] },
    subject: String,
    description: String,
    productId: mongoose.Schema.Types.ObjectId,
    sellerEmail: String,
    status: { type: String, enum: ['open', 'in_review', 'resolved', 'dismissed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    adminNotes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
