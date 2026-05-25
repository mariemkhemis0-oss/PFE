import React, { useState, useEffect } from 'react';
import './shieldops.css';
import './theme.css';
import Layout from './components/Layout';
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
import CampaignSupervision from './views/CampaignSupervision';
import AuditorDashboard from './views/AuditorDashboard';
import ClientDashboard from './views/ClientDashboard';
import ClientReportsView from './views/ClientReportsView';
import ValidationView from './views/ValidationView';
import CVELibraryView from './views/CVELibraryView';
import ChefValidationView from './views/ChefValidationView';
import AuditorReportsListView from './views/AuditorReportsListView';
import ChatView from './views/ChatView';
import { User, UserRole, Vulnerability, Severity, Notification } from './types';
import { mockVulns } from './mockData';
import { Moon, Sun } from 'lucide-react';
import { usersAPI, vulnerabilitiesAPI, notificationsAPI } from './services/apiService';
import { AuditProvider } from './context/AuditContext';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [vulns, setVulns] = useState<Vulnerability[]>(mockVulns);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const userId = parsedUser._id || parsedUser.id;
        const userTheme = localStorage.getItem(`theme_${userId}`);
        if (userTheme !== null) return userTheme === 'dark';
      } catch (e) {}
    }
    const globalTheme = localStorage.getItem('global_theme');
    return globalTheme !== null ? globalTheme === 'dark' : true;
  });

  // Charger le thème de l'utilisateur à la connexion
  useEffect(() => {
    if (user) {
      const userId = (user as any)._id || user.id;
      const userTheme = localStorage.getItem(`theme_${userId}`);
      if (userTheme !== null) {
        setIsDark(userTheme === 'dark');
      }
    }
  }, [user]);

  // Sync dark class to <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSetIsDark = (newDark: boolean) => {
    setIsDark(newDark);
    if (user) {
      const userId = (user as any)._id || user.id;
      localStorage.setItem(`theme_${userId}`, newDark ? 'dark' : 'light');
    } else {
      localStorage.setItem('global_theme', newDark ? 'dark' : 'light');
    }
  };

// REMPLACE le useEffect unique par deux useEffects séparés :

// 1 — Charge users et vulns uniquement pour les rôles non-CLIENT
useEffect(() => {
  const currentRole = (user?.role || '').toUpperCase();

  // Les CLIENTs n'ont pas accès à /api/users ni /api/vulnerabilities → évite le toast 403
  if (!user || currentRole === 'CLIENT') {
    setAllUsers([]);
    return;
  }

  const loadData = async () => {
    try {
      const usersData = await usersAPI.getAll();
      setAllUsers(usersData);
      const vulnsData = await vulnerabilitiesAPI.getAll();
      setVulns(vulnsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setAllUsers([]);
    }
  };
  loadData();

  const handleGlobalUpdate = () => loadData();
  window.addEventListener('cyberaudit_data_updated', handleGlobalUpdate);
  window.addEventListener('storage', handleGlobalUpdate);
  return () => {
    window.removeEventListener('cyberaudit_data_updated', handleGlobalUpdate);
    window.removeEventListener('storage', handleGlobalUpdate);
  };
}, [user]); // ← se relance à chaque changement de user (login/logout)

// 2 — Charge les notifs UNIQUEMENT pour le user connecté
useEffect(() => {
  if (!user) return;

  const userId = (user as any)._id || user.id;
  if (!userId) return;

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:5000/api/notifications?userId=${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur notifs:', error);
      setNotifications([]);
    }
  };

  loadNotifications();

  // Rafraîchit toutes les 30 secondes
  const interval = setInterval(loadNotifications, 30000);
  return () => clearInterval(interval);

}, [user]); // ← dépend de user : se relance à chaque login/logout

  const handleLogin = (u: User) => {
    u.role = u.role?.toUpperCase() as UserRole;
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u)); // ← clé unifiée 'user'
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setChatTarget(null);
    localStorage.removeItem('user'); // ← clé unifiée 'user'
    localStorage.removeItem('token'); // Remove the token
    localStorage.removeItem('activeScanId'); // Clear active scan
  };

  const handleUpdateUser = (updatedUser: User) => {
    // Comparaison avec _id MongoDB ET id frontend
    const isSameUser =
      (user as any)?._id === (updatedUser as any)?._id ||
      user?.id === updatedUser.id;

    if (isSameUser) {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser)); // ← persiste immédiatement
    }

    setAllUsers(prev =>
      prev.map(u =>
        (u as any)._id === (updatedUser as any)._id || u.id === updatedUser.id
          ? updatedUser
          : u
      )
    );

    // Sync backend optionnel (ne bloque pas l'UI)
    const userId = (updatedUser as any)._id || updatedUser.id;
    if (userId) {
      usersAPI.update(userId, updatedUser).catch(err =>
        console.error('Erreur sync backend:', err)
      );
    }
  };

  const handleDeleteUser = (id: string) => {
    setAllUsers(allUsers.filter(u => u.id !== id));
    usersAPI.delete(id).catch(err => console.error(err));
    if (user?.id === id) handleLogout();
  };

  const toggleTheme = () => handleSetIsDark(!isDark);

  // Show AuthView if user is not logged in OR if there's a reset token in URL
  const hasResetToken = new URLSearchParams(window.location.search).has('token');
  if (!user || hasResetToken) return <AuthView onLogin={handleLogin} isDark={isDark} />;

