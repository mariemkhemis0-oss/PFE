import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Target, Key, Plus, Trash2, RefreshCw, Search, X, ChevronRight,
  Server, Shield, Wifi, WifiOff, Eye, EyeOff, Database, Zap, Info
} from 'lucide-react';

interface AssetManagerProps {
  organizationId: string;
  organizationName: string;
  isDark?: boolean;
}

interface TargetItem {
  _id: string;
  name: string;
  hosts: string;
  excludeHosts: string;
  gvmTargetId: string | null;
  credentialId: any;
  status: string;
  scanCount: number;
  lastScanDate: string | null;
  comment: string;
  createdAt: string;
}

interface CredentialItem {
  _id: string;
  name: string;
  type: string;
  username: string;
  gvmCredentialId: string | null;
  status: string;
  createdAt: string;
}

const AssetManager: React.FC<AssetManagerProps> = ({ organizationId, organizationName, isDark = true }) => {
  const [activeTab, setActiveTab] = useState<'targets' | 'credentials'>('targets');
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Modals ──
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);

  // ── Target Form ──
  const [targetForm, setTargetForm] = useState({ name: '', hosts: '', excludeHosts: '', credentialId: '', comment: '' });

  // ── Credential Form ──
  const [credForm, setCredForm] = useState({ name: '', type: 'SSH', username: '', password: '', port: '' });
  const [showPassword, setShowPassword] = useState(false);

  // ── Fetch Data ──
  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch(`/api/targets?orgId=${organizationId}`);
      if (res.ok) setTargets(await res.json());
    } catch (e) { console.error('Fetch targets error:', e); }
  }, [organizationId]);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch(`/api/credentials?orgId=${organizationId}`);
      if (res.ok) setCredentials(await res.json());
    } catch (e) { console.error('Fetch credentials error:', e); }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchTargets();
      fetchCredentials();
    }
  }, [organizationId, fetchTargets, fetchCredentials]);

  // ── Create Target ──
  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetForm, organizationId }),
      });
      if (res.ok) {
        await fetchTargets();
        setShowTargetModal(false);
        setTargetForm({ name: '', hosts: '', excludeHosts: '', credentialId: '', comment: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur création cible');
      }
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  // ── Create Credential ──
  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credForm, organizationId, port: credForm.port ? parseInt(credForm.port) : null }),
      });
      if (res.ok) {
        await fetchCredentials();
        setShowCredModal(false);
        setCredForm({ name: '', type: 'SSH', username: '', password: '', port: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur création credential');
      }
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  // ── Delete ──
  const handleDeleteTarget = async (id: string) => {
    if (!window.confirm('Supprimer cette cible et la désynchroniser de GVM ?')) return;
    await fetch(`/api/targets/${id}`, { method: 'DELETE' });
    fetchTargets();
  };

  const handleDeleteCredential = async (id: string) => {
    if (!window.confirm('Supprimer ce credential ? Les cibles liées perdront leur authentification.')) return;
    await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
    fetchCredentials();
  };

  // ── Sync ──
  const handleSyncTarget = async (id: string) => {
    setLoading(true);
    await fetch(`/api/targets/${id}/sync`, { method: 'POST' });
    await fetchTargets();
    setLoading(false);
  };

  const handleSyncCredential = async (id: string) => {
    setLoading(true);
    await fetch(`/api/credentials/${id}/sync`, { method: 'POST' });
    await fetchCredentials();
    setLoading(false);
  };

  // ── Filter ──
  const filteredTargets = targets.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.hosts.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredCreds = credentials.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'targets' as const, label: 'CIBLES', icon: Target, count: targets.length },
    { id: 'credentials' as const, label: 'CREDENTIALS', icon: Key, count: credentials.length },
  ];

  const inputClass = "w-full px-5 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none text-sm font-bold text-slate-900 dark:text-white focus:border-[#57a9d9]/50 transition-all";
  const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            GESTIONNAIRE D'ACTIFS
          </h2>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">
            {organizationName} — CIBLES & CREDENTIALS
          </p>
        </div>
        <button
          onClick={() => activeTab === 'targets' ? setShowTargetModal(true) : setShowCredModal(true)}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white shadow-xl hover:opacity-90 transition-all active:scale-95"
          style={{ backgroundColor: '#57a9d9' }}
        >
          <Plus size={18} />
          {activeTab === 'targets' ? 'NOUVELLE CIBLE' : 'NOUVEAU CREDENTIAL'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-[#57a9d9] text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-[9px] ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-xs font-bold text-slate-900 dark:text-white focus:border-[#57a9d9]/40"
        />
      </div>

      {/* ═══ TARGETS TAB ═══ */}
      {activeTab === 'targets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTargets.length === 0 ? (
            <div className="col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-16 text-center">
              <Target size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-lg font-black text-slate-500 italic">Aucune cible configurée</p>
              <p className="text-xs text-slate-400 mt-2">Créez votre première cible pour commencer les scans</p>
            </div>
          ) : filteredTargets.map(target => (
            <div key={target._id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 hover:border-[#57a9d9]/30 transition-all group shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border ${target.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                    <Server size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{target.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">
                      {target.gvmTargetId ? (
                        <span className="text-emerald-500">● Synchronisé GVM</span>
                      ) : (
                        <span className="text-rose-500">● Non synchronisé</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {!target.gvmTargetId && (
                    <button onClick={() => handleSyncTarget(target._id)} className="p-2 bg-[#57a9d9]/10 text-[#57a9d9] rounded-xl hover:bg-[#57a9d9]/20 transition-all" title="Synchroniser GVM">
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteTarget(target._id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all" title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest w-16">HÔTES</span>
                  <code className="text-xs font-mono text-[#57a9d9] bg-[#57a9d9]/5 px-3 py-1 rounded-lg border border-[#57a9d9]/10 flex-1 truncate">{target.hosts}</code>
                </div>
                {target.excludeHosts && (
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest w-16">EXCLUS</span>
                    <code className="text-xs font-mono text-amber-500 bg-amber-500/5 px-3 py-1 rounded-lg border border-amber-500/10 flex-1 truncate">{target.excludeHosts}</code>
                  </div>
                )}
                {target.credentialId && (
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest w-16">AUTH</span>
                    <span className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                      <Key size={12} /> {target.credentialId.name || 'Credential lié'} ({target.credentialId.type})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {target.scanCount} scan(s) • {new Date(target.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  target.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>{target.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ CREDENTIALS TAB ═══ */}
      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCreds.length === 0 ? (
            <div className="col-span-3 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-16 text-center">
              <Key size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-lg font-black text-slate-500 italic">Aucun credential configuré</p>
              <p className="text-xs text-slate-400 mt-2">Ajoutez des identifiants SSH/SMB pour les scans authentifiés</p>
            </div>
          ) : filteredCreds.map(cred => (
            <div key={cred._id} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 hover:border-[#57a9d9]/30 transition-all group shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border ${
                    cred.type === 'SSH' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    cred.type === 'SMB' ? 'bg-[#57a9d9]/10 text-[#57a9d9] border-[#57a9d9]/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{cred.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">{cred.type}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {!cred.gvmCredentialId && (
                    <button onClick={() => handleSyncCredential(cred._id)} className="p-2 bg-[#57a9d9]/10 text-[#57a9d9] rounded-xl hover:bg-[#57a9d9]/20 transition-all">
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteCredential(cred._id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest w-14">USER</span>
                  <code className="text-xs font-mono text-slate-300">{cred.username}</code>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest w-14">PASS</span>
                  <code className="text-xs font-mono text-slate-500">••••••••</code>
                  <span className="text-[8px] text-emerald-500 font-bold">🔒 CHIFFRÉ AES-256</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest w-14">GVM</span>
                  {cred.gvmCredentialId ? (
                    <span className="text-xs font-bold text-emerald-500">● Synchronisé</span>
                  ) : (
                    <span className="text-xs font-bold text-rose-500">● Non sync</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ CREATE TARGET MODAL ═══ */}
      {showTargetModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" style={{ zIndex: 9999 }} onClick={() => setShowTargetModal(false)}>
          <div className="bg-white dark:bg-[#0a0c14] rounded-[32px] border border-slate-200 dark:border-white/10 p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">NOUVELLE CIBLE</h3>
              <button onClick={() => setShowTargetModal(false)} className="p-2 text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateTarget} className="space-y-6">
              <div>
                <label className={labelClass}>NOM DE LA CIBLE</label>
                <input className={inputClass} value={targetForm.name} onChange={e => setTargetForm({...targetForm, name: e.target.value})} placeholder="Serveurs Production" required />
              </div>
              <div>
                <label className={labelClass}>HÔTES (IP, CIDR, HOSTNAME)</label>
                <textarea className={`${inputClass} h-24 resize-none`} value={targetForm.hosts} onChange={e => setTargetForm({...targetForm, hosts: e.target.value})} placeholder="192.168.1.0/24, 10.0.0.1, server.example.com" required />
                <p className="text-[9px] text-slate-500 mt-1">Séparez les hôtes par des virgules. Formats acceptés : IP, plage CIDR, hostname</p>
              </div>
              <div>
                <label className={labelClass}>HÔTES EXCLUS (OPTIONNEL)</label>
                <input className={inputClass} value={targetForm.excludeHosts} onChange={e => setTargetForm({...targetForm, excludeHosts: e.target.value})} placeholder="192.168.1.254, 192.168.1.1" />
                <p className="text-[9px] text-slate-500 mt-1">Équipements à ne pas scanner (dispositifs médicaux, automates...)</p>
              </div>
              <div>
                <label className={labelClass}>CREDENTIAL D'AUTHENTIFICATION (OPTIONNEL)</label>
                <select className={inputClass} value={targetForm.credentialId} onChange={e => setTargetForm({...targetForm, credentialId: e.target.value})}>
                  <option value="">— Scan non authentifié —</option>
                  {credentials.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.type} - {c.username})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>COMMENTAIRE</label>
                <input className={inputClass} value={targetForm.comment} onChange={e => setTargetForm({...targetForm, comment: e.target.value})} placeholder="Notes sur cette cible..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTargetModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">ANNULER</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50" style={{ backgroundColor: '#57a9d9' }}>
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Target size={16} /> CRÉER & SYNCHRONISER GVM</>}
                </button>
              </div>
            </form>
        </div>
        </div>,
        document.body
      )}

      {/* ═══ CREATE CREDENTIAL MODAL ═══ */}
      {showCredModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" style={{ zIndex: 9999 }} onClick={() => setShowCredModal(false)}>
          <div className="bg-white dark:bg-[#0a0c14] rounded-[32px] border border-slate-200 dark:border-white/10 p-10 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">NOUVEAU CREDENTIAL</h3>
              <button onClick={() => setShowCredModal(false)} className="p-2 text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateCredential} className="space-y-6">
              <div>
                <label className={labelClass}>NOM</label>
                <input className={inputClass} value={credForm.name} onChange={e => setCredForm({...credForm, name: e.target.value})} placeholder="SSH Root Production" required />
              </div>
              <div>
                <label className={labelClass}>TYPE</label>
                <select className={inputClass} value={credForm.type} onChange={e => setCredForm({...credForm, type: e.target.value})}>
                  <option value="SSH">SSH</option>
                  <option value="SMB">SMB (Windows)</option>
                  <option value="ESXi">ESXi (VMware)</option>
                  <option value="SNMP">SNMP</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>NOM D'UTILISATEUR</label>
                <input className={inputClass} value={credForm.username} onChange={e => setCredForm({...credForm, username: e.target.value})} placeholder="root" required />
              </div>
              <div>
                <label className={labelClass}>MOT DE PASSE</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} className={inputClass} value={credForm.password} onChange={e => setCredForm({...credForm, password: e.target.value})} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[9px] text-emerald-500 mt-1 flex items-center gap-1">🔒 Chiffré AES-256-GCM avant stockage</p>
              </div>
              {credForm.type === 'SSH' && (
                <div>
                  <label className={labelClass}>PORT SSH (OPTIONNEL)</label>
                  <input className={inputClass} value={credForm.port} onChange={e => setCredForm({...credForm, port: e.target.value})} placeholder="22" type="number" />
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCredModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">ANNULER</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50" style={{ backgroundColor: '#57a9d9' }}>
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Key size={16} /> CRÉER & CHIFFRER</>}
                </button>
              </div>
            </form>
        </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AssetManager;
