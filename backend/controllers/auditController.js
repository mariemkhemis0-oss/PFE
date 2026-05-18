import AuditorOrganization from '../models/AuditorOrganization.js';
import Organization from '../models/Organization.js';
import Report from '../models/Report.js';
import Host from '../models/Host.js';
import User from '../models/User.js';

// ===== 1. RÉCUPÉRER LES ORGANISATIONS DE L'AUDITEUR =====
export const getMyOrganizations = async (req, res) => {
  try {
    // Récupérer l'ID de l'auditeur depuis le token ou la session
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!auditorId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Récupérer toutes les associations auditor-organization
    const auditorOrgs = await AuditorOrganization.find({ auditorId, status: 'ACTIVE' })
      .populate('organizationId')
      .sort({ assignedAt: -1 });

    if (!auditorOrgs || auditorOrgs.length === 0) {
      return res.status(404).json({ message: 'Aucune organisation assignée' });
    }

    const organizations = auditorOrgs.map(ao => ({
      id: ao.organizationId._id,
      name: ao.organizationId.name,
      sector: ao.organizationId.sector,
      type: ao.organizationId.type,
      assignedAt: ao.assignedAt,
    }));

    res.json({ success: true, organizations });
  } catch (error) {
    console.error('Erreur getMyOrganizations:', error);
    res.status(500).json({ error: error.message });
  }
};

// ===== 2. RÉCUPÉRER LES FORMULAIRES POUR UNE ORGANISATION =====
export const getOrganizationAuditForms = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!auditorId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier que l'auditeur a accès à cette organisation
    const hasAccess = await AuditorOrganization.findOne({ auditorId, organizationId, status: 'ACTIVE' });
    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès non autorisé à cette organisation' });
    }

    // Récupérer les rapports brouillon pour cette organisation
    const forms = await Report.find({ 
      organizationId, 
      auditorId, 
      status: 'DRAFT' 
    });

    res.json({ success: true, forms });
  } catch (error) {
    console.error('Erreur getOrganizationAuditForms:', error);
    res.status(500).json({ error: error.message });
  }
};

// ===== 3. RÉCUPÉRER LES ÉQUIPEMENTS D'UNE ORGANISATION =====
export const getOrganizationHosts = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!auditorId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier que l'auditeur a accès à cette organisation
    const hasAccess = await AuditorOrganization.findOne({ auditorId, organizationId, status: 'ACTIVE' });
    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès non autorisé à cette organisation' });
    }

    // Récupérer les hosts de l'organisation
    const hosts = await Host.find({ organizationId })
      .select('_id hostname ipAddress operatingSystem status lastScanned')
      .lean();

    res.json({ success: true, hosts });
  } catch (error) {
    console.error('Erreur getOrganizationHosts:', error);
    res.status(500).json({ error: error.message });
  }
};

// ===== 4. CRÉER UN RAPPORT POUR UNE ORGANISATION =====
export const createOrganizationReport = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!auditorId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const { title, description } = req.body;

    // Vérifier que l'auditeur a accès à cette organisation
    const hasAccess = await AuditorOrganization.findOne({ auditorId, organizationId, status: 'ACTIVE' });
    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès non autorisé à cette organisation' });
    }

    // Créer le rapport avec lien à l'organisation
    const newReport = new Report({
      title: title || `Audit - ${new Date().toLocaleDateString()}`,
      description,
      organizationId,
      auditorId,
      status: 'DRAFT',
      startDate: new Date(),
    });

    await newReport.save();
    res.status(201).json({ success: true, report: newReport });
  } catch (error) {
    console.error('Erreur createOrganizationReport:', error);
    res.status(500).json({ error: error.message });
  }
};

// ===== 5. AJOUTER UN ÉQUIPEMENT À UNE ORGANISATION =====
export const addHostToOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!auditorId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }
    const { hostname, ipAddress, operatingSystem } = req.body;

    // Vérifier que l'auditeur a accès à cette organisation
    const hasAccess = await AuditorOrganization.findOne({ auditorId, organizationId, status: 'ACTIVE' });
    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès non autorisé à cette organisation' });
    }

    // Vérifier que l'organisation existe
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({ error: 'Organisation non trouvée' });
    }

    // Créer l'host avec lien à l'organisation
    const newHost = new Host({
      hostname,
      ipAddress,
      organizationId,
      operatingSystem: operatingSystem || 'Unknown',
    });

    await newHost.save();
    res.status(201).json({ success: true, host: newHost });
  } catch (error) {
    console.error('Erreur addHostToOrganization:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Adresse IP déjà existante' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// ===== 6. OBTENIR LES STATISTIQUES D'UNE ORGANISATION =====
export const getOrganizationStats = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const auditorId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!auditorId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier que l'auditeur a accès à cette organisation
    const hasAccess = await AuditorOrganization.findOne({ auditorId, organizationId, status: 'ACTIVE' });
    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès non autorisé à cette organisation' });
    }

    // Compter les hosts
    const hostsCount = await Host.countDocuments({ organizationId });

    // Compter les rapports
    const reportsCount = await Report.countDocuments({ organizationId, auditorId });
    const reportsInReview = await Report.countDocuments({ organizationId, auditorId, status: 'IN_REVIEW' });
    const reportsPublished = await Report.countDocuments({ organizationId, auditorId, status: 'PUBLISHED' });

    res.json({
      success: true,
      stats: {
        totalHosts: hostsCount,
        totalReports: reportsCount,
        reportsInReview,
        reportsPublished,
      }
    });
  } catch (error) {
    console.error('Erreur getOrganizationStats:', error);
    res.status(500).json({ error: error.message });
  }
};

// ===== 7. SEED DEMO DATA (For Testing) =====
export const seedDemoData = async (req, res) => {
  try {
    // Créer les organisations de démo
    const demoOrgs = await Organization.insertMany([
      { name: 'Acme Corporation', sector: 'Finance', type: 'ENTERPRISE' },
      { name: 'TechStart Inc', sector: 'Technology', type: 'Startup' },
      { name: 'Global Bank', sector: 'Banking', type: 'ENTERPRISE' },
    ], { ordered: false }).catch(() => Organization.find().limit(3));
    
    // Récupérer les auditeurs
    const auditors = await User.find({ role: 'AUDITOR' }).limit(2);
    
    if (auditors.length > 0) {
      // Créer les associations
      const associations = [];
      for (let i = 0; i < auditors.length; i++) {
        for (let j = 0; j < demoOrgs.length; j++) {
          associations.push({
            auditorId: auditors[i]._id,
            organizationId: demoOrgs[j]._id,
            status: 'ACTIVE',
          });
        }
      }
      
      await AuditorOrganization.insertMany(associations, { ordered: false }).catch(() => {});
    }
    
    res.json({ 
      success: true, 
      message: 'Demo data seeded',
      organizations: demoOrgs.length,
      associationsCreated: (auditors.length * demoOrgs.length)
    });
  } catch (error) {
    console.error('Erreur seed demo:', error);
    res.status(500).json({ error: error.message });
  }
};
