import User from '../models/User.js';
import Organization from '../models/Organization.js';
import AuditorOrganization from '../models/AuditorOrganization.js';
import { createNotificationHelper } from './notificationController.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, role, company, password } = req.body;
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newUser = new User({
      name, email, role, password,
      company: company || 'CyberAudit',
      status: 'ACTIVE',
      mfaEnabled: false,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, role, company, status, mfaEnabled } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (company) user.company = company;
    if (status) user.status = status;
    if (typeof mfaEnabled === 'boolean') user.mfaEnabled = mfaEnabled;

    user.updatedAt = new Date();
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const role = req.params.role.toUpperCase();
    const users = await User.find({ role });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const assignClientToAuditor = async (req, res) => {
  try {
    const { clientId, auditorId } = req.body;
    console.log('ASSIGN CLIENT:', clientId, '-> AUDITOR:', auditorId);

    const client = await User.findByIdAndUpdate(
      clientId,
      { $set: { auditorId } },
      { new: true }
    );
    if (!client) return res.status(404).json({ error: 'Client introuvable' });

    const auditor = await User.findById(auditorId);

    // ── Auto-lier l'organisation du client à l'auditeur ──
    if (client.company) {
      let org = await Organization.findOne({ 
        name: { $regex: new RegExp(`^${client.company.trim()}$`, 'i') }
      });
      
      // Auto-créer l'organisation si elle n'existe pas
      if (!org) {
        org = new Organization({
          name: client.company.toUpperCase(),
          codeClient: `CLI-${Date.now().toString().slice(-6)}`,
          sector: 'Non défini',
          type: 'PME',
          status: 'ACTIVE',
          perimeters: []
        });
        await org.save();
        console.log(`[ASSIGN] Organisation auto-créée: ${org.name}`);
      }

      // Créer AuditorOrganization si pas déjà existant
      try {
        await AuditorOrganization.findOneAndUpdate(
          { auditorId, organizationId: org._id },
          { auditorId, organizationId: org._id, status: 'ACTIVE' },
          { upsert: true, new: true }
        );
        console.log(`[ASSIGN] AuditorOrganization créé: ${auditor?.name} <-> ${org.name}`);
      } catch (e) {
        if (e.code !== 11000) console.error('AuditorOrganization error:', e.message);
      }
    }

    // Notif → l'auditeur
    if (auditor) {
      await createNotificationHelper({
        userId: auditorId,
        title: '👤 Nouveau client assigné',
        message: `Le client "${client.name}" (${client.company || 'N/A'}) vous a été assigné. Vous pouvez le retrouver dans votre section "Mes Clients".`,
        type: 'INFO',
        actionUrl: 'auditor-clients',
      });
    }

    // Notif → le client
    await createNotificationHelper({
      userId: clientId,
      title: '🔒 Auditeur assigné à votre compte',
      message: `${auditor?.name || 'Un auditeur'} a été désigné comme votre référent sécurité. Il prendra contact avec vous prochainement.`,
      type: 'INFO',
      actionUrl: 'dashboard',
    });

    console.log('UPDATED:', client.name, '| auditorId:', client.auditorId);
    res.json({ message: 'Client assigné avec succès', client });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    console.log('UPDATE PROFILE - ID:', req.params.id, '| Body keys:', Object.keys(req.body));
    const { name, email, avatar, avatarColor } = req.body;

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (avatarColor !== undefined) updateData.avatarColor = avatarColor;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    console.log('PROFILE UPDATED:', user.name, '| hasAvatar:', !!user.avatar);
    res.json(user);
  } catch (error) {
    console.error('UPDATE PROFILE ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    console.log('CHANGE PASSWORD - User ID:', req.params.id);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Verify current password using the schema method
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    console.log('PASSWORD CHANGED for:', user.name);
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('CHANGE PASSWORD ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
};