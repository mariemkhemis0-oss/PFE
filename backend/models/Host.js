import mongoose from 'mongoose';

const hostSchema = new mongoose.Schema({
  hostname: { type: String, required: true },
  ipAddress: { type: String, required: true, unique: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  operatingSystem: { type: String },
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] },
  scannerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scanner' }],
  vulnerabilities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vulnerability' }],
  lastScanned: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Host', hostSchema);
