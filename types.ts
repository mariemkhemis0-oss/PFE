
export enum UserRole {
  ADMIN = 'ADMIN',
  CHEF = 'CHEF',
  AUDITOR = 'AUDITOR',
  CLIENT = 'CLIENT'
}

export enum UserStatus {
  PENDING = 'En attente',
  ACTIVE = 'Actif',
  INACTIVE = 'Inactif',
  BLOCKED = 'Bloqué'
}

export enum RequestStatus {
  PENDING = 'En attente',
  APPROVED = 'Approuvé',
  REJECTED = 'Rejeté'
}

export enum ReportStatus {
  DRAFT = 'Brouillon',
  IN_REVIEW = 'En revue',
  VALIDATED = 'Validé',
  REJECTED = 'Refusé',
  READY = 'Prêt pour livraison'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  avatar?: string;
  managerId?: string; 
  auditorId?: string;
  status?: UserStatus;
  lastLogin?: string;
  mfaEnabled?: boolean;
  failedAttempts?: number;
  lastIp?: string;
  deviceInfo?: string;
}

export interface UserLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  ip: string;
  device: string;
  details?: string;
}

export interface Perimeter {
  id: string;
  orgId: string;
  name: string;
  type: 'IP' | 'Domain' | 'Cloud' | 'App';
  target: string;
  description?: string;
}

export interface Organization {
  id: string;
  name: string;
  codeClient: string;
  sector: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
  rssiName: string;
  type: 'PME' | 'Banque' | 'Industrie' | 'Sante' | 'Public';
  perimeters: Perimeter[];
}

export interface ScannerConfig {
  id: string;
  name: string;
  type: 'OpenVAS' | 'Nuclei' | 'Nikto';
  status: 'Online' | 'Offline' | 'Error';
  endpoint: string;
  version: string;
  load: number;
}

export interface SystemHealth {
  cpu: number;
  ram: number;
  disk: number;
  latency: number;
  lastBackup: string;
  activeJobs: number;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger'
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  userName?: string;
  isRead: boolean;
}

export enum Severity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  INFO = 'Info'
}

export interface Vulnerability {
  id: string;
  name: string;
  severity: Severity;
  score: number;
  description: string;
  impact: string;
  recommendation: string;
  host: string;
  port: string;
  protocol: string;
  cve?: string;
  aiPriority?: number;
  aiJustification?: string;
  complexity?: 'Low' | 'Medium' | 'High';
  estimatedTime?: string;
}

export interface Host {
  ip: string;
  hostname: string;
  os: string;
  openPorts: number[];
  vulnCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  riskScore: number;
}

export interface AuditReport {
  id: string;
  clientName: string;
  date: string;
  version: string;
  responsible: string;
  status: ReportStatus;
  vulns: Vulnerability[];
  hosts: Host[];
  overallScore: number;
  grade: string;
  executiveSummary: string;
}

export interface RoleRequest {
  id: string;
  name: string;
  email: string;
  requestedRole: UserRole;
  company?: string;
  createdAt: string;
  status: RequestStatus;
}
