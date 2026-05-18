import AuditData from '../models/AuditData.js';

// ══════════════════════════════════════════════════════════════
// GET /api/audit-data?orgId=xxx — Charger le questionnaire + assets
// ══════════════════════════════════════════════════════════════
export const getAuditData = async (req, res) => {
  try {
    const { orgId } = req.query;
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    if (!orgId || !auditorId) return res.status(400).json({ error: 'orgId et authentification requis' });

    const data = await AuditData.findOne({ organizationId: orgId, auditorId });
    if (!data) return res.json({ axes: null, assets: null }); // Pas encore de données sauvegardées
    res.json(data);
  } catch (error) {
    console.error('[AuditData] GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// POST /api/audit-data — Sauvegarder (upsert) questionnaire + assets
// ══════════════════════════════════════════════════════════════
export const saveAuditData = async (req, res) => {
  try {
    const { organizationId, axes, assets } = req.body;
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    if (!organizationId || !auditorId) return res.status(400).json({ error: 'organizationId et authentification requis' });

    const data = await AuditData.findOneAndUpdate(
      { organizationId, auditorId },
      {
        $set: {
          axes: axes || [],
          assets: assets || [],
          lastSavedAt: new Date(),
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[AuditData] ✅ Sauvegardé pour org:${organizationId} auditor:${auditorId}`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[AuditData] SAVE error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
