import React, { useContext } from 'react';
import { AuditContext } from '../frontend/context/AuditContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  CheckCircle2,
  Bell,
  User as UserIcon,
  ShieldCheck,
  Building2,
  Lock,
  Search,
  CheckCircle,
  Loader2,
  Activity
} from 'lucide-react';
import { UserRole, User } from '../types';
import Logo from './Logo';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  themeToggle: React.ReactNode;
  unreadNotifications: number;
}

const Layout: React.FC<LayoutProps> = ({ 
  user, 
  onLogout, 
  children, 
  activeView, 
  setActiveView, 
  themeToggle,
  unreadNotifications
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  // Access scan state for persistent indicator (safe — no throw if provider missing)
  const auditCtx = useContext(AuditContext);
  const scanState = {
    isScanning: auditCtx?.isScanning || false,
    scanStatus: auditCtx?.scanStatus || 'IDLE',
    scanProgress: auditCtx?.scanProgress || 0
  };

  const isActive = ['LAUNCHING','QUEUED','RUNNING','RETRIEVING_XML','PARSING','AI_ANALYSIS','GENERATING_PDF','SAVING'].includes(scanState.scanStatus);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.CHEF, UserRole.AUDITOR, UserRole.CLIENT] },
    { id: 'admin-portal', label: 'Administration', icon: Lock, roles: [UserRole.ADMIN] },
    { id: 'auditor-clients', label: 'Mes Clients', icon: Building2, roles: [UserRole.AUDITOR] },
    { id: 'reports', label: 'Mes Audits', icon: FileText, roles: [UserRole.AUDITOR] },
    { id: 'team', label: 'Supervision Équipe', icon: ShieldCheck, roles: [UserRole.CHEF] },
    { id: 'validation', label: 'Validation Rapports', icon: CheckCircle, roles: [UserRole.CHEF] },
    { id: 'client-reports', label: 'Mes Rapports Validés', icon: ShieldCheck, roles: [UserRole.CLIENT] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: [UserRole.ADMIN, UserRole.CHEF, UserRole.AUDITOR, UserRole.CLIENT] },
    { id: 'settings', label: 'Paramètres', icon: Settings, roles: [UserRole.ADMIN, UserRole.CHEF, UserRole.AUDITOR, UserRole.CLIENT] },
].filter(item => item.roles.includes(user.role?.toUpperCase() as UserRole));

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden text-slate-900 dark:text-slate-100">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shrink-0 z-50 fixed md:relative h-full border-r border-slate-800`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <Logo size={isSidebarOpen ? 32 : 32} showText={isSidebarOpen} />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group ${
                activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-bold border-2 border-slate-600 shrink-0">
              {user.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{user.role?.toUpperCase()}</p>
              </div>
            )}
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-4 p-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40 transition-colors">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize italic tracking-tight">
            {menuItems.find(m => m.id === activeView)?.label || 'Aperçu'}
          </h2>
          <div className="flex items-center gap-4">
            {/* Scan indicator — visible on all pages */}
            {isActive && (
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl animate-pulse">
                <Loader2 size={16} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">
                    Scan {scanState.scanStatus}
                  </span>
                  <div className="w-20 h-1 bg-emerald-200 dark:bg-emerald-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${scanState.scanProgress}%` }}></div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{scanState.scanProgress}%</span>
              </div>
            )}
            {themeToggle}
            <button 
              onClick={() => setActiveView('notifications')}
              className={`p-2 rounded-xl transition-all relative ${
                activeView === 'notifications' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-white">{unreadNotifications}</span>
              )}
            </button>
          </div>
        </header>
        <div className="p-8 pb-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
