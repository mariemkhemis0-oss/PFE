import express from 'express';
import * as userController from '../controllers/userController.js';
import * as vulnerabilityController from '../controllers/vulnerabilityController.js';
import * as reportController from '../controllers/reportController.js';
import * as hostController from '../controllers/hostController.js';
import * as organizationController from '../controllers/organizationController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as scannerController from '../controllers/scannerController.js';
import * as roleRequestController from '../controllers/roleRequestController.js';
import * as configController from '../controllers/configController.js';
import * as authController from '../controllers/authController.js';
import * as auditController from '../controllers/auditController.js';
import multer from 'multer';
import * as passwordResetController from '../controllers/passwordResetController.js';
import * as scanController from '../controllers/scanController.js';
import * as scheduleController from '../controllers/scheduleController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import * as healthController from '../controllers/healthController.js';
import * as targetController from '../controllers/targetController.js';
import * as credentialController from '../controllers/credentialController.js';
import * as auditDataController from '../controllers/auditDataController.js';
import * as messageController from '../controllers/messageController.js';
import * as reviewController from '../controllers/reviewController.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// ===== AUDIT DATA (Questionnaire + Assets) =====
router.get('/audit-data', authenticateToken, auditDataController.getAuditData);
router.post('/audit-data', authenticateToken, auditDataController.saveAuditData);

// ===== MESSAGES (Chat Auditeur/Client) =====
router.get('/messages/conversations', authenticateToken, messageController.getConversationsList);
router.get('/messages/unread-count', authenticateToken, messageController.getUnreadCount);
router.get('/messages/conversation/:userId', authenticateToken, messageController.getConversation);
router.post('/messages', authenticateToken, messageController.sendMessage);

// ===== REVIEWS (Avis Client → Admin) =====
router.get('/reviews', authenticateToken, reviewController.getReviews);
router.get('/reviews/stats', authenticateToken, reviewController.getReviewStats);
router.post('/reviews', authenticateToken, reviewController.createReview);

// ===== VM HEALTH ROUTES =====
router.get('/health/vm', authenticateToken, authorizeRoles('ADMIN'), healthController.getVmHealth);
router.get('/health/vm/history', authenticateToken, authorizeRoles('ADMIN'), healthController.getVmHealthHistory);

// ===== TARGET MANAGEMENT =====
router.get('/targets', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), targetController.getTargets);
router.post('/targets', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), targetController.createTarget);
router.put('/targets/:id', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), targetController.updateTarget);
router.delete('/targets/:id', authenticateToken, authorizeRoles('ADMIN'), targetController.deleteTarget);
router.post('/targets/:id/sync', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), targetController.syncTarget);

// ===== CREDENTIAL MANAGEMENT =====
router.get('/credentials', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), credentialController.getCredentials);
router.post('/credentials', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), credentialController.createCredential);
router.delete('/credentials/:id', authenticateToken, authorizeRoles('ADMIN'), credentialController.deleteCredential);
router.post('/credentials/:id/sync', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), credentialController.syncCredential);

// ===== LIVE SCAN ROUTES (OpenVAS) =====
router.post('/scans/launch', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), scanController.launchScan);
router.get('/scans/active', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), scanController.getActiveScans);
router.get('/scans/my-active', authenticateToken, scanController.getMyActiveScan);
router.get('/scans/profiles', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), scanController.getScanProfiles);
router.get('/scans/test-connection', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), scanController.testGvmConnection);
router.get('/scans/user/:userId', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), scanController.getUserScans);
router.get('/scans/:scanId/status', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), scanController.getScanStatus);
router.post('/scans/:scanId/stop', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), scanController.stopScan);

// ===== SCAN SCHEDULING ROUTES =====
router.post('/scans/schedule', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), scheduleController.createSchedule);
router.get('/scans/schedules', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), scheduleController.getSchedules);
router.delete('/scans/schedule/:id', authenticateToken, authorizeRoles('ADMIN'), scheduleController.deleteSchedule);
router.put('/scans/schedule/:id/toggle', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), scheduleController.toggleSchedule);

// ===== AUTH ROUTES =====
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
// Routes reset password
router.post('/auth/forgot-password', passwordResetController.forgotPassword);
router.post('/auth/reset-password', passwordResetController.resetPassword);
router.get('/auth/verify-reset-token', passwordResetController.verifyResetToken);

