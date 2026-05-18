import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Search, ArrowRight, RefreshCw,
  CheckCircle2, Clock, XCircle, Play, FileText, Eye
} from 'lucide-react';

interface CampaignSupervisionProps {
  onNavigate?: (view: string) => void;
  user?: any;
}

const CampaignSupervision: React.FC<CampaignSupervisionProps> = ({ onNavigate, user }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (user) fetchReports();
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const chefId = (user as any)._id || user.id;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reports/chef/${chefId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { label: string; icon: any; cls: string; dot: string }> = {
      'DRAFT':        { label: 'In Progress',  icon: Play,       cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    dot: 'bg-blue-400' },
      'PENDING_LEAD': { label: 'Validating',   icon: Clock,      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  dot: 'bg-amber-400 animate-pulse' },
      'IN_REVIEW':    { label: 'Validating',   icon: Clock,      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  dot: 'bg-amber-400 animate-pulse' },
      'REJECTED':     { label: 'Rejected',     icon: XCircle,    cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',     dot: 'bg-rose-400' },
      'PUBLISHED':    { label: 'Completed',    icon: CheckCircle2,cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
      'COMPLETED':    { label: 'Completed',    icon: CheckCircle2,cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
      'APPROVED':     { label: 'Approved',     icon: CheckCircle2,cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20',    dot: 'bg-teal-400' },
    };
    return map[status] || { label: status, icon: FileText, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400' };
  };

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      (r.clientCompany || r.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.clientName || '').toLowerCase().includes(search.toLowerCase());
    let matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    // Grouper PENDING_LEAD avec IN_REVIEW
    if (filterStatus === 'IN_REVIEW' && r.status === 'PENDING_LEAD') matchStatus = true;
    // Grouper COMPLETED avec PUBLISHED
    if (filterStatus === 'PUBLISHED' && r.status === 'COMPLETED') matchStatus = true;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    ALL: reports.length,
    DRAFT: reports.filter(r => r.status === 'DRAFT').length,
    IN_REVIEW: reports.filter(r => ['IN_REVIEW', 'PENDING_LEAD'].includes(r.status)).length,
    REJECTED: reports.filter(r => r.status === 'REJECTED').length,
    PUBLISHED: reports.filter(r => ['PUBLISHED', 'COMPLETED'].includes(r.status)).length,
  };

  const completionRate = reports.length > 0
    ? Math.round((statusCounts.PUBLISHED / reports.length) * 100)
    : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Liste d'Audits</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Suivi en temps réel de l'état d'avancement des audits par client.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchReports} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all">
            <RefreshCw size={18} />
          </button>
          <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            statusCounts.IN_REVIEW > 0
              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
              : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
          }`}>
            {statusCounts.IN_REVIEW} campagne{statusCounts.IN_REVIEW > 1 ? 's' : ''} actives
          </span>
        </div>
      </div>

      {/* FILTRES PAR STATUT */}
      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'ALL',       label: `Tous (${statusCounts.ALL})` },
          { key: 'DRAFT',     label: `In Progress (${statusCounts.DRAFT})` },
          { key: 'IN_REVIEW', label: `Validating (${statusCounts.IN_REVIEW})` },
          { key: 'REJECTED',  label: `Rejected (${statusCounts.REJECTED})` },
          { key: 'PUBLISHED', label: `Completed (${statusCounts.PUBLISHED})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
              filterStatus === f.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher audit ou client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white"
        />
      </div>

      {/* TABLE DES AUDITS */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-slate-400 italic">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <ClipboardList size={40} className="mx-auto text-slate-300" />
            <p className="text-slate-400 font-bold uppercase italic tracking-widest">Aucun audit trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((report: any) => {
              const st = getStatusConfig(report.status);
              const StatusIcon = st.icon;
              const isValidating = report.status === 'IN_REVIEW';

              return (
                <div key={(report as any)._id || report.id} className="p-8 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    {/* Icône statut */}
                    <div className={`p-3 rounded-2xl border ${st.cls}`}>
                      <StatusIcon size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h4 className="font-black text-slate-800 dark:text-white uppercase italic tracking-tight text-base truncate">
                          {report.clientCompany || report.title || 'Audit'}
                        </h4>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {report.ref || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          Client: {report.clientName || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                          {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                        {report.score && (
                          <p className="text-xs font-black text-indigo-500 uppercase">
                            Score: {report.score}/100
                          </p>
                        )}
                      </div>
                      {/* Commentaire rejet visible */}
                      {report.status === 'REJECTED' && report.rejectionComment && (
                        <div className="mt-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-xl inline-block">
                          <p className="text-[10px] text-rose-500 font-bold italic">"{report.rejectionComment}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 ml-6">
                    {/* Badge statut */}
                    <div className="hidden md:flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${st.dot}`}></div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Bouton action selon statut */}
                    {isValidating ? (
                      <button
                        onClick={() => onNavigate?.('validation')}
                        className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg flex items-center gap-2 active:scale-95"
                      >
                        <Eye size={14} /> VALIDER
                      </button>
                    ) : (
                      <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-xl transition-all">
                        <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TAUX DE COMPLÉTION */}
      {!loading && reports.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Taux de Complétion</h3>
              <p className="text-slate-400 text-sm font-medium italic mt-1">
                {statusCounts.PUBLISHED} audit{statusCounts.PUBLISHED > 1 ? 's' : ''} publié{statusCounts.PUBLISHED > 1 ? 's' : ''} sur {reports.length} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-4xl font-black text-indigo-500 italic">{completionRate}%</p>
              <div className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('validation')}
              className="px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center gap-2 active:scale-95"
            >
              VOIR VALIDATION <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignSupervision;