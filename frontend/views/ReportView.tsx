
import React from 'react';
import { 
  Lock, ShieldCheck, Calendar, Hash, Target, Zap, 
  ShieldAlert, FileText, ChevronRight, Activity, 
  Terminal, CheckCircle2, Globe, Info, TrendingUp,
  AlertCircle, Shield, Award, MousePointer2,
  Layers, Map, BarChart4, ListChecks,
  History, Clock, BookOpen, User as UserIcon,
  Building2, Mail, Phone, ExternalLink, Sliders,
  Gauge, Code, Server, Laptop, Workflow,
  BarChart, Check, ClipboardList, Timer, Download
} from 'lucide-react';
import { Vulnerability, Severity, User } from '../types';
import Logo from '../components/Logo';

interface ReportViewProps {
  data: {
    clientName: string;
    date: string;
    ref: string;
    version: string;
    responsible: string;
    vulns: Vulnerability[];
    overallScore: number;
    grade: string;
    executiveSummary: string;
    stats?: { critical?: number; high?: number; medium?: number; low?: number; total?: number };
    priorites?: any[];
    recommandations?: string[];
    conclusion?: string;
    targets?: string;
  };
  user: User;
}

const ReportView: React.FC<ReportViewProps> = ({ data, user }) => {
  const handlePrint = () => window.print();

  return (
<div className="space-y-32 font-sans selection:bg-indigo-500/30 text-slate-900 dark:text-slate-200 bg-white dark:bg-[#020617] dark:p-4 md:p-0 dark:report-view-dark">      
      {/* 🧾 PAGE DE COUVERTURE */}
<section className="bg-slate-50 dark:bg-[#020617] min-h-[95vh] flex flex-col items-center justify-between p-16 dark:rounded-none rounded-[48px] border border-slate-200 dark:border-none relative overflow-hidden page-break shadow-2xl dark:shadow-none">        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="w-full flex justify-between items-start z-10">
          <Logo size={120} showText isDark={true} />
          <div className="bg-rose-500/10 text-rose-500 font-black text-[10px] uppercase tracking-[0.3em] px-6 py-3 rounded-full border border-rose-500/20 flex items-center gap-2">
            <Lock size={14} /> STRICTEMENT CONFIDENTIEL
          </div>
        </div>
        <div className="text-center z-10 w-full space-y-12">
          <div className="space-y-4">
             <p className="text-indigo-400 font-black uppercase tracking-[0.6em] text-xs italic">SÉCURITÉ OFFENSIVE & CONFORMITÉ</p>
             <h1 className="text-[70px] md:text-[90px] font-black text-white leading-[0.8] tracking-tighter italic uppercase">RAPPORT <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-700">D'AUDIT COMPLET</span></h1>
          </div>
          <div className="space-y-2">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.5em] italic">— CLIENT AUDITÉ —</p>
             <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">{data.clientName}</h2>
             <p className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-6">SESSION : {data.ref} • {data.date.toUpperCase()}</p>
          </div>
        </div>
        <div className="w-full z-10 flex justify-between items-end border-t border-white/5 pt-12">
           <div className="space-y-2"><p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Document Certifié par</p><p className="text-lg font-black text-white uppercase italic">KSI SECURITY ENGINE V4.2</p></div>
           <div className="text-right space-y-2"><p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Responsable Audit</p><p className="text-lg font-black text-white uppercase italic">{data.responsible}</p></div>
        </div>
      </section>

      {/* 📋 TABLE DES MATIÈRES (Conforme structure 1 à 10) */}
      <section className="page-break space-y-12">
         <div className="space-y-2 border-l-4 border-indigo-600 pl-8">
           <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">TABLE DES MATIÈRES</h2>
           <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Index du document technique</p>
         </div>
<div className="bg-slate-50 dark:bg-[#0a0c14] p-12 rounded-[48px] border border-slate-200 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6 font-mono text-sm">            {[
              { n: '1', t: 'RÉSUMÉ EXÉCUTIF', p: '3' },
              { n: '2', t: 'CONTEXTE ET OBJECTIFS', p: '5' },
              { n: '3', t: 'MÉTHODOLOGIE', p: '8' },
              { n: '4', t: 'PÉRIMÈTRE DE L\'AUDIT', p: '12' },
              { n: '5', t: 'RÉSULTATS DÉTAILLÉS', p: '15' },
              { n: '6', t: 'ANALYSE PAR SYSTÈME', p: '60' },
              { n: '7', t: 'PLAN D\'ACTIONS CORRECTIVES', p: '75' },
              { n: '8', t: 'RECOMMANDATIONS DÉTAILLÉES', p: '82' },
              { n: '9', t: 'ANNEXES TECHNIQUES', p: '90' },
              { n: '10', t: 'GLOSSAIRE', p: '95' },
            ].map((ch, i) => (
              <div key={i} className="flex justify-between items-baseline border-b border-white/5 pb-2 group cursor-pointer">
                <span className="font-black text-indigo-400 italic group-hover:text-white transition-colors">{ch.n}. {ch.t}</span>
                <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300">.......... {ch.p}</span>
              </div>
            ))}
         </div>
      </section>

      {/* 1. RÉSUMÉ EXÉCUTIF */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">1. RÉSUMÉ EXÉCUTIF</h2>
        <div className="space-y-12">
           <div className="bg-indigo-600/5 border-l-4 border-indigo-600 p-10 rounded-r-[32px] italic text-lg leading-relaxed text-slate-300">
             "{data.executiveSummary}"
           </div>
           <div className="bg-[#0a0c14] rounded-[32px] border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-400">
                  <tr><th className="px-10 py-5">Indicateur</th><th className="px-10 py-5">Valeur</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-bold italic">
                  <tr><td className="px-10 py-6">Vulnérabilités critiques</td><td className="px-10 py-6 text-rose-500 font-black">{data.stats?.critical ?? 0}</td></tr>
                  <tr><td className="px-10 py-6">Vulnérabilités élevées</td><td className="px-10 py-6 text-amber-500 font-black">{data.stats?.high ?? 0}</td></tr>
                  <tr><td className="px-10 py-6">Vulnérabilités moyennes</td><td className="px-10 py-6 text-orange-400 font-black">{data.stats?.medium ?? 0}</td></tr>
                  <tr><td className="px-10 py-6">Vulnérabilités faibles</td><td className="px-10 py-6 text-emerald-500 font-black">{data.stats?.low ?? 0}</td></tr>
                  <tr><td className="px-10 py-6">Score de sécurité global</td><td className="px-10 py-6 font-black">{data.overallScore}/100</td></tr>
                  <tr><td className="px-10 py-6">Total vulnérabilités</td><td className="px-10 py-6 font-black">{data.stats?.total ?? data.vulns?.length ?? 0}</td></tr>
                </tbody>
              </table>
           </div>
        </div>
      </section>

      {/* 2. CONTEXTE ET OBJECTIFS */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">2. CONTEXTE ET OBJECTIFS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="bg-[#0a0c14] p-10 rounded-[40px] border border-white/5 space-y-6">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">2.1 PRÉSENTATION DE L'ENTREPRISE</h3>
              <ul className="space-y-4 text-sm font-bold text-slate-400 dark:text-slate-300 italic">
                 <li className="flex items-center gap-3">● Secteur: <span className="text-white">Finance / Banque</span></li>
                 <li className="flex items-center gap-3">● Taille: <span className="text-white">Grand Compte (+500 employés)</span></li>
                 <li className="flex items-center gap-3">● Enjeux: <span className="text-white">Protection des données bancaires, Conformité réglementaire</span></li>
              </ul>
           </div>
           <div className="bg-[#0a0c14] p-10 rounded-[40px] border border-white/5 space-y-6">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">2.2 OBJECTIFS DE L'AUDIT</h3>
              <ul className="space-y-4 text-sm font-bold text-slate-400 dark:text-slate-300 italic">
                 <li className="flex items-start gap-3">● <span className="text-white">Identifier les vulnérabilités exploitables à distance.</span></li>
                 <li className="flex items-start gap-3">● <span className="text-white">Mesurer l'impact métier en cas de compromission réussie.</span></li>
                 <li className="flex items-start gap-3">● <span className="text-white">Définir une feuille de route priorisée pour la remédiation.</span></li>
              </ul>
           </div>
        </div>
      </section>

      {/* 3. MÉTHODOLOGIE */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">3. MÉTHODOLOGIE</h2>
        <div className="bg-[#0a0c14] rounded-[40px] border border-white/5 overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-400">
                <tr><th className="px-10 py-5">Outil / Norme</th><th className="px-10 py-5">Usage technique</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs italic font-bold">
                <tr><td className="px-10 py-5 text-indigo-400 uppercase">OpenVAS (GVM)</td><td className="px-10 py-5">Scan de vulnérabilités infrastructure complet</td></tr>
                <tr><td className="px-10 py-5 text-indigo-400 uppercase">CVSS v3.1</td><td className="px-10 py-5">Standard de calcul de criticité universel</td></tr>
                <tr><td className="px-10 py-5 text-indigo-400 uppercase">OWASP ZAP</td><td className="px-10 py-5">Audit de sécurité des couches applicatives web</td></tr>
              </tbody>
           </table>
        </div>
      </section>

      {/* 4. PÉRIMÈTRE DE L'AUDIT */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">4. PÉRIMÈTRE DE L'AUDIT</h2>
        <div className="bg-[#0a0c14] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
           <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                 <tr><th className="px-10 py-6">Type d'Actif</th><th className="px-10 py-6 text-center">Nombre</th><th className="px-10 py-6">IP / Cible</th><th className="px-10 py-6 text-right">Criticité</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-bold italic">
                 {[
                   { t: 'Serveurs de Production', q: 25, r: '192.168.1.x', c: 'Critique', col: 'text-rose-500' },
                   { t: 'Équipements Réseau', q: 12, r: '192.168.0.x', c: 'Critique', col: 'text-rose-500' },
                   { t: 'Applications Web', q: 8, r: 'apps.domaine.tn', c: 'Élevée', col: 'text-orange-500' },
                 ].map((row, i) => (
                   <tr key={i} className="hover:bg-white/[0.01]">
                      <td className="px-10 py-7 text-white uppercase">{row.t}</td>
                      <td className="px-10 py-7 text-center text-slate-400 dark:text-slate-300">{row.q}</td>
                      <td className="px-10 py-7 font-mono text-indigo-400 text-xs">{row.r}</td>
                      <td className={`px-10 py-7 text-right uppercase ${row.col}`}>{row.c}</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </section>

      {/* 5. RÉSULTATS DÉTAILLÉS */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">5. RÉSULTATS DÉTAILLÉS</h2>
        {data.vulns && data.vulns.length > 0 ? data.vulns.map((v: any, i: number) => {
          const sevColor = (v.criticality || v.severity || '').toUpperCase().includes('CRIT') ? 'bg-rose-500' : (v.criticality || '').toUpperCase().includes('HIGH') ? 'bg-orange-500' : (v.criticality || '').toUpperCase().includes('MED') ? 'bg-amber-500' : 'bg-blue-500';
          return (
          <div key={i} className="bg-[#050810] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl">
            <div className={`${sevColor} text-white px-10 py-5 flex justify-between items-center font-black italic uppercase tracking-tighter text-lg`}>
              <span>VULNÉRABILITÉ #{String(i+1).padStart(3,'0')} — {v.cve && v.cve !== 'N/A' ? v.cve : v.name}</span>
              <span className="bg-white/20 px-4 py-1 rounded-lg text-sm">{v.criticality || v.severity} {v.cvss}</span>
            </div>
            <div className="p-12 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-3"><Info size={16}/> DESCRIPTION</h4>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed italic">{v.description || v.name}</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-3"><Target size={16}/> CIBLE</h4>
                  <p className="text-sm text-slate-400 font-mono italic">{v.host}:{v.port}</p>
                  {v.solution && <><h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-4">SOLUTION</h4><p className="text-sm text-emerald-300 italic">{v.solution}</p></>}
                </div>
              </div>
            </div>
          </div>
          );
        }) : (
          <div className="bg-[#0a0c14] p-12 rounded-[48px] border border-white/5 text-center">
            <p className="text-slate-400 font-bold italic">Aucune vulnérabilité détectée lors de ce scan.</p>
          </div>
        )}
      </section>

      {/* 6. ANALYSE PAR SYSTÈME */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">6. ANALYSE PAR SYSTÈME</h2>
        <div className="bg-[#0a0c14] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
           <table className="w-full text-left border-collapse">
<thead className="bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">                 <tr>
                    <th className="px-10 py-6">Serveur / Asset</th>
                    <th className="px-6 py-6 text-center">Critiques</th>
                    <th className="px-6 py-6 text-center">Élevées</th>
                    <th className="px-6 py-6 text-center">Moyennes</th>
                    <th className="px-10 py-6 text-right">Score Santé</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                 {[
                   { n: 'WEB-SERVER-01', c: 3, e: 5, m: 8, s: '45/100', co: 'text-rose-500' },
                   { n: 'DATABASE-SRV-01', c: 2, e: 4, m: 6, s: '62/100', co: 'text-amber-500' },
                   { n: 'APP-BACKEND-01', c: 4, e: 3, m: 5, s: '38/100', co: 'text-rose-500' },
                   { n: 'BACKUP-NODE-01', c: 0, e: 1, m: 3, s: '88/100', co: 'text-emerald-500' },
                 ].map((s, i) => (
                   <tr key={i} className="hover:bg-white/[0.01] group transition-all">
                      <td className="px-10 py-7 font-black text-white uppercase italic tracking-tighter">{s.n}</td>
                      <td className="px-6 py-7 text-center text-rose-500 font-black">{s.c}</td>
                      <td className="px-6 py-7 text-center text-orange-500 font-black">{s.e}</td>
                      <td className="px-6 py-7 text-center text-slate-500 dark:text-slate-300 font-bold">{s.m}</td>
                      <td className={`px-10 py-7 text-right font-black italic ${s.co}`}>{s.s}</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
        
        <div className="bg-[#0a0c14] p-12 rounded-[48px] border border-white/5 space-y-8">
           <div className="flex justify-between items-end">
              <div>
                 <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em] italic mb-2">GRAPHIQUE D'ÉVOLUTION PAR ÉQUIPEMENT</h3>
                 <p className="text-xs text-slate-400 dark:text-slate-300 font-medium italic">Analyse comparative des scores de résilience.</p>
              </div>
              <BarChart className="text-indigo-500" size={32} />
           </div>
           <div className="h-24 flex items-end gap-6 pl-4 border-b border-white/5 pb-1">
              {[45, 62, 38, 88, 70, 55, 90].map((v, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-indigo-900 to-indigo-500 rounded-t-lg transition-all hover:brightness-125" style={{ height: `${v}%` }}></div>
              ))}
           </div>
        </div>
      </section>

      {/* 7. PLAN D'ACTIONS CORRECTIVES */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">7. PLAN D'ACTIONS CORRECTIVES</h2>
        
        <div className="space-y-10">
           <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic ml-4">7.1 ACTIONS URGENTES (J+0 à J+7)</h3>
           <div className="bg-[#0a0c14] rounded-[48px] border border-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse">
<thead className="bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">                    <tr><th className="px-10 py-6">ID</th><th className="px-10 py-6">Action Prioritaire</th><th className="px-10 py-6 text-center">Responsable</th><th className="px-10 py-6 text-right">Statut</th></tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      { id: 'U01', a: 'Changer mots de passe par défaut', r: 'Admin Sys', s: 'À FAIRE', sc: 'text-amber-500' },
                      { id: 'U02', a: 'Isoler serveur compromis (192.168.1.50)', r: 'Ops Réseau', s: 'EN COURS', sc: 'text-indigo-400' },
                      { id: 'U03', a: 'Appliquer correctif critique Log4j', r: 'DevOps', s: 'PLANIFIÉ', sc: 'text-slate-500' },
                    ].map((act, i) => (
                      <tr key={i} className="hover:bg-white/[0.01]">
                         <td className="px-10 py-7 font-mono text-indigo-400 text-xs">{act.id}</td>
                         <td className="px-10 py-7 font-black text-white uppercase italic tracking-tighter">{act.a}</td>
                         <td className="px-10 py-7 text-center text-slate-500 font-bold uppercase text-[10px]">{act.r}</td>
                         <td className={`px-10 py-7 text-right text-[10px] font-black uppercase tracking-widest ${act.sc}`}>{act.s}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="bg-indigo-600/5 border border-indigo-500/20 p-10 rounded-[48px] space-y-6">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 text-white rounded-2xl"><ClipboardList size={20}/></div>
                 <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">📋 DÉTAIL ACTION U01</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm">
                 <div className="space-y-4">
                    <p className="text-indigo-400 font-black uppercase text-[10px]">Procédure technique :</p>
                    <p className="text-slate-300 italic leading-relaxed">Générer des mots de passe complexes (16+ caractères). Mettre à jour les accès SSH et Telnet. Documenter dans le coffre-fort numérique.</p>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                       <span className="text-[10px] font-black uppercase text-slate-500">Estimation temps</span>
                       <span className="font-black text-white italic">4h Homme</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                       <span className="text-[10px] font-black uppercase text-slate-500">Impact service</span>
                       <span className="font-black text-emerald-500 italic">Aucun</span>
                    </div>
                 </div>
              </div>
           </div>

           <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em] italic text-center pt-10">7.4 CALENDRIER DE MISE EN ŒUVRE (GANTT)</h3>
           <div className="bg-[#0a0c14] p-12 rounded-[48px] border border-white/5 space-y-10 shadow-2xl">
              <div className="space-y-6">
                 {[
                   { name: 'U01 - PASSWORD RESET', w: 'w-[15%]', c: 'bg-rose-500' },
                   { name: 'U02 - NETWORK ISOLATION', w: 'w-[40%]', c: 'bg-rose-600', m: 'ml-[5%]' },
                   { name: 'U03 - LOG4J PATCHING', w: 'w-[20%]', c: 'bg-indigo-600', m: 'ml-[15%]' },
                   { name: 'R01 - WAF DEPLOYMENT', w: 'w-[50%]', c: 'bg-emerald-600', m: 'ml-[30%]' },
                 ].map((g, i) => (
                   <div key={i} className="flex items-center gap-6">
                      <div className="w-48 text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest italic">{g.name}</div>
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden flex">
                         <div className={`${g.c} ${g.w} ${g.m || ''} rounded-full shadow-lg`}></div>
                      </div>
                   </div>
                 ))}
                 <div className="flex justify-between pl-48 text-[8px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest pt-2">
                    <span>SEM 1</span><span>SEM 2</span><span>SEM 3</span><span>SEM 4</span><span>SEM 5</span><span>SEM 6</span><span>SEM 7</span><span>SEM 8</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 8. RECOMMANDATIONS DÉTAILLÉES */}
      <section className="page-break space-y-16">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">8. RECOMMANDATIONS DÉTAILLÉES</h2>
        <div className="grid grid-cols-1 gap-12">
           {[
             { id: '01', title: 'MISE À JOUR SYSTÉMATIQUE', obj: 'Maintenir tous les systèmes à jour.', actions: ['WSUS pour Windows', 'Mises à jour Linux auto', 'Politique Patch J+7'], cost: '15h Homme + 500€/mois', kpi: '% MAJ: Cible 95%' },
             { id: '02', title: 'MFA MULTI-FACTEUR', obj: 'Sécuriser les accès privilégiés.', actions: ['Déployer Okta/Azure', 'Activer sur VPN', 'Révoquer PWD simple'], cost: '20h Homme + Licences', kpi: 'Taux MFA: Cible 100%' }
           ].map((reco, i) => (
             <div key={i} className="bg-[#0a0c14] border border-white/5 rounded-[48px] overflow-hidden">
                <div className="bg-indigo-600 p-8 flex justify-between items-center text-white italic font-black uppercase tracking-tighter text-xl">
                   <span>RECO {reco.id} : {reco.title}</span>
                   <div className="p-2 bg-white/20 rounded-xl"><CheckCircle2 size={24}/></div>
                </div>
                <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-20 text-sm">
                   <div className="space-y-6">
                      <p className="font-bold text-slate-200 italic">🎯 Objectif: "{reco.obj}"</p>
                      <ul className="space-y-3 text-slate-400 dark:text-slate-300 italic font-medium">
                         {reco.actions.map((a, j) => <li key={j} className="flex items-center gap-3">├─ {a}</li>)}
                      </ul>
                   </div>
                   <div className="space-y-6 border-l border-white/5 pl-10 italic">
                      <p className="font-black text-emerald-400 uppercase text-[10px]">💰 Coût : {reco.cost}</p>
                      <p className="font-black text-emerald-400 uppercase text-[10px]">📈 KPI : {reco.kpi}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* 9. ANNEXES TECHNIQUES */}
      <section className="page-break space-y-12">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">9. ANNEXES TECHNIQUES</h2>
        <div className="space-y-12">
           <div className="bg-black/90 p-8 rounded-[40px] border border-white/5 font-mono text-[11px] text-emerald-500/80 italic shadow-inner">
              <p className="mb-2 text-slate-600"># SCANS_BRUTS_OPENVAS</p>
              <p>[INFO] Target: 192.168.1.10 | Severity: 10.0 | Detection: Log4j CVE-2024-1234</p>
           </div>
           <div className="bg-[#0a0c14] rounded-[40px] border border-white/5 p-8 font-mono text-[11px] text-indigo-300 italic">
              <p className="text-slate-500 dark:text-slate-300 uppercase font-black text-[9px] mb-4">Hardening Script Suggestion</p>
              <p>ServerTokens Prod</p>
              <p>Header always set X-Frame-Options "SAMEORIGIN"</p>
           </div>
        </div>
      </section>

      {/* 10. GLOSSAIRE */}
      <section className="page-break space-y-12 pb-32">
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none border-b border-white/10 pb-6">10. GLOSSAIRE</h2>
        <div className="bg-[#0a0c14] rounded-[48px] border border-white/5 overflow-hidden">
           <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-white/5 font-bold italic">
                 {[
                   { t: 'CVE', d: 'Identifiant unique pour vulnérabilité de sécurité publique.' },
                   { t: 'CVSS', d: 'Score de gravité des failles de 0 à 10.' },
                   { t: 'RCE', d: 'Remote Code Execution - Exécution de code à distance.' },
                   { t: 'WAF', d: 'Web Application Firewall - Pare-feu applicatif.' },
                 ].map((row, idx) => (
                   <tr key={idx}><td className="px-10 py-6 text-indigo-400 text-sm w-32">{row.t}</td><td className="px-10 py-6 text-xs text-slate-400 dark:text-slate-300">{row.d}</td></tr>
                 ))}
              </tbody>
           </table>
        </div>
      </section>

      <footer className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center px-12 pb-12 gap-8 opacity-50 no-print">
         <div className="flex items-center gap-4"><Award className="text-indigo-500" /><p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]"> DOCUMENT GÉNÉRÉ PAR CYBERAUDIT AI © 2024 </p></div>
         <Logo size={40} isDark={true} />
      </footer>

      {/* 📥 BOUTON DE TÉLÉCHARGEMENT FLOTTANT (Demandé par l'utilisateur) */}
      <button 
        onClick={handlePrint}
        className="fixed bottom-12 right-12 z-[100] bg-indigo-600 text-white p-6 rounded-full shadow-[0_20px_50px_rgba(79,70,229,0.5)] hover:bg-indigo-500 transition-all hover:scale-110 active:scale-90 no-print group border border-white/10"
        title="Télécharger le rapport PDF"
      >
        <Download size={32} className="group-hover:translate-y-0.5 transition-transform" />
      </button>
      
    </div>
  );
};

export default ReportView;
