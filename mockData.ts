
import { Vulnerability, Severity, Host, UserRole, User, Notification, NotificationType, UserStatus, Organization, ScannerConfig, RoleRequest, RequestStatus } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'Admin Principal', email: 'admin@cyberaudit.com', role: UserRole.ADMIN, status: UserStatus.ACTIVE, lastLogin: '2024-05-10 14:30', mfaEnabled: true, lastIp: '192.168.1.15', deviceInfo: 'MacBook Pro / Chrome' },
  { id: '2', name: 'Marc Chef de Projet', email: 'chef@cyberaudit.com', role: UserRole.CHEF, status: UserStatus.ACTIVE, lastLogin: '2024-05-10 09:15', mfaEnabled: true, lastIp: '192.168.1.20', deviceInfo: 'Windows 11 / Edge' },
  { id: '3', name: 'Alice Auditor', email: 'alice@cyberaudit.com', role: UserRole.AUDITOR, managerId: '2', status: UserStatus.ACTIVE, lastLogin: '2024-05-09 18:45', mfaEnabled: false, lastIp: '172.16.0.5', deviceInfo: 'Linux / Firefox' },
  { id: '4', name: 'Bob Client', email: 'bob@enterprise.com', role: UserRole.CLIENT, company: 'Enterprise Corp', managerId: '2', auditorId: '3', status: UserStatus.ACTIVE, lastLogin: '2024-05-10 11:20', mfaEnabled: true, lastIp: '82.34.12.9', deviceInfo: 'iPhone 15' },
  { id: '5', name: 'Thomas Auditor', email: 'thomas@cyberaudit.com', role: UserRole.AUDITOR, managerId: '2', status: UserStatus.INACTIVE, lastLogin: '2024-05-01 10:00', mfaEnabled: false },
  { id: '6', name: 'Sarah Client', email: 'sarah@global.com', role: UserRole.CLIENT, company: 'Global Security', managerId: '2', auditorId: '3', status: UserStatus.ACTIVE, lastLogin: '2024-05-10 08:30', mfaEnabled: true },
  { id: '7', name: 'Jean Client', email: 'jean@startup.io', role: UserRole.CLIENT, company: 'InnovaSoft', managerId: '2', auditorId: '5', status: UserStatus.BLOCKED, lastLogin: '2024-04-20 16:15', mfaEnabled: false },
];

export const mockOrganizations: Organization[] = [
  {
    id: 'org1',
    name: 'Enterprise Corp',
    codeClient: 'ENT-2024-01',
    sector: 'Finance / Banque',
    address: '12 Rue de la Bourse, Paris',
    contactName: 'Bob Client',
    email: 'contact@enterprise.com',
    phone: '01 42 00 00 00',
    rssiName: 'Jean Secu',
    type: 'Banque',
    perimeters: [
      { id: 'p1', orgId: 'org1', name: 'Reseau Local', type: 'IP', target: '10.0.0.0/24' },
      { id: 'p2', orgId: 'org1', name: 'Plateforme Web', type: 'Domain', target: 'app.enterprise.com' },
      { id: 'p3', orgId: 'org1', name: 'Azure Infrastructure', type: 'Cloud', target: 'tenant-ent-01' }
    ]
  },
  {
    id: 'org2',
    name: 'InnovaSoft',
    codeClient: 'INN-2024-42',
    sector: 'Technologie',
    address: 'Station F, Paris',
    contactName: 'Lucie Tech',
    email: 'lucie@innovasoft.io',
    phone: '06 00 00 00 00',
    rssiName: 'Lucie Tech',
    type: 'PME',
    perimeters: [
      { id: 'p4', orgId: 'org2', name: 'SaaS Frontend', type: 'Domain', target: 'cloud.innovasoft.io' }
    ]
  }
];

export const mockScanners: ScannerConfig[] = [
  { id: 's1', name: 'GVM Cluster Alpha', type: 'OpenVAS', status: 'Online', endpoint: 'gvm-01.internal', version: '22.4', load: 45 },
  { id: 's2', name: 'Nuclei Core', type: 'Nuclei', status: 'Online', endpoint: 'sc-01.internal', version: '3.2.0', load: 12 },
  { id: 's3', name: 'Nikto Web Crawler', type: 'Nikto', status: 'Offline', endpoint: 'sc-02.internal', version: '2.5.0', load: 0 }
];

export const mockRoleRequests: RoleRequest[] = [
  {
    id: 'role-req-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    requestedRole: UserRole.AUDITOR,
    company: 'SecureX',
    createdAt: '2024-04-08T08:00:00Z',
    status: RequestStatus.PENDING,
  },
  {
    id: 'role-req-002',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    requestedRole: UserRole.CLIENT,
    company: 'TechCorp',
    createdAt: '2024-04-07T14:30:00Z',
    status: RequestStatus.PENDING,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Scan Terminé',
    message: 'Le scan de 192.168.1.10 est terminé avec 3 vulnérabilités critiques.',
    type: NotificationType.DANGER,
    timestamp: new Date().toISOString(),
    userName: 'Alice Auditor',
    isRead: false
  },
  {
    id: 'n2',
    title: 'Nouveau Rapport',
    message: 'Le rapport pour Enterprise Corp a été validé par le Chef de Projet.',
    type: NotificationType.SUCCESS,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userName: 'Marc Chef de Projet',
    isRead: false
  }
];

export const mockVulns: Vulnerability[] = [
  {
    id: 'v1',
    name: 'Exécution de code à distance (RCE)',
    severity: Severity.CRITICAL,
    score: 9.8,
    description: 'Une faille critique permettant l\'exécution de code non autorisé via un buffer overflow dans le service SMB.',
    impact: 'Contrôle total du serveur par un attaquant distant.',
    recommendation: 'Appliquer le correctif de sécurité KB5012345 immédiatement.',
    host: '192.168.1.10',
    port: '445',
    protocol: 'tcp',
    cve: 'CVE-2024-1234',
    aiPriority: 95,
    aiJustification: 'Exploitation facile et impact maximal sur la confidentialité et disponibilité.',
    complexity: 'Low',
    estimatedTime: '2 hours'
  }
];

export const mockHosts: Host[] = [
  {
    ip: '192.168.1.10',
    hostname: 'srv-prod-web-01',
    os: 'Ubuntu 20.04 LTS',
    openPorts: [22, 80, 443, 445],
    vulnCount: { critical: 1, high: 0, medium: 2, low: 5 },
    riskScore: 85
  }
];
