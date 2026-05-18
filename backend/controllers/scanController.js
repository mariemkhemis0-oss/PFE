// backend/controllers/scanController.js
// ──────────────────────────────────────────────────────────────
// PIPELINE COMPLET avec PERSISTANCE MongoDB
//   1. Créer target + task GVM → démarrer scan
//   2. Persister en DB + polling auto 30s
//   3. Scan done → récupérer XML
//   4. Parser XML (openvasParser.js)
//   5. Analyse IA (Groq LLaMA 3.3)
//   6. Générer PDF détaillé
//   7. Sauvegarder MongoDB (DRAFT)
//   8. Auditeur soumet → PENDING_LEAD → chef notifié
//   9. Chef valide → COMPLETED → client voit le rapport
// ──────────────────────────────────────────────────────────────

import * as gvm from '../services/gvmService.js';
import { parseOpenVASReport } from '../services/openvasParser.js';
import { analyzeVulnerabilities, computeOrganizationalScore } from '../services/aiAnalysisService.js';
import { generatePDFReport } from '../services/pdfReportService.js';
import { createNotificationHelper } from './notificationController.js';
import Report from '../models/Report.js';
import Scan from '../models/Scan.js';
import ScheduledScan from '../models/ScheduledScan.js';
import AuditData from '../models/AuditData.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// In-memory map pour le polling rapide (complète MongoDB)
const activeScans = new Map();

// ══════════════════════════════════════════════════════════════
//  RESTAURER LES SCANS AU DÉMARRAGE
// ══════════════════════════════════════════════════════════════
export async function restoreActiveScans() {
  try {
    const runningScans = await Scan.find({
      status: { $in: ['QUEUED', 'RUNNING', 'DONE', 'RETRIEVING_XML', 'PARSING', 'AI_ANALYSIS', 'GENERATING_PDF', 'SAVING'] }
    });

    for (const scan of runningScans) {
      const scanInfo = {
        scanId: scan.taskId,
        taskId: scan.taskId,
        targetId: scan.targetId,
        reportId: scan.reportId,
        targets: scan.targets,
        scanProfile: scan.scanProfile,
        clientName: scan.clientName,
        clientCompany: scan.clientCompany,
        auditorId: scan.auditorId?.toString(),
        organizationId: scan.organizationId?.toString(),
        status: scan.status,
        progress: scan.progress,
        startedAt: scan.startedAt,
        logs: scan.logs || [],
        reportMongoId: scan.mongoReportId?.toString(),
        summary: scan.summary,
      };

      activeScans.set(scan.taskId, scanInfo);

      // Relancer le polling pour les scans encore en cours sur GVM
      if (['QUEUED', 'RUNNING'].includes(scan.status)) {
        console.log(`[SCAN] Restauration polling pour ${scan.taskId}`);
        startPolling(scan.taskId);
      }
    }

    if (runningScans.length > 0) {
      console.log(`[SCAN] ${runningScans.length} scan(s) restauré(s) depuis MongoDB`);
    }
  } catch (error) {
    console.error('[SCAN] Erreur restauration scans:', error.message);
  }
}

// ══════════════════════════════════════════════════════════════
//  Synchoniser l'état en DB
// ══════════════════════════════════════════════════════════════
async function syncScanToDB(taskId) {
  const scan = activeScans.get(taskId);
  if (!scan) return;

  try {
    await Scan.findOneAndUpdate(
      { taskId },
      {
        status: scan.status,
        progress: scan.progress,
        logs: scan.logs.slice(-100), // Garder les 100 derniers logs
        mongoReportId: scan.reportMongoId ? new mongoose.Types.ObjectId(scan.reportMongoId) : undefined,
        summary: scan.summary,
        error: scan.error,
        ...(scan.status === 'COMPLETED' || scan.status === 'ERROR' || scan.status === 'STOPPED'
          ? { completedAt: new Date() }
          : {}),
      },
      { upsert: false }
    );
  } catch (error) {
    console.error('[SCAN] Erreur sync DB:', error.message);
  }
}

