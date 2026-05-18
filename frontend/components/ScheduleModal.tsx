import React, { useState } from 'react';
import { Calendar, Clock, X, Zap } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: string;
  scanProfile: string;
  clientName: string;
  clientCompany: string;
  onScheduleCreated: (schedule: any) => void;
}

export default function ScheduleModal({ isOpen, onClose, targets, scanProfile, clientName, clientCompany, onScheduleCreated }: ScheduleModalProps) {
  const [frequency, setFrequency] = useState('weekly');
  const [timeOfDay, setTimeOfDay] = useState('02:00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSchedule = async () => {
    if (!targets.trim()) {
      setError('Veuillez spécifier au moins une IP cible dans le champ principal.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const auditorId = user?.id || user?._id;

      const res = await fetch(`${API_URL}/scans/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          targets,
          scanProfile,
          frequency,
          timeOfDay,
          clientName: clientName || user?.name || 'Client',
          clientCompany: clientCompany || user?.company || 'Organisation',
          auditorId,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la planification');

      onScheduleCreated(data.schedule);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2 text-indigo-400">
            <Calendar size={20} />
            <h3 className="font-bold text-white">Planifier un Scan</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Cibles à scanner</label>
            <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-300 text-sm font-mono break-all">
              {targets || 'Aucune cible définie'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Fréquence de récurrence</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: 'Quotidien' },
                { id: 'weekly', label: 'Hebdomadaire' },
                { id: 'monthly', label: 'Mensuel' }
              ].map(freq => (
                <button
                  key={freq.id}
                  onClick={() => setFrequency(freq.id)}
                  className={`p-2.5 text-sm font-medium rounded-xl border transition-all ${
                    frequency === freq.id
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Heure d'exécution</label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Le scan se déclenchera automatiquement à cette heure selon la fréquence choisie.</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSchedule}
            disabled={isLoading || !targets}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Calendar size={16} />
            )}
            Valider la planification
          </button>
        </div>
      </div>
    </div>
  );
}