// ===== AUDIT ROUTES (Multi-Tenancy) =====
router.get('/audits/my-organizations', authenticateToken, auditController.getMyOrganizations);
router.get('/audits/organizations/:organizationId/forms', authenticateToken, auditController.getOrganizationAuditForms);
router.get('/audits/organizations/:organizationId/hosts', authenticateToken, auditController.getOrganizationHosts);
router.post('/audits/organizations/:organizationId/reports', authenticateToken, auditController.createOrganizationReport);
router.post('/audits/organizations/:organizationId/hosts', authenticateToken, auditController.addHostToOrganization);
router.get('/audits/organizations/:organizationId/stats', authenticateToken, auditController.getOrganizationStats);
router.get('/audits/seed-demo-data', auditController.seedDemoData);

// ===== USERS ROUTES =====
router.get('/users', authenticateToken, authorizeRoles('ADMIN', 'CHEF', 'AUDITOR'), userController.getUsers);
router.post('/users/assign-client', authenticateToken, authorizeRoles('ADMIN', 'CHEF'), userController.assignClientToAuditor);
router.get('/users/role/:role', authenticateToken, authorizeRoles('ADMIN', 'CHEF', 'AUDITOR'), userController.getUsersByRole);
router.put('/users/:id/profile', authenticateToken, userController.updateProfile);
router.put('/users/:id/password', authenticateToken, userController.changePassword);
router.get('/users/:id', authenticateToken, userController.getUserById);
router.post('/users', authenticateToken, authorizeRoles('ADMIN'), userController.createUser);
router.put('/users/:id', authenticateToken, authorizeRoles('ADMIN'), userController.updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('ADMIN'), userController.deleteUser);

// ===== VULNERABILITIES ROUTES =====
router.get('/vulnerabilities', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), vulnerabilityController.getVulnerabilities);
router.get('/vulnerabilities/stats', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), vulnerabilityController.getVulnerabilityStats);
router.get('/vulnerabilities/:id', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), vulnerabilityController.getVulnerabilityById);
router.get('/vulnerabilities/severity/:severity', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), vulnerabilityController.getVulnerabilityBySeverity);
router.post('/vulnerabilities', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), vulnerabilityController.createVulnerability);
router.put('/vulnerabilities/:id', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), vulnerabilityController.updateVulnerability);
router.delete('/vulnerabilities/:id', authenticateToken, authorizeRoles('ADMIN'), vulnerabilityController.deleteVulnerability);

