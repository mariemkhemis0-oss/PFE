import React, { useState } from 'react';
import { 
  Bell, AlertCircle, CheckCircle2, Clock, 
  Trash2, Zap, UserPlus, X, Shield, CheckSquare, 
  ChevronRight, ArrowRight
} from 'lucide-react';

interface NotificationsViewProps {
  notifications: any[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigate: (view: string) => void;
  isDark: boolean;
  user?: any;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ 
  notifications, onMarkAllAsRead, onClearAll, onNavigate, isDark, user 
}) => {
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [localNotifs, setLocalNotifs] = useState<any[]>(notifications);

  // Sync quand les props changent
  React.useEffect(() => {
    setLocalNotifs(notifications);
  }, [notifications]);

  // Compatibilité MongoDB (_id, read, createdAt) ET ancien format (id, isRead, timestamp)
  const getId = (n: any) => n._id || n.id;
  const isRead = (n: any) => n.read ?? n.isRead ?? false;
  const getTimestamp = (n: any) => n.createdAt || n.timestamp;
  const getType = (n: any) => n.type || 'INFO';

  const getIcon = (type: string, size: number = 20) => {
    switch (type) {
      case 'INFO': return <div className="p-3.5 bg-blue-50 dark:bg-blue-500/5 text-blue-500 rounded-full border border-blue-100/50 dark:border-blue-500/10"><UserPlus size={size} /></div>;
      case 'WARNING': return <div className="p-3.5 bg-amber-50 dark:bg-amber-500/5 text-amber-500 rounded-full border border-amber-100/50 dark:border-amber-500/10"><Zap size={size} /></div>;
      case 'ERROR': case 'DANGER': return <div className="p-3.5 bg-rose-50 dark:bg-rose-500/5 text-rose-500 rounded-full border border-rose-100/50 dark:border-rose-500/10"><AlertCircle size={size} /></div>;
      case 'SUCCESS': return <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-500 rounded-full border border-emerald-100/50 dark:border-emerald-500/10"><CheckCircle2 size={size} /></div>;
      default: return <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-full"><Bell size={size} /></div>;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'INFO': return 'bg-blue-500';
      case 'WARNING': return 'bg-amber-500';
      case 'ERROR': case 'DANGER': return 'bg-rose-500';
      case 'SUCCESS': return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `IL Y A ${seconds}S`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `IL Y A ${minutes}M`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `IL Y A ${hours}H`;
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase();
  };

  const handleMarkAllAsRead = async () => {
    const userId = (user as any)?._id || user?.id;
    if (userId) {
      try {
        await fetch('http://localhost:5000/api/notifications/mark-all-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ userId }),
        });
        setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })));
      } catch (e) {
        console.error(e);
      }
    }
    onMarkAllAsRead();
  };

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notifId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ read: true }),
      });
      setLocalNotifs(prev => prev.map(n => 
        (n._id || n.id) === notifId ? { ...n, read: true } : n
      ));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    const userId = (user as any)?._id || user?.id;
    if (userId && window.confirm('Effacer toutes les notifications ?')) {
      try {
        // Supprime toutes les notifs de cet utilisateur
        for (const n of localNotifs) {
          await fetch(`http://localhost:5000/api/notifications/${getId(n)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          });
        }
        setLocalNotifs([]);
      } catch (e) {
        console.error(e);
      }
    }
    onClearAll();
  };

  const handleRequiredAction = () => {
    if (!selectedNotif) return;
    const actionUrl = selectedNotif.actionUrl;
    if (actionUrl) {
      setSelectedNotif(null);
      onNavigate(actionUrl);
      return;
    }
    // Fallback si pas d'actionUrl
    const title = selectedNotif.title.toLowerCase();
    let targetView = 'dashboard';
    if (title.includes('rapport') || title.includes('rejet') || title.includes('certif')) targetView = 'reports';
    else if (title.includes('valida')) targetView = 'validation';
    else if (title.includes('client')) targetView = 'auditor-clients';
    else if (title.includes('admin') || title.includes('inscription')) targetView = 'admin-portal';
    else if (title.includes('profil') || title.includes('compte')) targetView = 'settings';
    setSelectedNotif(null);
    onNavigate(targetView);
  };

  const unreadCount = localNotifs.filter(n => !isRead(n)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">

      {/* HEADER */}
      <div className="flex flex-col items-center text-center space-y-2 relative">
        <div className="w-full flex justify-end absolute top-0 right-0">
          <button
            onClick={handleMarkAllAsRead}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] hover:opacity-70 transition-all flex items-center gap-2"
          >
            <CheckSquare size={14} /> Tout marquer comme lu
          </button>
        </div>
        <div className="pt-4">
          <h2 className="text-[32px] font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
            Centre de Notifications
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">
            Surveillance en temps réel du flux système
          </p>
          {unreadCount > 0 && (
            <span className="inline-block mt-3 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* LISTE */}
      <div className="bg-white dark:bg-slate-900/50 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {localNotifs.length === 0 ? (
          <div className="p-32 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-800">
              <Bell size={40} />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Aucune notification en attente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {localNotifs.map((notif) => (
              <div
                key={getId(notif)}
                onClick={() => { setSelectedNotif(notif); handleMarkAsRead(getId(notif)); }}
                className={`relative p-10 flex gap-8 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-all group cursor-pointer ${!isRead(notif) ? 'bg-indigo-500/[0.02]' : ''}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(getType(notif))} opacity-80`}></div>
                <div className="shrink-0">{getIcon(getType(notif))}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="font-black text-slate-800 dark:text-white uppercase italic tracking-tight text-lg leading-snug">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap pt-1.5">
                      {getTimeAgo(getTimestamp(notif))}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4 pr-4 line-clamp-2">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      Consulter <ChevronRight size={12} />
                    </span>
                    {!isRead(notif) && (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {localNotifs.length > 0 && (
          <div className="p-8 bg-slate-50/30 dark:bg-slate-950/20 flex justify-center border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleClearAll}
              className="flex items-center gap-3 px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
            >
              <Trash2 size={16} /> Effacer toutes les notifications
            </button>
          </div>
        )}
      </div>

      {/* MODALE DÉTAIL */}
      {selectedNotif && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[60px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">

            <div className="p-12 pb-10 flex flex-col items-center text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-2 ${getStatusColor(getType(selectedNotif))}`}></div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="absolute top-8 right-8 p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                <X size={20} />
              </button>
              <div className="mb-8">{getIcon(getType(selectedNotif), 32)}</div>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-tight mb-3">
                {selectedNotif.title}
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1.5"><Clock size={14} /> {getTimeAgo(getTimestamp(selectedNotif))}</span>
                <span>|</span>
                <span className="flex items-center gap-1.5"><Shield size={14} className="text-indigo-500" /> SOURCE SÉCURISÉE</span>
              </div>
            </div>

            <div className="px-12 pb-12 space-y-8">
              <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-[40px] border border-slate-100 dark:border-slate-800/50">
                <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                  "{selectedNotif.message}"
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="flex-1 py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200"
                >
                  Fermer
                </button>
                {selectedNotif.actionUrl && (
                  <button
                    onClick={handleRequiredAction}
                    className="flex-[2] py-5 bg-indigo-600 dark:bg-indigo-700 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                  >
                    Voir maintenant <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50/50 dark:bg-slate-950/30 flex justify-center border-t border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">
                  ID: {getId(selectedNotif)?.toString().substring(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;