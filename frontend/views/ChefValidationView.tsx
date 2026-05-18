import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Clock, Eye, FileText, X, CheckCircle2,
  AlertTriangle, Loader2, Download, XCircle, MessageSquare,
  History, RefreshCw, ClipboardCheck
} from 'lucide-react';

interface ChefValidationViewProps {
  isDark: boolean;
  user: any;
}

const ChefValidationView: React.FC<ChefValidationViewProps> = ({ isDark, user }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [archivedReports, setArchivedReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'detail' | 'conformite'>('resume');
  const [publishing, setPublishing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const chefId = (user as any)._id || user.id;
      // Fetch both old (IN_REVIEW) and new (PENDING_LEAD) status names
      const authHeaders = { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' };
      const [pendingRes, inReviewRes, completedRes, publishedRes] = await Promise.all([
        fetch(`http://localhost:5000/api/reports/chef/${chefId}?status=PENDING_LEAD`, { headers: authHeaders }),
        fetch(`http://localhost:5000/api/reports/chef/${chefId}?status=IN_REVIEW`, { headers: authHeaders }),
        fetch(`http://localhost:5000/api/reports/chef/${chefId}?status=COMPLETED`, { headers: authHeaders }),
        fetch(`http://localhost:5000/api/reports/chef/${chefId}?status=PUBLISHED`, { headers: authHeaders }),
      ]);
      const pendingData = await pendingRes.json();
      const inReviewData = await inReviewRes.json();
      const completedData = await completedRes.json();
      const publishedData = await publishedRes.json();
      
      // Combine pending reviews
      const pending = [
        ...(Array.isArray(pendingData) ? pendingData : []),
        ...(Array.isArray(inReviewData) ? inReviewData : []),
      ];
      // Deduplicate by _id
      const uniquePending = pending.filter((r, i, a) => a.findIndex(x => (x._id || x.id) === (r._id || r.id)) === i);
      
      // Combine history
      const history = [
        ...(Array.isArray(completedData) ? completedData : []),
        ...(Array.isArray(publishedData) ? publishedData : []),
      ];
      const uniqueHistory = history.filter((r, i, a) => a.findIndex(x => (x._id || x.id) === (r._id || r.id)) === i);
      
      setReports(uniquePending);
      setArchivedReports(uniqueHistory);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (reportId: string) => {
    setPublishing(true);
    try {
      const chefId = (user as any)._id || user.id;
      const res = await fetch(`http://localhost:5000/api/reports/${reportId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ chefId }),
      });
      if (!res.ok) throw new Error('Erreur publication');
      await fetchReports();
      setSelectedReport(null);
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectComment.trim()) return;
    setRejecting(true);
    try {
      const chefId = (user as any)._id || user.id;
      const res = await fetch(`http://localhost:5000/api/reports/${selectedReport._id || selectedReport.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ comment: rejectComment, chefId }),
      });
      if (!res.ok) throw new Error('Erreur rejet');
      await fetchReports();
      setSelectedReport(null);
      setShowRejectModal(false);
      setRejectComment('');
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    } finally {
      setRejecting(false);
    }
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

  const riskColor = (level: string) => {
    if (!level) return 'text-slate-400';
    const l = level.toUpperCase();
    if (l === 'CRITIQUE' || l === 'CRITICAL') return 'text-rose-500';
    if (l === 'ÉLEVÉ' || l === 'HIGH') return 'text-amber-500';
    if (l === 'MOYEN' || l === 'MEDIUM') return 'text-orange-400';
    return 'text-emerald-500';
  };

  const displayReports = showHistory ? archivedReports : reports;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
            {showHistory ? 'Historique des Rapports' : 'Validation des Rapports'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">
            {showHistory ? 'Rapports certifiés et publiés.' : 'Rapports soumis en attente de certification.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowHistory(!showHistory); }}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${showHistory ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <History size={16} /> {showHistory ? 'EN ATTENTE' : 'HISTORIQUE'}
          </button>
          <button onClick={fetchReports} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all">
            <RefreshCw size={18} />
          </button>
          <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${showHistory ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
            {displayReports.length} {showHistory ? 'publiés' : 'en attente'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : displayReports.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
          <p className="text-slate-400 font-bold uppercase italic tracking-widest">
            {showHistory ? 'Aucun rapport publié' : 'Aucun rapport en attente de validation'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayReports.map((report) => {
              const id = report._id || report.id;
              return (
                <div key={id} className="p-8 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/20">
                      {(report.clientCompany || report.clientName || 'R').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tight">
                        {report.clientCompany || report.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Client: {report.clientName} • {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {report.status === 'PUBLISHED' && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">✓ PUBLIÉ</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                      <p className="font-black text-indigo-500 italic text-sm">{report.score}/100</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risque</p>
                      <p className={`font-black uppercase text-sm italic tracking-tighter ${riskColor(report.niveauRisque)}`}>
                        {report.niveauRisque || 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleDownload(report)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 rounded-xl transition-all" title="Télécharger PDF">
                        <Download size={18} />
                      </button>
                      {!showHistory && (
                        <button onClick={() => { setSelectedReport(report); setActiveTab('resume'); }} className="px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center gap-2 active:scale-95">
                          <Eye size={14} /> REVUE
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

      {/* MODAL SPLIT-SCREEN REVUE */}
      {selectedReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[56px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
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

            <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button onClick={() => setActiveTab('resume')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'resume' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-slate-400 hover:text-slate-600'}`}>
                <FileText size={16} /> Résumé Exécutif
              </button>
              <button onClick={() => setActiveTab('detail')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'detail' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-slate-400 hover:text-slate-600'}`}>
                <AlertTriangle size={16} /> Rapport Détaillé
              </button>
              <button onClick={() => setActiveTab('conformite')} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'conformite' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10' : 'text-slate-400 hover:text-slate-600'}`}>
                <ClipboardCheck size={16} /> Conformité Org.
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {activeTab === 'resume' ? (
                <div className="space-y-8">
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
                  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3">Résumé exécutif IA</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">"{selectedReport.resumeExecutif || 'Aucun résumé disponible.'}"</p>
                  </div>
                  {(selectedReport.recommandationsDetaillees?.length > 0 || selectedReport.recommendations?.length > 0) && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommandations Détaillées</p>
                      {selectedReport.recommandationsDetaillees?.length > 0
                        ? selectedReport.recommandationsDetaillees.map((rec: any, i: number) => (
                          <div key={i} className="bg-emerald-50 dark:bg-emerald-500/5 rounded-[24px] border border-emerald-100 dark:border-emerald-500/20 overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20">
                              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[9px] font-black shrink-0">{rec.id || `RECO-${String(i+1).padStart(2,'0')}`}</div>
                              <h4 className="font-black text-emerald-800 dark:text-emerald-300 uppercase italic tracking-tight text-sm">{rec.titre}</h4>
                            </div>
                            <div className="p-5 space-y-3">
                              {rec.objectif && <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">{rec.objectif}</p>}
                              {rec.actions?.length > 0 && (
                                <ul className="space-y-1">
                                  {rec.actions.map((a: string, j: number) => (
                                    <li key={j} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                      <span className="text-emerald-500 font-black mt-0.5">▸</span><span>{a}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {(rec.kpi || rec.estimation_cout) && (
                                <div className="flex gap-6 pt-2 border-t border-emerald-100 dark:border-emerald-500/20">
                                  {rec.kpi && <p className="text-[10px] text-emerald-700 dark:text-emerald-300"><span className="font-black">KPI : </span>{rec.kpi}</p>}
                                  {rec.estimation_cout && <p className="text-[10px] text-slate-500"><span className="font-black">Coût : </span>{rec.estimation_cout}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                        : selectedReport.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">{i+1}</div>
                            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{rec}</p>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              ) : activeTab === 'detail' ? (
                <div className="space-y-6">
                  {(selectedReport.priorites?.length > 0 || selectedReport.actions_immediates?.length > 0) && (
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priorités de remédiation</p>
                      {(selectedReport.priorites?.length > 0 ? selectedReport.priorites : selectedReport.actions_immediates)?.map((p: any, i: number) => (
                        <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black">#{p.ordre || i + 1}</span>
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
                  {selectedReport.vulnerabilities?.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Détail des vulnérabilités ({selectedReport.vulnerabilities.length})</p>
                      {selectedReport.vulnerabilities.map((v: any, i: number) => (
                        <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-md shrink-0 ${v.criticality === 'CRITICAL' ? 'bg-rose-500 text-white' : v.criticality === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            {v.criticality}
                          </span>
                          <div>
                            <p className="font-black text-slate-800 dark:text-white text-sm uppercase italic tracking-tight">{v.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.host}:{v.port} • CVSS: {v.cvss}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* ── ONGLET CONFORMITÉ ORGANISATIONNELLE ── */
                <div className="space-y-8">
                  {(() => {
                    const orgData = selectedReport.auditData?.organisationalScore;
                    const axes = selectedReport.auditData?.axes;
                    if (!orgData && !axes) return (
                      <div className="text-center py-16 space-y-4">
                        <ClipboardCheck size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-400 font-bold uppercase italic tracking-widest text-sm">Aucun questionnaire rempli pour cet audit</p>
                        <p className="text-slate-400 text-xs">L'auditeur n'a pas complété le questionnaire de maturité organisationnelle.</p>
                      </div>
                    );

                    const scoreData = orgData || { globalScore: 0, axisScores: [], weaknesses: [], totalAnswered: 0, totalQuestions: 0 };

                    return (
                      <>
                        {/* KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Score Organisationnel', val: `${scoreData.globalScore}/100`, color: scoreData.globalScore >= 70 ? 'text-emerald-500' : scoreData.globalScore >= 40 ? 'text-amber-500' : 'text-rose-500' },
                            { label: 'Questions répondues', val: `${scoreData.totalAnswered}/${scoreData.totalQuestions}`, color: 'text-indigo-500' },
                            { label: 'Points faibles', val: scoreData.weaknesses?.length || 0, color: 'text-rose-500' },
                            { label: 'Pondération', val: '40%', color: 'text-slate-500' },
                          ].map((item, i) => (
                            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 text-center">
                              <p className={`text-3xl font-black italic ${item.color}`}>{item.val}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Scores par axe */}
                        {scoreData.axisScores && scoreData.axisScores.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score par axe d'évaluation</p>
                            {scoreData.axisScores.map((axis: any, i: number) => (
                              <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase italic tracking-tight">{axis.title}</h4>
                                  <span className={`text-lg font-black italic ${axis.score >= 70 ? 'text-emerald-500' : axis.score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{axis.score}/100</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${axis.score >= 70 ? 'bg-emerald-500' : axis.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${axis.score}%` }}></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">{axis.answered}/{axis.total} questions répondues</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Points faibles */}
                        {scoreData.weaknesses && scoreData.weaknesses.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">⚠ Points Faibles Identifiés (réponses NON)</p>
                            {scoreData.weaknesses.map((w: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-500/5 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                                <span className="text-rose-500 font-black text-sm mt-0.5">✗</span>
                                <div>
                                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{w.axis}</p>
                                  <p className="text-sm text-rose-800 dark:text-rose-300 font-medium">{w.question}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
              <button onClick={() => setSelectedReport(null)} className="flex-1 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
                Fermer
              </button>
              <button onClick={() => handleDownload(selectedReport)} className="px-8 py-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-300 transition-all">
                <Download size={16} /> PDF
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-8 py-5 bg-rose-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 transition-all active:scale-95"
              >
                <XCircle size={16} /> Rejeter
              </button>
              <button
                onClick={() => handlePublish(selectedReport._id || selectedReport.id)}
                disabled={publishing}
                className="flex-[2] py-5 bg-emerald-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {publishing ? <><Loader2 size={18} className="animate-spin" /> Publication...</> : <><ShieldCheck size={18} /> Certifier &amp; Publier</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJET */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[48px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 pb-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Motif du Rejet</h2>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">Ce message sera visible par l'auditeur</p>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="Ex: Les vulnérabilités critiques manquent de preuves visuelles. Merci d'ajouter des captures d'écran pour chaque CVE..."
                rows={5}
                className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[28px] text-sm font-medium dark:text-white outline-none focus:ring-4 focus:ring-rose-500/10 transition-all resize-none"
              />
              <div className="flex gap-4">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 rounded-[24px] font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-all">
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting || !rejectComment.trim()}
                  className="flex-[2] py-5 bg-rose-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {rejecting ? <><Loader2 size={16} className="animate-spin" /> Envoi...</> : <><XCircle size={16} /> Confirmer le Rejet</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefValidationView;