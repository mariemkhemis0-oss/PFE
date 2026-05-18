import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['ADMIN', 'CHEF', 'AUDITOR', 'CLIENT', 'VALIDATOR'] },
  company: { type: String, default: 'CyberAudit' },
  status: { type: String, default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
  lastLogin: { type: Date },
  mfaEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  chefId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  auditorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  avatar: { type: String, default: null },
  avatarColor: { type: String, default: '#5c56e3' },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
