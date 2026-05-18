import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  codeClient: { type: String },
  sector: { type: String },
  type: { type: String, enum: ['PME', 'Banque', 'ENTERPRISE', 'Startup'] },
  address: { type: String },
  contactName: { type: String },
  email: { type: String },
  phone: { type: String },
  perimeters: { type: Array, default: [] },
  status: { type: String, default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Organization', organizationSchema);