import React, { useState, useEffect } from 'react';
import {
  FileText, Eye, X, Download, Loader2, RefreshCw,
  CheckCircle2, AlertTriangle, Clock, Send, ShieldCheck,
  XCircle, Filter
} from 'lucide-react';

interface AuditorReportsListViewProps {
  user: any;
  isDark: boolean;
}

const AuditorReportsListView: React.FC<AuditorReportsListViewProps> = ({ user, isDark }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'detail'>('resume');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const auditorId = (user as any)._id || user.id;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reports/auditor/${auditorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDownload = async (report: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reports/${report._id || report.id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur téléchargement');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.ref || 'rapport'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handleSubmit = async (reportId: string) => {
    if (!window.confirm('Soumettre ce rapport au Chef d\'Audit ?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditorId: (user as any)._id || user.id }),
      });
      if (res.ok) { alert('✅ Rapport soumis !'); fetchReports(); }
      else alert('❌ Erreur');
    } catch { alert('❌ Erreur réseau'); }
  };

  const handleResubmit = async (reportId: string) => {
    if (!window.confirm('Re-soumettre ce rapport après corrections ?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/resubmit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) { alert('✅ Rapport re-soumis !'); fetchReports(); }
      else alert('❌ Erreur');
    } catch { alert('❌ Erreur réseau'); }
  };

  const riskColor = (level: string) => {
    if (!level) return 'text-slate-400';
    const l = level.toUpperCase();
    if (l === 'CRITIQUE' || l === 'CRITICAL') return 'text-rose-500';
    if (l === 'ÉLEVÉ' || l === 'HIGH') return 'text-amber-500';
    if (l === 'MOYEN' || l === 'MEDIUM') return 'text-orange-400';
    return 'text-emerald-500';
  };

  const statusStyle = (s: string) => {
    const map: Record<string, { label: string; cls: string; bg: string }> = {
      'DRAFT': { label: 'Brouillon', cls: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600' },
      'PENDING_LEAD': { label: 'En validation', cls: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' },
      'IN_REVIEW': { label: 'En validation', cls: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' },
      'PUBLISHED': { label: 'Publié', cls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' },
      'COMPLETED': { label: 'Complété', cls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' },
      'REJECTED': { label: 'Rejeté', cls: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' },
    };
    return map[s] || { label: s, cls: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  };

  const filteredReports = filterStatus === 'ALL' ? reports : reports.filter(r => {
    if (filterStatus === 'PENDING') return r.status === 'PENDING_LEAD' || r.status === 'IN_REVIEW';
    return r.status === filterStatus;
  });

  const critBadge = (c: string) => {
    const u = (c || '').toUpperCase();
    if (u === 'CRITICAL') return 'bg-rose-500 text-white';
    if (u === 'HIGH') return 'bg-amber-500 text-white';
    if (u === 'MEDIUM') return 'bg-orange-400 text-white';
    return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
            Mes Rapports d'Audit
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">
            Historique complet de vos rapports générés.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Filtres */}
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'DRAFT', label: 'Brouillons' },
            { id: 'PENDING', label: 'En attente' },
            { id: 'PUBLISHED', label: 'Publiés' },
            { id: 'REJECTED', label: 'Rejetés' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterStatus(f.id)}
              className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${filterStatus === f.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-500/30'}`}
            >{f.label}</button>
          ))}
          <button onClick={fetchReports} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-slate-400 font-bold uppercase italic tracking-widest">Aucun rapport trouvé</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.map((report) => {
              const id = report._id || report.id;
              const st = statusStyle(report.status);
              const isRejected = report.status === 'REJECTED';
              return (
                <div key={id} className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-600/20 shrink-0">
                      {(report.clientCompany || report.clientName || 'R').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-slate-800 dark:text-white uppercase italic tracking-tight truncate">
                        {report.clientCompany || report.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {report.clientName} • {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {isRejected && report.rejectionComment && (
                        <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl">
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Motif : <span className="font-medium normal-case italic">{report.rejectionComment}</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 flex-wrap">
                    <div className="text-right hidden lg:block">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                      <p className="font-black text-indigo-500 italic text-sm">{report.score ?? '—'}/100</p>
                    </div>
                    <div className="text-right hidden lg:block">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risque</p>
                      <p className={`font-black uppercase text-sm italic tracking-tighter ${riskColor(report.niveauRisque)}`}>{report.niveauRisque || 'N/A'}</p>
                    </div>
                    <span className={`text-[8px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest ${st.bg} ${st.cls}`}>{st.label}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleDownload(report)} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 rounded-xl transition-all" title="Télécharger PDF">
                        <Download size={16} />
                      </button>
                      <button onClick={() => { setSelectedReport(report); setActiveTab('resume'); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                        <Eye size={14} /> VOIR
                      </button>
                      {(report.status === 'DRAFT') && (
                        <button onClick={() => handleSubmit(id)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                          <Send size={12} /> Soumettre
                        </button>
                      )}
                      {report.status === 'REJECTED' && (
                        <button onClick={() => handleResubmit(id)} className="px-4 py-2.5 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all flex items-center gap-2 active:scale-95">
                          <Send size={12} /> Re-soumettre
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DETAIL RAPPORT */}
      {selectedReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[56px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-10 pb-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-gradient-to-r from-indigo-50 dark:from-indigo-900/10 to-transparent shrink-0">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">
                  {selectedReport.clientCompany || selectedReport.title}
                </h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 italic">
                  Client: {selectedReport.clientName} • Score: {selectedReport.score}/100 • {selectedReport.niveauRisque}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-3xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button onClick={() => setActiveTab('resume')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'resume' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-slate-400 hover:text-slate-600'}`}>
                <FileText size={16} /> Résumé Exécutif
              </button>
              <button onClick={() => setActiveTab('detail')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'detail' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-slate-400 hover:text-slate-600'}`}>
                <AlertTriangle size={16} /> Rapport Détaillé
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {activeTab === 'resume' ? (
                <div className="space-y-8">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Score sécurité', val: `${selectedReport.score}/100`, color: 'text-indigo-500' },
                      { label: 'Niveau risque', val: selectedReport.niveauRisque, color: riskColor(selectedReport.niveauRisque) },
                      { label: 'Critiques', val: selectedReport.stats?.critical ?? 0, color: 'text-rose-500' },
                      { label: 'Total vulns', val: selectedReport.stats?.total ?? 0, color: 'text-amber-500' },
                    ].map((item, i) => (
                      <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 text-center">
                        <p className={`text-3xl font-black italic ${item.color}`}>{item.val}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Résumé */}
                  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3">Résumé exécutif IA</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">"{selectedReport.resumeExecutif || 'Aucun résumé disponible.'}"</p>
                  </div>
                  {/* Recommandations */}
                  {(selectedReport.recommandationsDetaillees?.length > 0 || selectedReport.recommendations?.length > 0) && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommandations</p>
                      {selectedReport.recommandationsDetaillees?.length > 0
                        ? selectedReport.recommandationsDetaillees.map((rec: any, i: number) => (
                          <div key={i} className="bg-emerald-50 dark:bg-emerald-500/5 rounded-[24px] border border-emerald-100 dark:border-emerald-500/20 overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20">
                              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[9px] font-black shrink-0">{rec.id || i+1}</div>
                              <h4 className="font-black text-emerald-800 dark:text-emerald-300 uppercase italic tracking-tight text-sm">{rec.titre}</h4>
                            </div>
                            <div className="p-5 space-y-3">
                              {rec.objectif && <p className="text-xs text-slate-600 dark:text-slate-300 italic">{rec.objectif}</p>}
                              {rec.actions?.length > 0 && (
                                <ul className="space-y-1">{rec.actions.map((a: string, j: number) => (
                                  <li key={j} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"><span className="text-emerald-500 font-black mt-0.5">▸</span><span>{a}</span></li>
                                ))}</ul>
                              )}
                            </div>
                          </div>
                        ))
                        : selectedReport.recommendations?.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">{i+1}</div>
                            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{rec}</p>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Priorités */}
                  {(selectedReport.priorites?.length > 0 || selectedReport.actionsImmediates?.length > 0) && (
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priorités de remédiation</p>
                      {(selectedReport.priorites?.length > 0 ? selectedReport.priorites : selectedReport.actionsImmediates)?.map((p: any, i: number) => (
                        <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black">#{p.ordre || i+1}</span>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase italic tracking-tight text-sm">{p.vulnerabilite || p.action || 'Action corrective'}</h4>
                          </div>
                          {(p.impact || p.raison || p.detail) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic"><span className="font-black text-slate-600 dark:text-slate-300">{p.raison ? 'Raison : ' : 'Détail : '}</span>{p.impact || p.raison || p.detail}</p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic"><span className="font-black text-slate-600 dark:text-slate-300">{p.solution_detaillee ? 'Solution : ' : 'Délai : '}</span>{p.solution_detaillee || p.temps_estime || 'À planifier'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Vulnérabilités */}
                  {selectedReport.vulnerabilities?.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vulnérabilités ({selectedReport.vulnerabilities.length})</p>
                      {selectedReport.vulnerabilities.map((v: any, i: number) => (
                        <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-md shrink-0 ${critBadge(v.criticality)}`}>{v.criticality}</span>
                          <div>
                            <p className="font-black text-slate-800 dark:text-white text-sm uppercase italic tracking-tight">{v.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.host}:{v.port} • CVSS: {v.cvss}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
              <button onClick={() => setSelectedReport(null)} className="flex-1 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Fermer</button>
              <button onClick={() => handleDownload(selectedReport)} className="px-8 py-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-300 transition-all">
                <Download size={16} /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditorReportsListView;
