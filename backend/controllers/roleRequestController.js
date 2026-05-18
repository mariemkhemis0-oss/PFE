import RoleRequest from '../models/RoleRequest.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { createNotificationHelper } from './notificationController.js';

export const getRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRoleRequest = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email déjà utilisé' });

    const existingRequest = await RoleRequest.findOne({ email });
    if (existingRequest) return res.status(409).json({ error: 'Demande déjà en cours' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const request = new RoleRequest({
      name, email,
      password: hashedPassword,
      requestedRole: role.toUpperCase(),
      company: company || '',
      status: 'PENDING',
    });

    await request.save();

    // Notif → tous les admins
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await createNotificationHelper({
        userId: admin._id,
        title: 'Nouvelle demande d\'inscription',
        message: `${name} souhaite rejoindre la plateforme en tant que ${role.toUpperCase()}${company ? ` — ${company}` : ''}. Approuvez ou rejetez dans Administration.`,
        type: 'INFO',
        actionUrl: 'admin-portal',
      });
    }

    res.status(201).json({ message: 'Demande envoyée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveRoleRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Demande introuvable' });

    const { chefId } = req.body;

    const user = new User({
      name: request.name,
      email: request.email,
      password: request.password,
      role: request.requestedRole,
      company: request.company || 'CyberAudit',
      status: 'ACTIVE',
      mfaEnabled: false,
      chefId: request.requestedRole === 'AUDITOR' ? chefId || null : null,
    });

    await user.save();
    await RoleRequest.findByIdAndDelete(req.params.id);

    // Notif → le nouvel utilisateur approuvé
    await createNotificationHelper({
      userId: user._id,
      title: '🎉 Compte approuvé !',
      message: `Bienvenue ${user.name} ! Votre demande d'accès en tant que ${user.role} a été approuvée par l'administrateur. Vous pouvez maintenant vous connecter.`,
      type: 'SUCCESS',
      actionUrl: 'dashboard',
    });

    // Si auditeur → notifier le chef référent
    if (request.requestedRole === 'AUDITOR' && chefId) {
      await createNotificationHelper({
        userId: chefId,
        title: 'Nouvel auditeur dans votre équipe',
        message: `${request.name} vient d'être ajouté à votre équipe en tant qu'auditeur. Consultez la section Team Ops.`,
        type: 'INFO',
        actionUrl: 'team',
      });
    }

    res.json({ message: 'Demande approuvée', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectRoleRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'REJECTED', rejectedAt: new Date() } },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: 'Demande introuvable' });
    res.json({ message: 'Demande rejetée', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};