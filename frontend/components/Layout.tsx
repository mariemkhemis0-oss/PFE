import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Settings, LogOut, Bell, ShieldCheck,
  Building2, Lock, CheckCircle, ClipboardList, Library,
  Menu, ChevronLeft, ChevronRight, Search, Loader2, MessageSquare,
  ArrowRight, User as UserIcon, FileSearch
} from 'lucide-react';
import { UserRole, User } from '../types';
import Logo from './Logo';
import Avatar from './Avatar';
import { AuditContext } from '../context/AuditContext';
import { usersAPI, reportsAPI } from '../services/apiService';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  unreadNotifications: number;
  themeToggle: React.ReactNode;
  isDark: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  user, onLogout, children, activeView, setActiveView,
  unreadNotifications, themeToggle, isDark
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // ── GLOBAL SEARCH STATE ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{category: string; icon: any; items: {title: string; subtitle: string; view: string}[]}[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchCache, setSearchCache] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scan state for persistent header indicator
  const auditCtx = useContext(AuditContext);
  const scanActive = auditCtx && ['LAUNCHING','QUEUED','RUNNING','RETRIEVING_XML','PARSING','AI_ANALYSIS','GENERATING_PDF','SAVING'].includes(auditCtx.scanStatus);
  const scanProgress = auditCtx?.scanProgress || 0;
  const scanStatusLabel = auditCtx?.scanStatus || 'IDLE';

  const menuItems = [
    { id: 'dashboard',      label: 'DASHBOARD',      icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.CHEF, UserRole.AUDITOR, UserRole.CLIENT] },
    { id: 'campaigns',      label: 'AUDITS LIST',    icon: ClipboardList,   roles: [UserRole.CHEF] },
    { id: 'admin-portal',   label: 'ADMINISTRATION', icon: Lock,            roles: [UserRole.ADMIN] },
    { id: 'auditor-clients',label: 'MES CLIENTS',    icon: Building2,       roles: [UserRole.AUDITOR] },
    { id: 'reports',        label: 'MES AUDITS',     icon: FileText,        roles: [UserRole.AUDITOR] },
    { id: 'cve-library',    label: 'CVE LIBRARY',    icon: Library,         roles: [UserRole.AUDITOR] },
    { id: 'team',           label: 'TEAM OPS',       icon: ShieldCheck,     roles: [UserRole.CHEF] },
    { id: 'validation',     label: 'VALIDATION',     icon: CheckCircle,     roles: [UserRole.CHEF] },
    { id: 'client-reports', label: 'REPORTS',        icon: ShieldCheck,     roles: [UserRole.CLIENT] },
    { id: 'messages',       label: 'MESSAGES',       icon: MessageSquare,   roles: [UserRole.CHEF, UserRole.AUDITOR, UserRole.CLIENT] },
    { id: 'notifications',  label: 'NOTIFICATIONS',  icon: Bell,            roles: [UserRole.ADMIN, UserRole.CHEF, UserRole.AUDITOR, UserRole.CLIENT] },
    { id: 'settings',       label: 'PARAMÈTRES',     icon: Settings,        roles: [UserRole.ADMIN, UserRole.CHEF, UserRole.AUDITOR, UserRole.CLIENT] },
  ].filter(item => item.roles.map(r => r.toUpperCase()).includes(user.role?.toUpperCase() as UserRole));

  const currentLabel = menuItems.find(m => m.id === activeView)?.label || 'DASHBOARD';

  // ── SEARCH: load data on focus ──
  const loadSearchData = useCallback(async () => {
    if (searchCache) return;
    try {
      const role = user.role?.toUpperCase();
      const userId = (user as any)._id || user.id;
      const token = localStorage.getItem('token');
      const authHeaders: any = { 'Authorization': `Bearer ${token}` };
      const cache: any = { reports: [], users: [], orgs: [] };
      try {
        let reps = await reportsAPI.getAll();
        if (!Array.isArray(reps)) reps = [];
        if (role === 'CLIENT') reps = reps.filter((r: any) => r.clientId === userId || r.clientCompany?.toLowerCase() === user.company?.toLowerCase());
        else if (role === 'AUDITOR') reps = reps.filter((r: any) => r.auditorId === userId);
        else if (role === 'CHEF') reps = reps.filter((r: any) => r.chefId === userId || r.status === 'IN_REVIEW');
        cache.reports = reps;
      } catch {}
      if (['ADMIN', 'CHEF'].includes(role)) {
        try { cache.users = await usersAPI.getAll(); } catch {}
      }
      if (role === 'AUDITOR') {
        try {
          const usersData = await usersAPI.getAll();
          cache.users = (usersData || []).filter((u: any) => u.auditorId?.toString() === userId?.toString() && u.role?.toUpperCase() === 'CLIENT');
        } catch {}
      }
      if (role === 'ADMIN') {
        try {
          const res = await fetch('http://localhost:5000/api/organizations', { headers: authHeaders });
          cache.orgs = await res.json();
        } catch {}
      }
      setSearchCache(cache);
    } catch {}
  }, [searchCache, user]);

  // ── SEARCH: build role-specific shortcuts ──
  const getRoleShortcuts = useCallback(() => {
    const role = user.role?.toUpperCase();
    const shortcuts: { keywords: string[]; title: string; subtitle: string; view: string }[] = [];

    // Own name → settings
    shortcuts.push({ keywords: [user.name?.toLowerCase(), user.email?.toLowerCase(), 'mon profil', 'mon compte', 'profile', 'my profile'].filter(Boolean) as string[], title: `${user.name}`, subtitle: 'Mon profil · Paramètres', view: 'settings' });

    if (role === 'ADMIN') {
      shortcuts.push(
        { keywords: ['utilisateurs', 'users', 'comptes', 'rôles', 'roles', 'gestion utilisateurs'], title: 'GESTION UTILISATEURS', subtitle: 'Identités, Rôles, MFA, Sessions', view: 'admin-portal' },
        { keywords: ['organisations', 'organization', 'clients', 'multi-tenant', 'périmètres', 'entreprises'], title: 'ORGANISATIONS', subtitle: 'Clients multi-tenant, périmètres IP & domaines', view: 'admin-portal' },
        { keywords: ['branding', 'rapport config', 'personnalisation', 'logo', 'template'], title: 'BRANDING & RAPPORTS', subtitle: 'Personnalisation visuelle des rapports', view: 'admin-portal' },
        { keywords: ['santé', 'health', 'système', 'serveurs', 'cpu', 'ram', 'monitoring', 'infrastructure', 'vm', 'openvas'], title: 'SANTÉ SYSTÈME', subtitle: 'Monitoring serveurs, CPU, RAM, VM', view: 'admin-portal' },
        { keywords: ['demandes', 'demandes de rôles', 'inscription', 'approbation', 'approuver'], title: 'DEMANDES D\'ACCÈS', subtitle: 'Demandes de rôles en attente', view: 'admin-portal' },
      );
    }
    if (role === 'CHEF') {
      shortcuts.push(
        { keywords: ['validation', 'valider', 'approuver', 'en attente', 'review', 'revue'], title: 'VALIDATION RAPPORTS', subtitle: 'Rapports en attente de validation', view: 'validation' },
        { keywords: ['équipe', 'team', 'auditeurs', 'performance', 'membres'], title: 'ÉQUIPE & PERFORMANCE', subtitle: 'Supervision des auditeurs', view: 'team' },
        { keywords: ['scans', 'scan planifié', 'planification', 'schedule'], title: 'SCANS PLANIFIÉS', subtitle: 'Supervision des scans équipe', view: 'dashboard' },
        { keywords: ['campagnes', 'audits list', 'campagne', 'missions'], title: 'CAMPAGNES D\'AUDIT', subtitle: 'Liste des campagnes d\'audit', view: 'campaigns' },
      );
    }
    if (role === 'AUDITOR') {
      shortcuts.push(
        { keywords: ['clients', 'mes clients', 'assignés', 'client'], title: 'MES CLIENTS', subtitle: 'Clients assignés', view: 'auditor-clients' },
        { keywords: ['cve', 'vulnérabilités', 'vulnerability', 'failles', 'library'], title: 'CVE LIBRARY', subtitle: 'Base de données CVE', view: 'cve-library' },
        { keywords: ['scan', 'xml', 'openvas', 'nouveau rapport', 'générer'], title: 'NOUVEAU RAPPORT', subtitle: 'Importer un XML et générer un rapport', view: 'reports' },
        { keywords: ['scans planifiés', 'planification', 'schedule', 'scan auto'], title: 'SCANS PLANIFIÉS', subtitle: 'Mes scans automatiques', view: 'dashboard' },
        { keywords: ['soumettre', 'soumission', 'envoyer au chef'], title: 'SOUMETTRE RAPPORT', subtitle: 'Soumettre un rapport au Chef d\'Audit', view: 'auditor-reports' },
      );
    }
    if (role === 'CLIENT') {
      shortcuts.push(
        { keywords: ['rapports', 'reports', 'mes rapports', 'audit'], title: 'MES RAPPORTS', subtitle: 'Consulter mes rapports d\'audit', view: 'client-reports' },
        { keywords: ['score', 'sécurité', 'security', 'note', 'niveau'], title: 'SCORE DE SÉCURITÉ', subtitle: 'Niveau de risque et score global', view: 'dashboard' },
        { keywords: ['vulnérabilités', 'failles', 'critique', 'findings', 'risques'], title: 'VULNÉRABILITÉS', subtitle: 'Points critiques de sécurité', view: 'client-reports' },
        { keywords: ['feedback', 'avis', 'satisfaction', 'note', 'étoile', 'commentaire'], title: 'AVIS & FEEDBACK', subtitle: 'Donner votre avis sur la plateforme', view: 'dashboard' },
        { keywords: ['télécharger', 'download', 'pdf', 'export'], title: 'TÉLÉCHARGER RAPPORT', subtitle: 'Télécharger un rapport en PDF', view: 'client-reports' },
      );
    }
    return shortcuts;
  }, [user]);

  // ── SEARCH: filter results ──
  const filterResults = useCallback((query: string) => {
    if (!query.trim()) { setSearchResults([]); setIsSearchOpen(false); return; }
    const q = query.toLowerCase().trim();
    const role = user.role?.toUpperCase();
    const cats: typeof searchResults = [];

    // 1. Pages (menu items)
    const pages = menuItems.filter(m => m.label.toLowerCase().includes(q));
    if (pages.length) cats.push({ category: 'Pages', icon: LayoutDashboard, items: pages.map(m => ({ title: m.label, subtitle: 'Naviguer vers cette page', view: m.id })) });

    // 2. Role-specific shortcuts
    const shortcuts = getRoleShortcuts();
    const shortcutMatches = shortcuts.filter(s => s.keywords.some(kw => kw.includes(q) || q.includes(kw)));
    if (shortcutMatches.length) cats.push({ category: 'Accès rapide', icon: Search, items: shortcutMatches.map(s => ({ title: s.title, subtitle: s.subtitle, view: s.view })) });

    if (searchCache) {
      // 3. Reports
      const rMatches = (searchCache.reports || []).filter((r: any) => `${r.title||''} ${r.clientName||''} ${r.ref||''} ${r.clientCompany||''} ${r.status||''}`.toLowerCase().includes(q)).slice(0, 5);
      if (rMatches.length) cats.push({ category: 'Rapports', icon: FileText, items: rMatches.map((r: any) => ({ title: r.title || r.ref || 'Rapport', subtitle: `${r.clientName || r.clientCompany || '—'} · ${r.status}`, view: role === 'CLIENT' ? 'client-reports' : role === 'CHEF' ? 'validation' : 'reports' })) });

      // 4. Users (ADMIN: all users, CHEF: auditors, AUDITOR: clients)
      const uMatches = (searchCache.users || []).filter((u: any) => `${u.name||''} ${u.email||''} ${u.company||''} ${u.role||''}`.toLowerCase().includes(q)).slice(0, 5);
      if (uMatches.length) {
        const label = role === 'AUDITOR' ? 'Mes Clients' : 'Utilisateurs';
        cats.push({ category: label, icon: UserIcon, items: uMatches.map((u: any) => ({ title: u.name, subtitle: `${u.email} · ${u.role || u.company || ''}`, view: role === 'ADMIN' ? 'admin-portal' : role === 'AUDITOR' ? 'auditor-clients' : 'team' })) });
      }

      // 5. Organizations (ADMIN only)
      if (role === 'ADMIN' && searchCache.orgs?.length) {
        const oMatches = searchCache.orgs.filter((o: any) => `${o.name||''} ${o.codeClient||''} ${o.sector||''} ${o.type||''}`.toLowerCase().includes(q)).slice(0, 5);
        if (oMatches.length) cats.push({ category: 'Organisations', icon: Building2, items: oMatches.map((o: any) => ({ title: o.name, subtitle: `${o.codeClient || ''} · ${o.sector || o.type || ''}`, view: 'admin-portal' })) });
      }
    }
    setSearchResults(cats);
    setIsSearchOpen(true);
  }, [menuItems, searchCache, user, getRoleShortcuts]);

  const onSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => filterResults(e.target.value), 250);
  };

  const onResultClick = (view: string) => { setActiveView(view); setSearchQuery(''); setSearchResults([]); setIsSearchOpen(false); };

  return (
    <div className="shieldops-layout min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500 text-slate-900 dark:text-slate-100 overflow-hidden font-sans relative">
      {/* ── SIDEBAR ── */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-[#0f172a] transition-all duration-500 flex flex-col shrink-0 border-r border-slate-800 z-[70] h-screen shadow-[10px_0_40px_rgba(0,0,0,0.1)] relative`}>
        <div className="h-24 flex items-center px-8 border-b border-slate-800 shrink-0">
          <Logo size={48} showText={isSidebarOpen} isDark={true} />
        </div>

        <nav className="flex-1 p-6 space-y-3 mt-6 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-5 p-4 rounded-2xl transition-all relative group border border-transparent ${
                activeView === item.id
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 dark:bg-transparent dark:border-[#347ABF] dark:text-[#347ABF] dark:shadow-none translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white dark:hover:text-[#347ABF]'
              }`}
            >
              <item.icon
                size={22}
                className={`${activeView === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} text-[#57a9d9]`}
              />
              {isSidebarOpen && (
                <span className="font-black text-[11px] uppercase tracking-[0.2em]">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 space-y-6">
          <div className={`bg-slate-800/40 border border-slate-700/50 p-6 rounded-[32px] transition-all ${!isSidebarOpen ? 'px-3' : ''}`}>
            <div className="flex items-center gap-5 mb-6">
              <Avatar user={user} size={isSidebarOpen ? 56 : 40} editable={false} />
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-[14px] font-black text-white uppercase tracking-tighter truncate leading-none mb-2 italic">{user.name}</p>
                  <p className="text-[9px] font-black uppercase text-[#57a9d9] tracking-[0.3em] leading-none opacity-80">ID: {user.role.substring(0,3)}</p>
                </div>
              )}
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em] border border-rose-500/20 shadow-sm"
            >
              <LogOut size={18} />
              {isSidebarOpen && <span>LOGOUT</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="dashboard-layout min-h-screen flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        {/* Header */}

        <header className={`h-24 transition-colors duration-500 flex items-center justify-between px-12 shrink-0 z-50 ${isDark ? 'bg-slate-900/60' : 'bg-white/80'} backdrop-blur-xl border-b ${isDark ? 'border-slate-800' : 'border-slate-200/60'}`}>
          <div className="flex items-center gap-8">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>

            <div className="flex flex-col">
              <h2 className={`text-[22px] font-black uppercase italic tracking-tighter leading-none mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentLabel}
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                  STATUS: OPERATIONAL
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div ref={searchRef} className="relative w-80 hidden lg:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={onSearchInput}
                onFocus={loadSearchData}
                placeholder="GLOBAL SEARCH..."
                className={`w-full pl-14 pr-6 py-4 rounded-full text-xs font-black uppercase tracking-widest border transition-all placeholder:text-slate-400 ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400'} focus:ring-2 focus:ring-indigo-500/20 outline-none`}
              />
              {/* ── Search Results Dropdown ── */}
              {isSearchOpen && (
                <div className={`absolute top-full mt-3 left-0 right-0 rounded-2xl shadow-2xl border overflow-hidden z-[200] max-h-[420px] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200'}`} style={{boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.6)' : '0 25px 60px rgba(0,0,0,0.15)'}}>
                  {searchResults.length > 0 ? (
                    searchResults.map((cat, ci) => (
                      <div key={ci}>
                        <div className={`px-5 py-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 ${isDark ? 'bg-slate-800/90 text-slate-400 backdrop-blur' : 'bg-slate-100/90 text-slate-500 backdrop-blur'}`}>
                          <cat.icon size={13} />
                          {cat.category}
                        </div>
                        {cat.items.map((item, ii) => (
                          <button
                            key={ii}
                            onClick={() => onResultClick(item.view)}
                            className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 transition-all group ${isDark ? 'hover:bg-indigo-500/10 text-white' : 'hover:bg-indigo-50 text-slate-900'}`}
                          >
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="text-[13px] font-bold truncate">{item.title}</span>
                              <span className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.subtitle}</span>
                            </div>
                            <ArrowRight size={14} className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                          </button>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className={`px-5 py-10 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <FileSearch size={28} className="mx-auto mb-3 opacity-40" />
                      <p className="text-[11px] font-black uppercase tracking-[0.15em]">Aucun résultat pour "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Scan progress indicator — visible from all pages */}
              {scanActive && (
                <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl">
                  <Loader2 size={16} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">
                      SCAN {scanStatusLabel}
                    </span>
                    <div className="w-20 h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{scanProgress}%</span>
                </div>
              )}
              {themeToggle}
              <button
                onClick={() => setActiveView('notifications')}
                className={`relative p-4 rounded-2xl transition-all group shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-[#57a9d9]' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-indigo-600'}`}
              >
                <Bell size={24} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-[-4px] right-[-4px] w-6 h-6 bg-rose-500 border-[3px] border-white dark:border-slate-950 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>

            <div className={`h-12 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

            <div onClick={() => setActiveView('settings')} className="cursor-pointer">
              <Avatar user={user} size={56} editable={false} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col overflow-y-auto h-full scroll-smooth relative transition-colors duration-500">
          <div className="p-6 lg:p-8 pb-32 max-w-[1600px] mx-auto w-full relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
