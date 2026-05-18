import CVE from '../models/CVE.js';
import Vulnerability from '../models/Vulnerability.js';
import Host from '../models/Host.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

// ===== CVE LIBRARY =====

// GET all CVEs
export const getCVEs = async (req, res) => {
  try {
    const { severity } = req.query;
    let query = {};

    if (severity) query.severity = severity.toUpperCase();

    const cves = await CVE.find(query);
    res.json(cves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single CVE
export const getCVEById = async (req, res) => {
  try {
    const cve = await CVE.findById(req.params.id);
    if (!cve) {
      return res.status(404).json({ error: 'CVE not found' });
    }
    res.json(cve);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// SEARCH CVEs by CVE ID
export const searchCVE = async (req, res) => {
  try {
    const { cveId } = req.query;
    if (!cveId) {
      return res.status(400).json({ error: 'cveId query parameter required' });
    }

    const cve = await CVE.findOne({ cveId: new RegExp(cveId, 'i') });
    if (!cve) {
      return res.status(404).json({ error: 'CVE not found' });
    }

    res.json(cve);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE CVE
export const createCVE = async (req, res) => {
  try {
    const { cveId, title, description, severity, cvssScore } = req.body;
    if (!cveId || !title || !severity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newCVE = new CVE({
      cveId,
      title,
      description: description || '',
      severity: severity.toUpperCase(),
      cvssScore: cvssScore || 5.0,
      affectedSoftware: [],
      references: [],
    });

    await newCVE.save();
    res.status(201).json(newCVE);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE CVE
export const updateCVE = async (req, res) => {
  try {
    const cve = await CVE.findById(req.params.id);
    if (!cve) {
      return res.status(404).json({ error: 'CVE not found' });
    }

    const { title, description, severity, cvssScore, affectedSoftware, references } = req.body;
    if (title) cve.title = title;
    if (description) cve.description = description;
    if (severity) cve.severity = severity.toUpperCase();
    if (cvssScore !== undefined) cve.cvssScore = cvssScore;
    if (affectedSoftware) cve.affectedSoftware = affectedSoftware;
    if (references) cve.references = references;

    cve.updatedAt = new Date();
    await cve.save();
    res.json(cve);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE CVE
export const deleteCVE = async (req, res) => {
  try {
    const cve = await CVE.findByIdAndDelete(req.params.id);
    if (!cve) {
      return res.status(404).json({ error: 'CVE not found' });
    }
    res.json({ message: 'CVE deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== DASHBOARD & CONFIG =====

// GET dashboard overview
export const getDashboardData = async (req, res) => {
  try {
    const totalVulnerabilities = await Vulnerability.countDocuments();
    const criticalVulnerabilities = await Vulnerability.countDocuments({ severity: 'CRITICAL' });
    const highVulnerabilities = await Vulnerability.countDocuments({ severity: 'HIGH' });
    const activeHosts = await Host.countDocuments({ status: 'ACTIVE' });
    const totalHosts = await Host.countDocuments();
    const publishedReports = await Report.countDocuments({ status: 'PUBLISHED' });
    const inProgressReports = await Report.countDocuments({ status: 'IN_PROGRESS' });
    const activeUsers = await User.countDocuments({ status: 'ACTIVE' });

    res.json({
      systemStatus: 'OPERATIONAL',
      lastUpdated: new Date().toISOString(),
      overview: {
        totalVulnerabilities,
        criticalVulnerabilities,
        highVulnerabilities,
        activeHosts,
        totalHosts,
        publishedReports,
        inProgressReports,
        activeUsers,
      },
      recentActivity: [
        { timestamp: new Date().toISOString(), action: 'System operational', severity: 'INFO' },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET system health
export const getSystemHealth = (req, res) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    metrics: {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      apiResponseTime: Math.floor(Math.random() * 500),
      uptime: '99.5%',
    },
    services: {
      database: 'CONNECTED',
      emailService: 'OPERATIONAL',
      scanningEngine: 'OPERATIONAL',
      aiAnalysis: 'OPERATIONAL',
    },
  });
};

// GET scaling configuration
export const getScalingConfig = (req, res) => {
  res.json({
    autoscalingEnabled: true,
    minInstances: 2,
    maxInstances: 10,
    cpuThreshold: 75,
    memoryThreshold: 80,
    scaleUpCooldown: 300,
    scaleDownCooldown: 600,
  });
};

// UPDATE scaling configuration
export const updateScalingConfig = (req, res) => {
  const {
    autoscalingEnabled,
    minInstances,
    maxInstances,
    cpuThreshold,
    memoryThreshold,
    scaleUpCooldown,
    scaleDownCooldown,
  } = req.body;

  const config = {
    autoscalingEnabled: autoscalingEnabled !== undefined ? autoscalingEnabled : true,
    minInstances: minInstances || 2,
    maxInstances: maxInstances || 10,
    cpuThreshold: cpuThreshold || 75,
    memoryThreshold: memoryThreshold || 80,
    scaleUpCooldown: scaleUpCooldown || 300,
    scaleDownCooldown: scaleDownCooldown || 600,
  };

  res.json(config);
};
