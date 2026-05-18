import Notification from '../models/Notification.js';
// HELPER — créer une notif interne (appelé depuis d'autres controllers)
export const createNotificationHelper = async ({ userId, title, message, type = 'INFO', actionUrl = '' }) => {
  try {
    if (!userId || !title) return;
    const notif = new Notification({ userId, title, message: message || '', type, actionUrl, read: false });
    await notif.save();
    return notif;
  } catch (error) {
    console.error('Erreur création notification:', error.message);
  }
};
// GET all notifications
export const getNotifications = async (req, res) => {
  try {
    const { userId, read } = req.query;
    let query = {};

    if (userId) query.userId = userId;
    if (read !== undefined) query.read = read === 'true';

    const notifs = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single notification
export const getNotificationById = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id).populate('userId');
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, userId, actionUrl } = req.body;
    if (!title || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newNotif = new Notification({
      title,
      message: message || '',
      type: type || 'INFO',
      userId,
      actionUrl: actionUrl || '',
      read: false,
    });

    await newNotif.save();
    res.status(201).json(newNotif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE notification
export const updateNotification = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const { title, message, read } = req.body;
    if (title) notif.title = title;
    if (message) notif.message = message;
    if (typeof read === 'boolean') {
      notif.read = read;
      if (read) notif.readAt = new Date();
    }

    await notif.save();
    res.json(notif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE notification
export const deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const total = await Notification.countDocuments();
    const unread = await Notification.countDocuments({ read: false });
    const read = await Notification.countDocuments({ read: true });

    const stats = { total, unread, read };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MARK ALL AS READ
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
