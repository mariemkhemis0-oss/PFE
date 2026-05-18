import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  auditorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chefId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    default: 'DRAFT',
    enum: ['DRAFT', 'IN_REVIEW', 'PENDING_LEAD', 'APPROVED', 'PUBLISHED', 'COMPLETED', 'REJECTED', 'ARCHIVED']
  },
  startDate: { type: Date },
  endDate: { type: Date },
  vulnerabilities: { type: Array, default: [] },
  hostsCovered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Host' }],
  riskScore: { type: Number },
  recommendations: [String],
  clientName: { type: String },
  clientCompany: { type: String },
  ref: { type: String },
  score: { type: Number },
  niveauRisque: { type: String },
  resumeExecutif: { type: String },
  stats: { type: Object },
  priorites: { type: Array },
  recommandationsDetaillees: { type: Array, default: [] },
  actionsImmediates: { type: Array },
  topVulnerabilites: { type: Array },
  conclusion: { type: String },
  pdfData: { type: String },
  // Workflow fields
  rejectionComment: { type: String },
  rejectedAt: { type: Date },
  submittedAt: { type: Date },
  publishedAt: { type: Date },
  approvedAt: { type: Date },
  certifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Scan fields
  openvasTaskId: { type: String },
  openvasReportId: { type: String },
  scanProfile: { type: String },
  targets: { type: String },
  // Full AI report (10 sections)
  fullAiReport: { type: Object },
  // Audit data (questionnaire + assets + score organisationnel)
  auditData: {
    axes: { type: Array, default: [] },
    assets: { type: Array, default: [] },
    organisationalScore: { type: Object, default: null },
  },
}, {
  timestamps: true, // auto createdAt + updatedAt
});

export default mongoose.model('Report', reportSchema);