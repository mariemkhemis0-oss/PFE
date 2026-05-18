import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Building2, Cpu, Activity, Plus, Search, X, Edit2, Trash2,
  RefreshCw, Zap, Info, Database, ChevronRight,
  Save, Target, LayoutGrid, ChevronLeft, ClipboardList, ShieldCheck,
  UserX, Check, Palette, FileDown, Filter, History, ArrowRight, Wifi, WifiOff, Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, CartesianGrid, Tooltip
} from 'recharts';
import {
  User, UserRole, UserStatus, Organization, ScannerConfig, Perimeter, RoleRequest
} from '../types';
import { mockScanners } from '../mockData';
import Logo from '../components/Logo';
import { usersAPI, organizationsAPI, scannersAPI, roleRequestsAPI } from '../services/apiService';

type AdminSection = 'menu' | 'users' | 'orgs' | 'report-config' | 'health';

interface AdminPortalProps {
  isDark: boolean;
}

// ── VM Health Types ──
interface ContainerInfo {
  name: string;
  status: string;
  cpu: string;
  memory: string;
}

interface VmHealthData {
  cpu: number;
  ram: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  uptime: string;
  loadAvg: number[];
  containers: ContainerInfo[];
  timestamp: string;
  error?: string;
}

interface VmHealthHistory {
  history: Array<{ time: string; cpu: number; ram: number }>;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ isDark }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('menu');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [orgsList, setOrgsList] = useState<Organization[]>([]);
  const [scannersList, setScannersList] = useState<ScannerConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [approvingRequest, setApprovingRequest] = useState<RoleRequest | null>(null);
  const [selectedChefId, setSelectedChefId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [isConnectNodeModalOpen, setIsConnectNodeModalOpen] = useState(false);
  const [isScalingModalOpen, setIsScalingModalOpen] = useState(false);
  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);
  const [isAssignClientModalOpen, setIsAssignClientModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ clientId: '', auditorId: '' });

  // ── VM Health State ──
  const [vmHealth, setVmHealth] = useState<VmHealthData | null>(null);
  const [vmHealthHistory, setVmHealthHistory] = useState<Array<{ time: string; cpu: number; ram: number }>>([]);
  const [vmHealthLoading, setVmHealthLoading] = useState(false);
  const [vmHealthError, setVmHealthError] = useState<string | null>(null);
  const [vmLastUpdate, setVmLastUpdate] = useState<Date | null>(null);
  const [adminReports, setAdminReports] = useState<any[]>([]);

  const [reportConfig, setReportConfig] = useState({
    companyName: 'KSI SECURITY',
    companyLogo: '',
    reportPrefix: 'AUD',
    footerText: '© 2024 KSI SECURITY - Document Confidentiel',
    primaryColor: '#57a9d9',
    showAuditDate: true,
    slogan: 'Secure Vision for a Digital Future'
  });

  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: UserRole.CLIENT, company: '' });
  const [newOrgForm, setNewOrgForm] = useState({
    name: '', codeClient: '', sector: '', address: '', contactName: '', email: '', phone: '', rssiName: '', type: 'PME' as Organization['type']
  });
  const [newNodeForm, setNewNodeForm] = useState({ name: '', type: 'OpenVAS' as ScannerConfig['type'], endpoint: '', version: '24.1.0' });
  const [scalingConfig, setScalingConfig] = useState({ enabled: true, minNodes: 2, maxNodes: 8, threshold: 75 });
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // ── Fetch VM Health ──
  const fetchVmHealth = useCallback(async () => {
    setVmHealthLoading(true);
    setVmHealthError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/health/vm', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      if (raw.error) {
        setVmHealthError(raw.error);
      } else {
        // Normaliser les données backend → frontend
        const normalized: VmHealthData = {
          cpu: typeof raw.cpu === 'object' ? (raw.cpu.usage ?? 0) : (raw.cpu ?? 0),
          ram: {
            used: raw.ram?.usedFormatted ? parseFloat(raw.ram.usedFormatted) : (raw.ram?.used > 1024 ? raw.ram.used / 1024 : raw.ram?.used ?? 0),
            total: raw.ram?.totalFormatted ? parseFloat(raw.ram.totalFormatted) : (raw.ram?.total > 1024 ? raw.ram.total / 1024 : raw.ram?.total ?? 0),
            percent: raw.ram?.percent ?? 0,
          },
          disk: {
            used: parseFloat(raw.disk?.used) || 0,
            total: parseFloat(raw.disk?.total) || 0,
            percent: raw.disk?.percent ?? 0,
          },
          uptime: raw.uptime || 'N/A',
          loadAvg: raw.cpu?.loadAvg ? [raw.cpu.loadAvg['1m'] ?? 0, raw.cpu.loadAvg['5m'] ?? 0, raw.cpu.loadAvg['15m'] ?? 0] : (raw.loadAvg || []),
          containers: (raw.docker?.containers || raw.containers || []).map((c: any) => ({
            name: c.name,
            status: c.status,
            cpu: c.cpu || '0%',
            memory: c.memory || '0MB',
          })),
          timestamp: raw.timestamp || new Date().toISOString(),
        };
        setVmHealth(normalized);
        setVmLastUpdate(new Date());
        // Ajouter un point live au graphique
        setVmHealthHistory(prev => {
          const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const newPoint = { time: now, cpu: normalized.cpu, ram: normalized.ram.percent };
          const updated = [...prev, newPoint];
          return updated.slice(-50); // garder les 50 derniers points
        });
      }
    } catch (err: any) {
      setVmHealthError(err.message || 'Impossible de joindre la VM');
    } finally {
      setVmHealthLoading(false);
    }
  }, []);

  const fetchVmHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/health/vm/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data: VmHealthHistory = await res.json();
      if (data.history?.length) setVmHealthHistory(data.history);
    } catch {
      // silent
    }
  }, []);

  // Auto-refresh every 15s when on health section
  useEffect(() => {
    if (activeSection !== 'health') return;
    fetchVmHealth();
    fetchVmHistory();
    const interval = setInterval(fetchVmHealth, 15000);
    return () => clearInterval(interval);
  }, [activeSection, fetchVmHealth, fetchVmHistory]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const usersData = await usersAPI.getAll();
        setUsersList(usersData);
        const orgsData = await organizationsAPI.getAll();
        
        // Ne garder que les organisations qui correspondent à la "company" d'un utilisateur de type CLIENT
        const clientCompanies = new Set(usersData.filter((u: User) => u.role === 'CLIENT' && u.company).map((u: User) => u.company!.toLowerCase().trim()));
        const filteredOrgs = (orgsData || []).filter((org: any) => clientCompanies.has(org.name.toLowerCase().trim()));
        
        setOrgsList(filteredOrgs);
        const scannersData = await scannersAPI.getAll();
        setScannersList(scannersData || []);
        const roleReqsData = await roleRequestsAPI.getAll();
        setRoleRequests(roleReqsData || []);
        // Charger tous les rapports
        try {
          const token = localStorage.getItem('token');
          const reportsRes = await fetch('/api/reports', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (reportsRes.ok) {
            const reportsData = await reportsRes.json();
            setAdminReports(reportsData || []);
          }
        } catch (e) { console.error('Erreur chargement rapports:', e); }
      } catch (error) {
        console.error('Erreur chargement données AdminPortal:', error);
      }
    };
    loadData();
    const savedScaling = localStorage.getItem('cyberaudit_scaling_config');
    if (savedScaling) setScalingConfig(JSON.parse(savedScaling));
    const savedReportConfig = localStorage.getItem('cyberaudit_report_settings');
    if (savedReportConfig) setReportConfig(JSON.parse(savedReportConfig));
  }, []);

  // ── APPROVE REQUEST ──
  const handleApproveRequest = (request: RoleRequest) => {
    if (request.requestedRole?.toUpperCase() === 'AUDITOR') {
      setApprovingRequest(request);
      setSelectedChefId('');
    } else {
      confirmApprove(request, '');
    }
  };

  const confirmApprove = async (request: RoleRequest, chefId: string) => {
    try {
      const id = (request as any)._id || request.id;
      const result = await roleRequestsAPI.approve(id, chefId ? { chefId } : {});
      setRoleRequests(prev => prev.filter(r => ((r as any)._id || r.id) !== id));
      const usersData = await usersAPI.getAll();
      setUsersList(usersData);
      setApprovingRequest(null);
      setSelectedChefId('');
      alert('✓ Demande approuvée ! Utilisateur créé avec succès.');
    } catch (error: any) {
      console.error('Erreur approbation:', error);
      alert(`✗ ${error?.message || 'Erreur lors de l\'approbation'}`);
    }
  };

  // ── REJECT REQUEST ──
  const handleRejectRequest = async (request: RoleRequest) => {
    if (window.confirm('Voulez-vous vraiment rejeter cette inscription ?')) {
      try {
        const realId = (request as any)._id || request.id;
        await roleRequestsAPI.reject(realId);
        setRoleRequests(prev => prev.filter(r => ((r as any)._id || r.id) !== realId));
      } catch (error) {
        console.error('Erreur rejet demande:', error);
        alert('Erreur lors du rejet.');
      }
    }
  };

  // ── DELETE USER ──
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Supprimer cet utilisateur définitivement ?')) {
      try {
        await usersAPI.delete(userId);
        setUsersList(prev => prev.filter(u => ((u as any)._id || u.id) !== userId));
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression.');
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUserForm.name.toUpperCase(),
        email: newUserForm.email.toLowerCase(),
        role: newUserForm.role,
        company: newUserForm.company || 'CyberAudit',
        status: UserStatus.ACTIVE, lastLogin: 'Jamais', mfaEnabled: false
      };
      await usersAPI.create(newUser);
      const updatedList = [newUser, ...usersList];
      setUsersList(updatedList);
      window.dispatchEvent(new CustomEvent('cyberaudit_data_updated'));
      setNewUserForm({ name: '', email: '', role: UserRole.CLIENT, company: '' });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
    }
  };

  const handleSaveReportConfig = () => {
    localStorage.setItem('cyberaudit_report_settings', JSON.stringify(reportConfig));
    alert('Configuration de rapport sauvegardée !');
  };

  const handleConnectNode = (e: React.FormEvent) => {
    e.preventDefault();
    const newNode: ScannerConfig = {
      id: `s-${Math.random().toString(36).substr(2, 5)}`,
      ...newNodeForm, status: 'Online', load: 0
    };
    const updated = [newNode, ...scannersList];
    setScannersList(updated);
    localStorage.setItem('cyberaudit_scanners', JSON.stringify(updated));
    setNewNodeForm({ name: '', type: 'OpenVAS', endpoint: '', version: '24.1.0' });
    setIsConnectNodeModalOpen(false);
  };

  const handleSaveScaling = () => {
    localStorage.setItem('cyberaudit_scaling_config', JSON.stringify(scalingConfig));
    setIsScalingModalOpen(false);
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrg: Organization = { ...newOrgForm, id: Math.random().toString(36).substr(2, 9), perimeters: [] };
    const updatedList = [newOrg, ...orgsList];
    setOrgsList(updatedList);
    localStorage.setItem('cyberaudit_orgs', JSON.stringify(updatedList));
    setNewOrgForm({ name: '', codeClient: '', sector: '', address: '', contactName: '', email: '', phone: '', rssiName: '', type: 'PME' });
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    const orgId = (editingOrg as any)._id || editingOrg.id;
    try {
      await organizationsAPI.update(orgId, editingOrg);
      const updatedList = orgsList.map(o => {
        const oId = (o as any)._id || o.id;
        return oId === orgId ? { ...o, ...editingOrg } : o;
      });
      setOrgsList(updatedList);
      setIsEditOrgModalOpen(false);
    } catch (error) {
      console.error('Erreur mise à jour org:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleGenerateSynthesis = () => {
    setIsGeneratingSynthesis(true);
    setTimeout(() => { setIsGeneratingSynthesis(false); alert('Synthèse globale générée !'); }, 3000);
  };

  const handleForceMaintenance = () => {
    setIsMaintenanceRunning(true);
    setTimeout(() => { setIsMaintenanceRunning(false); alert('Maintenance terminée !'); }, 4000);
  };

  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersAPI.assignClient({ clientId: assignForm.clientId, auditorId: assignForm.auditorId });
      setIsAssignClientModalOpen(false);
      setAssignForm({ clientId: '', auditorId: '' });
      const usersData = await usersAPI.getAll();
      setUsersList(usersData);
      alert('Client assigné avec succès !');
    } catch (error) {
      console.error('Erreur assignation:', error);
      alert('Erreur lors de l\'assignation.');
    }
  };

  const adminModules = [
    { id: 'users', label: 'UTILISATEURS', icon: Users },
    { id: 'orgs', label: 'ORGANISATIONS', icon: Building2 },
    { id: 'report-config', label: 'RAPPORTS', icon: Palette },
    { id: 'health', label: 'SANTÉ', icon: Activity },
  ];

  // ── Helper: color by percentage ──
  const getColorByPercent = (pct: number) => {
    if (pct < 50) return { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (pct < 80) return { text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { text: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-500/20', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
  };

  const getContainerStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('up') || s.includes('running')) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (s.includes('exit') || s.includes('stop')) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  };

  const renderQuickNav = () => {
    if (activeSection === 'menu') return null;
    return (
      <div className="flex items-center justify-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-white dark:bg-slate-900 p-2 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center gap-1">
          <button onClick={() => setActiveSection('menu')} className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"><LayoutGrid size={20} /></button>
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          {adminModules.map((mod) => (
            <button key={mod.id} onClick={() => setActiveSection(mod.id as AdminSection)}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeSection === mod.id ? 'bg-[#57a9d9] text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 hover:text-[#57a9d9]'}`}>
              <mod.icon size={18} /> <span className="hidden md:block">{mod.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSectionHeader = (title: string, subtitle: string, action?: React.ReactNode) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSection('menu')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"><ChevronLeft size={20} /></button>
        </div>
        <div className="ml-4">
          <h1 className="text-[32px] font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{title}</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 italic">{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-4">
        {activeSection === 'users' && (
          <button
            onClick={() => setIsAssignClientModalOpen(true)}
            className="px-10 py-5 bg-emerald-600 text-slate-900 dark:text-white rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-xl active:scale-95"
          >
            <ArrowRight size={20} /> ASSIGNER CLIENT
          </button>
        )}
        {action}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'menu':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500">
            {[
              { id: 'users', title: 'GESTION UTILISATEURS', icon: Users, desc: '"Identités, Rôles, MFA, Sessions & Traçabilité."', count: `${usersList.length} COMPTES`, color: 'text-[#57a9d9]', bg: 'bg-[#57a9d9]/10' },
              { id: 'orgs', title: 'ORGANISATIONS', icon: Building2, desc: '"Clients Multi-tenant, Périmètres IP & Domaines."', count: `${orgsList.length} ENTITÉS`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { id: 'report-config', title: 'BRANDING & RAPPORTS', icon: Palette, desc: '"Personnalisation visuelle des rapports client."', count: 'ACTIF', color: 'text-teal-500', bg: 'bg-teal-500/10' },
              { id: 'health', title: 'SANTÉ SYSTÈME', icon: Activity, desc: '"Monitoring Serveurs, Backups, Jobs Cron."', count: 'STABLE', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id as AdminSection)}
                className="bg-white dark:bg-slate-900 p-12 rounded-[48px] border border-slate-200 dark:border-slate-800 hover:border-[#57a9d9]/50 transition-all group text-left relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#57a9d9]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>
                <div className={`p-5 ${item.bg} ${item.color} rounded-2xl mb-10 inline-flex shadow-inner`}><item.icon size={32} /></div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 uppercase italic tracking-tighter leading-none">{item.title}</h3>
                <p className="text-xs text-slate-500 mb-10 font-medium italic leading-relaxed">{item.desc}</p>
                <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-full tracking-widest">{item.count}</span>
              </button>
            ))}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            {renderSectionHeader('UTILISATEURS', 'CONTRÔLEZ LES ACCÈS ET GÉREZ LES RÔLES DE LA PLATEFORME.')}

            <div className="flex gap-10 border-b border-slate-200 dark:border-white/5 pb-0 mb-8 px-4">
              <button onClick={() => setActiveTab('all')} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === 'all' ? 'text-[#57a9d9]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                TOUS LES UTILISATEURS ({usersList.length})
                {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#57a9d9] rounded-full"></div>}
              </button>
              <button onClick={() => setActiveTab('requests')} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-3 ${activeTab === 'requests' ? 'text-[#57a9d9]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                DEMANDES DE RÔLES
                {roleRequests.length > 0 && (
                  <span className="w-5 h-5 bg-rose-500 text-slate-900 dark:text-white rounded-full flex items-center justify-center text-[9px] font-black animate-pulse">{roleRequests.length}</span>
                )}
                {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#57a9d9] rounded-full"></div>}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/2">
                    <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">{activeTab === 'all' ? 'UTILISATEUR' : 'DEMANDEUR'}</th>
                    <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] text-center">{activeTab === 'all' ? 'RÔLE ACTUEL' : 'RÔLE SOUHAITÉ'}</th>
                    <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] text-center">{activeTab === 'all' ? 'DERNIÈRE CONNEXION' : 'DATE DE DEMANDE'}</th>
                    <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeTab === 'all' ? (
                    usersList.map(u => (
                      <tr key={(u as any)._id || u.id} className="group hover:bg-white/[0.01] transition-all">
                        <td className="px-12 py-10">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-[#57a9d9] font-black text-lg border border-slate-200 dark:border-white/10">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-base leading-none mb-1">{u.name}</p>
                              <p className="text-[10px] font-bold text-slate-500 tracking-tight">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-10 text-center">
                          <span className="px-6 py-1.5 bg-[#57a9d9]/5 border border-[#57a9d9]/30 text-[#57a9d9] text-[10px] font-black rounded-lg uppercase tracking-widest">{u.role?.toUpperCase()}</span>
                        </td>
                        <td className="px-12 py-10 text-center">
                          <p className="text-[11px] font-black text-slate-500 uppercase italic">{u.lastLogin || 'N/A'}</p>
                        </td>
                        <td className="px-12 py-10">
                          <div className="flex justify-end gap-6 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser((u as any)._id || u.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    roleRequests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-12 py-20 text-center text-slate-500 font-bold uppercase italic tracking-widest opacity-50">Aucune demande en attente</td>
                      </tr>
                    ) : (
                      roleRequests.map(req => (
                        <tr key={(req as any)._id || req.id} className="group hover:bg-white/[0.01] transition-all">
                          <td className="px-12 py-10">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-full bg-[#57a9d9]/20 flex items-center justify-center text-[#57a9d9] font-black text-lg border border-[#57a9d9]/20">
                                {req.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-white uppercase italic tracking-tighter text-base leading-none mb-1">{req.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 tracking-tight">{req.email}</p>
                                <p className="text-[9px] font-black text-[#57a9d9] uppercase tracking-widest mt-1">SOCIÉTÉ: {req.company}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-10 text-center">
                            <span className="px-4 py-2 bg-white text-[#57a9d9] text-[10px] font-black rounded-lg uppercase tracking-widest shadow-sm">{req.requestedRole}</span>
                          </td>
                          <td className="px-12 py-10 text-center">
                            <p className="text-[11px] font-black text-slate-500 uppercase italic tracking-widest">
                              {req.timestamp ? new Date(req.timestamp).toLocaleDateString('fr-FR') :
                                (req as any).createdAt ? new Date((req as any).createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                            </p>
                          </td>
                          <td className="px-12 py-10">
                            <div className="flex justify-end gap-4">
                              <button
                                onClick={() => handleApproveRequest(req)}
                                className="flex items-center gap-3 px-8 py-3 bg-[#10b981] text-slate-900 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                              >
                                <Check size={16} strokeWidth={4} /> APPROUVER
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req)}
                                className="flex items-center gap-3 px-8 py-3 bg-[#1e293b] text-slate-400 border border-slate-200 dark:border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
                              >
                                <UserX size={16} /> REJETER
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'orgs':
        return (
          <div className="space-y-10 animate-in slide-in-from-right duration-500">
            {renderSectionHeader('ORGANISATIONS', 'GESTION MULTI-TENANT ET SUPERVISION DES PÉRIMÈTRES CLIENTS.')}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {orgsList.map(org => (
                <div key={org.id} className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden group hover:border-[#57a9d9]/50 transition-all flex flex-col justify-between min-h-[500px]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="p-5 bg-amber-500/10 text-amber-500 rounded-[24px] shadow-inner border border-amber-500/20 group-hover:scale-110 transition-transform"><Building2 size={36} /></div>
                    <span className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black rounded-full uppercase tracking-widest">{org.codeClient}</span>
                  </div>
                  <div className="mb-10 relative z-10">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter leading-[0.9] mb-3">{org.name}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{org.sector?.toUpperCase()} • {org.type?.toUpperCase()}</p>
                  </div>
                  <div className="space-y-5 mb-12 relative z-10">
                    <div className="flex items-center gap-5 text-slate-400"><Target size={18} className="text-[#57a9d9]" /><span className="text-[11px] font-black uppercase tracking-widest">{org.perimeters?.length || 0} Périmètres actifs</span></div>
                  </div>
                  <button onClick={() => { setEditingOrg(org); setIsEditOrgModalOpen(true); }} className="w-full py-5 bg-[#002147] border border-slate-200 dark:border-white/5 rounded-[24px] text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] group-hover:bg-amber-600 group-hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-4 relative z-10 shadow-xl active:scale-95">MODIFIER CONFIGURATION <ChevronRight size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'report-config':
        const handleDownloadReport = async (reportId: string, ref: string) => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/reports/${reportId}/download`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Erreur de téléchargement");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${ref}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } catch (e) {
            console.error(e);
            alert("Erreur lors du téléchargement du rapport.");
          }
        };

        const reports = adminReports
          .filter(r => r.status === 'PUBLISHED')
          .map((r: any) => ({
            id: r.ref || `REP-${((r as any)._id || r.id || '').slice(-6).toUpperCase()}`,
            size: r.vulnerabilities ? `${r.vulnerabilities.length} vulns` : 'N/A',
            client: r.clientName || r.clientCompany || 'Non assigné',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : 'N/A',
            status: 'PUBLIÉ',
            type: 'Scan de Vulnérabilités',
            score: r.score,
            _id: (r as any)._id || r.id,
          }));
        return (
          <div className="space-y-10 animate-in slide-in-from-right duration-500 pb-20">
            {renderSectionHeader('RAPPORTS SYSTÈME', 'CONSOLE DE GESTION DOCUMENTAIRE')}
            <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center gap-6">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input type="text" placeholder="Rechercher par ID ou client..." className="w-full pl-14 pr-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full outline-none text-xs font-bold text-slate-900 dark:text-white focus:border-[#57a9d9]/40" />
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-10 py-6">RAPPORT</th>
                    <th className="px-10 py-6">CLIENT</th>
                    <th className="px-10 py-6">DATE</th>
                    <th className="px-10 py-6">STATUT</th>
                    <th className="px-10 py-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reports.map((report, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] group transition-all">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="p-4 bg-[#57a9d9]/10 text-[#57a9d9] rounded-2xl border border-[#57a9d9]/20"><FileDown size={24} /></div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-1">{report.id}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{report.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8"><p className="text-base font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">{report.client}</p></td>
                      <td className="px-10 py-8"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{report.date}</p></td>
                      <td className="px-10 py-8">
                        <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${report.status === 'CERTIFIÉ' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : report.status === 'PUBLIÉ' ? 'bg-[#57a9d9]/10 text-[#57a9d9] border-[#57a9d9]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{report.status}</span>
                      </td>
                      <td className="px-10 py-8 text-right flex justify-end gap-3">
                        <button onClick={() => handleDownloadReport(report._id, report.id)} className="p-3 bg-[#57a9d9]/10 rounded-xl text-[#57a9d9] hover:bg-[#57a9d9]/20 transition-all">
                          <FileDown size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'health': {
        const cpuColors = vmHealth ? getColorByPercent(vmHealth.cpu) : null;
        const ramColors = vmHealth ? getColorByPercent(vmHealth.ram.percent) : null;
        const diskColors = vmHealth ? getColorByPercent(vmHealth.disk.percent) : null;

        // Chart data: use real history or placeholder zeros
        const chartData = vmHealthHistory.length > 0
          ? vmHealthHistory
          : [
            { time: '00:00', cpu: 0, ram: 0 },
            { time: '04:00', cpu: 0, ram: 0 },
            { time: '08:00', cpu: 0, ram: 0 },
            { time: '12:00', cpu: 0, ram: 0 },
            { time: '16:00', cpu: 0, ram: 0 },
            { time: '20:00', cpu: 0, ram: 0 },
          ];

        return (
          <div className="space-y-12 animate-in slide-in-from-right duration-500 pb-20">
            {renderSectionHeader(
              'SANTÉ SYSTÈME',
              'VM OPENVAS — MONITORING EN TEMPS RÉEL.',
              <div className="flex items-center gap-4">
                {/* Connection status */}
                <div className={`flex items-center gap-3 px-6 py-2 rounded-full border ${vmHealthError ? 'bg-rose-500/10 border-rose-500/20' : 'bg-[#0a1a14] border-emerald-500/20'}`}>
                  {vmHealthError
                    ? <><WifiOff size={14} className="text-rose-500" /><span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">VM HORS-LIGNE</span></>
                    : <><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,1)]"></div><span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">VM CONNECTÉE</span></>
                  }
                </div>
                {/* Refresh button */}
                <button
                  onClick={() => { fetchVmHealth(); fetchVmHistory(); }}
                  disabled={vmHealthLoading}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-[#57a9d9] transition-all disabled:opacity-50"
                >
                  <RefreshCw size={18} className={vmHealthLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            )}

            {/* Error Banner */}
            {vmHealthError && (
              <div className="mx-4 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[24px] flex items-center gap-4">
                <WifiOff size={20} className="text-rose-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">ERREUR DE CONNEXION SSH</p>
                  <p className="text-xs text-rose-400 mt-1 font-mono">{vmHealthError}</p>
                </div>
              </div>
            )}

            {/* Last update */}
            {vmLastUpdate && (
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                DERNIÈRE MAJ : {vmLastUpdate.toLocaleTimeString('fr-FR')} — Rafraîchissement auto toutes les 15s
              </p>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* CPU */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 ${cpuColors ? cpuColors.bg + '/10' : 'bg-[#57a9d9]/10'} ${cpuColors ? cpuColors.text : 'text-[#57a9d9]'} rounded-2xl shadow-inner border border-slate-200 dark:border-white/5`}>
                    <Cpu size={24} />
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">{vmHealthLoading ? 'SYNC...' : 'LIVE'}</span>
                </div>
                <p className={`text-4xl font-black italic tracking-tighter leading-none mb-3 ${cpuColors ? cpuColors.text : 'text-slate-900 dark:text-white'}`}>
                  {vmHealth ? `${vmHealth.cpu.toFixed(1)}%` : (vmHealthLoading ? '...' : 'N/A')}
                </p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">UTILISATION CPU</p>
                {vmHealth && (
                  <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${cpuColors!.bg}`}
                      style={{ width: `${Math.min(vmHealth.cpu, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* RAM */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-4 ${ramColors ? 'bg-emerald-500/10' : 'bg-emerald-500/10'} text-emerald-500 rounded-2xl shadow-inner border border-slate-200 dark:border-white/5`}>
                    <Database size={24} />
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">{vmHealthLoading ? 'SYNC...' : 'LIVE'}</span>
                </div>
                <p className={`text-4xl font-black italic tracking-tighter leading-none mb-1 ${ramColors ? ramColors.text : 'text-slate-900 dark:text-white'}`}>
                  {vmHealth ? `${vmHealth.ram.percent.toFixed(0)}%` : (vmHealthLoading ? '...' : 'N/A')}
                </p>
                {vmHealth && (
                  <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 mb-2">
                    {vmHealth.ram.used.toFixed(1)} GB / {vmHealth.ram.total.toFixed(1)} GB
                  </p>
                )}
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">RAM DÉPLOYÉE</p>
                {vmHealth && (
                  <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${ramColors!.bg}`}
                      style={{ width: `${Math.min(vmHealth.ram.percent, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* DISK */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl shadow-inner border border-slate-200 dark:border-white/5">
                    <Database size={24} />
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">{vmHealthLoading ? 'SYNC...' : 'LIVE'}</span>
                </div>
                <p className={`text-4xl font-black italic tracking-tighter leading-none mb-1 ${diskColors ? diskColors.text : 'text-slate-900 dark:text-white'}`}>
                  {vmHealth ? `${vmHealth.disk.percent.toFixed(0)}%` : (vmHealthLoading ? '...' : 'N/A')}
                </p>
                {vmHealth && (
                  <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 mb-2">
                    {vmHealth.disk.used.toFixed(0)} GB / {vmHealth.disk.total.toFixed(0)} GB
                  </p>
                )}
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DISQUE UTILISÉ</p>
                {vmHealth && (
                  <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${diskColors!.bg}`}
                      style={{ width: `${Math.min(vmHealth.disk.percent, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* UPTIME / LOAD */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-[#57a9d9]/10 text-[#57a9d9] rounded-2xl shadow-inner border border-slate-200 dark:border-white/5">
                    <Zap size={24} />
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">{vmHealthLoading ? 'SYNC...' : 'LIVE'}</span>
                </div>
                <p className="text-2xl font-black text-[#57a9d9] italic tracking-tighter leading-none mb-1">
                  {vmHealth ? vmHealth.uptime : (vmHealthLoading ? '...' : 'N/A')}
                </p>
                {vmHealth?.loadAvg && (
                  <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 mb-2">
                    LOAD: {vmHealth.loadAvg.map(v => v.toFixed(2)).join(' · ')}
                  </p>
                )}
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">UPTIME VM</p>
              </div>
            </div>

            {/* Chart + Containers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[56px] border border-slate-200 dark:border-slate-800 p-12 space-y-10 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Activity className="text-[#57a9d9]" size={24} />
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">MÉTRIQUES DE CHARGE (24H)</h3>
                  </div>
                  <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-2"><span className="w-4 h-1 bg-[#6366f1] rounded inline-block"></span>CPU</span>
                    <span className="flex items-center gap-2"><span className="w-4 h-1 bg-[#10b981] rounded inline-block" style={{ borderStyle: 'dashed' }}></span>RAM</span>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a0c14', borderRadius: '20px', border: '1px solid #1e293b', color: '#fff' }}
                        formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name.toUpperCase()]}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={4} />
                      <Area type="monotone" dataKey="ram" stroke="#10b981" fill="url(#colorRam)" fillOpacity={1} strokeWidth={3} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Maintenance */}
              <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-200 dark:border-slate-800 p-12 flex flex-col justify-between shadow-2xl">
                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <History className="text-[#57a9d9]" size={24} />
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">MAINTENANCE</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="p-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] space-y-2">
                      <p className="text-[9px] font-black text-[#57a9d9] uppercase tracking-widest">DERNIER BACKUP</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">HIER À 02:00 (RÉUSSI)</p>
                    </div>
                    <div className="p-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] space-y-2">
                      <p className="text-[9px] font-black text-[#57a9d9] uppercase tracking-widest">ROTATION DES LOGS</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">IL Y A 2 HEURES</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleForceMaintenance}
                  disabled={isMaintenanceRunning}
                  className="mt-10 w-full py-6 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 border-none text-white"
                  style={{ backgroundColor: '#57a9d9' }}
                >
                  {isMaintenanceRunning ? <RefreshCw className="animate-spin" size={18} /> : 'FORCER LA MAINTENANCE'}
                </button>
              </div>
            </div>

            {/* Docker Containers */}
            {(vmHealth?.containers && vmHealth.containers.length > 0) && (
              <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-200 dark:border-slate-800 p-12 shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                  <ClipboardList className="text-[#57a9d9]" size={24} />
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">CONTENEURS DOCKER — VM OPENVAS</h3>
                  <span className="px-4 py-1.5 bg-[#57a9d9]/10 border border-[#57a9d9]/20 text-[#57a9d9] text-[9px] font-black rounded-full uppercase tracking-widest">
                    {vmHealth.containers.length} ACTIFS
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vmHealth.containers.map((container, i) => {
                    const statusClass = getContainerStatusColor(container.status);
                    return (
                      <div key={i} className="p-8 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[32px] hover:border-[#57a9d9]/30 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{container.name}</p>
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusClass}`}>
                            {container.status.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">CPU</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{container.cpu}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">MEM</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{container.memory}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading skeleton when no data yet */}
            {vmHealthLoading && !vmHealth && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-6">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-[#57a9d9]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#57a9d9] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">CONNEXION SSH À LA VM...</p>
                </div>
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <div className="space-y-6 min-h-screen pb-32">
      {renderQuickNav()}
      {renderContent()}

      {/* MODAL CRÉATION UTILISATEUR */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[56px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-start">
              <div><h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">NOUVEL ACCRÉDITÉ</h2></div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-rose-500/20 hover:text-rose-500 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <form className="p-12 space-y-10" onSubmit={handleCreateUser}>
              <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nom complet</label><input required type="text" placeholder="Ex: ALI SENNOUR" value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white uppercase italic outline-none focus:ring-4 focus:ring-[#57a9d9]/10 transition-all" /></div>
              <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email</label><input required type="email" placeholder="ali@ksi.tn" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-bold text-slate-300 outline-none focus:ring-4 focus:ring-[#57a9d9]/10 transition-all" /></div>
              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">ANNULER</button>
                <button type="submit" className="flex-[2] py-6 bg-[#57a9d9] text-slate-900 dark:text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-[#57a9d9] transition-all flex items-center justify-center gap-3 active:scale-95"><ShieldCheck size={20} /> CRÉER</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION ORGANISATION */}
      {isEditOrgModalOpen && editingOrg && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[56px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-12 pb-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-start">
              <div><h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">CONFIGURER L'ENTITÉ</h2><p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-3 italic">{editingOrg.name}</p></div>
              <button onClick={() => setIsEditOrgModalOpen(false)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-amber-500/20 hover:text-amber-500 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <input type="text" value={editingOrg.name} onChange={e => setEditingOrg({ ...editingOrg, name: e.target.value })} placeholder="Nom" className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white uppercase italic outline-none" />
                <input type="text" value={editingOrg.sector} onChange={e => setEditingOrg({ ...editingOrg, sector: e.target.value })} placeholder="Secteur" className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white uppercase italic outline-none" />
              </div>
            </div>
            <div className="p-12 bg-slate-950/80 border-t border-slate-200 dark:border-white/5 flex gap-6">
              <button onClick={() => setIsEditOrgModalOpen(false)} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:bg-white/10 transition-all">ANNULER</button>
              <button onClick={handleUpdateOrg} className="flex-[2] py-6 bg-amber-600 text-slate-900 dark:text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-amber-500 transition-all flex items-center justify-center gap-3 active:scale-95"><Save size={20} /> ENREGISTRER</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONNECTER NOEUD */}
      {isConnectNodeModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[56px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-start">
              <div><h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">CONNECTER UN NOEUD</h2></div>
              <button onClick={() => setIsConnectNodeModalOpen(false)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-rose-500/20 hover:text-rose-500 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <form className="p-12 space-y-8" onSubmit={handleConnectNode}>
              <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nom du Noeud</label><input required type="text" placeholder="Ex: NUCLEI-NODE-04" value={newNodeForm.name} onChange={e => setNewNodeForm({ ...newNodeForm, name: e.target.value })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white uppercase italic outline-none" /></div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Type</label>
                  <select value={newNodeForm.type} onChange={e => setNewNodeForm({ ...newNodeForm, type: e.target.value as any })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white outline-none appearance-none">
                    <option value="OpenVAS">OpenVAS (GVM)</option>
                    <option value="Nuclei">Nuclei</option>
                    <option value="Nikto">Nikto</option>
                  </select>
                </div>
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Version</label><input required type="text" placeholder="24.1.0" value={newNodeForm.version} onChange={e => setNewNodeForm({ ...newNodeForm, version: e.target.value })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white outline-none" /></div>
              </div>
              <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Endpoint</label><input required type="text" placeholder="https://node.internal:8080" value={newNodeForm.endpoint} onChange={e => setNewNodeForm({ ...newNodeForm, endpoint: e.target.value })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-mono text-slate-300 outline-none" /></div>
              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setIsConnectNodeModalOpen(false)} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">ANNULER</button>
                <button type="submit" className="flex-[2] py-6 bg-gradient-to-r from-rose-500 to-pink-600 text-slate-900 dark:text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"><Cpu size={20} /> ÉTABLIR LA CONNEXION</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SCALING */}
      {isScalingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[56px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-start">
              <div><h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">AUTO-SCALING</h2></div>
              <button onClick={() => setIsScalingModalOpen(false)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-[#57a9d9]/20 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <div className="p-12 space-y-10">
              <div className="flex items-center justify-between p-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px]">
                <div><p className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Activer le Scaling Automatique</p></div>
                <button onClick={() => setScalingConfig({ ...scalingConfig, enabled: !scalingConfig.enabled })} className={`w-16 h-8 rounded-full transition-all relative ${scalingConfig.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${scalingConfig.enabled ? 'left-9' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Noeuds Min</label><input type="number" value={scalingConfig.minNodes} onChange={e => setScalingConfig({ ...scalingConfig, minNodes: parseInt(e.target.value) })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white outline-none" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Noeuds Max</label><input type="number" value={scalingConfig.maxNodes} onChange={e => setScalingConfig({ ...scalingConfig, maxNodes: parseInt(e.target.value) })} className="w-full p-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white outline-none" /></div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest"><span>Seuil CPU</span><span className="text-slate-900 dark:text-white italic">{scalingConfig.threshold}%</span></div>
                <input type="range" min="10" max="90" step="5" value={scalingConfig.threshold} onChange={e => setScalingConfig({ ...scalingConfig, threshold: parseInt(e.target.value) })} className="w-full accent-[#57a9d9]" />
              </div>
              <div className="flex gap-6 pt-6">
                <button onClick={() => setIsScalingModalOpen(false)} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">ANNULER</button>
                <button onClick={handleSaveScaling} className="flex-[2] py-6 bg-[#57a9d9] text-slate-900 dark:text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-[#57a9d9] transition-all flex items-center justify-center gap-3 active:scale-95"><Save size={20} /> ENREGISTRER</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS RAPPORT */}
      {selectedReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[56px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-start">
              <div><h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{selectedReport.id}</h2><p className="text-[10px] font-black text-[#57a9d9] uppercase tracking-[0.3em] mt-3 italic">{selectedReport.type}</p></div>
              <button onClick={() => setSelectedReport(null)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-rose-500/20 hover:text-rose-500 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <div className="p-12 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">CLIENT</p><p className="text-xl font-black text-slate-900 dark:text-white uppercase italic">{selectedReport.client}</p></div>
                <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DATE</p><p className="text-xl font-black text-slate-900 dark:text-white uppercase italic">{selectedReport.date}</p></div>
              </div>
              <div className="flex gap-6 pt-6">
                <button onClick={() => setSelectedReport(null)} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">FERMER</button>
                <button className="flex-[2] py-6 bg-[#57a9d9] text-slate-900 dark:text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-[#57a9d9] transition-all flex items-center justify-center gap-3 active:scale-95"><FileDown size={20} /> TÉLÉCHARGER PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GÉNÉRATION SYNTHÈSE */}
      {isGeneratingSynthesis && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="text-center space-y-10">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-emerald-500"><Zap size={48} className="animate-pulse" /></div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">GÉNÉRATION EN COURS</h2>
          </div>
        </div>
      )}

      {/* MODAL MAINTENANCE */}
      {isMaintenanceRunning && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="text-center space-y-10">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 border-4 border-[#57a9d9]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#57a9d9] border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-[#57a9d9]"><History size={48} className="animate-bounce" /></div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">MAINTENANCE EN COURS</h2>
          </div>
        </div>
      )}

      {/* MODAL SÉLECTION CHEF RÉFÉRENT */}
      {approvingRequest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#0a0c14] w-full max-w-lg rounded-[56px] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">ASSIGNER UN CHEF</h2>
                <p className="text-[10px] font-black text-[#57a9d9] uppercase tracking-[0.3em] mt-3 italic">Auditeur : {approvingRequest.name}</p>
              </div>
              <button onClick={() => setApprovingRequest(null)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-rose-500/20 hover:text-rose-500 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <div className="p-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Chef d'Audit Référent</label>
                <select value={selectedChefId} onChange={e => setSelectedChefId(e.target.value)} className="w-full p-5 bg-[#1a1f2e] border border-slate-200 dark:border-white/10 rounded-3xl font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-[#57a9d9]/10 transition-all appearance-none" style={{ colorScheme: 'dark' }}>
                  <option value="">— Sélectionner un Chef d'Audit —</option>
                  {usersList.filter(u => u.role?.toUpperCase() === 'CHEF').map(chef => (
                    <option key={(chef as any)._id || chef.id} value={(chef as any)._id || chef.id} style={{ backgroundColor: '#1a1f2e', color: 'white' }}>
                      {chef.name} — {chef.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="p-6 bg-[#57a9d9]/5 border border-[#57a9d9]/20 rounded-3xl">
                <p className="text-[10px] font-black text-[#57a9d9] uppercase tracking-widest">ℹ️ L'auditeur apparaîtra dans la section "Team" du chef sélectionné.</p>
              </div>
              <div className="flex gap-6 pt-2">
                <button onClick={() => setApprovingRequest(null)} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">ANNULER</button>
                <button onClick={() => confirmApprove(approvingRequest, selectedChefId)} disabled={!selectedChefId} className="flex-[2] py-6 bg-[#10b981] text-slate-900 dark:text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Check size={20} strokeWidth={4} /> APPROUVER & ASSIGNER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASSIGNER CLIENT */}
      {isAssignClientModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#0a0c14] w-full max-w-lg rounded-[56px] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">ASSIGNER UN CLIENT</h2>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mt-3 italic">Lier un client à son auditeur référent</p>
              </div>
              <button onClick={() => setIsAssignClientModalOpen(false)} className="p-4 bg-slate-100 dark:bg-white/5 rounded-3xl hover:bg-rose-500/20 hover:text-rose-500 transition-all text-slate-400"><X size={24} /></button>
            </div>
            <form className="p-12 space-y-8" onSubmit={handleAssignClient}>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Client à assigner</label>
                <select required value={assignForm.clientId} onChange={e => setAssignForm({ ...assignForm, clientId: e.target.value })} className={`w-full p-5 border rounded-3xl font-black outline-none appearance-none ${isDark ? 'bg-[#1a1f2e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white' : 'bg-white border-slate-200 text-slate-900'}`} style={{ colorScheme: isDark ? 'dark' : 'light' }}>
                  <option value="" style={{ backgroundColor: isDark ? '#1a1f2e' : 'white', color: isDark ? 'white' : 'black' }}>— Sélectionner un Client —</option>
                  {usersList.filter(u => u.role?.toUpperCase() === 'CLIENT').map(client => (
                    <option key={(client as any)._id || client.id} value={(client as any)._id || client.id} style={{ backgroundColor: isDark ? '#1a1f2e' : 'white', color: isDark ? 'white' : 'black' }}>
                      {client.name} — {client.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Auditeur référent</label>
                <select required value={assignForm.auditorId} onChange={e => setAssignForm({ ...assignForm, auditorId: e.target.value })} className={`w-full p-5 border rounded-3xl font-black outline-none appearance-none ${isDark ? 'bg-[#1a1f2e] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white' : 'bg-white border-slate-200 text-slate-900'}`} style={{ colorScheme: isDark ? 'dark' : 'light' }}>
                  <option value="" style={{ backgroundColor: isDark ? '#1a1f2e' : 'white', color: isDark ? 'white' : 'black' }}>— Sélectionner un Auditeur —</option>
                  {usersList.filter(u => u.role?.toUpperCase() === 'AUDITOR').map(auditor => (
                    <option key={(auditor as any)._id || auditor.id} value={(auditor as any)._id || auditor.id} style={{ backgroundColor: isDark ? '#1a1f2e' : 'white', color: isDark ? 'white' : 'black' }}>
                      {auditor.name} — {auditor.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-6 pt-2">
                <button type="button" onClick={() => setIsAssignClientModalOpen(false)} className="flex-1 py-6 bg-slate-100 dark:bg-white/5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 transition-all">ANNULER</button>
                <button type="submit" className="flex-[2] py-6 bg-emerald-600 text-slate-900 dark:text-white rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <ArrowRight size={20} /> CONFIRMER L'ASSIGNATION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;