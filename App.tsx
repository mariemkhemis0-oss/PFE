
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StatsGrid from './components/StatsGrid';
import ReportView from './views/ReportView';
import AuthView from './views/AuthView';
import SettingsView from './views/SettingsView';
import UsersView from './views/UsersView';
import NotificationsView from './views/NotificationsView';
import AuditorReportWorkspace from './views/AuditorReportWorkspace';
import TeamView from './views/TeamView';
import AuditorClientsView from './views/AuditorClientsView';
import AdminPortal from './views/AdminPortal';
import AdminDashboard from './views/AdminDashboard';
import ChefDashboard from './views/ChefDashboard';
import AuditorDashboard from './views/AuditorDashboard';
import ClientDashboard from './views/ClientDashboard';
import ClientReportsView from './views/ClientReportsView';
import { User, UserRole, Vulnerability, Host, Severity, Notification } from './types';
import { mockUsers, mockVulns, mockHosts, mockNotifications } from './mockData';
import { ShieldAlert, Terminal, BrainCircuit, Search, Plus, Filter, Moon, Sun } from 'lucide-react';
import { analyzeVulnerabilities, generateExecutiveSummary } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [vulns, setVulns] = useState<Vulnerability[]>(mockVulns);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Fonction pour recharger les utilisateurs depuis le stockage local
  const refreshUsers = () => {
    const savedUsers = localStorage.getItem('cyberaudit_users');
    if (savedUsers) {
      setAllUsers(JSON.parse(savedUsers));
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('cyberaudit_users');
    if (!savedUsers) {
      localStorage.setItem('cyberaudit_users', JSON.stringify(mockUsers));
      setAllUsers(mockUsers);
    } else {
      setAllUsers(JSON.parse(savedUsers));
    }
    
    // Ecouter les mises à jour venant de l'AdminPortal
    const handleGlobalUpdate = () => refreshUsers();
    window.addEventListener('cyberaudit_data_updated', handleGlobalUpdate);
    window.addEventListener('storage', handleGlobalUpdate);

    const savedNotifs = localStorage.getItem('cyberaudit_notifications');
    if (savedNotifs) {
      setNotifications(JSON.parse(savedNotifs));
    } else {
      localStorage.setItem('cyberaudit_notifications', JSON.stringify(mockNotifications));
    }

    const session = localStorage.getItem('cyberaudit_session');
    if (session) {
      const u = JSON.parse(session);
      setUser(u);
      if (u.role === UserRole.ADMIN) setActiveView('dashboard');
      if (u.role === UserRole.CLIENT) setActiveView('dashboard');
    }
    
    fetchInitialSummary();

    return () => {
      window.removeEventListener('cyberaudit_data_updated', handleGlobalUpdate);
      window.removeEventListener('storage', handleGlobalUpdate);
    };
  }, []);

  const fetchInitialSummary = async () => {
    const dataSummary = await generateExecutiveSummary({
      total: mockVulns.length,
      critical: mockVulns.filter(v => v.severity === Severity.CRITICAL).length,
      grade: 'B'
    });
    setSummary(dataSummary || 'Analyse de sécurité en cours...');
  };

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('cyberaudit_session', JSON.stringify(u));
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cyberaudit_session');
  };

  const handleUpdateUser = (updatedUser: User) => {
    if (user?.id === updatedUser.id) setUser(updatedUser);
    const updatedList = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAllUsers(updatedList);
    localStorage.setItem('cyberaudit_users', JSON.stringify(updatedList));
  };

  const handleDeleteUser = (id: string) => {
    const newList = allUsers.filter(u => u.id !== id);
    setAllUsers(newList);
    localStorage.setItem('cyberaudit_users', JSON.stringify(newList));
    // Si l'utilisateur supprimé est celui connecté, on déconnecte
    if (user?.id === id) handleLogout();
  };

  const toggleTheme = () => setIsDark(!isDark);

  if (!user) return <AuthView onLogin={handleLogin} isDark={isDark} />;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        if (user.role === UserRole.ADMIN) return <AdminDashboard />;
        if (user.role === UserRole.CHEF) return <ChefDashboard />;
        if (user.role === UserRole.AUDITOR) return <AuditorDashboard />;
        if (user.role === UserRole.CLIENT) return <ClientDashboard />;
        return <div className="p-10">Rôle non identifié</div>;
      case 'admin-portal':
        return <AdminPortal />;
      case 'users':
        return <UsersView users={allUsers} onAddUser={() => {}} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} isDark={isDark} />;
      case 'auditor-clients':
        return <AuditorClientsView auditor={user} allUsers={allUsers} onSelectClient={() => setActiveView('reports')} isDark={isDark} />;
      case 'reports':
        if (user.role === UserRole.AUDITOR) return <AuditorReportWorkspace user={user} isDark={isDark} />;
        return <div className="p-10 text-center">Utilisez le menu spécifique à votre rôle.</div>;
      case 'validation':
        return (
           <div className="space-y-8 animate-in fade-in duration-500">
             <div>
               <h2 className="text-3xl font-black text-slate-800 dark:text-white">Validation & Supervision</h2>
               <p className="text-slate-500 dark:text-slate-400 font-medium">Contrôlez et validez les rapports avant livraison client.</p>
             </div>
             <ReportView 
               data={{
                 clientName: 'Enterprise Corp',
                 date: new Date().toLocaleDateString('fr-FR'),
                 version: '1.0.4',
                 responsible: 'Alice Auditor',
                 vulns: vulns,
                 hosts: mockHosts,
                 overallScore: 78,
                 grade: 'B',
                 executiveSummary: summary
               }} 
               user={user} 
               isDark={isDark} 
             />
           </div>
        );
      case 'team':
        return <TeamView chef={user} allUsers={allUsers} isDark={isDark} />;
      case 'client-reports':
        return <ClientReportsView />;
      case 'notifications':
        return <NotificationsView notifications={notifications} onMarkAllAsRead={() => {}} onClearAll={() => {}} isDark={isDark} />;
      case 'settings':
        return <SettingsView user={user} onUpdateUser={handleUpdateUser} isDark={isDark} />;
      default:
        return <div className="p-10 text-center dark:text-white uppercase font-black">Section en développement...</div>;
    }
  };

  return (
    <Layout 
      user={user} 
      activeView={activeView} 
      setActiveView={setActiveView}
      onLogout={handleLogout}
      unreadNotifications={unreadCount}
      themeToggle={<button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
