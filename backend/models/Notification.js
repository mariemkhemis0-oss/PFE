import { read } from 'fs';
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'], default: 'INFO' },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  actionUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  
});

export default mongoose.model('Notification', notificationSchema);
