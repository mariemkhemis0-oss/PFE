import cron from 'node-cron';
import ScheduledScan from '../models/ScheduledScan.js';
import { launchScanInternal } from '../controllers/scanController.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

let isRunning = false;

// The cron job runs every minute to check for due scans
export const startScheduler = () => {
  console.log('[SchedulerService] Starting node-cron scheduler...');
  
  cron.schedule('* * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    
    try {
      const now = new Date();
      // Find active schedules where nextRun is in the past
      const dueScans = await ScheduledScan.find({
        isActive: true,
        nextRun: { $lte: now }
      });

      if (dueScans.length > 0) {
        console.log(`[SchedulerService] Found ${dueScans.length} scheduled scan(s) due.`);
      }

      for (const schedule of dueScans) {
        console.log(`[SchedulerService] Triggering scan for schedule ID: ${schedule._id}`);
        
        try {
          // Trigger the scan
          await launchScanInternal({
            targets: schedule.targets,
            scanProfile: schedule.scanProfile,
            clientName: schedule.clientName,
            clientCompany: schedule.clientCompany,
            auditorId: schedule.auditorId,
            organizationId: schedule.organizationId,
            isScheduled: true
          });

          // Update lastRun and calculate nextRun
          schedule.lastRun = new Date();
          schedule.calculateNextRun();
          await schedule.save();

          // Create Notification for the Chef
          if (schedule.auditorId) {
            const auditor = await User.findById(schedule.auditorId);
            if (auditor && auditor.chefId) {
              await Notification.create({
                userId: auditor.chefId,
                title: 'Scan automatisé lancé',
                message: `Le scan planifié (${schedule.frequency}) pour ${schedule.clientCompany || schedule.clientName} s'est déclenché avec succès.`,
                type: 'SUCCESS'
              });
            }
          }
          
          console.log(`[SchedulerService] Scan triggered successfully. Next run set to: ${schedule.nextRun}`);
        } catch (scanError) {
          console.error(`[SchedulerService] Error triggering scan for schedule ID ${schedule._id}:`, scanError);
          // If it fails, we still want to recalculate so it doesn't get stuck retrying every minute
          schedule.calculateNextRun();
          await schedule.save();
        }
      }
    } catch (error) {
      console.error('[SchedulerService] Error in scheduler loop:', error);
    } finally {
      isRunning = false;
    }
  });
};
