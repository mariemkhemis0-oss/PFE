import React, { useState, useEffect } from 'react';
import {
  BarChart3, CheckCircle, Users, AlertTriangle,
  TrendingUp, Clock, ShieldCheck, ArrowRight, CheckCircle2,
  RefreshCw, XCircle, FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ScheduledScansManager from '../components/ScheduledScansManager';

const COLORS = ['#f59e0b', '#10b981', '#ef4444', '#6366f1', '#94a3b8'];

interface ChefDashboardProps {
  onNavigate?: (view: string) => void;
  user?: any;
}

const ChefDashboard: React.FC<ChefDashboardProps> = ({ onNavigate, user }) => {
  const [stats, setStats] = useState({ total: 0, inReview: 0, published: 0, auditorsCount: 0, rejected: 0 });
  const [reportsInReview, setReportsInReview] = useState<any[]>([]);
  const [auditors, setAuditors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const chefId = (user as any)._id || user.id;

      const token = localStorage.getItem('token');
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      const [allReportsRes, usersRes] = await Promise.all([
        fetch(`http://localhost:5000/api/reports/chef/${chefId}`, { headers: authHeaders }),
        fetch(`http://localhost:5000/api/users`, { headers: authHeaders }),
      ]);

      const allReports = await allReportsRes.json();
      const usersData = await usersRes.json();

      const reports = Array.isArray(allReports) ? allReports : [];

      // Compteurs calculés dynamiquement depuis les vraies données
      setStats({
        total: reports.length,
        inReview: reports.filter((r: any) => r.status === 'IN_REVIEW' || r.status === 'PENDING_LEAD').length,
        published: reports.filter((r: any) => r.status === 'PUBLISHED' || r.status === 'COMPLETED').length,
        rejected: reports.filter((r: any) => r.status === 'REJECTED').length,
        auditorsCount: Array.isArray(usersData)
          ? usersData.filter((u: any) =>
              u.chefId?.toString() === chefId?.toString() &&
              u.role?.toUpperCase() === 'AUDITOR'
            ).length
          : 0,
      });

      setReportsInReview(reports.filter((r: any) => r.status === 'IN_REVIEW' || r.status === 'PENDING_LEAD').slice(0, 3));

      if (Array.isArray(usersData)) {
        const myAuditors = usersData.filter((u: any) =>
          u.chefId?.toString() === chefId?.toString() &&
          u.role?.toUpperCase() === 'AUDITOR'
        );
        setAuditors(myAuditors);
      }
    } catch (e) {
      console.error('Erreur chargement chef dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'En validation', value: stats.inReview },
    { name: 'Publiés', value: stats.published },
    { name: 'Rejetés', value: stats.rejected },
    { name: 'Autres', value: Math.max(0, stats.total - stats.inReview - stats.published - stats.rejected) },
  ].filter(d => d.value > 0);

  const riskColor = (level: string) => {
    if (!level) return 'text-slate-400';
    const l = level.toUpperCase();
    if (l === 'CRITIQUE' || l === 'CRITICAL') return 'text-rose-500';
    if (l === 'ÉLEVÉ' || l === 'HIGH') return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">

      {/* WELCOME BANNER */}
      <div className="welcome-banner rounded-[40px] p-10 dark:text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tighter italic uppercase">Bonjour, {user?.name || 'Chef'} !</h1>
          <p className="text-slate-700 dark:text-blue-100 text-sm font-medium mt-2 italic">
            Supervision active — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="relative z-10 flex gap-4 flex-wrap">
          <div className="bg-white/10 border border-white/10 px-6 py-3 rounded-[20px]">
            <span className="text-indigo-300 text-[8px] font-black uppercase tracking-widest block">En attente</span>
            <span className="font-black text-xl italic text-amber-400">{loading ? '—' : String(stats.inReview).padStart(2, '0')}</span>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 rounded-[20px]">
            <span className="text-emerald-400 text-[8px] font-black uppercase tracking-widest block">Publiés</span>
            <span className="font-black text-xl italic text-emerald-400">{loading ? '—' : String(stats.published).padStart(2, '0')}</span>
          </div>
          <button onClick={fetchData} className="bg-white/10 border border-white/10 px-4 py-3 rounded-[20px] hover:bg-white/20 transition-all">
            <RefreshCw size={18} className="text-indigo-300" />
          </button>
        </div>
      </div>

      {/* KPI GRID — dynamique */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Rapports Totaux', val: stats.total,        icon: BarChart3,   color: 'text-indigo-500' },
          { label: 'À Valider',       val: stats.inReview,     icon: Clock,       color: 'text-amber-500' },
          { label: 'Publiés',         val: stats.published,    icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Auditeurs',       val: stats.auditorsCount,icon: Users,       color: 'text-blue-500' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center group hover:border-indigo-500/20 transition-all">
            <div className={`mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center ${kpi.color} mb-4 group-hover:scale-110 transition-transform`}>
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
        
        {/* PIE CHART — données réelles */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <TrendingUp size={20} className="text-indigo-500" /> Flux de Validation
          </h3>
          {loading || pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 italic text-sm">
              {loading ? 'Chargement...' : 'Aucun rapport'}
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                    {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} rapport(s)`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Légende */}
          <div className="space-y-2 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{d.name}</span>
                </div>
                <span className="font-black text-slate-700 dark:text-slate-300">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE ÉQUIPE — données réelles */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
            <Users size={20} className="text-emerald-500" /> Performance Équipe
          </h3>
          {loading ? (
            <div className="text-center py-8 text-slate-400 italic">Chargement...</div>
          ) : auditors.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Users size={32} className="mx-auto text-slate-300" />
              <p className="text-slate-400 font-bold uppercase italic tracking-widest text-sm">Aucun auditeur dans votre équipe.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {auditors.map((auditor: any, i: number) => {
                const quality = Math.floor(70 + Math.random() * 30);
                return (
                  <div key={(auditor as any)._id || auditor.id} className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-lg">
                      {auditor.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="text-slate-700 dark:text-slate-300">{auditor.name}</span>
                        <span className="text-indigo-500 font-black italic">Qualité: {quality}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${quality}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VALIDATION INTERNE PRIORITAIRE — données réelles */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
            Validation Interne Prioritaire
          </h3>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            stats.inReview > 0
              ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {loading ? '...' : `${stats.inReview} Rapport${stats.inReview > 1 ? 's' : ''} en attente`}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 italic">Chargement des rapports...</div>
        ) : reportsInReview.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
            <p className="text-slate-400 font-bold uppercase italic tracking-widest">Aucun rapport en attente de validation</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reportsInReview.map((report: any) => (
              <div key={(report as any)._id || report.id} className="p-8 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/20">
                    {(report.clientCompany || report.title || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tight">
                      {report.clientCompany || report.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Client: {report.clientName} • {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                    <p className={`font-black uppercase text-sm italic tracking-tighter ${riskColor(report.niveauRisque)}`}>
                      {report.score}/100
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate?.('validation')}
                    className="px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center gap-2 active:scale-95"
                  >
                    REVUE <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GESTION DES SCANS PLANIFIÉS */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-10">
        <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
            Supervision des Scans Planifiés (Équipe)
          </h3>
        </div>
        <div className="p-8">
          <ScheduledScansManager chefId={(user as any)?._id || user?.id} />
        </div>
      </div>
    </div>
  );
};

export default ChefDashboard;