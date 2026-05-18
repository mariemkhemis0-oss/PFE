import React, { useEffect, useState } from 'react';
import { Calendar, Trash2, Power, PowerOff, Zap, Clock } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

interface ScheduledScan {
  _id: string;
  targets: string;
  scanProfile: string;
  frequency: string;
  timeOfDay: string;
  nextRun: string;
  lastRun?: string;
  lastStatus?: string;
  isActive: boolean;
  clientCompany: string;
}

interface ScheduledScansManagerProps {
  chefId?: string;
  auditorId?: string;
}

export default function ScheduledScansManager({ chefId, auditorId }: ScheduledScansManagerProps) {
  const [scans, setScans] = useState<ScheduledScan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    try {
      let url = `${API_URL}/scans/schedules?`;
      if (chefId) url += `chefId=${chefId}&`;
      if (auditorId) url += `auditorId=${auditorId}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setScans(data);
      }
    } catch (err) {
      console.error('Erreur chargement scans planifiés:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
    // Rafraîchissement automatique toutes les 30s
    const interval = setInterval(fetchScans, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleScan = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/scans/schedule/${id}/toggle`, { method: 'PUT' });
      fetchScans();
    } catch (err) {
      console.error('Erreur toggle:', err);
    }
  };

  const deleteScan = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette planification ?')) return;
    try {
      await fetch(`http://localhost:5000/api/scans/schedule/${id}`, { method: 'DELETE' });
      fetchScans();
    } catch (err) {
      console.error('Erreur delete:', err);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Chargement des planifications...</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-white/[0.02]">
          <tr>
            <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">CIBLE & CLIENT</th>
            <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] text-center">RÉCURRENCE</th>
            <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] text-center">PROCHAIN SCAN</th>
            <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] text-center">STATUT</th>
            <th className="px-12 py-8 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {scans.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-12 py-20 text-center text-slate-500 font-bold uppercase italic tracking-widest opacity-50">Aucun scan planifié</td>
            </tr>
          ) : (
            scans.map(scan => (
              <tr key={scan._id} className="group hover:bg-white/[0.01] transition-all">
                <td className="px-12 py-10">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-lg border border-indigo-500/20">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-base leading-none mb-1">{scan.clientCompany}</p>
                      <p className="text-[10px] font-bold text-slate-500 tracking-tight">{scan.targets}</p>
                    </div>
                  </div>
                </td>
                <td className="px-12 py-10 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black rounded-lg uppercase tracking-widest">
                      {scan.frequency}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Clock size={10} /> {scan.timeOfDay}</span>
                  </div>
                </td>
                <td className="px-12 py-10 text-center">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(scan.nextRun).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </td>
                <td className="px-12 py-10 text-center">
                  {!scan.isActive ? (
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-rose-500/10 text-rose-500 border-rose-500/20">
                      PAUSE
                    </span>
                  ) : scan.lastStatus === 'Terminé' ? (
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      ✅ TERMINÉ
                    </span>
                  ) : scan.lastStatus === 'Running' ? (
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
                      ⚡ EN COURS
                    </span>
                  ) : scan.lastStatus === 'Erreur' ? (
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-rose-500/10 text-rose-500 border-rose-500/20">
                      ❌ ERREUR
                    </span>
                  ) : (
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      ACTIF
                    </span>
                  )}
                </td>
                <td className="px-12 py-10">
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => toggleScan(scan._id)}
                      className={`p-3 rounded-xl transition-all border ${
                        scan.isActive 
                          ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20'
                      }`}
                      title={scan.isActive ? 'Mettre en pause' : 'Réactiver'}
                    >
                      {scan.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                    </button>
                    <button
                      onClick={() => deleteScan(scan._id)}
                      className="p-3 bg-slate-800 text-slate-400 border border-slate-700 rounded-xl hover:text-rose-500 hover:bg-slate-700 transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
