import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, TrendingUp, AlertTriangle, BarChart3, 
  FileText, ArrowRight, AlertCircle, Loader2, Clock, Send, Star, MessageSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, CartesianGrid } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981'];

interface ClientDashboardProps {
  onNavigate?: (view: string) => void;
  user?: any;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ onNavigate, user }) => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [latestReport, setLatestReport] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [resPub, resComp] = await Promise.all([
          fetch('http://localhost:5000/api/reports/status/PUBLISHED', { headers }),
          fetch('http://localhost:5000/api/reports/status/COMPLETED', { headers })
        ]);
        const dataPub = await resPub.json();
        const dataComp = await resComp.json();
        
        const allData = [...(Array.isArray(dataPub) ? dataPub : []), ...(Array.isArray(dataComp) ? dataComp : [])];
        
        // Remove duplicates just in case
        const uniqueData = Array.from(new Map(allData.map(item => [item._id, item])).values());
        
        const clientCompany = user?.company?.toLowerCase();
        const filteredReports = uniqueData.filter(report => {
          if (clientCompany && report.clientCompany?.toLowerCase() === clientCompany) return true;
          return false;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setReports(filteredReports);
        if (filteredReports.length > 0) setLatestReport(filteredReports[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFeedbackSubmit = async () => {
    if (!rating) return alert('Veuillez sélectionner une note');
    setSubmittingFeedback(true);
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating,
          comment: feedback
        })
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedback('');
        setRating(0);
        setTimeout(() => setFeedbackSuccess(false), 5000);
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de l\'envoi');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const score = latestReport?.score ?? 0;
  const computeRisk = (s: number) => s < 40 ? 'CRITIQUE' : s < 70 ? 'ÉLEVÉ' : s < 90 ? 'MOYEN' : 'FAIBLE';
  const riskLevel = computeRisk(score);
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';
  const scoreStroke = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';

  const stats = latestReport?.stats;
  const riskData = stats ? [
    { name: 'Critique', value: stats.critical || 0 },
    { name: 'Élevé', value: stats.high || 0 },
    { name: 'Moyen', value: stats.medium || 0 },
    { name: 'Faible', value: stats.low || 0 },
  ].filter(d => d.value > 0) : [];

  const trendData = reports.slice(0, 5).reverse().map((r: any, i: number) => ({
    name: new Date(r.createdAt).toLocaleDateString('fr-FR', { month: 'short' }),
    score: r.score || 0,
  }));

  const topVulns = latestReport?.vulnerabilities?.slice(0, 3) || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-[1400px] mx-auto">
      
      {/* WELCOME BANNER */}
      <div className="welcome-banner rounded-[40px] p-10 dark:text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 space-y-4 flex-1">
          <h1 className="text-5xl font-black tracking-tight leading-tight">
            Bonjour, {user?.name || 'Client'} !
          </h1>
          <p className="text-slate-700 dark:text-blue-100 text-xl font-black uppercase tracking-widest italic">
            {latestReport ? `Niveau de risque : ${riskLevel}` : 'Aucun rapport disponible.'}
          </p>
          <p className="text-slate-700 dark:text-blue-100 text-base font-medium max-w-xl leading-relaxed opacity-90">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            {latestReport && ` — Dernier audit : ${new Date(latestReport.createdAt).toLocaleDateString('fr-FR')}`}
          </p>
          <div className="flex gap-4 flex-wrap">
            {reports.length > 0 && (
              <button
                onClick={() => onNavigate?.('client-reports')}
                className="bg-white dark:bg-slate-100 text-slate-900 px-10 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white transition-all shadow-xl active:scale-95 group"
              >
                Voir mes Rapports <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
        <div className="relative z-10 shrink-0 w-56 h-56 flex items-center justify-center">
          {loading ? (
            <Loader2 size={48} className="animate-spin text-white/50" />
          ) : (
            <>
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                <circle cx="112" cy="112" r="100" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray="628"
                  strokeDashoffset={628 - (628 * (score || 0)) / 100}
                  className={scoreStroke + ' transition-all duration-1000'}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-6xl font-black tracking-tighter leading-none ${scoreColor}`}>{score || '—'}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1">Security Score</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0"><ShieldCheck size={32} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Niveau de Risque</p>
            <p className={`text-2xl font-black uppercase italic tracking-tighter ${latestReport ? (riskLevel === 'CRITIQUE' ? 'text-rose-500' : riskLevel === 'ÉLEVÉ' ? 'text-amber-500' : 'text-emerald-600') : 'text-slate-400 dark:text-slate-500'}`}>
              {loading ? '...' : riskLevel || 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0"><AlertCircle size={32} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vulnérabilités Critiques</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
              {loading ? '...' : (stats?.critical ?? 0)} Findings
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0"><FileText size={32} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rapports</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
              {loading ? '...' : reports.length} Reports
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      {!loading && (riskData.length > 0 || trendData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4">
          {riskData.length > 0 && (
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-10 flex items-center gap-3"><BarChart3 size={20} className="text-indigo-500" /> Sévérité des Failles</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                      {riskData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {trendData.length > 1 && (
            <div className={`${riskData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm`}>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-10 flex items-center gap-3"><TrendingUp size={20} className="text-emerald-500" /> Évolution du Score</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={0.1} fill="#6366f1" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOP VULNÉRABILITÉS */}
      {topVulns.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[48px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Points Critiques de Sécurité</h3>
            <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-full border border-rose-100 dark:border-rose-500/20 shadow-sm">Action Prioritaire</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                <tr>
                  <th className="pb-6 px-4">Risque Identifié</th>
                  <th className="pb-6 px-4">Sévérité</th>
                  <th className="pb-6 px-4">Cible</th>
                  <th className="pb-6 px-4 text-right">CVSS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {topVulns.map((v: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-7 px-4 font-bold text-slate-800 dark:text-slate-200 text-base italic">{v.name}</td>
                    <td className="py-7 px-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        v.criticality === 'CRITICAL' ? 'bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' :
                        v.criticality === 'HIGH' ? 'bg-orange-100 text-orange-600 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                        'bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                      }`}>{v.criticality}</span>
                    </td>
                    <td className="py-7 px-4 text-sm text-slate-500 font-mono">{v.host}:{v.port}</td>
                    <td className="py-7 px-4 text-right">
                      <span className="font-black text-sm text-indigo-500 italic">{v.cvss}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => onNavigate?.('client-reports')}
            className="mt-8 w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-2"
          >
            Voir le Rapport Complet <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* FEEDBACK */}
      <div className="bg-white dark:bg-slate-900 p-16 rounded-[60px] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-3 h-full bg-blue-300 shadow-[2px_0_10px_rgba(79,70,229,0.3)]"></div>
        <div className="max-w-4xl">
          <h3 className="text-4xl font-black text-slate-800 dark:text-white mb-3 italic tracking-tighter uppercase leading-none">Votre avis compte</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-10 leading-relaxed italic max-w-2xl">Aidez-nous à améliorer la plateforme.</p>
          <div className="flex gap-4 mb-10">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className={`w-16 h-16 rounded-2xl border-2 transition-all flex items-center justify-center ${rating >= s ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300 hover:border-amber-400'}`}>
                <Star size={32} fill={rating >= s ? "currentColor" : "none"} strokeWidth={rating >= s ? 0 : 2} />
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea className="w-full p-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[40px] focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all font-medium text-lg dark:text-white shadow-inner resize-none" rows={4} placeholder="Écrivez votre suggestion ici..." value={feedback} onChange={(e) => setFeedback(e.target.value)} disabled={submittingFeedback}></textarea>
            <button onClick={handleFeedbackSubmit} disabled={submittingFeedback || !rating} className="absolute bottom-6 right-6 p-5 bg-blue-400 text-white rounded-3xl hover:bg-blue-500 transition-all shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 group disabled:opacity-50 disabled:hover:scale-100">
              {submittingFeedback ? <Loader2 size={28} className="animate-spin" /> : <Send size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            </button>
          </div>
          {feedbackSuccess && <p className="text-emerald-500 font-bold mt-4 italic">Merci pour votre retour !</p>}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;