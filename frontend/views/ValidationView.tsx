import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, ArrowRight, ChevronLeft, Terminal, 
  FileText, Zap, ShieldAlert, Target, Shield, Check, X,
  MousePointer2, Gauge, ClipboardList, Info, ShieldCheck,
  Search, Filter, Activity, Server, Database, Monitor,
  // Added ShieldX to fix the "Cannot find name 'ShieldX'" error
  AlertCircle, ChevronRight, LayoutList, Loader2, LockKeyhole, ShieldX
} from 'lucide-react';
import { User, ReportStatus, Severity } from '../types';
import ReportView from './ReportView';

interface ValidationViewProps {
  user: User;
  data: any; 
}

interface AuditItem {
  id: string;
  client: string;
  tool: string;
  findings: { crit: number; high: number };
  status: 'CERTIFIED' | 'REJECTED' | 'PENDING_TECH_VAL' | 'AWAITING_REVIEW';
  date: string;
}

const ValidationView: React.FC<ValidationViewProps> = ({ user, data: parentData }) => {
  const [validationType, setValidationType] = useState<'audits' | 'reports'>('reports');
  
  // États pour la partie Rapport (Stratégique)
  const [ratings, setRatings] = useState({ clarity: 4, precision: 3, proofs: 5, impact: 4 });
  const [checklist, setChecklist] = useState({ general: true, security: true, assets: true, results: true });
  const [reportStatus, setReportStatus] = useState<'idle' | 'certifying' | 'certified' | 'rejected'>('idle');

  // État de validation technique (Audits)
  const [isApproving, setIsApproving] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string>('SCN-8821');
  const [auditsData, setAuditsData] = useState<AuditItem[]>([
    { id: 'SCN-8821', client: 'SOCIÉTÉ GÉNÉRALE TN', tool: 'OpenVAS GVM', findings: { crit: 3, high: 12 }, status: 'PENDING_TECH_VAL', date: 'Aujourd\'hui, 10:45' },
    { id: 'SCN-8822', client: 'OOREDOO TN', tool: 'Nuclei Engine', findings: { crit: 0, high: 4 }, status: 'AWAITING_REVIEW', date: 'Hier, 18:20' },
  ]);

  const currentSelectedAudit = auditsData.find(a => a.id === selectedAuditId) || auditsData[0];

  const handleApproveFindings = () => {
    setIsApproving(true);
    // Simulation d'une signature cryptographique des données brutes
    setTimeout(() => {
      setIsApproving(false);
      setAuditsData(prev => prev.map(a => 
        a.id === selectedAuditId ? { ...a, status: 'CERTIFIED' } : a
      ));
    }, 2000);
  };

  const handleRejectAudit = () => {
    if (window.confirm(`Rejeter définitivement les données brutes du dossier ${selectedAuditId} ?`)) {
      setAuditsData(prev => prev.map(a => 
        a.id === selectedAuditId ? { ...a, status: 'REJECTED' } : a
      ));
    }
  };

  const handleCertifyReport = () => {
    setReportStatus('certifying');
    setTimeout(() => setReportStatus('certified'), 2500);
  };

  const handleRejectReport = () => {
    const reason = window.prompt("Motif du rejet du rapport :");
    if (reason !== null) {
      setReportStatus('rejected');
      setTimeout(() => setReportStatus('idle'), 3000);
    }
  };

  const renderRating = (label: string, value: number, key: keyof typeof ratings) => (
    <div className="flex items-center justify-between p-6 bg-slate-900/50 rounded-3xl border border-white/5 group hover:border-indigo-500/20 transition-all">
       <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</span>
       <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(step => (
            <button 
              key={step}
              onClick={() => setRatings({...ratings, [key]: step})}
              className={`w-10 h-6 rounded-lg transition-all border ${
                value >= step 
                ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
            />
          ))}
       </div>
    </div>
  );

  const renderCheckItem = (label: string, checked: boolean, key: keyof typeof checklist) => (
    <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-all rounded-2xl cursor-pointer group" onClick={() => setChecklist({...checklist, [key]: !checked})}>
       <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter group-hover:text-white transition-colors">{label}</span>
       <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
         checked ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 border-white/10 text-slate-700'
       }`}>
          <Check size={18} strokeWidth={4} />
       </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto pb-40">
      
      {/* 🚀 NAVIGATION DE VALIDATION (Dual Flow) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 no-print bg-[#050810] p-8 rounded-[40px] border border-white/5 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
             <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">CENTRE DE VALIDATION</h2>
          </div>
          <p className="text-slate-500 font-bold italic uppercase text-[10px] tracking-[0.4em]">KSI CORE V4.2 • MODULE DE CERTIFICATION</p>
        </div>

        <div className="flex bg-slate-900 p-1.5 rounded-[24px] border border-white/5 shadow-inner">
           <button 
             onClick={() => setValidationType('audits')}
             className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${validationType === 'audits' ? 'bg-indigo-600 text-white shadow-xl translate-x-0' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Zap size={16} /> 1. VAL-TECHNIQUE (AUDITS)
           </button>
           <button 
             onClick={() => setValidationType('reports')}
             className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${validationType === 'reports' ? 'bg-indigo-600 text-white shadow-xl translate-x-0' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <FileText size={16} /> 2. VAL-DOCUMENTAIRE (RAPPORTS)
           </button>
        </div>
      </div>

      {validationType === 'audits' ? (
        <div className="space-y-10 animate-in slide-in-from-left duration-700">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Liste des audits */}
              <div className="lg:col-span-1 space-y-6">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">MISSIONS À CERTIFIER</h3>
                 {auditsData.map(audit => (
                   <div 
                    key={audit.id} 
                    onClick={() => setSelectedAuditId(audit.id)}
                    className={`p-8 rounded-[40px] border transition-all cursor-pointer relative overflow-hidden shadow-xl ${
                     selectedAuditId === audit.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-white/5'
                   } ${
                     audit.status === 'CERTIFIED' ? 'bg-emerald-500/5' : audit.status === 'REJECTED' ? 'bg-rose-500/5' : 'bg-[#0a0c14] group hover:border-indigo-500/40'
                   }`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="flex justify-between items-start mb-6">
                         <div className={`p-4 rounded-2xl border ${
                           audit.status === 'CERTIFIED' ? 'bg-emerald-50/10 text-emerald-400 border-emerald-500/20' : 
                           audit.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                           'bg-white/5 text-indigo-400 border-white/10 group-hover:scale-110 transition-transform'
                         }`}>
                            {audit.status === 'CERTIFIED' ? <ShieldCheck size={24} /> : audit.status === 'REJECTED' ? <ShieldX size={24} /> : <Activity size={24} />}
                         </div>
                         <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                           audit.status === 'CERTIFIED' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                           audit.status === 'REJECTED' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' :
                           'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                         }`}>{audit.status.replace('_', ' ')}</span>
                      </div>
                      <h4 className="text-xl font-black text-white uppercase italic tracking-tighter mb-1">{audit.client}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">{audit.tool} • {audit.date}</p>
                      
                      <div className="flex gap-4 mb-8">
                         <div className="flex-1 p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center">
                            <p className="text-[9px] font-black text-rose-500 uppercase mb-1">Critique</p>
                            <p className="text-lg font-black text-white italic leading-none">{audit.findings.crit}</p>
                         </div>
                         <div className="flex-1 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                            <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Élevé</p>
                            <p className="text-lg font-black text-white italic leading-none">{audit.findings.high}</p>
                         </div>
                      </div>
                      <button className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border ${
                        selectedAuditId === audit.id
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                         {audit.status === 'CERTIFIED' ? 'DONNÉES SÉCURISÉES' : 'INSPECTER LA DONNÉE'} <ChevronRight size={14} />
                      </button>
                   </div>
                 ))}
              </div>

              {/* Vue détaillée Findings */}
              <div className="lg:col-span-2 space-y-8">
                 <div className="bg-[#0a0c14] rounded-[56px] border border-white/10 overflow-hidden shadow-2xl h-full flex flex-col">
                    <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-950/20 to-transparent">
                       <div>
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">INSPECTION TECHNIQUE BRUTE</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Dossier: {currentSelectedAudit.id} ({currentSelectedAudit.client})</p>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={handleRejectAudit} className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><X size={20} /></button>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"><Terminal size={20} /></div>
                       </div>
                    </div>

                    <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar max-h-[600px]">
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                            <Info size={14} className="text-indigo-500" /> VÉRIFICATION DE L'INTÉGRITÉ DU SCAN
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {[
                               { label: 'Hosts Scannés', value: '14/14', status: 'OK' },
                               { label: 'NVT Updated', value: 'YES', status: 'OK' },
                               { label: 'Errors Log', value: '0', status: 'OK' }
                             ].map((m, i) => (
                               <div key={i} className="p-5 bg-white/5 rounded-[28px] border border-white/5 flex flex-col items-center">
                                  <span className="text-[8px] font-black text-slate-500 uppercase mb-1">{m.label}</span>
                                  <span className="text-xl font-black text-white italic">{m.value}</span>
                                  <span className="text-[8px] font-black text-emerald-500 uppercase mt-2">{m.status}</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                            <Terminal size={14} className="text-indigo-500" /> LOGS DE FINDINGS ({currentSelectedAudit.tool})
                          </h4>
                          <div className="bg-slate-950 p-8 rounded-[40px] border border-white/10 font-mono text-[11px] text-emerald-400 italic shadow-inner space-y-2">
                             <p className="text-slate-600">// Analysis session: {currentSelectedAudit.id}</p>
                             <p>$ ENGINE: {currentSelectedAudit.tool.toLowerCase()}</p>
                             <p>$ FINDINGS_COUNT: CRIT({currentSelectedAudit.findings.crit}), HIGH({currentSelectedAudit.findings.high})</p>
                             <p>$ STATUS: {currentSelectedAudit.status}</p>
                             <p className={`mt-4 font-black italic shadow-emerald-500/20 ${currentSelectedAudit.status === 'CERTIFIED' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                               $ AUDIT_STATUS: {currentSelectedAudit.status === 'CERTIFIED' ? 'DATA_LOCKED_AND_CERTIFIED' : 'READY_FOR_VALIDATION'}
                             </p>
                          </div>
                       </div>

                       <div className={`p-10 rounded-[40px] border transition-all duration-700 flex flex-col md:flex-row items-center justify-between gap-8 ${
                         currentSelectedAudit.status === 'CERTIFIED' 
                         ? 'bg-emerald-500/10 border-emerald-500/30' 
                         : currentSelectedAudit.status === 'REJECTED'
                         ? 'bg-rose-500/10 border-rose-500/30'
                         : 'bg-indigo-500/5 border-indigo-500/10'
                       }`}>
                          <div className="space-y-1 text-center md:text-left">
                             <p className="text-lg font-black text-white uppercase italic tracking-tighter">
                                {currentSelectedAudit.status === 'CERTIFIED' ? 'DONNÉES CERTIFIÉES ✅' : 
                                 currentSelectedAudit.status === 'REJECTED' ? 'DONNÉES REJETÉES ❌' :
                                'CERTIFIER LES DONNÉES BRUTES ?'}
                             </p>
                             <p className="text-[10px] text-slate-500 font-medium italic">
                                {currentSelectedAudit.status === 'CERTIFIED' 
                                  ? 'L\'auditeur a reçu la notification. Le rapport peut être finalisé.' 
                                  : currentSelectedAudit.status === 'REJECTED'
                                  ? 'Le dossier doit être re-scanné ou les faux-positifs écartés.'
                                  : 'Cela permettra à l\'auditeur de générer le rapport final.'}
                             </p>
                          </div>
                          
                          <div className="flex gap-4">
                            {currentSelectedAudit.status !== 'CERTIFIED' && currentSelectedAudit.status !== 'REJECTED' && (
                              <button 
                                onClick={handleApproveFindings}
                                disabled={isApproving}
                                className={`px-12 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-4 relative overflow-hidden group bg-[#10b981] text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95`}
                              >
                                {isApproving ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" /> SIGNATURE...
                                  </>
                                ) : (
                                  'APPROUVER LES FINDINGS'
                                )}
                              </button>
                            )}
                            {currentSelectedAudit.status === 'CERTIFIED' && (
                               <div className="px-12 py-5 bg-emerald-500 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                                  <ShieldCheck size={18} /> CERTIFIÉ
                               </div>
                            )}
                            {currentSelectedAudit.status === 'REJECTED' && (
                               <div className="px-12 py-5 bg-rose-500 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
                                  <XCircle size={18} /> REJETÉ
                               </div>
                            )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-right duration-700">
           {/* APERÇU RAPPORT */}
           <div className="bg-[#020617] rounded-[64px] border-[12px] border-slate-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative group">
             <div className="absolute top-10 right-10 bg-indigo-600/10 text-indigo-400 px-6 py-2 rounded-full border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest no-print z-50 backdrop-blur-md">
                {reportStatus === 'certified' ? 'RAPPORT CERTIFIÉ' : 'APERÇU DÉFINITIF DU RAPPORT'}
             </div>
             
             <div className={`p-12 transition-all duration-1000 ${reportStatus === 'certified' ? 'opacity-100' : reportStatus === 'rejected' ? 'grayscale opacity-50' : 'opacity-100'}`}>
               <ReportView 
                 user={user}
                 data={{
                   clientName: 'ENTERPRISE CORP',
                   ref: 'AUD-2024-0042',
                   date: '04 FÉVRIER 2024',
                   version: '1.0.4',
                   responsible: 'ALI SENNOUR',
                   vulns: parentData.vulns,
                   overallScore: 68,
                   grade: 'GRADE B',
                   executiveSummary: "La posture de sécurité globale est préoccupante suite à la détection d'une vulnérabilité critique sur le moteur de base de données MySQL."
                 }}
               />
             </div>
           </div>

           {/* 🔮 DÉCISION ADMINISTRATIVE */}
           <div className="bg-[#050810] rounded-[56px] border border-white/10 p-16 space-y-16 shadow-2xl animate-in slide-in-from-bottom-20 duration-1000 delay-300">
             <div className="border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">DÉCISION ADMINISTRATIVE</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">ÉVALUATION DE QUALITÉ FINALE - KSI CORE V4.2</p>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${reportStatus === 'certified' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${reportStatus === 'certified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                     {reportStatus === 'certified' ? 'SIGNATURE APPOSÉE' : 'EN ATTENTE DE SIGNATURE'}
                   </span>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-10">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-3">
                     <Gauge size={16} className="text-indigo-500" /> QUALITÉ RÉDACTIONNELLE
                   </h3>
                   <div className="space-y-4">
                      {renderRating('Clarté', ratings.clarity, 'clarity')}
                      {renderRating('Précision', ratings.precision, 'precision')}
                      {renderRating('Preuves', ratings.proofs, 'proofs')}
                      {renderRating('Impact', ratings.impact, 'impact')}
                   </div>
                </div>

                <div className="space-y-10">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-3">
                     <ClipboardList size={16} className="text-indigo-500" /> CHECKLIST DE CONFORMITÉ
                   </h3>
                   <div className="bg-slate-900/50 p-6 rounded-[40px] border border-white/5 shadow-inner space-y-2">
                      {renderCheckItem('Information générale', checklist.general, 'general')}
                      <div className="h-px bg-white/5 mx-6"></div>
                      {renderCheckItem('Questionnaire de sécurité', checklist.security, 'security')}
                      <div className="h-px bg-white/5 mx-6"></div>
                      {renderCheckItem('Gestion des équipements', checklist.assets, 'assets')}
                      <div className="h-px bg-white/5 mx-6"></div>
                      {renderCheckItem('Bases résultats', checklist.results, 'results')}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-white/5">
                <button 
                  onClick={handleRejectReport}
                  disabled={reportStatus !== 'idle'}
                  className={`py-7 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] border transition-all shadow-xl group flex items-center justify-center gap-4 ${
                    reportStatus === 'rejected' 
                    ? 'bg-rose-500 text-white border-rose-400 cursor-default' 
                    : 'bg-rose-600/10 text-rose-500 border-rose-500/20 hover:bg-rose-600 hover:text-white'
                  }`}
                >
                   {reportStatus === 'rejected' ? <ShieldAlert size={20} /> : <XCircle size={20} className="group-hover:scale-125 transition-transform" />} 
                   {reportStatus === 'rejected' ? 'DOSSIER REJETÉ' : 'REFUSER LE DOSSIER'}
                </button>
                <button 
                  onClick={handleCertifyReport}
                  disabled={reportStatus !== 'idle'}
                  className={`py-7 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-4 group ${
                    reportStatus === 'certified'
                    ? 'bg-emerald-500 text-white cursor-default'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                   {reportStatus === 'certifying' ? (
                     <>
                        <Loader2 size={20} className="animate-spin" /> CERTIFICATION...
                     </>
                   ) : reportStatus === 'certified' ? (
                     <>
                        <ShieldCheck size={20} /> RAPPORT PUBLIÉ
                     </>
                   ) : (
                     <>
                        <ShieldCheck size={20} className="group-hover:scale-125 transition-transform" /> 
                        CERTIFIER & PUBLIER AU CLIENT
                     </>
                   )}
                </button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ValidationView;