const unreadCount = notifications.filter(n => !n.isRead && !(n as any).read).length;

  const handleNavigate = (view: string, data?: any) => {
    if (view === 'messages' && data?.targetUser) {
      setChatTarget(data.targetUser);
    } else if (view !== 'messages') {
      setChatTarget(null);
    }
    setActiveView(view);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        if (user.role === UserRole.ADMIN) return <AdminDashboard onNavigate={handleNavigate} user={user} />;
        if (user.role === UserRole.CHEF) return <ChefDashboard onNavigate={handleNavigate} user={user} />;
        if (user.role === UserRole.AUDITOR) return <AuditorDashboard onNavigate={handleNavigate} user={user} />;
        if (user.role === UserRole.CLIENT) return <ClientDashboard onNavigate={handleNavigate} user={user} />;
        return <AdminDashboard onNavigate={handleNavigate} user={user} />;
      case 'campaigns':
        return <CampaignSupervision onNavigate={handleNavigate} user={user} />;
      case 'admin-portal':
        return <AdminPortal isDark={isDark} />;
      case 'users':
        return <UsersView users={allUsers} onAddUser={() => {}} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} isDark={isDark} />;
      case 'auditor-clients':
        return <AuditorClientsView auditor={user} allUsers={allUsers} onSelectClient={() => handleNavigate('reports')} onNavigate={handleNavigate} isDark={isDark} />;
      case 'reports':
        return <AuditorReportWorkspace user={user} isDark={isDark} />;
      case 'cve-library':
        return <CVELibraryView />;
      case 'validation':
        if (user.role === UserRole.CHEF) {
          return <ChefValidationView isDark={isDark} user={user} />;
        }
        return (
          <ValidationView
            user={user}
            data={{
              clientName: 'SOCIÉTÉ GÉNÉRALE TN',
              organization: 'DSI / Infrastructure',
              ref: 'AUD-2024-0042',
              vulns: vulns
            }}
          />
        );
      case 'team':
        return <TeamView chef={user} allUsers={allUsers} isDark={isDark} onNavigate={handleNavigate} />;
      case 'auditor-reports':
        return <AuditorReportsListView user={user} isDark={isDark} />;
      case 'client-reports':
        return <ClientReportsView user={user} />;
      case 'messages':
        return <ChatView user={user} isDark={isDark} targetUser={chatTarget} />;
      case 'notifications':
        return <NotificationsView notifications={notifications} onMarkAllAsRead={() => {}} onClearAll={() => {}} onNavigate={handleNavigate} isDark={isDark} user={user}/>;
      case 'settings':
        return <SettingsView user={user} onUpdateUser={handleUpdateUser} isDark={isDark} setIsDark={handleSetIsDark} />;
      default:
        return <AdminDashboard onNavigate={handleNavigate} user={user} />;
    }
  };

  return (
    <AuditProvider>
      <div className={isDark ? 'dark' : ''}>
        <Layout
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          unreadNotifications={unreadCount}
          isDark={isDark}
          themeToggle={
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {isDark ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
            </button>
          }
        >
          {renderContent()}
        </Layout>
      </div>
    </AuditProvider>
  );
};

export default App;