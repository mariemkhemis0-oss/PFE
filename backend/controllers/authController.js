import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Organization from '../models/Organization.js';
import { createNotificationHelper } from './notificationController.js';
// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password, role, company } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Champs manquants' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    // NOTE: Ne PAS hash ici — le hook pre('save') du modèle User s'en charge
    const user = new User({
      name,
      email,
      password,
      role: role.toUpperCase(),
      company: company || 'CyberAudit',
      status: 'ACTIVE',
      mfaEnabled: false,
    });

    await user.save();

    if (role.toUpperCase() === 'CLIENT' && company) {
      const existingOrg = await Organization.findOne({ name: company.toUpperCase() });
      if (!existingOrg) {
        const newOrg = new Organization({
          name: company.toUpperCase(),
          codeClient: `CLI-${Date.now().toString().slice(-6)}`,
          sector: 'Non défini',
          type: 'PME',
          status: 'ACTIVE',
          perimeters: []
        });
        await newOrg.save();
      }
    }
    // Notif → tous les admins
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await createNotificationHelper({
        userId: admin._id,
        title: 'Nouvelle inscription client',
        message: `${name} (${role.toUpperCase()}) vient de s'inscrire${company ? ` — Organisation: ${company}` : ''}. Vérifiez la section Utilisateurs.`,
        type: 'INFO',
      });
    }

    // Notif → le client lui-même
    await createNotificationHelper({
      userId: user._id,
      title: 'Bienvenue sur CyberAudit AI !',
      message: `Votre compte a été créé avec succès. Consultez vos rapports d'audit dans votre espace personnel.`,
      type: 'SUCCESS',
    });
    res.status(201).json({ message: 'Compte créé avec succès' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('LOGIN ATTEMPT:', email, password, role ? `(rôle sélectionné: ${role})` : '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email });
    console.log('USER FOUND:', user ? user.email : 'NOT FOUND');

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('PASSWORD MATCH:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // ===== VÉRIFICATION DU RÔLE (RBAC) =====
    // Si le frontend envoie un rôle sélectionné, on vérifie qu'il correspond au rôle réel
    if (role) {
      const selectedRole = role.toUpperCase();
      const actualRole = user.role.toUpperCase();
      if (selectedRole !== actualRole) {
        console.log(`RBAC BLOCKED: rôle sélectionné=${selectedRole}, rôle réel=${actualRole}`);
        return res.status(403).json({ 
          error: `🚫 Accès bloqué — Votre compte est enregistré en tant que "${actualRole}". Vous ne pouvez pas accéder à l'espace "${selectedRole}".` 
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'cyberaudit_secret_key',
      { expiresIn: '24h' }
    );

    // ← Retourne TOUS les champs incluant avatar et avatarColor
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      token,
      user: userObj
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
};