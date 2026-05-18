import mongoose from 'mongoose';

const targetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  hosts: { type: String, required: true },        // IPs, CIDR, hostnames séparés par virgule
  excludeHosts: { type: String, default: '' },     // Hôtes exclus (whitelist)
  portListId: { type: String, default: '33d0cd82-57c6-11e1-8ed1-406186ea4fc5' }, // All IANA TCP
  credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential', default: null },
  gvmTargetId: { type: String, default: null },    // ID retourné par GVM
  comment: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'ARCHIVED', 'ERROR'] },
  lastScanDate: { type: Date, default: null },
  scanCount: { type: Number, default: 0 },
}, { timestamps: true });

targetSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('Target', targetSchema);
