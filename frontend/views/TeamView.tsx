import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Trash2, CheckCircle2, 
  Clock, AlertCircle, X, ChevronRight, User as UserIcon,
  Briefcase, Mail, Shield, Zap, Building2, ExternalLink,
  BarChart3, Target, Award, TrendingUp, Phone, Calendar,
  ShieldCheck, FileText, Activity, Globe, LayoutList,
  ShieldAlert, ArrowRight, Gauge, FileDown, History, RefreshCw, MessageSquare
} from 'lucide-react';
import { User, UserRole, Organization } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { mockOrganizations } from '../mockData';

interface TeamViewProps {
  chef: User;
  allUsers: User[];
  isDark: boolean;
  onNavigate: (view: string, data?: any) => void;
}

const TeamView: React.FC<TeamViewProps> = ({ chef, allUsers: initialUsers, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuditor, setSelectedAuditor] = useState<User | null>(null);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'auditors' | 'clients'>('auditors');
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);

  // ← Fetch direct pour avoir les données fraîches
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setAllUsers(data);
    } catch (e) {
      console.error('Erreur fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  const chefMongoId = ((chef as any)._id || chef.id)?.toString();

  // Debug
  useEffect(() => {
    if (chefMongoId) {
      const auditorsList = allUsers.filter(u => u.role?.toUpperCase() === 'AUDITOR');
      console.log('=== TEAM VIEW DEBUG ===');
      console.log('CHEF ID:', chefMongoId);
      console.log('ALL AUDITORS:', auditorsList.map(u => ({
        name: u.name,
        chefId: (u as any).chefId?.toString(),
        match: (u as any).chefId?.toString() === chefMongoId
      })));
    }
  }, [allUsers, chefMongoId]);

  const auditors = allUsers.filter(u => {
    if (u.role?.toUpperCase() !== 'AUDITOR') return false;
    const userChefId = (u as any).chefId?.toString();
    if (!userChefId) return false;
    return userChefId === chefMongoId;
  });

  const chefAuditorIds = auditors.map(u => ((u as any)._id || u.id)?.toString());

  const clients = allUsers.filter(u => {
    if (u.role?.toUpperCase() !== 'CLIENT') return false;
    const userAuditorId = (u as any).auditorId?.toString();
    if (!userAuditorId) return false;
    return chefAuditorIds.includes(userAuditorId);
  });

  const filteredAuditors = auditors.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((c.company || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const kpiData = [
    { subject: 'Qualité Technique', A: 120, fullMark: 150 },
    { subject: 'Vitesse', A: 98, fullMark: 150 },
    { subject: 'Conformité', A: 86, fullMark: 150 },
    { subject: 'Rédaction', A: 130, fullMark: 150 },
    { subject: 'Complexité', A: 85, fullMark: 150 },
  ];

  const trendData = [
    { name: 'Lun', score: 65 },
    { name: 'Mar', score: 58 },
    { name: 'Mer', score: 72 },
    { name: 'Jeu', score: 68 },
    { name: 'Ven', score: 85 },
  ];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const getAuditorForClient = (client: User) => {
    const clientAuditorId = (client as any).auditorId?.toString();
    const auditor = auditors.find(a => ((a as any)._id || a.id)?.toString() === clientAuditorId);
    return auditor?.name || 'Non assigné';
  };

  const getOrgDetails = (client: User): Organization | undefined => {
    return mockOrganizations.find(o => o.name === client.company);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">
            Gestion de l'Équipe
          </h1>
          <p className="text-sm text-slate-400 font-bold italic mt-2 uppercase tracking-widest">
            Supervisez vos experts et surveillez la posture de vos clients.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-500 transition-all"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* SEARCH & TABS */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder={activeTab === 'auditors' ? "Rechercher un auditeur..." : "Rechercher un client..."}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full outline-none text-xs font-bold transition-all focus:ring-4 focus:ring-indigo-500/5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => { setActiveTab('auditors'); setSearchTerm(''); }}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'auditors' ? 'bg-[#5c56e3] text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Auditeurs ({auditors.length})
            </button>
            <button 
              onClick={() => { setActiveTab('clients'); setSearchTerm(''); }}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'clients' ? 'bg-[#5c56e3] text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Clients ({clients.length})
            </button>
          </div>
        </div>

        <div className="p-10">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-bold uppercase italic tracking-widest">
              Chargement...
            </div>
          ) : activeTab === 'auditors' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredAuditors.length === 0 ? (
                <div className="col-span-2 text-center py-16 space-y-4">
                  <Users size={40} className="mx-auto text-slate-300" />
                  <p className="text-slate-400 font-bold uppercase italic tracking-widest">Aucun auditeur trouvé</p>
                  <p className="text-slate-400 text-xs italic">Chef ID: {chefMongoId}</p>
                </div>
              ) : (
                filteredAuditors.map((auditor) => (
                  <div key={(auditor as any)._id || auditor.id} className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform">
                        {getInitials(auditor.name)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm leading-none mb-1">{auditor.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{auditor.email}</p>
                        <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
                          Chef ID: {(auditor as any).chefId?.toString().substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onNavigate('messages', { targetUser: auditor })}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-500 rounded-2xl transition-all shadow-sm active:scale-90"
                      >
                        <MessageSquare size={20} />
                      </button>
                      <button 
                        onClick={() => setSelectedAuditor(auditor)}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-500 rounded-2xl transition-all shadow-sm active:scale-90"
                      >
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <Building2 size={40} className="mx-auto text-slate-300" />
                  <p className="text-slate-400 font-bold uppercase italic tracking-widest">Aucun client assigné</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div key={(client as any)._id || client.id} className="p-6 px-10 bg-slate-50 dark:bg-slate-800/40 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-8">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm text-indigo-500">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase italic tracking-tighter text-base leading-none mb-1">{client.company || client.name}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <UserIcon size={12} className="text-indigo-400" /> Auditeur: {getAuditorForClient(client)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Dernier Score</span>
                        <span className="text-sm font-black text-emerald-500 italic">91/100</span>
                      </div>
                      <button 
                        onClick={() => setSelectedClient(client)}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-500 rounded-2xl transition-all shadow-sm active:scale-90"
                      >
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALE PERFORMANCE AUDITEUR */}
      {selectedAuditor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[60px] shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-12 pb-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-start bg-gradient-to-r from-indigo-50 dark:from-indigo-900/10 to-transparent">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-indigo-600/30">{getInitials(selectedAuditor.name)}</div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">{selectedAuditor.name}</h2>
                    <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full shadow-sm uppercase tracking-widest">Expert Sénior</span>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                    <Mail size={14} className="text-indigo-500" /> {selectedAuditor.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedAuditor(null)} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={28} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 space-y-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic border-l-4 border-indigo-600 pl-4">Skills Matrix</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={kpiData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                        <Radar name="Score" dataKey="A" stroke="#5c56e3" fill="#5c56e3" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-10">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic border-l-4 border-indigo-600 pl-4">Derniers Audits</h3>
                  <div className="space-y-4">
                    {['SOCIÉTÉ GÉNÉRALE TN', 'POSTE TUNISIENNE'].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950/40 rounded-[32px] border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center font-black">SG</div>
                          <span className="font-black text-slate-800 dark:text-white uppercase italic tracking-tighter text-sm">{c}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-100 px-3 py-1 rounded-full">Validé</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 bg-slate-50/50 dark:bg-slate-950/20">
              <button 
                onClick={() => { setSelectedAuditor(null); onNavigate('messages', { targetUser: selectedAuditor }); }} 
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 flex items-center gap-2"
              >
                <MessageSquare size={16} /> Envoyer Message
              </button>
              <button 
                onClick={() => setSelectedAuditor(null)} 
                className="px-10 py-5 bg-[#0f172a] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-black"
              >
                Fermer Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE POSTURE SÉCURITÉ CLIENT */}
      {selectedClient && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[60px] shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
            <div className="p-12 pb-10 border-b border-slate-50 dark:border-slate-800 bg-gradient-to-r from-emerald-50 dark:from-emerald-900/10 to-transparent flex justify-between items-start">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-emerald-600 rounded-[32px] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-emerald-500/30">
                  {getInitials(selectedClient.company || selectedClient.name)}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">{selectedClient.company || selectedClient.name}</h2>
                    <span className="px-3 py-1 bg-indigo-500 text-white text-[9px] font-black rounded-full uppercase tracking-[0.2em] shadow-sm">Client Gold</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Target size={14} className="text-emerald-500" /> ID: {((selectedClient as any)._id || selectedClient.id)?.toString().substring(0,8)}
                    </p>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <UserIcon size={14} className="text-indigo-500" /> Auditeur: {getAuditorForClient(selectedClient)}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Indice de Résilience', value: '91%', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                  { label: 'Vuln. Ouvertes', value: '04', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                  { label: 'Périmètres Scannés', value: '03', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                  { label: 'Maturité Globale', value: 'A+', icon: Gauge, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                ].map((kpi, idx) => (
                  <div key={idx} className="p-8 bg-slate-50 dark:bg-slate-950/40 rounded-[32px] border border-slate-100 dark:border-slate-800">
                    <div className={`p-4 ${kpi.bg} ${kpi.color} rounded-2xl w-fit mb-6 shadow-sm`}>
                      <kpi.icon size={28} />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                    <p className={`text-4xl font-black italic tracking-tighter ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 p-10 space-y-10 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                      <LayoutList size={18} className="text-indigo-500" /> Périmètre Technique
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {getOrgDetails(selectedClient)?.perimeters.map(p => (
                      <div key={p.id} className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl flex justify-between items-center border border-transparent hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-slate-400 shadow-inner"><Globe size={18} /></div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{p.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{p.target}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">Monitoring On</span>
                      </div>
                    )) || (
                      <p className="text-slate-400 text-sm italic text-center py-4">Aucun périmètre configuré</p>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 p-10 space-y-10 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                      <History size={18} className="text-emerald-500" /> Archives de Certification
                    </h3>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">3 Documents</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { title: 'Audit Annuel Q4', date: '04 Fév 2024', score: 91 },
                      { title: "Test d'Intrusion Web", date: '12 Déc 2023', score: 85 },
                      { title: 'Audit Conformité ISO', date: '22 Oct 2023', score: 78 },
                    ].map((rep, idx) => (
                      <div key={idx} className="p-6 border border-slate-100 dark:border-slate-800 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 dark:text-white uppercase text-sm italic tracking-tighter leading-none mb-1">{rep.title}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{rep.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Score</p>
                            <p className="text-sm font-black text-indigo-500 italic leading-none">{rep.score}%</p>
                          </div>
                          <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-500 transition-all shadow-sm">
                            <FileDown size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0c14] rounded-[56px] border border-white/10 p-12 space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Tendance du Score de Sécurité</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Évolution sur les 30 derniers jours</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-emerald-500" size={24} />
                    <span className="text-4xl font-black text-emerald-500 italic">+14%</span>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0c14', borderRadius: '20px', border: '1px solid #1e293b', color: '#fff' }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <div className="flex gap-8">
                <button className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">
                  <ShieldCheck size={16} /> Planifier nouvel audit
                </button>
                <button className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors">
                  <Zap size={16} /> Lancer Scan Rapide
                </button>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="px-12 py-5 bg-[#0f172a] text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all group"
              >
                QUITTER LA FICHE CLIENT <ArrowRight size={16} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INVITER MEMBRE */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[56px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 flex justify-between items-start border-b border-slate-50 dark:border-slate-800">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Nouvelle Accréditation</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic">Générer un accès sécurisé plateforme</p>
              </div>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <X size={24} className="text-slate-300" />
              </button>
            </div>
            <form className="p-12 space-y-8" onSubmit={(e) => { e.preventDefault(); setIsInviteModalOpen(false); alert('Invitation transmise !'); }}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Type de Compte</label>
                  <select className="w-full p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-black text-xs uppercase tracking-widest outline-none">
                    <option>Auditeur Sécurité</option>
                    <option>Contact Client RSSI</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Professionnel</label>
                  <input type="email" required placeholder="contact@expertise.tn" className="w-full p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold dark:text-white outline-none" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400">Annuler</button>
                <button type="submit" className="flex-[2] py-5 bg-[#5c56e3] text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                  <Zap size={16} /> Envoyer Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;