import mongoose from 'mongoose';

const scheduledScanSchema = new mongoose.Schema({
  targets: {
    type: String,
    required: true,
  },
  scanProfile: {
    type: String,
    default: 'Full and fast',
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  timeOfDay: {
    type: String,
    required: true, // Format: "HH:mm" (e.g., "03:00")
  },
  nextRun: {
    type: Date,
    required: true,
  },
  lastRun: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  clientCompany: {
    type: String,
    required: true,
  },
  auditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  lastStatus: {
    type: String,
    enum: ['Pending', 'Running', 'Terminé', 'Erreur'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Calculate the next run time based on frequency and timeOfDay
scheduledScanSchema.methods.calculateNextRun = function() {
  const now = new Date();
  const [hours, minutes] = this.timeOfDay.split(':').map(Number);
  
  // Set time of day for the target date
  let nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, or we just ran it, advance based on frequency
  if (nextDate <= now) {
    if (this.frequency === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (this.frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (this.frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }
  
  this.nextRun = nextDate;
  return nextDate;
};

const ScheduledScan = mongoose.model('ScheduledScan', scheduledScanSchema);

export default ScheduledScan;
