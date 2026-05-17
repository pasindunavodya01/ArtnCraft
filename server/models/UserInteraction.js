import mongoose from 'mongoose';

const userInteractionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['view'], required: true },
}, { timestamps: true });

userInteractionSchema.index({ userEmail: 1, productId: 1, type: 1 });

const UserInteraction = mongoose.models.UserInteraction
  || mongoose.model('UserInteraction', userInteractionSchema);

export default UserInteraction;
