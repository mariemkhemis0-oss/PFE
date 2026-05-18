import React, { useState } from 'react';
import {
  User, Mail, Lock, Save, Moon, Sun, Eye, EyeOff,
  ShieldCheck, Bell, Globe, CheckCircle2
} from 'lucide-react';
import { User as UserType } from '../types';
import Avatar from '../components/Avatar';

interface SettingsViewProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, isDark, setIsDark }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const userId = (user as any)._id || user.id;

  const handleSaveProfile = async () => {
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          avatar: (user as any).avatar ?? null,
          avatarColor: (user as any).avatarColor ?? '#5c56e3',
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updatedUser = await res.json();
      // Fusionne toutes les données y compris avatar/avatarColor
      onUpdateUser({ ...user, ...updatedUser });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde.');
    }
  };

  const handleAvatarUpdate = async (data: { avatar?: string; avatarColor?: string }) => {
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          avatar: data.avatar ?? (user as any).avatar ?? null,
          avatarColor: data.avatarColor ?? (user as any).avatarColor ?? '#5c56e3',
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updatedUser = await res.json();
      // Met à jour App.tsx + localStorage immédiatement
      onUpdateUser({ ...user, ...updatedUser });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError('Erreur sauvegarde avatar : ' + e.message);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 6) { setError('Minimum 6 caractères.'); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur changement de mot de passe.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'preferences', label: 'Préférences', icon: Globe },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-3xl mx-auto">

      <div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Paramètres</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-1">Gérez votre profil et vos préférences.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setError(''); setSaved(false); }}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#347ABF] text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-[#347ABF] dark:bg-[#0f172a]'
              }`}
            >
              <TabIcon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* PROFIL */}
      {activeTab === 'profile' && (
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* Avatar section */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Photo de profil</h3>
            <div className="flex items-center gap-8">
              <Avatar
                user={user}
                size={96}
                editable={true}
                onUpdate={handleAvatarUpdate}
              />
              <div>
                <p className="font-black text-slate-800 dark:text-white uppercase italic tracking-tight text-lg">{user.name}</p>
                <p className="text-sm text-slate-400 font-medium mt-1">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                  {user.role}
                </span>
              </div>
            </div>
            {saved && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">Avatar sauvegardé !</p>
              </div>
            )}
          </div>

          {/* Infos personnelles */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Informations personnelles</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
                <p className="text-rose-500 text-xs font-bold">⚠️ {error}</p>
              </div>
            )}
            {saved && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">Sauvegardé avec succès !</p>
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Save size={16} /> Sauvegarder les modifications
            </button>
          </div>
        </div>
      )}

      {/* SÉCURITÉ */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-300">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Changer le mot de passe</h3>
          {[
            { label: 'Mot de passe actuel', value: currentPassword, setter: setCurrentPassword, placeholder: '••••••••' },
            { label: 'Nouveau mot de passe', value: newPassword, setter: setNewPassword, placeholder: 'Min. 6 caractères' },
            { label: 'Confirmer le nouveau', value: confirmPassword, setter: setConfirmPassword, placeholder: 'Répétez' },
          ].map((field, i) => (
            <div key={i} className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={field.value}
                  onChange={e => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                {i === 0 && (
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
              <p className="text-rose-500 text-xs font-bold">⚠️ {error}</p>
            </div>
          )}
          {saved && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">Mot de passe mis à jour !</p>
            </div>
          )}

          <button
            onClick={handleChangePassword}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <ShieldCheck size={16} /> Mettre à jour le mot de passe
          </button>
        </div>
      )}

      {/* PRÉFÉRENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-300">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Apparence & Notifications</h3>

          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              {isDark ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-500" />}
              <div>
                <p className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">
                  Thème {isDark ? 'sombre' : 'clair'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Changer l'apparence de l'interface</p>
              </div>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`w-14 h-7 rounded-full transition-all relative ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isDark ? 'left-7' : 'left-0.5'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <Bell size={20} className="text-amber-500" />
              <div>
                <p className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">Notifications</p>
                <p className="text-[10px] text-slate-400 font-medium">Recevoir les alertes rapport</p>
              </div>
            </div>
            <button className="w-14 h-7 rounded-full bg-emerald-500 relative">
              <div className="absolute top-0.5 left-7 w-6 h-6 bg-white rounded-full shadow-md"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;