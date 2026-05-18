import mongoose from 'mongoose';

const roleRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  requestedRole: { type: String, required: true, enum: ['AUDITOR', 'CHEF'] },
  company: { type: String, default: '' },
  status: { type: String, default: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
  rejectedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('RoleRequest', roleRequestSchema);