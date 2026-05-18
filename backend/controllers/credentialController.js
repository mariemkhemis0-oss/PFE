// backend/controllers/credentialController.js
// ──────────────────────────────────────────────────────────────
// CRUD Credentials — Identifiants chiffrés pour scans authentifiés
// Chiffrement AES-256-GCM, synchronisation GVM
// ──────────────────────────────────────────────────────────────

import Credential from '../models/Credential.js';
import { encrypt, decrypt } from '../services/credentialService.js';
import * as gvm from '../services/gvmService.js';

// ── GET /api/credentials?orgId=X ──
export const getCredentials = async (req, res) => {
  try {
    const filter = {};
    if (req.query.orgId) filter.organizationId = req.query.orgId;
    const creds = await Credential.find(filter)
      .select('-encryptedPassword -encryptedPrivateKey')  // Jamais exposer
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 });
    res.json(creds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/credentials ──
export const createCredential = async (req, res) => {
  try {
    const { name, organizationId, type, username, password, privateKey, port } = req.body;
    if (!name || !organizationId || !type || !username) {
      return res.status(400).json({ error: 'name, organizationId, type et username sont requis' });
    }

    // Chiffrer les secrets
    const encryptedPassword = password ? encrypt(password) : null;
    const encryptedPrivateKey = privateKey ? encrypt(privateKey) : null;

    // Synchroniser avec GVM
    let gvmCredentialId = null;
    try {
      if (password) {
        gvmCredentialId = await gvm.createGvmCredential(name, type, username, password);
      }
    } catch (gvmErr) {
      console.error('[CREDENTIAL] GVM sync failed:', gvmErr.message);
    }

    const credential = new Credential({
      name,
      organizationId,
      type,
      username,
      encryptedPassword,
      encryptedPrivateKey,
      port: port || null,
      gvmCredentialId,
      createdBy: req.user?.id || null,
      status: gvmCredentialId ? 'ACTIVE' : 'ERROR',
    });
    await credential.save();

    // Retourner sans les champs sensibles
    const safe = credential.toObject();
    delete safe.encryptedPassword;
    delete safe.encryptedPrivateKey;

    console.log(`[CREDENTIAL] Créé: ${name} (${type}) GVM: ${gvmCredentialId || 'non sync'}`);
    res.status(201).json(safe);
  } catch (error) {
    console.error('[CREDENTIAL] Create error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/credentials/:id ──
export const deleteCredential = async (req, res) => {
  try {
    const cred = await Credential.findById(req.params.id);
    if (!cred) return res.status(404).json({ error: 'Credential non trouvé' });

    if (cred.gvmCredentialId) {
      await gvm.deleteGvmCredential(cred.gvmCredentialId);
    }

    await Credential.findByIdAndDelete(req.params.id);
    console.log(`[CREDENTIAL] Supprimé: ${cred.name}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/credentials/:id/sync ── Resync avec GVM
export const syncCredential = async (req, res) => {
  try {
    const cred = await Credential.findById(req.params.id);
    if (!cred) return res.status(404).json({ error: 'Credential non trouvé' });

    const password = decrypt(cred.encryptedPassword);
    const gvmCredentialId = await gvm.createGvmCredential(cred.name, cred.type, cred.username, password);

    cred.gvmCredentialId = gvmCredentialId;
    cred.status = 'ACTIVE';
    await cred.save();

    const safe = cred.toObject();
    delete safe.encryptedPassword;
    delete safe.encryptedPrivateKey;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