// ══════════════════════════════════════════════════════════════
//  POST /api/scans/launch — LE SEUL BOUTON
// ══════════════════════════════════════════════════════════════
export const launchScan = async (req, res) => {
  try {
    const { targets, scanProfile, clientName, clientCompany, auditorId, organizationId } = req.body;

    if (!targets) return res.status(400).json({ error: 'IP cible(s) requise(s)' });

    const ts = () => new Date().toLocaleTimeString('fr-FR');

    // 1. Créer target + task + start
    const targetName = `ShieldOps - ${clientCompany || 'Audit'} - ${new Date().toISOString().slice(0, 10)}`;
    const targetId = await gvm.createTarget(targetName, targets);
    const taskId = await gvm.createTask(`Audit ${clientCompany || targets}`, targetId, scanProfile || 'full-and-fast');
    const { reportId } = await gvm.startTask(taskId);

    const scanInfo = {
      scanId: taskId, taskId, targetId, reportId, targets,
      scanProfile: scanProfile || 'full-and-fast',
      clientName: clientName || 'Client',
      clientCompany: clientCompany || 'Organisation',
      auditorId, organizationId,
      status: 'QUEUED', progress: 0, startedAt: new Date(),
      logs: [
        `[${ts()}] ✅ Connexion GVM établie`,
        `[${ts()}] 🎯 Cible créée: ${targets}`,
        `[${ts()}] 📋 Tâche créée (profil: ${scanProfile || 'full-and-fast'})`,
        `[${ts()}] 🚀 Scan démarré — ID: ${taskId}`,
        `[${ts()}] ⏳ Polling activé (30s)`,
      ],
    };

    // Persister en mémoire + MongoDB
    activeScans.set(taskId, scanInfo);

    await Scan.create({
      taskId,
      reportId,
      targetId,
      targets,
      scanProfile: scanProfile || 'full-and-fast',
      clientName: clientName || 'Client',
      clientCompany: clientCompany || 'Organisation',
      auditorId: auditorId ? new mongoose.Types.ObjectId(auditorId) : undefined,
      organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined,
      status: 'QUEUED',
      progress: 0,
      logs: scanInfo.logs,
      startedAt: new Date(),
    });

    startPolling(taskId);

    res.json({ success: true, scanId: taskId, reportId, message: `Scan lancé sur ${targets}` });
  } catch (error) {
    console.error('[SCAN] Erreur:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const launchScanInternal = async ({ targets, scanProfile, clientName, clientCompany, auditorId, organizationId, isScheduled }) => {
  try {
    if (!targets) throw new Error('IP cible(s) requise(s)');

    const ts = () => new Date().toLocaleTimeString('fr-FR');

    const targetName = `ShieldOps - ${clientCompany || 'Audit'} - ${new Date().toISOString().slice(0, 10)} ${isScheduled ? '(Scheduled)' : ''}`;
    const targetId = await gvm.createTarget(targetName, targets);
    const taskId = await gvm.createTask(`Audit ${clientCompany || targets} ${isScheduled ? '(Automated)' : ''}`, targetId, scanProfile || 'full-and-fast');
    const { reportId } = await gvm.startTask(taskId);

    const scanInfo = {
      scanId: taskId, taskId, targetId, reportId, targets,
      scanProfile: scanProfile || 'full-and-fast',
      clientName: clientName || 'Client',
      clientCompany: clientCompany || 'Organisation',
      auditorId, organizationId,
      isScheduled: !!isScheduled,
      status: 'QUEUED', progress: 0, startedAt: new Date(),
      logs: [
        `[${ts()}] ✅ Connexion GVM établie`,
        `[${ts()}] 🎯 Cible créée: ${targets}`,
        `[${ts()}] 📋 Tâche automatisée créée (profil: ${scanProfile || 'full-and-fast'})`,
        `[${ts()}] 🚀 Scan programmé démarré — ID: ${taskId}`,
        `[${ts()}] ⏳ Polling activé (30s)`,
      ],
    };

    activeScans.set(taskId, scanInfo);

    // Update ScheduledScan lastStatus to Running
    if (isScheduled && auditorId) {
      await ScheduledScan.findOneAndUpdate(
        { auditorId: new mongoose.Types.ObjectId(auditorId), targets, isActive: true },
        { lastStatus: 'Running' }
      );
    }

    await Scan.create({
      taskId,
      reportId,
      targetId,
      targets,
      scanProfile: scanProfile || 'full-and-fast',
      clientName: clientName || 'Client',
      clientCompany: clientCompany || 'Organisation',
      auditorId: auditorId ? new mongoose.Types.ObjectId(auditorId) : undefined,
      organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined,
      status: 'QUEUED',
      progress: 0,
      logs: scanInfo.logs,
      startedAt: new Date(),
      isScheduled: !!isScheduled,
    });

    startPolling(taskId);
    return { success: true, scanId: taskId, reportId };
  } catch (error) {
    console.error('[SCAN INTERNAL] Erreur:', error.message);
    throw error;
  }
};

// ══════════════════════════════════════════════════════════════
//  POLLING 30s
// ══════════════════════════════════════════════════════════════
function startPolling(taskId) {
  const ts = () => new Date().toLocaleTimeString('fr-FR');

  const interval = setInterval(async () => {
    try {
      const scan = activeScans.get(taskId);
      if (!scan) { clearInterval(interval); return; }

      const { status, progress, rawStatus } = await gvm.getTaskStatus(taskId);
      scan.status = status;
      scan.progress = progress;
      scan.logs.push(`[${ts()}] 📡 ${rawStatus} — ${progress}%`);

      // Sync DB toutes les 2 minutes (pas à chaque poll)
      await syncScanToDB(taskId);

      if (status === 'DONE') {
        clearInterval(interval);
        scan.logs.push(`[${ts()}] ✅ Scan terminé ! Pipeline automatique...`);
        await runFullPipeline(taskId);
      }

      if (status === 'STOPPED' || status === 'UNKNOWN') {
        clearInterval(interval);
        scan.logs.push(`[${ts()}] ⚠️ Scan ${status}`);
        await syncScanToDB(taskId);
      }
    } catch (error) {
      const scan = activeScans.get(taskId);
      if (scan) scan.logs.push(`[${ts()}] ❌ ${error.message}`);
    }
  }, 30000);

  const scan = activeScans.get(taskId);
  if (scan) scan._interval = interval;
}

// ══════════════════════════════════════════════════════════════
//  PIPELINE AUTO : XML → Parse → IA → PDF → MongoDB
// ══════════════════════════════════════════════════════════════
async function runFullPipeline(taskId) {
  const scan = activeScans.get(taskId);
  if (!scan) return;
  const ts = () => new Date().toLocaleTimeString('fr-FR');

  try {
    // ── 1. XML ──
    scan.logs.push(`[${ts()}] 📄 Récupération XML...`);
    scan.status = 'RETRIEVING_XML';
    await syncScanToDB(taskId);
    const xmlContent = await gvm.getReportXML(scan.reportId);
    scan.logs.push(`[${ts()}] ✅ XML récupéré (${(xmlContent.length / 1024).toFixed(1)} KB)`);

    // ── 2. Parse ──
    scan.logs.push(`[${ts()}] 🔍 Parsing vulnérabilités...`);
    scan.status = 'PARSING';
    await syncScanToDB(taskId);
    const parsedReport = await parseOpenVASReport(xmlContent);
    const st = parsedReport.stats || {};
    scan.logs.push(`[${ts()}] ✅ ${st.total || 0} vulnérabilités (C:${st.critical || 0} H:${st.high || 0} M:${st.medium || 0} L:${st.low || 0})`);

    // ── 3. Récupérer le questionnaire de l'auditeur ──
    let questionnaireAxes = null;
    if (scan.auditorId && scan.organizationId) {
      try {
        const auditData = await AuditData.findOne({
          auditorId: new mongoose.Types.ObjectId(scan.auditorId),
          organizationId: new mongoose.Types.ObjectId(scan.organizationId),
        });
        if (auditData && auditData.axes && auditData.axes.length > 0) {
          questionnaireAxes = auditData.axes;
          scan.logs.push(`[${ts()}] 📋 Questionnaire chargé (${auditData.axes.length} axes, ${auditData.axes.reduce((s, a) => s + (a.questions?.length || 0), 0)} questions)`);
        } else {
          scan.logs.push(`[${ts()}] ⚠️ Aucun questionnaire rempli — score basé uniquement sur le scan technique`);
        }
      } catch (e) {
        scan.logs.push(`[${ts()}] ⚠️ Questionnaire non trouvé — score technique uniquement`);
      }
    }

    // ── 3b. IA ──
    scan.logs.push(`[${ts()}] 🤖 Analyse IA (Groq LLaMA 3.3 70B)...`);
    scan.status = 'AI_ANALYSIS';
    await syncScanToDB(taskId);

    const st2 = parsedReport.stats || {};
    const computedStats = {
      globalScore: Math.max(0, 100 - (st2.critical || 0) * 15 - (st2.high || 0) * 8 - (st2.medium || 0) * 3 - (st2.low || 0)),
      scoreTrend: 0,
      isoCompliance: Math.max(0, 85 - (st2.critical || 0) * 10 - (st2.high || 0) * 5),
      critTrend: 0, highTrend: 0, medTrend: 0, lowTrend: 0,
    };

    const aiResult = await analyzeVulnerabilities(parsedReport, computedStats, questionnaireAxes);
    const orgScoreData = aiResult.organisational_score || computeOrganizationalScore(questionnaireAxes);
    scan.logs.push(`[${ts()}] ✅ Score Tech: ${aiResult.raw_tech_score || 'N/A'}/100 | Score Org: ${orgScoreData?.globalScore ?? 'N/A'}/100 | Score Final: ${aiResult.score_securite}/100 — Risque: ${aiResult.niveau_risque}`);

    // ── 4. PDF ──
    scan.logs.push(`[${ts()}] 📊 Génération PDF...`);
    scan.status = 'GENERATING_PDF';
    await syncScanToDB(taskId);
    const pdfBuffer = await generatePDFReport(parsedReport, aiResult, {
      name: scan.clientName,
      company: scan.clientCompany,
    });
    scan.logs.push(`[${ts()}] ✅ PDF (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);

    // ── 5. MongoDB ──
    scan.logs.push(`[${ts()}] 💾 Sauvegarde...`);
    scan.status = 'SAVING';
    await syncScanToDB(taskId);
    const ref = `AUD-${Date.now().toString().slice(-6)}`;

    const report = new Report({
      title: `Rapport d'Audit — ${scan.clientCompany} — ${new Date().toLocaleDateString('fr-FR')}`,
      clientName: scan.clientName,
      clientCompany: scan.clientCompany,
      ref,
      score: aiResult.score_securite,
      niveauRisque: aiResult.niveau_risque,
      resumeExecutif: aiResult.resume_executif,
      stats: parsedReport.stats,
      vulnerabilities: parsedReport.vulnerabilities,
      priorites: aiResult.priorites,
      recommendations: aiResult.recommandations_generales,
      recommandationsDetaillees: aiResult.recommandations_detaillees || [],
      actionsImmediates: aiResult.actions_immediates,
      topVulnerabilites: aiResult.top_vulnerabilites,
      conclusion: aiResult.conclusion,
      pdfData: pdfBuffer.toString('base64'),
      auditorId: scan.auditorId ? new mongoose.Types.ObjectId(scan.auditorId) : undefined,
      organizationId: scan.organizationId ? new mongoose.Types.ObjectId(scan.organizationId) : undefined,
      status: 'DRAFT',
      openvasTaskId: taskId,
      openvasReportId: scan.reportId,
      scanProfile: scan.scanProfile,
      targets: scan.targets,
      fullAiReport: aiResult.full_report || null,
      // Score organisationnel (questionnaire)
      auditData: questionnaireAxes ? {
        axes: questionnaireAxes,
        assets: [],
        organisationalScore: orgScoreData,
      } : undefined,
    });

    await report.save();

    // Notification auditeur
    if (scan.auditorId) {
      try {
        await createNotificationHelper({
          userId: scan.auditorId,
          title: '✅ Scan terminé — Rapport prêt',
          message: `Scan ${scan.clientCompany} terminé. Score: ${aiResult.score_securite}/100. Rapport prêt à soumettre.`,
          type: 'SUCCESS',
          actionUrl: 'reports',
        });
      } catch (e) { /* non bloquant */ }
    }

    // ── Notification chef d'audit (si scan planifié ou non) ──
    if (scan.auditorId) {
      try {
        const auditor = await User.findById(scan.auditorId);
        if (auditor && auditor.chefId) {
          await createNotificationHelper({
            userId: auditor.chefId,
            title: '📊 Scan terminé — Nouveau rapport',
            message: `L'auditeur ${auditor.name} a un nouveau rapport pour ${scan.clientCompany}. Score: ${aiResult.score_securite}/100.`,
            type: 'INFO',
            actionUrl: 'validation',
          });
        }
      } catch (e) { /* non bloquant */ }
    }

    // ── Mettre à jour le ScheduledScan si c'est un scan planifié ──
    if (scan.isScheduled && scan.auditorId) {
      try {
        await ScheduledScan.findOneAndUpdate(
          { auditorId: new mongoose.Types.ObjectId(scan.auditorId), targets: scan.targets, isActive: true },
          { lastStatus: 'Terminé', lastRun: new Date() }
        );
      } catch (e) { /* non bloquant */ }
    }

    // ── Résultat final ──
    scan.status = 'COMPLETED';
    scan.progress = 100;
    scan.reportMongoId = report._id.toString();
    scan.logs.push(`[${ts()}] ══════════════════════════════════════`);
    scan.logs.push(`[${ts()}] ✅ PIPELINE TERMINÉ`);
    scan.logs.push(`[${ts()}]    Rapport: ${ref}`);
    scan.logs.push(`[${ts()}]    Score: ${aiResult.score_securite}/100`);
    scan.logs.push(`[${ts()}]    Risque: ${aiResult.niveau_risque}`);
    scan.logs.push(`[${ts()}]    → Prêt à soumettre au Chef d'Audit`);
    scan.logs.push(`[${ts()}] ══════════════════════════════════════`);

    scan.summary = {
      reportId: report._id.toString(),
      ref,
      score: aiResult.score_securite,
      niveauRisque: aiResult.niveau_risque,
      resumeExecutif: aiResult.resume_executif,
      stats: parsedReport.stats,
      vulnerabilities: parsedReport.vulnerabilities,
      priorites: aiResult.priorites,
      recommandations: aiResult.recommandations_generales,
      recommandations_detaillees: aiResult.recommandations_detaillees || [],
      actions_immediates: aiResult.actions_immediates,
      top_vulnerabilites: aiResult.top_vulnerabilites,
      conclusion: aiResult.conclusion,
    };

    await syncScanToDB(taskId);

  } catch (error) {
    scan.status = 'ERROR';
    scan.error = error.message;
    scan.logs.push(`[${ts()}] ❌ ERREUR: ${error.message}`);

    // Mettre à jour ScheduledScan en Erreur si c'est un scan planifié
    if (scan.isScheduled && scan.auditorId) {
      try {
        await ScheduledScan.findOneAndUpdate(
          { auditorId: new mongoose.Types.ObjectId(scan.auditorId), targets: scan.targets, isActive: true },
          { lastStatus: 'Erreur' }
        );
      } catch (e) { /* non bloquant */ }
    }

    await syncScanToDB(taskId);
  }
}

// ══════════════════════════════════════════════════════════════
//  GET /api/scans/:scanId/status — polling frontend 5s
// ══════════════════════════════════════════════════════════════
export const getScanStatus = async (req, res) => {
  try {
    // D'abord en mémoire (rapide)
    let scan = activeScans.get(req.params.scanId);

    // Sinon en DB (persisté)
    if (!scan) {
      const dbScan = await Scan.findOne({ taskId: req.params.scanId });
      if (!dbScan) return res.status(404).json({ error: 'Scan non trouvé' });

      scan = {
        scanId: dbScan.taskId,
        status: dbScan.status,
        progress: dbScan.progress,
        targets: dbScan.targets,
        startedAt: dbScan.startedAt,
        logs: dbScan.logs || [],
        reportMongoId: dbScan.mongoReportId?.toString() || null,
        summary: dbScan.summary || null,
        error: dbScan.error || null,
      };
    }

    res.json({
      scanId: scan.scanId || scan.taskId,
      status: scan.status,
      progress: scan.progress,
      targets: scan.targets,
      startedAt: scan.startedAt,
      logs: scan.logs,
      reportId: scan.reportMongoId || null,
      summary: scan.summary || null,
      error: scan.error || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET /api/scans/active
export const getActiveScans = async (req, res) => {
  const scans = [];
  for (const [id, s] of activeScans) {
    scans.push({ scanId: id, targets: s.targets, status: s.status, progress: s.progress, clientCompany: s.clientCompany, startedAt: s.startedAt, isScheduled: s.isScheduled || false });
  }
  res.json(scans);
};

// GET /api/scans/my-active — Scan actif de l'auditeur connecté (polling frontend)
export const getMyActiveScan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    // 1. Chercher en mémoire d'abord (plus rapide)
    for (const [id, s] of activeScans) {
      const sAuditorId = s.auditorId?.toString();
      if (sAuditorId === userId.toString()) {
        const activeStatuses = ['QUEUED', 'RUNNING', 'DONE', 'RETRIEVING_XML', 'PARSING', 'AI_ANALYSIS', 'GENERATING_PDF', 'SAVING'];
        if (activeStatuses.includes(s.status)) {
          return res.json({
            success: true,
            scan: {
              scanId: id,
              taskId: id,
              targets: s.targets,
              status: s.status,
              progress: s.progress,
              clientCompany: s.clientCompany,
              startedAt: s.startedAt,
              isScheduled: s.isScheduled || false,
              logs: s.logs || [],
            }
          });
        }
      }
    }

    // 2. Fallback en DB
    const activeScan = await Scan.findOne({
      auditorId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['QUEUED', 'RUNNING', 'DONE', 'RETRIEVING_XML', 'PARSING', 'AI_ANALYSIS', 'GENERATING_PDF', 'SAVING'] }
    }).sort({ startedAt: -1 });

    if (activeScan) {
      return res.json({
        success: true,
        scan: {
          scanId: activeScan.taskId,
          taskId: activeScan.taskId,
          targets: activeScan.targets,
          status: activeScan.status,
          progress: activeScan.progress,
          clientCompany: activeScan.clientCompany,
          startedAt: activeScan.startedAt,
          isScheduled: activeScan.isScheduled || false,
          logs: activeScan.logs || [],
        }
      });
    }

    res.json({ success: true, scan: null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
//  GET /api/scans/user/:userId — Scans d'un auditeur (persistance)
// ══════════════════════════════════════════════════════════════
export const getUserScans = async (req, res) => {
  try {
    const { userId } = req.params;

    // Chercher les scans en cours ou récents (dernières 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const scans = await Scan.find({
      auditorId: new mongoose.Types.ObjectId(userId),
      $or: [
        { status: { $in: ['QUEUED', 'RUNNING', 'DONE', 'RETRIEVING_XML', 'PARSING', 'AI_ANALYSIS', 'GENERATING_PDF', 'SAVING'] } },
        { completedAt: { $gte: oneDayAgo } },
        { startedAt: { $gte: oneDayAgo }, status: 'COMPLETED' },
      ]
    }).sort({ startedAt: -1 }).limit(5);

    // Si un scan est actif en mémoire, utiliser ces données (plus fraîches)
    const result = scans.map(s => {
      const memScan = activeScans.get(s.taskId);
      return {
        scanId: s.taskId,
        status: memScan?.status || s.status,
        progress: memScan?.progress ?? s.progress,
        targets: s.targets,
        clientCompany: s.clientCompany,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        logs: memScan?.logs || s.logs || [],
        reportId: memScan?.reportMongoId || s.mongoReportId?.toString() || null,
        summary: memScan?.summary || s.summary || null,
        error: memScan?.error || s.error || null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/scans/profiles
export const getScanProfiles = async (req, res) => {
  res.json(gvm.getAvailableScanProfiles());
};

// GET /api/scans/test-connection
export const testGvmConnection = async (req, res) => {
  try {
    res.json(await gvm.testConnection());
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
};

// POST /api/scans/:scanId/stop
export const stopScan = async (req, res) => {
  try {
    const { scanId } = req.params;
    const scan = activeScans.get(scanId);

    if (scan && scan.taskId) {
      await gvm.stopTask(scan.taskId);
      scan.status = 'STOPPED';
      scan.logs = [...(scan.logs || []), `[SCAN] ⛔ Scan arrêté manuellement`];
      activeScans.set(scanId, scan);
      await syncScanToDB(scanId);
      console.log(`[SCAN] Arrêt demandé pour ${scanId}`);
      res.json({ success: true, status: 'STOPPED' });
    } else {
      // Essayer directement en DB
      const dbScan = await Scan.findOne({ taskId: scanId });
      if (dbScan) {
        await gvm.stopTask(dbScan.taskId);
        dbScan.status = 'STOPPED';
        dbScan.logs = [...(dbScan.logs || []), `[SCAN] ⛔ Scan arrêté manuellement`];
        await dbScan.save();
        res.json({ success: true, status: 'STOPPED' });
      } else {
        res.status(404).json({ error: 'Scan non trouvé' });
      }
    }
  } catch (error) {
    console.error('[SCAN] Stop error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
