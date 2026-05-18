import ScheduledScan from '../models/ScheduledScan.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const createSchedule = async (req, res) => {
  try {
    const { targets, scanProfile, frequency, timeOfDay, clientName, clientCompany, auditorId, organizationId } = req.body;

    if (!targets || !frequency || !timeOfDay) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newSchedule = new ScheduledScan({
      targets,
      scanProfile: scanProfile || 'Full and fast',
      frequency,
      timeOfDay,
      clientName,
      clientCompany,
      auditorId,
      organizationId,
      nextRun: new Date(), // Temporary, will be calculated below
    });

    newSchedule.calculateNextRun();
    await newSchedule.save();

    // Create Notification for the Chef
    if (auditorId) {
      const auditor = await User.findById(auditorId);
      if (auditor && auditor.chefId) {
        await Notification.create({
          userId: auditor.chefId,
          title: 'Nouvelle planification de scan',
          message: `L'auditeur ${auditor.name} a planifié un scan (${frequency}) pour ${clientCompany || clientName}.`,
          type: 'INFO'
        });
      }
    }

    res.status(201).json({ message: 'Schedule created successfully', schedule: newSchedule });
  } catch (error) {
    console.error('[ScheduleController] Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

export const getSchedules = async (req, res) => {
  try {
    const { auditorId, organizationId, chefId } = req.query;
    
    let query = {};
    
    if (chefId) {
      const allUsers = await User.find({}).select('_id chefId');
      const auditorIds = allUsers
        .filter(u => u.chefId && u.chefId.toString() === chefId)
        .map(u => u._id);
        
      if (auditorIds.length > 0) {
        query.auditorId = { $in: auditorIds };
      } else {
        // If the chef has no auditors, return empty array immediately
        return res.status(200).json([]);
      }
    } else if (auditorId) {
      query.auditorId = auditorId;
    }

    if (organizationId) query.organizationId = organizationId;

    const schedules = await ScheduledScan.find(query).sort({ createdAt: -1 });
    res.status(200).json(schedules);
  } catch (error) {
    console.error('[ScheduleController] Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await ScheduledScan.findByIdAndDelete(id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.status(200).json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('[ScheduleController] Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

export const toggleSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await ScheduledScan.findById(id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    schedule.isActive = !schedule.isActive;
    if (schedule.isActive) {
      schedule.calculateNextRun(); // Recalculate next run when reactivated
    }
    await schedule.save();

    res.status(200).json({ message: 'Schedule toggled successfully', schedule });
  } catch (error) {
    console.error('[ScheduleController] Error toggling schedule:', error);
    res.status(500).json({ error: 'Failed to toggle schedule' });
  }
};
