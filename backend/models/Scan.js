import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  reportId: { type: String },           // OpenVAS report ID
  targetId: { type: String },
  targets: { type: String, required: true },
  scanProfile: { type: String, default: 'full-and-fast' },
  clientName: { type: String, default: 'Client' },
  clientCompany: { type: String, default: 'Organisation' },
  auditorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  status: {
    type: String,
    default: 'QUEUED',
    enum: ['QUEUED', 'RUNNING', 'DONE', 'RETRIEVING_XML', 'PARSING', 'AI_ANALYSIS', 'GENERATING_PDF', 'SAVING', 'COMPLETED', 'ERROR', 'STOPPED']
  },
  progress: { type: Number, default: 0 },
  logs: [{ type: String }],
  mongoReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  error: { type: String },
  summary: { type: Object },
  isScheduled: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

scanSchema.index({ auditorId: 1, status: 1 });
scanSchema.index({ taskId: 1 });

export default mongoose.model('Scan', scanSchema);
