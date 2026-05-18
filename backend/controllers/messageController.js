import Message from '../models/Message.js';
import User from '../models/User.js';
import { createNotificationHelper } from './notificationController.js';

// ══════════════════════════════════════════════════════════════
// GET /api/messages/conversation/:userId — Historique avec un user
// ══════════════════════════════════════════════════════════════
export const getConversation = async (req, res) => {
  try {
    const myId = req.user?.id || req.user?._id;
    const otherId = req.params.userId;
    
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ]
    })
    .sort({ createdAt: 1 })
    .limit(200)
    .populate('senderId', 'name role avatar avatarColor')
    .populate('receiverId', 'name role avatar avatarColor');

    // Marquer comme lus les messages reçus
    await Message.updateMany(
      { senderId: otherId, receiverId: myId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// POST /api/messages — Envoyer un message
// ══════════════════════════════════════════════════════════════
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id || req.user?._id;
    const { receiverId, text, organizationId } = req.body;

    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ error: 'receiverId et text requis' });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: text.trim(),
      organizationId: organizationId || null,
    });

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name role avatar avatarColor')
      .populate('receiverId', 'name role avatar avatarColor');

    // Créer une notification pour le destinataire
    const sender = await User.findById(senderId);
    await createNotificationHelper({
      userId: receiverId,
      title: '💬 Nouveau message',
      message: `${sender?.name || 'Utilisateur'} : "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`,
      type: 'INFO',
      actionUrl: 'messages',
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/messages/unread-count — Nombre de messages non lus
// ══════════════════════════════════════════════════════════════
export const getUnreadCount = async (req, res) => {
  try {
    const myId = req.user?.id || req.user?._id;
    const count = await Message.countDocuments({ receiverId: myId, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/messages/conversations — Liste des conversations
// ══════════════════════════════════════════════════════════════
export const getConversationsList = async (req, res) => {
  try {
    const myId = req.user?.id || req.user?._id;

    // Trouver tous les users avec qui j'ai échangé
    const sent = await Message.distinct('receiverId', { senderId: myId });
    const received = await Message.distinct('senderId', { receiverId: myId });
    const contactIds = [...new Set([...sent.map(String), ...received.map(String)])].filter(id => id !== String(myId));

    const conversations = [];
    for (const contactId of contactIds) {
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: myId, receiverId: contactId },
          { senderId: contactId, receiverId: myId },
        ]
      }).sort({ createdAt: -1 });

      const unread = await Message.countDocuments({
        senderId: contactId, receiverId: myId, isRead: false
      });

      const contact = await User.findById(contactId).select('name role company avatar avatarColor');

      conversations.push({
        contact,
        lastMessage: lastMsg,
        unreadCount: unread,
      });
    }

    // Trier par dernier message
    conversations.sort((a, b) => 
      new Date(b.lastMessage?.createdAt).getTime() - new Date(a.lastMessage?.createdAt).getTime()
    );

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