// ===== REPORTS =====
router.post('/reports/generate', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), upload.single('xmlFile'), reportController.generateReport);
router.get('/reports/stats', authenticateToken, authorizeRoles('ADMIN', 'CHEF', 'AUDITOR'), reportController.getDashboardStats);
router.get('/reports/status/:status', authenticateToken, authorizeRoles('ADMIN', 'CHEF', 'AUDITOR', 'CLIENT'), reportController.getReportsByStatus);
router.get('/reports/chef/:chefId', authenticateToken, authorizeRoles('ADMIN', 'CHEF'), reportController.getReportsByChef);
router.get('/reports/auditor/:auditorId', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), reportController.getReportsByAuditor);
router.get('/reports', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF', 'CLIENT'), reportController.getReports);
router.get('/reports/:id/download', authenticateToken, reportController.downloadReport);
router.post('/reports/:id/submit', authenticateToken, authorizeRoles('AUDITOR'), reportController.submitReport);
router.post('/reports/:id/publish', authenticateToken, authorizeRoles('ADMIN', 'CHEF'), reportController.publishReport);
router.post('/reports/:id/reject', authenticateToken, authorizeRoles('ADMIN', 'CHEF'), reportController.rejectReport);
router.post('/reports/:id/resubmit', authenticateToken, authorizeRoles('AUDITOR'), reportController.resubmitReport);
// ===== HOSTS =====
router.get('/hosts', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), hostController.getHosts);
router.get('/hosts/stats', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), hostController.getHostStats);
router.get('/hosts/:id', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), hostController.getHostById);
router.post('/hosts', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), hostController.createHost);
router.put('/hosts/:id', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR'), hostController.updateHost);
router.delete('/hosts/:id', authenticateToken, authorizeRoles('ADMIN'), hostController.deleteHost);

// ===== ORGANIZATIONS ROUTES =====
router.get('/organizations', authenticateToken, authorizeRoles('ADMIN', 'CHEF', 'AUDITOR'), organizationController.getOrganizations);
router.get('/organizations/:id', authenticateToken, authorizeRoles('ADMIN', 'CHEF', 'AUDITOR'), organizationController.getOrganizationById);
router.post('/organizations', authenticateToken, authorizeRoles('ADMIN'), organizationController.createOrganization);
router.put('/organizations/:id', authenticateToken, authorizeRoles('ADMIN'), organizationController.updateOrganization);
router.delete('/organizations/:id', authenticateToken, authorizeRoles('ADMIN'), organizationController.deleteOrganization);
router.post('/organizations/:id/perimeters', authenticateToken, authorizeRoles('ADMIN'), organizationController.addPerimeter);
router.delete('/organizations/:id/perimeters', authenticateToken, authorizeRoles('ADMIN'), organizationController.removePerimeter);

// ===== NOTIFICATIONS ROUTES =====
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.get('/notifications/stats', authenticateToken, notificationController.getNotificationStats);
router.get('/notifications/:id', authenticateToken, notificationController.getNotificationById);
router.post('/notifications', authenticateToken, authorizeRoles('ADMIN'), notificationController.createNotification);
router.put('/notifications/:id', authenticateToken, notificationController.updateNotification);
router.delete('/notifications/:id', authenticateToken, authorizeRoles('ADMIN'), notificationController.deleteNotification);
router.post('/notifications/mark-all-read', authenticateToken, notificationController.markAllAsRead);

// ===== SCANNERS ROUTES =====
router.get('/scanners', authenticateToken, authorizeRoles('ADMIN'), scannerController.getScanners);
router.get('/scanners/stats', authenticateToken, authorizeRoles('ADMIN'), scannerController.getScannerStats);
router.get('/scanners/:id', authenticateToken, authorizeRoles('ADMIN'), scannerController.getScannerById);
router.get('/scanners/:id/health', authenticateToken, authorizeRoles('ADMIN'), scannerController.getScannerHealth);
router.post('/scanners', authenticateToken, authorizeRoles('ADMIN'), scannerController.createScanner);
router.put('/scanners/:id', authenticateToken, authorizeRoles('ADMIN'), scannerController.updateScanner);
router.delete('/scanners/:id', authenticateToken, authorizeRoles('ADMIN'), scannerController.deleteScanner);

// ===== ROLE REQUESTS ROUTES =====
router.get('/role-requests', authenticateToken, authorizeRoles('ADMIN'), roleRequestController.getRoleRequests);
router.post('/role-requests', roleRequestController.createRoleRequest);
router.post('/role-requests/:id/approve', authenticateToken, authorizeRoles('ADMIN'), roleRequestController.approveRoleRequest);
router.post('/role-requests/:id/reject', authenticateToken, authorizeRoles('ADMIN'), roleRequestController.rejectRoleRequest);

// ===== CVE LIBRARY ROUTES =====
router.get('/cves', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), configController.getCVEs);
router.get('/cves/search', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), configController.searchCVE);
router.get('/cves/:id', authenticateToken, authorizeRoles('ADMIN', 'AUDITOR', 'CHEF'), configController.getCVEById);
router.post('/cves', authenticateToken, authorizeRoles('ADMIN'), configController.createCVE);
router.put('/cves/:id', authenticateToken, authorizeRoles('ADMIN'), configController.updateCVE);
router.delete('/cves/:id', authenticateToken, authorizeRoles('ADMIN'), configController.deleteCVE);

// ===== CONFIGURATION ROUTES =====
router.get('/config/scaling', authenticateToken, authorizeRoles('ADMIN'), configController.getScalingConfig);
router.put('/config/scaling', authenticateToken, authorizeRoles('ADMIN'), configController.updateScalingConfig);

// ===== DASHBOARD ROUTES =====
router.get('/dashboard', authenticateToken, authorizeRoles('ADMIN', 'CHEF'), configController.getDashboardData);
router.get('/health', authenticateToken, authorizeRoles('ADMIN'), configController.getSystemHealth);

// ===== TEST ROUTE — Générer un token de réinitialisation sans email (DEBUG ONLY) =====
router.get('/auth/test-reset-token/:email', async (req, res) => {
  try {
    const crypto = (await import('crypto')).default;
    const User = (await import('../models/User.js')).default;
    const PasswordReset = (await import('../models/PasswordReset.js')).default;

    const { email } = req.params;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    // Supprimer les anciens tokens
    await PasswordReset.deleteMany({ userId: user._id, used: false });

    // Générer un nouveau token
    const rawToken = crypto.randomBytes(48).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordReset.create({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
    });

    res.json({
      message: 'Token créé (TEST ONLY)',
      token: rawToken,
      resetUrl: `http://localhost:3000/?token=${rawToken}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;