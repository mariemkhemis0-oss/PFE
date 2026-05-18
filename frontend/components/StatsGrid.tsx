
import React from 'react';
import { AlertCircle, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';

const StatsGrid: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded">Critique</span>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.critical}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vulnérabilités Critiques</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded">High</span>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.high}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Menaces Elevées</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Activity size={24} />
          </div>
          <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">Score</span>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.overallScore}/100</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Score de Sécurité Global</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">Maturité</span>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.grade}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Niveau de Maturité</p>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
