import React, { useState, useEffect } from 'react';
import { 
  Users, ClipboardList, Search, ShieldAlert, Activity, Server,
  CheckCircle2, Terminal, Zap, AlertTriangle,
  ChevronRight, X, ShieldCheck, RefreshCw, UserCheck, Loader2, Star, MessageSquare
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate?: (view: string) => void;
  user?: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, user }) => {
  const [isUrgentActionsOpen, setIsUrgentActionsOpen] = useState(false);
  const [stats, setStats] = useState({ users: 0, reports: 0, vulnerabilities: 0, roleRequests: 0 });
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const authHeaders = { 'Authorization': `Bearer ${token}` };
        const [usersRes, reportsRes, vulnsRes, reqsRes, reviewsRes] = await Promise.all([
          fetch('http://localhost:5000/api/users', { headers: authHeaders }),
          fetch('http://localhost:5000/api/reports', { headers: authHeaders }),
          fetch('http://localhost:5000/api/vulnerabilities', { headers: authHeaders }),
          fetch('http://localhost:5000/api/role-requests', { headers: authHeaders }),
          fetch('http://localhost:5000/api/reviews', { headers: authHeaders })
        ]);
        const [users, reports, vulns, reqs, revs] = await Promise.all([
          usersRes.json(), reportsRes.json(), vulnsRes.json(), reqsRes.json(), reviewsRes.json()
        ]);
        setStats({
          users: Array.isArray(users) ? users.length : 0,
          reports: Array.isArray(reports) ? reports.length : 0,
          vulnerabilities: Array.isArray(vulns) ? vulns.length : 0,
          roleRequests: Array.isArray(reqs) ? reqs.length : 0,
        });
        setRoleRequests(Array.isArray(reqs) ? reqs.slice(0, 3) : []);
        setReviews(Array.isArray(revs) ? revs.slice(0, 5) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const urgentActions = [
    { id: 1, type: 'DEMANDES', title: `${stats.roleRequests} demande(s) en attente`, desc: 'Auditeurs/Chefs à approuver.', icon: UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-50', action: () => onNavigate?.('admin-portal') },
    { id: 2, type: 'SÉCURITÉ', title: 'OpenVAS v24.1', desc: 'Vérifier les correctifs critiques GVM.', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50', action: () => {} },
    { id: 3, type: 'MAINTENANCE', title: 'Backup Cloud', desc: 'Lancement manuel requis.', icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50', action: () => {} },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      
      {/* WELCOME */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="welcome-banner lg:col-span-2 rounded-[40px] p-10 dark:text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[280px]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">
              Bonjour, {user?.name || 'Admin'} !
            </h1>
            <p className="text-slate-700 dark:text-blue-100 text-base max-w-xl font-medium leading-relaxed">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} — Tout est opérationnel sur SecurAudit Pro.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-[20px] flex flex-col gap-0.5">
              <span className="text-indigo-300 text-[8px] font-black uppercase tracking-widest">Utilisateurs</span>
              <span className="font-black text-xl italic">{loading ? '...' : stats.users}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-6 py-3 rounded-[20px] flex flex-col gap-0.5">
              <span className="text-emerald-400 text-[8px] font-black uppercase tracking-widest">Rapports</span>
              <div className="flex items-center gap-2 font-black text-xl italic text-emerald-400">
                {loading ? '...' : stats.reports}
              </div>
            </div>
            {stats.roleRequests > 0 && (
              <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 px-6 py-3 rounded-[20px] flex flex-col gap-0.5 cursor-pointer" onClick={() => onNavigate?.('admin-portal')}>
                <span className="text-rose-400 text-[8px] font-black uppercase tracking-widest">Demandes</span>
                <div className="flex items-center gap-2 font-black text-xl italic text-rose-400 animate-pulse">
                  {stats.roleRequests} en attente
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Infrastructure</h3>
          <div className="space-y-3">
            {[
              { label: 'Serveurs', icon: Server, status: 'EN LIGNE' },
              { label: 'Engine GVM', icon: Terminal, status: 'ACTIF' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-[22px] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <item.icon className="text-slate-400" size={16} />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{item.status}</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 flex justify-center py-10"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
        ) : [
          { label: 'Utilisateurs', val: stats.users.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', nav: 'admin-portal' },
          { label: 'Rapports', val: stats.reports.toString(), icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50', nav: 'admin-portal' },
          { label: 'Vulnérabilités', val: stats.vulnerabilities.toString(), icon: Search, color: 'text-emerald-600', bg: 'bg-emerald-50', nav: null },
          { label: 'Demandes Rôles', val: stats.roleRequests.toString(), icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', nav: 'admin-portal' },
        ].map((kpi, i) => (
          <div key={i} onClick={() => kpi.nav && onNavigate?.(kpi.nav)} className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-indigo-500/20 transition-all ${kpi.nav ? 'cursor-pointer' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 ${kpi.bg} dark:bg-slate-800 ${kpi.color} rounded-xl shadow-sm group-hover:scale-110 transition-transform`}><kpi.icon size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter leading-none">{kpi.val}</p>
              </div>
            </div>
            {kpi.nav && <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />}
          </div>
        ))}
      </div>

      {/* DEMANDES DE RÔLES */}
      {roleRequests.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8 px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Demandes d'Accès en Attente</h3>
            <div className="px-3 py-1 bg-rose-500 text-white rounded-full text-[9px] font-black shadow-[0_5px_15px_rgba(244,63,94,0.3)] uppercase animate-pulse">{roleRequests.length} Urgent</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
            {roleRequests.map((req, i) => (
              <div key={i} onClick={() => onNavigate?.('admin-portal')} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950 rounded-[28px] border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {req.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{req.name}</p>
                    <p className="text-[9px] font-bold text-indigo-400 italic">{req.requestedRole}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate?.('admin-portal')}
            className="mt-8 w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-700 shadow-xl active:scale-[0.98] transition-all"
          >
            TRAITER MAINTENANT
          </button>
        </div>
      )}

      {/* AVIS ET SATISFACTION */}
      {reviews.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm mt-8">
          <div className="flex justify-between items-center mb-8 px-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic flex items-center gap-2">
              <Star size={14} className="text-amber-500" /> Avis & Satisfaction Client
            </h3>
          </div>
          <div className="space-y-4 px-2">
            {reviews.map((review, i) => (
              <div key={i} className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[28px] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{review.organizationName}</span>
                    <span className="text-[9px] font-bold text-slate-400">({review.clientName})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 italic font-medium text-sm">"{review.comment || 'Sans commentaire'}"</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={16} fill={s <= review.rating ? "currentColor" : "none"} strokeWidth={s <= review.rating ? 0 : 2} />
                    ))}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      {isUrgentActionsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[48px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Actions Requises</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Gouvernance active</p>
              </div>
              <button onClick={() => setIsUrgentActionsOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                <X size={20} className="text-slate-300" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              {urgentActions.map((action) => (
                <div key={action.id} onClick={action.action} className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-6 group hover:border-indigo-500/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${action.bg} ${action.color} shadow-sm group-hover:scale-110 transition-transform`}>
                      <action.icon size={20} />
                    </div>
                    <div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${action.color}`}>{action.type}</span>
                      <h4 className="text-base font-black text-slate-800 dark:text-white uppercase italic tracking-tight leading-none">{action.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic">{action.desc}</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                    Exécuter
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;