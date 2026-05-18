
import { Vulnerability, Severity, Host, UserRole, User, Notification, NotificationType, UserStatus, Organization, ScannerConfig, RoleRequest, RequestStatus } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'MARIEM KHEMISI', email: 'admin@ksi.tn', role: UserRole.ADMIN, status: UserStatus.ACTIVE, lastLogin: 'Hier à 16:33', mfaEnabled: true, lastIp: '197.0.0.1', deviceInfo: 'MacBook Pro / Chrome' },
  { id: '2', name: 'Marc Chef de Projet', email: 'chef@cyberaudit.com', role: UserRole.CHEF, status: UserStatus.ACTIVE, lastLogin: '2024-05-10 09:15', mfaEnabled: true, lastIp: '192.168.1.20', deviceInfo: 'Windows 11 / Edge' },
  { id: '3', name: 'SARAH MILLER', email: 'SARAH.M@SECUREAUDIT.PRO', role: UserRole.AUDITOR, managerId: '2', status: UserStatus.ACTIVE, lastLogin: '2024-05-09 18:45', mfaEnabled: false, lastIp: '172.16.0.5', deviceInfo: 'Linux / Firefox' },
  { id: '4', name: 'SOCIÉTÉ GÉNÉRALE TN', email: 'contact@socgen.tn', role: UserRole.CLIENT, company: 'SOCIÉTÉ GÉNÉRALE TN', managerId: '2', auditorId: '3', status: UserStatus.ACTIVE, lastLogin: '2024-05-10 11:20', mfaEnabled: true, lastIp: '82.34.12.9', deviceInfo: 'iPhone 15' },
  { id: '5', name: 'MARCUS KANE', email: 'M.KANE@SECUREAUDIT.PRO', role: UserRole.AUDITOR, managerId: '2', status: UserStatus.ACTIVE, lastLogin: '2024-05-01 10:00', mfaEnabled: false },
];

export const mockRoleRequests: RoleRequest[] = [
  { id: 'req1', name: 'Julien Expert', email: 'j.expert@cyberaudit.com', requestedRole: UserRole.AUDITOR, timestamp: '2024-05-11 10:15', status: RequestStatus.PENDING },
  { id: 'req2', name: 'Sophie HR', email: 'sophie@client-corp.com', requestedRole: UserRole.CLIENT, company: 'Client Corp', timestamp: '2024-05-11 08:45', status: RequestStatus.PENDING },
];

export const mockOrganizations: Organization[] = [
  {
    id: 'org1',
    name: 'SOCIÉTÉ GÉNÉRALE TN',
    codeClient: 'SGT-2024-01',
    sector: 'Finance / Banque',
    address: 'Avenue Habib Bourguiba, Tunis',
    contactName: 'Ahmed Bank',
    email: 'contact@socgen.tn',
    phone: '71 000 000',
    rssiName: 'Jean Secu',
    type: 'Banque',
    perimeters: [
      { id: 'p1', orgId: 'org1', name: 'Reseau Local', type: 'IP', target: '10.0.0.0/24' },
      { id: 'p2', orgId: 'org1', name: 'Plateforme Web', type: 'Domain', target: 'app.socgen.tn' }
    ]
  },
  {
    id: 'org2',
    name: 'OOREDOO TN',
    codeClient: 'OOR-2024-42',
    sector: 'Technologie',
    address: 'Berges du Lac, Tunis',
    contactName: 'Lucie Tech',
    email: 'it@ooredoo.tn',
    phone: '22 000 000',
    rssiName: 'Lucie Tech',
    type: 'PME',
    perimeters: [
      { id: 'p4', orgId: 'org2', name: 'Core Network', type: 'Domain', target: 'core.ooredoo.tn' }
    ]
  }
];

export const mockScanners: ScannerConfig[] = [
  { id: 's1', name: 'GVM Cluster Alpha', type: 'OpenVAS', status: 'Online', endpoint: 'gvm-01.internal', version: '22.4', load: 45 },
  { id: 's2', name: 'Nuclei Core', type: 'Nuclei', status: 'Online', endpoint: 'sc-01.internal', version: '3.2.0', load: 12 }
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Scan Terminé',
    message: 'Le scan de 192.168.1.10 est terminé avec 3 vulnérabilités critiques.',
    type: NotificationType.DANGER,
    timestamp: new Date().toISOString(),
    userName: 'Sarah Miller',
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
    recommendation: 'Désactiver SMBv1 et appliquer immédiatement le patch de sécurité MS17-010. Restreindre l\'accès au port 445 via firewall.',
    host: '192.168.1.10',
    port: '445',
    protocol: 'tcp',
    cve: 'CVE-2024-1234',
    aiPriority: 95,
    aiJustification: 'Exploitation facile et impact maximal sur la confidentialité et disponibilité.',
    complexity: 'Moyenne',
    estimatedTime: '4 heures'
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
