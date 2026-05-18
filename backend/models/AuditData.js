import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: String,
  text: String,
  response: { type: String, enum: ['oui', 'non', 'partiel', null], default: null },
  maturity: { type: String, default: '' },
  comment: { type: String, default: '' },
  proof: { type: String, default: '' },
});

const axisSchema = new mongoose.Schema({
  id: String,
  title: String,
  questions: [questionSchema],
});

const assetSchema = new mongoose.Schema({
  category: String,
  name: String,
  ip: String,
  os: String,
  criticality: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Audited', 'Pending'], default: 'Pending' },
});

const auditDataSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  auditorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  axes: [axisSchema],
  assets: [assetSchema],
  lastSavedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Un seul enregistrement par (orgId + auditorId)
auditDataSchema.index({ organizationId: 1, auditorId: 1 }, { unique: true });

export default mongoose.model('AuditData', auditDataSchema);
