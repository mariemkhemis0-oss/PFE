import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Clock, Zap, CheckCircle2, FileText,
  UserIcon, ChevronRight, Building2, XCircle, RefreshCw,
  AlertTriangle, Send
} from 'lucide-react';
import ScheduledScansManager from '../components/ScheduledScansManager';

interface AuditorDashboardProps {
  onNavigate?: (view: string) => void;
  user?: any;
  isDark?: boolean;
}

const AuditorDashboard: React.FC<AuditorDashboardProps> = ({ onNavigate, user, isDark }) => {
  const [stats, setStats] = useState({ total: 0, inReview: 0, published: 0, rejected: 0, clients: 0 });
  const [myReports, setMyReports] = useState<any[]>([]);
  const [myClients, setMyClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const auditorId = (user as any)._id || user.id;
      const token = localStorage.getItem('token');
      const authHeaders = { 'Authorization': `Bearer ${token}` };
      const [statsRes, reportsRes, usersRes] = await Promise.all([
        fetch(`http://localhost:5000/api/reports/stats?role=AUDITOR&userId=${auditorId}`, { headers: authHeaders }),
        fetch(`http://localhost:5000/api/reports/auditor/${auditorId}`, { headers: authHeaders }),
        fetch(`http://localhost:5000/api/users`, { headers: authHeaders }),
      ]);
      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();
      const usersData = await usersRes.json();

      // Calcul dynamique des compteurs depuis les vraies données
      const reports = Array.isArray(reportsData) ? reportsData : [];
      setStats({
        total: reports.length,
        inReview: reports.filter((r: any) => r.status === 'IN_REVIEW').length,
        published: reports.filter((r: any) => r.status === 'PUBLISHED').length,
        rejected: reports.filter((r: any) => r.status === 'REJECTED').length,
        clients: statsData.clients || 0,
      });
      setMyReports(reports.slice(0, 5));

      const clients = Array.isArray(usersData)
        ? usersData.filter((u: any) =>
            u.auditorId?.toString() === auditorId?.toString() &&
            u.role?.toUpperCase() === 'CLIENT'
          )
        : [];
      setMyClients(clients);
    } catch (e) {
      console.error('Erreur chargement auditeur:', e);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (reportId: string) => {
    if (!window.confirm('Soumettre ce rapport au Chef d\'Audit ?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        alert('✅ Rapport soumis au Chef d\'Audit !');
        fetchData();
      } else {
        alert('❌ Erreur lors de la soumission');
      }
    } catch (e) {
      alert('❌ Erreur réseau');
    }
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      'DRAFT':      { label: 'Brouillon',    cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
      'IN_REVIEW':  { label: 'En validation', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      'PUBLISHED':  { label: 'Publié',        cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      'REJECTED':   { label: 'Rejeté',        cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
      'APPROVED':   { label: 'Approuvé',      cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    };
    return map[status] || { label: status, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">

      {/* WELCOME BANNER */}
      <div className="welcome-banner rounded-[40px] p-10 dark:text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tighter italic uppercase">Bonjour, {user?.name || 'Auditeur'} !</h1>
          <p className="text-slate-700 dark:text-blue-100 text-sm font-medium mt-2 italic">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} — Production opérationnelle.
          </p>
        </div>
        <div className="relative z-10 flex gap-4 flex-wrap">
          <div className="bg-white/10 border border-white/10 px-6 py-3 rounded-[20px]">
            <span className="text-indigo-300 text-[8px] font-black uppercase tracking-widest block">En validation</span>
            <span className="font-black text-xl italic text-amber-400">{String(stats.inReview).padStart(2, '0')}</span>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 rounded-[20px]">
            <span className="text-emerald-400 text-[8px] font-black uppercase tracking-widest block">Publiés</span>
            <span className="font-black text-xl italic text-emerald-400">{String(stats.published).padStart(2, '0')}</span>
          </div>
          {stats.rejected > 0 && (
            <div className="bg-rose-500/20 border border-rose-500/30 px-6 py-3 rounded-[20px]">
              <span className="text-rose-400 text-[8px] font-black uppercase tracking-widest block">Rejetés</span>
              <span className="font-black text-xl italic text-rose-400">{String(stats.rejected).padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI GRID — compteurs dynamiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Rapports Actifs', val: stats.total,    icon: FileText,    color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
          { label: 'En Validation',   val: stats.inReview,  icon: Clock,       color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Publiés',         val: stats.published, icon: CheckCircle2,color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Mes Clients',     val: stats.clients,   icon: Building2,   color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/20 transition-all group">
            <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center ${kpi.color} mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
              <kpi.icon size={24} />
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white italic tracking-tighter leading-none mb-1">
              {loading ? '—' : String(kpi.val).padStart(2, '0')}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* MES CLIENTS ASSIGNÉS */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <Building2 size={20} className="text-indigo-500" /> Mes Clients Assignés
            </h3>
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 italic">Chargement...</div>
          ) : myClients.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Building2 size={32} className="mx-auto text-slate-300" />
              <p className="text-slate-400 font-bold uppercase italic tracking-widest text-sm">Aucun client assigné pour l'instant.</p>
              <p className="text-slate-400 text-xs italic">L'administrateur vous assignera des clients prochainement.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myClients.slice(0, 4).map((client: any) => (
                <div key={(client as any)._id || client.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                      {client.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 dark:text-white uppercase italic tracking-tight text-sm">{client.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client.company || client.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigate?.('reports')}
            className="mt-6 w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Zap size={18} /> NOUVEAU RAPPORT XML
          </button>
        </div>

        {/* HISTORIQUE DES RAPPORTS */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase italic tracking-tighter">
            <ClipboardList size={20} className="text-indigo-400" /> Mes Rapports
          </h3>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 italic">Chargement...</div>
          ) : myReports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-8">
              <FileText size={32} className="text-slate-600" />
              <p className="text-slate-500 font-bold uppercase italic text-xs tracking-widest">Aucun rapport</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {myReports.map((report: any) => {
                const st = getStatusStyle(report.status);
                const isRejected = report.status === 'REJECTED';
                return (
                  <div key={(report as any)._id || report.id} className={`p-4 rounded-2xl border transition-all ${isRejected ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-black text-white uppercase italic tracking-tight text-sm leading-tight truncate flex-1">
                        {report.clientCompany || report.title || 'Rapport'}
                      </p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    {/* Commentaire de rejet visible en rouge */}
                    {isRejected && report.rejectionComment && (
                      <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Motif du rejet :</p>
                        <p className="text-[10px] text-rose-300 italic leading-relaxed">"{report.rejectionComment}"</p>
                      </div>
                    )}
                    {/* Bouton soumettre pour BROUILLON et REJETÉ */}
                    {(report.status === 'DRAFT' || report.status === 'REJECTED') && (
                      <button
                        onClick={() => submitReport((report as any)._id || report.id)}
                        className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Send size={11} /> Soumettre au Chef
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => onNavigate?.('auditor-reports')}
            className="mt-6 w-full py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl active:scale-95"
          >
            <FileText size={14} /> VOIR TOUS MES AUDITS
          </button>
        </div>
      </div>

      {/* GESTION DES SCANS PLANIFIÉS */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-10">
        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
            Mes Scans Planifiés
          </h3>
        </div>
        <div className="p-8">
          <ScheduledScansManager auditorId={(user as any)?._id || user?.id} />
        </div>
      </div>
    </div>
  );
};

export default AuditorDashboard;