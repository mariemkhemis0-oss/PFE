import { parseOpenVASReport } from '../services/openvasParser.js';
import { analyzeVulnerabilities, computeOrganizationalScore } from '../services/aiAnalysisService.js';
import { generatePDFReport } from '../services/pdfReportService.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { createNotificationHelper } from './notificationController.js';

export const generateReport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier XML requis' });

    const xmlContent = req.file.buffer.toString('utf-8');
    const clientName = req.body.clientName || 'Client';
    const clientCompany = req.body.clientCompany || 'Organisation';

    const parsedReport = await parseOpenVASReport(xmlContent);
    const aiAnalysis = await analyzeVulnerabilities(parsedReport);
    const clientInfo = { name: clientName, company: clientCompany };
    const pdfBuffer = await generatePDFReport(parsedReport, aiAnalysis, clientInfo);

    const report = new Report({
      title: `Audit ${clientCompany} — ${new Date().toLocaleDateString('fr-FR')}`,
      clientName,
      clientCompany,
      ref: `AUD-${Date.now().toString().slice(-6)}`,
      score: aiAnalysis.score_securite,
      niveauRisque: aiAnalysis.niveau_risque,
      resumeExecutif: aiAnalysis.resume_executif,
      stats: parsedReport.stats,
      vulnerabilities: parsedReport.vulnerabilities,
      priorites: aiAnalysis.priorites,
      recommendations: aiAnalysis.recommandations_generales,
      conclusion: aiAnalysis.conclusion,
      pdfData: pdfBuffer.toString('base64'),
      status: 'DRAFT',
    });

    await report.save();

    res.json({
      success: true,
      reportId: report._id,
      summary: {
        score: aiAnalysis.score_securite,
        niveauRisque: aiAnalysis.niveau_risque,
        resumeExecutif: aiAnalysis.resume_executif,
        stats: parsedReport.stats,
        priorites: aiAnalysis.priorites,
        recommandations: aiAnalysis.recommandations_generales,
        conclusion: aiAnalysis.conclusion,
        vulnerabilities: parsedReport.vulnerabilities,
        date_audit: aiAnalysis.date_audit,
        session_id: aiAnalysis.session_id,
        top_vulnerabilites: aiAnalysis.top_vulnerabilites,
        actions_immediates: aiAnalysis.actions_immediates,
      }
    });
  } catch (error) {
    console.error('GENERATE REPORT ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().select('-pdfData').sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Rapport introuvable' });

    const pdfBuffer = Buffer.from(report.pdfData, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-${report.ref}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Soumettre au chef → IN_REVIEW / PENDING_LEAD
export const submitReport = async (req, res) => {
  try {
    const { auditorId, organizationId, auditData } = req.body;

    const updateFields = {
      status: 'PENDING_LEAD',
      auditorId,
      submittedAt: new Date(),
    };
    if (organizationId) updateFields.organizationId = organizationId;
    if (auditData) {
      // Calculer le score organisationnel à partir du questionnaire
      const orgScore = computeOrganizationalScore(auditData.axes);
      updateFields.auditData = {
        ...auditData,
        organisationalScore: orgScore,
      };
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Rapport introuvable' });

    // Notif → tous les chefs liés à cet auditeur
    if (auditorId) {
      const auditor = await User.findById(auditorId);
      if (auditor?.chefId) {
        await createNotificationHelper({
          userId: auditor.chefId,
          title: '📋 Nouveau rapport à valider',
          message: `${auditor.name} a soumis un rapport pour "${report.clientCompany || report.clientName}" en attente de votre validation.`,
          type: 'INFO',
          actionUrl: 'validation',
        });
      }
    }

    res.json({ message: 'Rapport soumis pour validation', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Certifier et publier → PUBLISHED / COMPLETED
export const publishReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Rapport introuvable' });

    // Trouver le client associé — recherche améliorée
    let clientId = null;
    const companyName = (report.clientCompany || '').trim();
    const clientNameStr = (report.clientName || '').trim();

    if (companyName || clientNameStr) {
      // 1. Chercher par company (case-insensitive)
      let client = null;
      if (companyName) {
        client = await User.findOne({ 
          company: { $regex: new RegExp(`^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, 
          role: { $regex: /^client$/i } 
        });
      }
      // 2. Chercher par name (case-insensitive)
      if (!client && clientNameStr) {
        client = await User.findOne({ 
          name: { $regex: new RegExp(`^${clientNameStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, 
          role: { $regex: /^client$/i } 
        });
      }
      // 3. Fallback: trouver un client assigné à l'auditeur de ce rapport
      if (!client && report.auditorId) {
        client = await User.findOne({ 
          auditorId: report.auditorId, 
          role: { $regex: /^client$/i } 
        });
      }
      if (client) clientId = client._id;
      console.log('[PUBLISH] Client lookup:', { companyName, clientNameStr, clientId: clientId?.toString() || 'NOT FOUND' });
    }

    // Mettre à jour le rapport
    const updateData = { 
      status: 'PUBLISHED', 
      publishedAt: new Date(), 
      approvedAt: new Date(), 
      certifiedBy: req.body.chefId,
    };
    if (clientId) updateData.clientId = clientId;

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    // Notif → l'auditeur
    if (updatedReport.auditorId) {
      await createNotificationHelper({
        userId: updatedReport.auditorId,
        title: '✅ Rapport certifié et publié',
        message: `Votre rapport pour "${updatedReport.clientCompany || updatedReport.clientName}" a été certifié et publié par le chef d'audit. Le client peut maintenant le consulter.`,
        type: 'SUCCESS',
        actionUrl: 'reports',
      });
    }

    // Notif → le client
    if (clientId) {
      await createNotificationHelper({
        userId: clientId,
        title: '📄 Votre rapport d\'audit est disponible',
        message: `Un nouveau rapport d'audit "${updatedReport.title || updatedReport.ref}" a été certifié et est maintenant disponible dans votre espace. Score de sécurité : ${updatedReport.score}/100.`,
        type: 'SUCCESS',
        actionUrl: 'client-reports',
      });
    }

    res.json({ message: 'Rapport certifié et publié', report: updatedReport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rejeter avec commentaire OBLIGATOIRE → REJECTED
export const rejectReport = async (req, res) => {
  try {
    const { comment, chefId } = req.body;

    // Commentaire obligatoire
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Le commentaire de rejet est obligatoire.' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'REJECTED', rejectionComment: comment.trim(), rejectedAt: new Date(), certifiedBy: chefId } },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Rapport introuvable' });

    // Notif → l'auditeur avec le commentaire du chef
    if (report.auditorId) {
      await createNotificationHelper({
        userId: report.auditorId,
        title: '❌ Rapport rejeté — Corrections requises',
        message: `Votre rapport pour "${report.clientCompany || report.clientName}" a été rejeté. Motif : "${comment.trim()}". Veuillez apporter les corrections nécessaires et re-soumettre.`,
        type: 'WARNING',
        actionUrl: 'reports',
      });
    }

    res.json({ message: 'Rapport rejeté', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Re-soumettre un rapport rejeté → PENDING_LEAD
export const resubmitReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Rapport introuvable' });
    if (report.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Seuls les rapports rejetés peuvent être re-soumis' });
    }

    report.status = 'PENDING_LEAD';
    report.rejectionComment = null;
    report.rejectedAt = null;
    report.submittedAt = new Date();
    await report.save();

    // Notif → chef
    if (report.auditorId) {
      const auditor = await User.findById(report.auditorId);
      if (auditor?.chefId) {
        await createNotificationHelper({
          userId: auditor.chefId,
          title: '🔄 Rapport re-soumis après corrections',
          message: `${auditor.name} a re-soumis le rapport pour "${report.clientCompany || report.clientName}" après corrections. Merci de le re-valider.`,
          type: 'INFO',
          actionUrl: 'validation',
        });
      }
    }

    res.json({ message: 'Rapport re-soumis pour validation', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET rapports par statut
export const getReportsByStatus = async (req, res) => {
  try {
    const reports = await Report.find({ status: req.params.status }).select('-pdfData').sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET rapports pour un chef
export const getReportsByChef = async (req, res) => {
  try {
    const { chefId } = req.params;
    const { status } = req.query;

    // 1. Récupérer TOUS les users et filtrer manuellement pour éviter les problèmes de type ObjectId/String
    const allUsers = await User.find({ role: 'AUDITOR' });
    const myAuditors = allUsers.filter(u => u.chefId && u.chefId.toString() === chefId.toString());
    const auditorIds = myAuditors.map(a => a._id);

    let reports = [];

    // 2. Rapports des auditeurs liés à ce chef
    if (auditorIds.length > 0) {
      const filter = { auditorId: { $in: auditorIds } };
      if (status) filter.status = status;
      reports = await Report.find(filter).select('-pdfData').sort({ createdAt: -1 });
    }

    // 3. Fallback: inclure aussi les rapports non liés directement à un auditeur de ce chef
    //    (rapports soumis mais pas encore reliés, ou rapports sans auditorId)
    if (!status || ['PENDING_LEAD', 'IN_REVIEW', 'REJECTED', 'DRAFT', 'PUBLISHED', 'COMPLETED'].includes(status)) {
      const pendingFilter = {};
      if (status) {
        pendingFilter.status = status;
      }
      // Exclure ceux déjà trouvés
      if (reports.length > 0) {
        pendingFilter._id = { $nin: reports.map(r => r._id) };
      }
      const extraReports = await Report.find(pendingFilter).select('-pdfData').sort({ createdAt: -1 });
      
      // Filtrer: garder seulement ceux dont l'auditeur n'est assigné à aucun chef OU est assigné à CE chef
      for (const r of extraReports) {
        if (!r.auditorId) {
          reports.push(r);
        } else {
          const auditor = allUsers.find(u => u._id.toString() === r.auditorId.toString());
          // Inclure si: auditeur supprimé (orphelin), auditeur sans chef, ou auditeur de CE chef
          if (!auditor || !auditor.chefId || auditor.chefId.toString() === chefId.toString()) {
            reports.push(r);
          }
        }
      }
    }

    // Trier par date desc
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET rapports pour un auditeur
export const getReportsByAuditor = async (req, res) => {
  try {
    const { auditorId } = req.params;
    const { status } = req.query;

    const filter = { auditorId };
    if (status) filter.status = status;

    const reports = await Report.find(filter).select('-pdfData').sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET stats dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const { role, userId } = req.query;

    if (role === 'ADMIN') {
      const total = await Report.countDocuments();
      const inReview = await Report.countDocuments({ status: { $in: ['IN_REVIEW', 'PENDING_LEAD'] } });
      const published = await Report.countDocuments({ status: { $in: ['PUBLISHED', 'COMPLETED'] } });
      const rejected = await Report.countDocuments({ status: 'REJECTED' });
      return res.json({ total, inReview, published, rejected });
    }

    if (role === 'CHEF') {
      const auditors = await User.find({ chefId: userId });
      const auditorIds = auditors.map(a => a._id);
      // Count all pending reports (not just linked auditors)
      const total = await Report.countDocuments(auditorIds.length > 0 ? { auditorId: { $in: auditorIds } } : {});
      const inReview = await Report.countDocuments({ status: { $in: ['IN_REVIEW', 'PENDING_LEAD'] } });
      const published = await Report.countDocuments({ status: { $in: ['PUBLISHED', 'COMPLETED'] } });
      return res.json({ total, inReview, published, auditorsCount: auditors.length });
    }

    if (role === 'AUDITOR') {
      const total = await Report.countDocuments({ auditorId: userId });
      const inReview = await Report.countDocuments({ auditorId: userId, status: 'IN_REVIEW' });
      const published = await Report.countDocuments({ auditorId: userId, status: 'PUBLISHED' });
      const rejected = await Report.countDocuments({ auditorId: userId, status: 'REJECTED' });
      const clients = await User.countDocuments({ auditorId: userId });
      return res.json({ total, inReview, published, rejected, clients });
    }

    if (role === 'CLIENT') {
      const reports = await Report.find({ status: 'PUBLISHED' }).select('-pdfData').sort({ createdAt: -1 });
      return res.json({ reports, total: reports.length });
    }

    res.json({});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};