import mongoose from 'mongoose';

const scannerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['NMAP', 'NESSUS', 'OPENVAS', 'CUSTOM'] },
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  lastHealthCheck: { type: Date },
  healthStatus: { type: String, default: 'HEALTHY', enum: ['HEALTHY', 'DEGRADED', 'OFFLINE'] },
  version: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Scanner', scannerSchema);
