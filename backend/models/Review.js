import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  clientName: { type: String },
  clientCompany: { type: String },
}, {
  timestamps: true,
});

reviewSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
