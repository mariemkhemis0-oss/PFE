import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: { type: String, required: true, enum: ['SSH', 'SMB', 'ESXi', 'SNMP'] },
  username: { type: String, required: true },
  encryptedPassword: { type: String, default: null },   // AES-256-GCM chiffré
  encryptedPrivateKey: { type: String, default: null },  // Pour SSH key auth
  port: { type: Number, default: null },                 // Port SSH custom (ex: 2222)
  gvmCredentialId: { type: String, default: null },      // ID retourné par GVM
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'REVOKED', 'ERROR'] },
}, { timestamps: true });

credentialSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('Credential', credentialSchema);
