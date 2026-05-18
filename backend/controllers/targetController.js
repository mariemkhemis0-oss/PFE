// backend/controllers/targetController.js
// ──────────────────────────────────────────────────────────────
// CRUD Targets — Cibles persistantes liées aux organisations
// Synchronisation avec GVM (create/delete)
// ──────────────────────────────────────────────────────────────

import Target from '../models/Target.js';
import Credential from '../models/Credential.js';
import { decrypt } from '../services/credentialService.js';
import * as gvm from '../services/gvmService.js';

// ── GET /api/targets?orgId=X ──
export const getTargets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.orgId) filter.organizationId = req.query.orgId;
    const targets = await Target.find(filter)
      .populate('credentialId', 'name type username status')
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 });
    res.json(targets);
  } catch (error) {
    console.error('[TARGET] Get error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/targets ──
export const createTarget = async (req, res) => {
  try {
    const { name, organizationId, hosts, excludeHosts, credentialId, comment } = req.body;
    if (!name || !organizationId || !hosts) {
      return res.status(400).json({ error: 'name, organizationId et hosts sont requis' });
    }

    // Synchroniser avec GVM
    let gvmTargetId = null;
    try {
      let gvmCredId = null;
      let credType = null;
      if (credentialId) {
        const cred = await Credential.findById(credentialId);
        if (cred) {
          gvmCredId = cred.gvmCredentialId;
          credType = cred.type;
        }
      }
      if (gvmCredId) {
        gvmTargetId = await gvm.createTargetWithCredential(name, hosts, excludeHosts, gvmCredId, credType);
      } else {
        gvmTargetId = await gvm.createTarget(name, hosts);
      }
    } catch (gvmErr) {
      console.error('[TARGET] GVM sync failed:', gvmErr.message);
      // On crée quand même en DB, on resynchronisera plus tard
    }

    const target = new Target({
      name,
      organizationId,
      hosts,
      excludeHosts: excludeHosts || '',
      credentialId: credentialId || null,
      gvmTargetId,
      comment: comment || '',
      createdBy: req.user?.id || null,
      status: gvmTargetId ? 'ACTIVE' : 'ERROR',
    });
    await target.save();

    const populated = await Target.findById(target._id)
      .populate('credentialId', 'name type username status')
      .populate('organizationId', 'name');

    console.log(`[TARGET] Créé: ${name} (GVM: ${gvmTargetId || 'non sync'})`);
    res.status(201).json(populated);
  } catch (error) {
    console.error('[TARGET] Create error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ── PUT /api/targets/:id ──
export const updateTarget = async (req, res) => {
  try {
    const target = await Target.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('credentialId', 'name type username status')
      .populate('organizationId', 'name');
    if (!target) return res.status(404).json({ error: 'Target non trouvée' });
    res.json(target);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/targets/:id ──
export const deleteTarget = async (req, res) => {
  try {
    const target = await Target.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Target non trouvée' });

    // Supprimer de GVM
    if (target.gvmTargetId) {
      await gvm.deleteGvmTarget(target.gvmTargetId);
    }

    await Target.findByIdAndDelete(req.params.id);
    console.log(`[TARGET] Supprimé: ${target.name}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── POST /api/targets/:id/sync ── Resync avec GVM
export const syncTarget = async (req, res) => {
  try {
    const target = await Target.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Target non trouvée' });

    let gvmCredId = null;
    let credType = null;
    if (target.credentialId) {
      const cred = await Credential.findById(target.credentialId);
      if (cred) { gvmCredId = cred.gvmCredentialId; credType = cred.type; }
    }

    const gvmTargetId = gvmCredId
      ? await gvm.createTargetWithCredential(target.name, target.hosts, target.excludeHosts, gvmCredId, credType)
      : await gvm.createTarget(target.name, target.hosts);

    target.gvmTargetId = gvmTargetId;
    target.status = 'ACTIVE';
    await target.save();

    res.json(target);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
