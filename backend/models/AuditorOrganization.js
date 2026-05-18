import mongoose from 'mongoose';

const auditorOrganizationSchema = new mongoose.Schema({
  auditorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'COMPLETED'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure unique combination of auditor and organization
auditorOrganizationSchema.index({ auditorId: 1, organizationId: 1 }, { unique: true });

export default mongoose.model('AuditorOrganization', auditorOrganizationSchema);
