
import React from 'react';
import { ShieldCheck, FileText, Download, TrendingUp, AlertTriangle, ArrowRight, BarChart3 } from 'lucide-react';

const ClientPortal: React.FC = () => {
  const stats = [
    { label: 'Indice de Risque', value: '78/100', color: 'text-indigo-600', icon: BarChart3 },
    { label: 'Audits Validés', value: '4', color: 'text-emerald-600', icon: ShieldCheck },
    { label: 'Points de Remédiation', value: '12', color: 'text-amber-600', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-900 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Bonjour, Enterprise Corp</h2>
          <p className="text-indigo-200 text-xl max-w-2xl mb-8">Votre posture de sécurité s'est améliorée de 15% ce trimestre grâce à la remédiation des vulnérabilités critiques.</p>
          <div className="flex flex-wrap gap-8">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/10 px-6 py-4 rounded-3xl backdrop-blur-sm border border-white/10">
                <div className="p-3 bg-white/20 rounded-2xl"><s.icon size={24} /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">{s.label}</p>
                  <p className="text-2xl font-black">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
           <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Derniers Rapports Validés</h3>
           {[
             { title: 'Audit Infrastructure Q3', date: '15/09/2024', grade: 'B', color: 'bg-emerald-500' },
             { title: 'Contrôle Applications Web', date: '02/07/2024', grade: 'A', color: 'bg-indigo-500' },
           ].map((r, i) => (
             <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:shadow-xl transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${r.color} flex items-center justify-center text-white text-2xl font-black`}>{r.grade}</div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{r.title}</h4>
                    <p className="text-sm text-slate-500">Délivré le {r.date}</p>
                  </div>
                </div>
                <button className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all">
                  <Download size={24} />
                </button>
             </div>
           ))}
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white">Plan de Remédiation</h3>
             <TrendingUp className="text-emerald-500" />
           </div>
           <div className="space-y-6">
             <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl border border-emerald-100 dark:border-emerald-500/20">
               <p className="text-emerald-800 dark:text-emerald-400 font-bold mb-1">Impact Immédiat</p>
               <p className="text-sm text-emerald-700 dark:text-emerald-500/80 leading-relaxed">Corrigez le CVE-2024-1234 sur le firewall principal pour augmenter votre score de 12 points.</p>
             </div>
             <button className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">
               Voir toutes les recommandations <ArrowRight size={18} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
