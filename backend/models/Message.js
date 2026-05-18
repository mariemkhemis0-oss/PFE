import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  text: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
}, {
  timestamps: true,
});

// Index pour requêtes rapides de conversations
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

export default mongoose.model('Message', messageSchema);
