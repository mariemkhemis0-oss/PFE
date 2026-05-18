import { reportsAPI } from '../services/apiService';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  FileText, Download, Eye, Search, X, Zap, Activity, 
  TrendingDown, ArrowRight, BarChart4, ListChecks, 
  ChevronLeftCircle, FileSearch, Layout, CheckCircle2,
  Upload, Loader2, AlertCircle, Shield
} from 'lucide-react';
import ReportView from './ReportView';
import { User } from '../types';

interface Report {
  _id: string;
  title: string;
  ref: string;
  clientName: string;
  clientCompany: string;
  date?: string;
  createdAt: string;
  score: number;
  niveauRisque: string;
  resumeExecutif: string;
  stats: { critical: number; high: number; medium: number; low: number; total: number };
  vulnerabilities: any[];
  priorites: any[];
  recommandations: string[];
  conclusion: string;
}

// --- APERÇU RAPIDE (données réelles IA) ---
const QuickAuditPreview: React.FC<{ report: Report; onShowFull: () => void }> = ({ report, onShowFull }) => {
  const riskColor = {
    'CRITIQUE': 'text-rose-500',
    'ÉLEVÉ': 'text-orange-500',
    'MOYEN': 'text-amber-500',
    'FAIBLE': 'text-emerald-500',
  }[report.niveauRisque] || 'text-indigo-400';

  const date = new Date(report.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-16 animate-in fade-in duration-500 pb-20">

      {/* TITRE */}
      <div className="text-center py-12 border-y border-white/5 bg-white/[0.01] rounded-[40px] mb-10">
        <p className="text-indigo-400 font-black uppercase tracking-[0.5em] text-[10px] italic mb-4">SÉCURITÉ OFFENSIVE • SYNTHÈSE IA</p>
        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none mb-6">
          APERÇU RAPIDE DE L'AUDIT
        </h2>
        <div className="flex justify-center items-center gap-8">
          <div className="h-px w-16 bg-white/10"></div>
          <p className="text-xl font-black text-slate-400 uppercase italic tracking-[0.2em]">{date.toUpperCase()}</p>
          <div className="h-px w-16 bg-white/10"></div>
        </div>
      </div>

      {/* KPI */}
      <div className="bg-[#0a0c14] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="bg-white/[0.03] px-10 py-5 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">INDICATEURS CLÉS (KPI)</h3>
          <Activity size={18} className="text-indigo-400" />
        </div>
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 italic">⚠️ Vulnérabilités critiques:</span>
              <span className="px-5 py-1.5 bg-rose-600 text-white font-black rounded-xl text-sm shadow-[0_0_20px_rgba(225,29,72,0.4)]">[{report.stats?.critical ?? 0}]</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 italic">🔴 Vulnérabilités élevées:</span>
              <span className="px-5 py-1.5 bg-orange-600 text-white font-black rounded-xl text-sm">[{report.stats?.high ?? 0}]</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 italic">🟡 Vulnérabilités moyennes:</span>
              <span className="px-5 py-1.5 bg-amber-500 text-white font-black rounded-xl text-sm">[{report.stats?.medium ?? 0}]</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400 italic">🔵 Vulnérabilités faibles:</span>
              <span className="px-5 py-1.5 bg-blue-600 text-white font-black rounded-xl text-sm">[{report.stats?.low ?? 0}]</span>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center border-l border-white/5 md:pl-16">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Score de sécurité global</p>
            <div className="flex items-center gap-6">
              <span className="text-8xl font-black text-white italic tracking-tighter leading-none">
                {report.score}<span className="text-slate-700">/100</span>
              </span>
              <TrendingDown size={48} className={`${riskColor} animate-bounce`} />
            </div>
            <span className={`mt-4 text-lg font-black uppercase tracking-widest ${riskColor}`}>RISQUE : {report.niveauRisque}</span>
          </div>
        </div>
      </div>

      {/* RÉSUMÉ EXÉCUTIF IA */}
      <div className="bg-[#0a0c14] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="bg-white/[0.03] px-10 py-5 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">RÉSUMÉ EXÉCUTIF (IA)</h3>
          <Shield size={18} className="text-indigo-400" />
        </div>
        <div className="p-10">
          <p className="text-sm text-slate-300 leading-relaxed italic">{report.resumeExecutif}</p>
        </div>
      </div>

      {/* TOP VULNÉRABILITÉS */}
      <div className="bg-[#0a0c14] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="bg-white/[0.03] px-10 py-5 border-b border-white/5">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">TOP VULNÉRABILITÉS CRITIQUES</h3>
        </div>
        <div className="p-10 space-y-6">
          {(report.vulnerabilities || []).slice(0, 5).map((v: any, i: number) => (
            <div key={i} className="flex gap-6 group hover:translate-x-2 transition-transform border-b border-white/[0.02] pb-4 last:border-0">
              <span className="text-indigo-500 font-black italic text-xl w-6 shrink-0">{i + 1}.</span>
              <div className="flex-1">
                <p className="text-base font-black text-white uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors">
                  {v.cve && v.cve !== 'N/A' ? `${v.cve} — ` : ''}{v.name}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest flex items-center gap-2">
                  <ArrowRight size={12} className="text-indigo-500" />
                  CIBLE: {v.host}:{v.port} • CVSS: {v.cvss} • [{v.criticality}]
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRIORITÉS IA */}
      {report.priorites && report.priorites.length > 0 && (
        <div className="bg-[#0a0c14] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="bg-white/[0.03] px-10 py-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">ACTIONS IMMÉDIATES REQUISES</h3>
            <Zap size={18} className="text-rose-500" />
          </div>
          <div className="p-10 space-y-6">
            {report.priorites.slice(0, 3).map((p: any, i: number) => (
              <div key={i} className="flex gap-4 border-b border-white/[0.03] pb-4 last:border-0">
                <span className="text-rose-500 font-black text-lg shrink-0">#{p.ordre}</span>
                <div>
                  <p className="text-sm font-black text-white uppercase italic">{p.vulnerabilite}</p>
                  <p className="text-xs text-slate-400 mt-1">{p.solution_detaillee}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOUTON RAPPORT COMPLET */}
      <div className="flex justify-center pt-8 no-print">
        <button
          onClick={onShowFull}
          className="w-full max-w-xl py-7 bg-[#5c56e3] text-white rounded-[32px] font-black text-[14px] uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(92,86,227,0.4)] hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 group"
        >
          <BarChart4 size={24} className="group-hover:scale-110 transition-transform" /> 📊 ACCÉDER AU RAPPORT DÉTAILLÉ
        </button>
      </div>
    </div>
  );
};

// --- MODAL UPLOAD XML ---
const UploadModal: React.FC<{ onClose: () => void; onSuccess: (report: Report) => void }> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!file) return setError('Veuillez sélectionner un fichier XML OpenVAS.');
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('xmlFile', file);
      formData.append('clientName', clientName || 'Client');
      formData.append('clientCompany', clientCompany || 'Organisation');
      const result = await reportsAPI.generate(formData);
      const allReports = await reportsAPI.getAll();
      const newReport = allReports.find((r: Report) => r._id === result.reportId);
      if (newReport) onSuccess(newReport);
      else onClose();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 pb-6 flex justify-between items-start border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Upload XML</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Importer un rapport OpenVAS</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-10 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-center gap-3">
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}
          <div
            className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[28px] text-center cursor-pointer hover:border-indigo-400 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".xml" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={24} className="text-indigo-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-white">{file.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={32} className="text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cliquez pour importer un XML</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom client</label>
              <input type="text" placeholder="Nom" value={clientName} onChange={e => setClientName(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none text-slate-700 dark:text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Organisation</label>
              <input type="text" placeholder="Société" value={clientCompany} onChange={e => setClientCompany(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none text-slate-700 dark:text-white" />
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading || !file}
            className="w-full py-5 bg-indigo-600 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Génération en cours...</> : <><Shield size={18} /> Générer le rapport</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const ClientReportsView: React.FC<{ user: User }> = ({ user }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getAll();
      const clientId = (user as any)?._id || user?.id;
      const clientName = user?.name?.toLowerCase();
      const clientCompany = (user as any)?.company?.toLowerCase();
      
      // Filtrer : seuls les rapports COMPLETED/PUBLISHED destinés à CE client
      const filteredReports = data.filter((report: any) => {
        const statusOk = ['COMPLETED', 'PUBLISHED'].includes(report.status);
        if (!statusOk) return false;
        
        // Match strict par nom de company (Organisation)
        if (clientCompany && report.clientCompany?.toLowerCase() === clientCompany) return true;
        
        return false;
      });
      console.log(`✅ Rapports pour ${user?.name} (${(user as any)?.company}): ${filteredReports.length} sur ${data.length}`);
      setReports(filteredReports);
    } catch (e) {
      console.error('Erreur chargement rapports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: Report) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/reports/${report._id}/download`, {
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

  const handleUploadSuccess = (newReport: Report) => {
    setShowUpload(false);
    loadReports();
    setPreviewReport(newReport);
    setShowFullReport(false);
  };

  const handleClose = () => {
    setPreviewReport(null);
    setShowFullReport(false);
  };

  const filtered = reports.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.ref?.toLowerCase().includes(search.toLowerCase()) ||
    r.clientCompany?.toLowerCase().includes(search.toLowerCase())
  );

  const computeRiskLevel = (score: number | undefined) => {
    const s = score ?? 0;
    if (s < 40) return 'CRITIQUE';
    if (s < 70) return 'ÉLEVÉ';
    if (s < 90) return 'MOYEN';
    return 'FAIBLE';
  };

  const riskBadgeColor = (niveau: string) => ({
    'CRITIQUE': 'bg-rose-600',
    'ÉLEVÉ': 'bg-orange-600',
    'MOYEN': 'bg-amber-500',
    'FAIBLE': 'bg-emerald-600',
  }[niveau] || 'bg-slate-600');

  return (
    <>
      <div className="space-y-12 animate-in fade-in duration-700 pb-32 max-w-[1400px] mx-auto bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 min-h-screen rounded-t-[40px]">
        
        {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-4 pt-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter italic uppercase leading-none">Bibliothèque des Rapports</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 italic">KSI SECURE VAULT V4.2</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="RECHERCHER..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full outline-none text-[10px] font-black uppercase tracking-widest shadow-sm focus:ring-8 focus:ring-indigo-500/5 transition-all"
            />
          </div>
        </div>
      </div>

      {/* LISTE RAPPORTS */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="font-black uppercase tracking-widest text-sm">Aucun rapport trouvé</p>
          <p className="text-xs mt-2">Cliquez sur "NOUVEAU RAPPORT" pour générer un rapport depuis un XML OpenVAS</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
          {filtered.map((report) => (
            <div key={report._id} className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] hover:shadow-2xl transition-all group flex flex-col justify-between h-[480px] relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start mb-10">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-indigo-500/10 text-indigo-500 rounded-[28px] flex items-center justify-center shadow-inner border border-white dark:border-indigo-500/10">
                    <FileText size={32} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">Score</p>
                    <p className={`text-4xl font-black italic tracking-tighter leading-none ${(report.score ?? 0) < 50 ? 'text-rose-500' : (report.score ?? 0) < 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {report.score ?? '—'}%
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase italic mb-4 line-clamp-2">{report.title}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">{report.ref}</span>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  {(() => {
                    const risk = computeRiskLevel(report.score);
                    return (
                      <span className={`px-3 py-1 ${riskBadgeColor(risk)} rounded-full text-[8px] font-black text-white uppercase tracking-widest`}>
                        {risk}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* ✅ BOUTONS CORRIGÉS — Download lisible en light ET dark */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleDownload(report)}
                  className="flex-1 py-5 
                    bg-slate-800 dark:bg-[#0f172a] 
                    text-white 
                    rounded-[24px] font-black text-[10px] uppercase tracking-widest 
                    hover:bg-slate-900 dark:hover:bg-black 
                    transition-all shadow-xl 
                    flex items-center justify-center gap-3 group/btn"
                >
                  <Download size={18} className="group-hover/btn:translate-y-0.5 transition-transform" /> DOWNLOAD
                </button>
                <button
                  onClick={() => { setPreviewReport(report); setShowFullReport(false); }}
                  className="flex-1 py-5 
                    bg-white dark:bg-slate-800 
                    text-slate-700 dark:text-slate-300 
                    border border-slate-200 dark:border-slate-700 
                    rounded-[24px] font-black text-[10px] uppercase tracking-widest 
                    hover:bg-slate-50 dark:hover:bg-slate-750 
                    transition-all flex items-center justify-center gap-3"
                >
                  <Eye size={18} /> PREVIEW
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* MODAL UPLOAD */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* ✅ MODAL PREVIEW — fond toujours sombre (design intentionnel rapport) */}
      {previewReport && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300 p-4 md:p-8">
          <div className="bg-[#050810] w-full h-full md:w-[96vw] md:h-[94vh] rounded-[60px] border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">

            {/* HEADER TABS */}
            <div className="px-12 py-8 bg-black/40 backdrop-blur-xl border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8 z-50 no-print">
              <button
                onClick={handleClose}
                className="flex items-center gap-3 text-slate-500 hover:text-white transition-all group font-black text-[10px] uppercase tracking-[0.2em] shrink-0"
              >
                <ChevronLeftCircle size={28} className="group-hover:-translate-x-1 transition-transform text-indigo-500" />
                RETOUR BIBLIOTHÈQUE
              </button>

              <div className="flex bg-[#1a1f2e] p-1.5 rounded-[24px] border border-white/5 shadow-inner">
                <button
                  onClick={() => setShowFullReport(false)}
                  className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${!showFullReport ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Layout size={16} /> 1. VUE SYNTHÉTIQUE
                </button>
                <button
                  onClick={() => setShowFullReport(true)}
                  className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${showFullReport ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <FileSearch size={16} /> 2. RAPPORT DÉTAILLÉ
                </button>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {new Date(previewReport.createdAt).toLocaleDateString('fr-FR').toUpperCase()}
                </span>
                <button
                  onClick={handleClose}
                  className="p-3 bg-white/5 text-slate-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* CONTENU SCROLLABLE */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="max-w-6xl mx-auto p-10 md:p-16">
                {showFullReport ? (
                  <ReportView
                    user={user}
                    data={{
                      clientName: previewReport.clientName || previewReport.clientCompany || 'Client',
                      date: new Date(previewReport.createdAt).toLocaleDateString('fr-FR'),
                      ref: previewReport.ref,
                      version: '1.0.4',
                      responsible: 'ÉQUIPE CERTIFICATION KSI',
                      vulns: previewReport.vulnerabilities || [],
                      overallScore: previewReport.score,
                      grade: previewReport.score >= 80 ? 'GRADE A' : previewReport.score >= 60 ? 'GRADE B' : 'GRADE C',
                      executiveSummary: previewReport.resumeExecutif || '',
                      stats: previewReport.stats || {},
                      priorites: previewReport.priorites || [],
                      recommandations: previewReport.recommandations || [],
                      conclusion: previewReport.conclusion || '',
                    }}
                  />
                ) : (
                  <QuickAuditPreview
                    report={previewReport}
                    onShowFull={() => setShowFullReport(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
};

export default ClientReportsView;