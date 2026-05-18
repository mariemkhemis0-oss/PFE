import mongoose from 'mongoose';

const cveSchema = new mongoose.Schema({
  cveId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  cvssScore: { type: Number },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
  publishDate: { type: Date },
  affectedSoftware: [String],
  references: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('CVE', cveSchema);
