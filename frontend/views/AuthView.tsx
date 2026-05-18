import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, User as UserIcon, Briefcase, ChevronRight,
  ChevronLeft, ShieldCheck, Eye, EyeOff, Building2,
  CheckCircle2, Info, Send, ArrowLeft, KeyRound, RefreshCw
} from 'lucide-react';
import Logo from '../components/Logo';

interface AuthViewProps {
  onLogin: (user: any) => void;
  isDark: boolean;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

const AuthView: React.FC<AuthViewProps> = ({ onLogin, isDark }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    role: '', company: '', name: '', email: '', password: '', confirmPassword: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetData, setResetData] = useState({ password: '', confirmPassword: '' });
  const [resetToken, setResetToken] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setMode('reset');
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/verify-reset-token?token=${token}`);
      const data = await res.json();
      setTokenValid(data.valid);
    } catch {
      setTokenValid(false);
    }
  };

  const roles = [
    { value: 'AUDITOR', label: 'Auditeur Sécurité', desc: 'Réalise les audits et soumet les rapports', icon: ShieldCheck, color: 'indigo' },
    { value: 'CHEF', label: "Chef d'Audit", desc: "Supervise l'équipe et certifie les rapports", icon: Briefcase, color: 'purple' },
    { value: 'CLIENT', label: 'Client / Entreprise', desc: "Consulte les rapports d'audit", icon: Building2, color: 'teal' },
  ];

  const [selectedRole, setSelectedRole] = useState('client');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginData, role: selectedRole.toUpperCase() }),
      });
      const data = await res.json();

      // 🚫 Accès bloqué — rôle invalide
      if (res.status === 403) {
        setError(data.error || '🚫 Accès bloqué — Rôle non autorisé');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Identifiants incorrects');
      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      onLogin({ ...data.user, role: data.user.role?.toUpperCase() });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || 'Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    if (resetData.password !== resetData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false); return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: resetData.password,
          confirmPassword: resetData.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setMode('login');
        setResetData({ password: '', confirmPassword: '' });
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNext = () => {
    setError('');
    if (step === 1 && !registerData.role) { setError('Veuillez sélectionner un rôle.'); return; }
    if (step === 2) {
      if (!registerData.name.trim()) { setError('Le nom est requis.'); return; }
      if (!registerData.email.trim()) { setError("L'email est requis."); return; }
      if (registerData.role === 'CLIENT' && !registerData.company.trim()) {
        setError("Le nom de l'organisation est requis."); return;
      }
    }
    setStep(s => s + 1);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (registerData.password !== registerData.confirmPassword) { setError('Mots de passe différents.'); return; }
    if (registerData.password.length < 6) { setError('Minimum 6 caractères.'); return; }
    setLoading(true);
    try {
      const endpoint = registerData.role === 'CLIENT'
        ? 'http://localhost:5000/api/auth/register'
        : 'http://localhost:5000/api/role-requests';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name, email: registerData.email,
          password: registerData.password, role: registerData.role,
          company: registerData.company || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inscription');
      setMode('login'); setStep(1);
      setRegisterData({ role: '', company: '', name: '', email: '', password: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setMode('login'); setStep(1); setError(''); setSuccess('');
    setRegisterData({ role: '', company: '', name: '', email: '', password: '', confirmPassword: '' });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step > s ? 'bg-sky-400 text-white'
            : step === s ? 'bg-sky-400 text-white shadow-lg shadow-sky-400/30'
              : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-400'
            }`}>
            {step > s ? <CheckCircle2 size={16} /> : s}
          </div>
          {s < 3 && <div className={`w-8 h-0.5 transition-all ${step > s ? 'bg-sky-400' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-black uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-[#0f2a55]'}`}>Quel est votre rôle ?</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sélectionnez votre profil pour commencer</p>
      </div>
      {roles.map(role => {
        const RoleIcon = role.icon;
        const isSelected = registerData.role === role.value;
        const colorMap: Record<string, string> = {
          indigo: isSelected ? (isDark ? 'border-sky-400 bg-sky-400/10' : 'border-sky-400 bg-sky-50') : '',
          purple: isSelected ? (isDark ? 'border-sky-500 bg-sky-400/10' : 'border-sky-500 bg-sky-50') : '',
          teal: isSelected ? (isDark ? 'border-sky-600 bg-sky-400/10' : 'border-sky-600 bg-sky-50') : '',
        };
        const iconMap: Record<string, string> = { indigo: 'text-sky-400', purple: 'text-sky-400', teal: 'text-sky-400' };
        return (
          <button key={role.value} type="button"
            onClick={() => setRegisterData({ ...registerData, role: role.value })}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${isSelected ? colorMap[role.color]
              : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
              }`}
          >
            <div className={`p-3 rounded-xl ${isSelected ? colorMap[role.color] : isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <RoleIcon size={22} className={isSelected ? iconMap[role.color] : 'text-slate-400'} />
            </div>
            <div>
              <p className={`font-black uppercase text-sm tracking-tight ${isSelected ? (isDark ? 'text-white' : 'text-[#0f2a55]') : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>{role.label}</p>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{role.desc}</p>
            </div>
            {isSelected && <CheckCircle2 size={20} className={`ml-auto ${iconMap[role.color]}`} />}
          </button>
        );
      })}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-black uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-[#0f2a55]'}`}>Vos informations</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Renseignez vos coordonnées personnelles</p>
      </div>
      {[
        { label: 'Nom complet', icon: UserIcon, type: 'text', ph: 'Ex: Mariem Khemis', val: registerData.name, set: (v: string) => setRegisterData({ ...registerData, name: v }) },
        { label: 'Adresse email', icon: Mail, type: 'email', ph: 'votre@email.com', val: registerData.email, set: (v: string) => setRegisterData({ ...registerData, email: v }) },
      ].map((f, i) => (
        <div key={i} className="space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{f.label}</label>
          <div className="relative">
            <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type={f.type} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' : 'bg-white/80 border-slate-200 text-[#0f2a55] placeholder-slate-400'
                }`} />
          </div>
        </div>
      ))}
      {registerData.role === 'CLIENT' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Organisation <span className="text-rose-500">*</span></label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Ex: Société Générale TN" value={registerData.company}
              onChange={e => setRegisterData({ ...registerData, company: e.target.value })}
              className={`w-full pl-12 pr-4 py-4 border rounded-2xl text-sm font-bold outline-none transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' : 'bg-white/80 border-slate-200 text-[#0f2a55]'
                }`} />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-black uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-[#0f2a55]'}`}>Sécurité du compte</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choisissez un mot de passe sécurisé</p>
      </div>
      {[
        { label: 'Mot de passe', ph: 'Min. 6 caractères', val: registerData.password, set: (v: string) => setRegisterData({ ...registerData, password: v }) },
        { label: 'Confirmer', ph: 'Répétez', val: registerData.confirmPassword, set: (v: string) => setRegisterData({ ...registerData, confirmPassword: v }) },
      ].map((f, i) => (
        <div key={i} className="space-y-2">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{f.label}</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type={showPassword ? 'text' : 'password'} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500' : 'bg-white/80 border-slate-200 text-[#0f2a55]'
                }`} />
            {i === 0 && <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>}
          </div>
        </div>
      ))}
      {registerData.role !== 'CLIENT' && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in duration-300 ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            <span className="font-black">Demande en attente :</span> Un administrateur examinera votre demande avant activation.
          </p>
        </div>
      )}
    </div>
  );

  const cardClass = isDark
    ? 'bg-[#0f1e3d] border border-[rgba(56,139,253,0.15)]'
    : 'bg-white/90 border border-[rgba(168,212,255,0.40)] backdrop-blur-xl shadow-[0_20px_60px_rgba(37,99,235,0.12)]';

  const inputClass = isDark
    ? 'bg-[#0D1829] border-[rgba(56,139,253,0.15)] text-[#CDD9F0] placeholder-[#364F6B]'
    : 'bg-white/80 border-[rgba(168,212,255,0.50)] text-[#0f2a55] placeholder-[#94a3b8]';

  return (
    // DARK MODE — dégradé bleu nuit vers noir marine
    // LIGHT MODE — dégradé bleu ciel clair vers bleu acier

    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-all duration-500"
      style={{
        background: isDark
          ? 'linear-gradient(to left, #020d28, #071a4a, #0d2d6b, #1a4a8a)'
          : 'linear-gradient(to left, #6b94c4, #8aaed4, #b8cfe8, #ddeeff)',
      }}
    >
      {/* Blobs décoratifs inchangés */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] ${isDark ? 'bg-indigo-900/20' : 'bg-blue-300/20'}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] ${isDark ? 'bg-blue-900/15' : 'bg-blue-200/25'}`}></div>
      </div>

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-[520px] rounded-[40px] transition-all duration-500 ${cardClass}`}
        style={{ boxShadow: isDark ? '0 40px 120px rgba(0,0,0,0.6), 0 0 40px rgba(56,139,253,0.08)' : undefined }}
      >
        {/* Header */}
        <div className={`p-10 pb-6 text-center border-b transition-colors duration-500 ${isDark ? 'border-[rgba(56,139,253,0.10)]' : 'border-[rgba(168,212,255,0.35)]'}`}>
          <div className="flex justify-center mb-4">
            <Logo size={56} showText={true} isDark={isDark} />
          </div>
          <h2 className={`text-xl font-black uppercase italic tracking-tighter mt-2 ${isDark ? 'text-[#CDD9F0]' : 'text-[#0f2a55]'}`}>
            {mode === 'login' ? 'Connexion à votre compte'
              : mode === 'register' ? 'Créer un compte'
                : mode === 'forgot' ? 'Récupération de compte'
                  : 'Nouveau mot de passe'}
          </h2>
          {mode === 'register' && (
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Étape {step} sur 3</p>
          )}
        </div>

        <div className="p-10">

          {/* ── MODE FORGOT ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6 animate-in fade-in duration-300">
              {!success ? (
                <>
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-indigo-500/5 border-indigo-500/15' : 'bg-blue-50 border-blue-100'}`}>
                    <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Saisissez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Adresse email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="email" required placeholder="votre@email.com" value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${inputClass}`} />
                    </div>
                  </div>
                  {error && <div className={`p-4 rounded-2xl border ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}><p className="text-rose-500 text-xs font-bold">⚠️ {error}</p></div>}
                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                    {loading ? <><RefreshCw size={16} className="animate-spin" /> Envoi...</> : <><Send size={16} /> Envoyer le lien de récupération</>}
                  </button>
                </>
              ) : (
                <div className="text-center py-6 space-y-6 animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                    <Mail size={36} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className={`font-black uppercase italic text-base tracking-tighter ${isDark ? 'text-white' : 'text-[#0f2a55]'}`}>Email envoyé !</p>
                    <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{success}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border text-left ${isDark ? 'bg-indigo-500/5 border-indigo-500/15' : 'bg-blue-50 border-blue-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Prochaines étapes :</p>
                    <ul className={`text-[11px] space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <li>📧 Vérifiez votre boîte email</li>
                      <li>🔗 Cliquez sur le lien reçu</li>
                      <li>⏱️ Le lien expire dans <strong>1 heure</strong></li>
                    </ul>
                  </div>
                </div>
              )}
              <div className="text-center mt-4">
                <button type="button" onClick={resetToLogin}
                  className={`flex items-center gap-2 mx-auto text-xs font-black uppercase tracking-widest hover:underline transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-[#0f2a55]'}`}>
                  <ArrowLeft size={14} /> Retour à la connexion
                </button>
              </div>
            </form>
          )}

          {/* ── MODE RESET ── */}
          {mode === 'reset' && (
            <div className="animate-in fade-in duration-300">
              {tokenValid === null && (
                <div className="text-center py-12 space-y-4">
                  <RefreshCw size={32} className="animate-spin text-indigo-400 mx-auto" />
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vérification du lien...</p>
                </div>
              )}
              {tokenValid === false && (
                <div className="text-center py-6 space-y-6">
                  <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                    <KeyRound size={36} className="text-rose-500" />
                  </div>
                  <div>
                    <p className={`font-black uppercase italic text-base tracking-tighter ${isDark ? 'text-white' : 'text-[#0f2a55]'}`}>Lien invalide</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande.</p>
                  </div>
                  <button onClick={() => { setMode('forgot'); setTokenValid(null); }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
                    Nouvelle demande
                  </button>
                </div>
              )}
              {tokenValid === true && !success && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 mb-4">
                      <KeyRound size={28} className="text-indigo-400" />
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choisissez un nouveau mot de passe sécurisé.</p>
                  </div>
                  {[
                    { label: 'Nouveau mot de passe', ph: 'Min. 6 caractères', val: resetData.password, set: (v: string) => setResetData({ ...resetData, password: v }) },
                    { label: 'Confirmer', ph: 'Répétez', val: resetData.confirmPassword, set: (v: string) => setResetData({ ...resetData, confirmPassword: v }) },
                  ].map((f, i) => (
                    <div key={i} className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{f.label}</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type={showPassword ? 'text' : 'password'} placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} required
                          className={`w-full pl-12 pr-12 py-4 border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${inputClass}`} />
                        {i === 0 && <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>}
                      </div>
                    </div>
                  ))}
                  {resetData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${resetData.password.length >= i * 2 ? (i <= 1 ? 'bg-rose-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-blue-500' : 'bg-emerald-500') : (isDark ? 'bg-slate-700' : 'bg-slate-200')}`}></div>
                        ))}
                      </div>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {resetData.password.length < 4 ? '⚠️ Trop court' : resetData.password.length < 6 ? '🔒 Faible' : resetData.password.length < 10 ? '✅ Moyen' : '🛡️ Fort'}
                      </p>
                    </div>
                  )}
                  {error && <div className={`p-4 rounded-2xl border ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}><p className="text-rose-500 text-xs font-bold">⚠️ {error}</p></div>}
                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                    {loading ? <><RefreshCw size={16} className="animate-spin" /> Mise à jour...</> : <><ShieldCheck size={16} /> Définir le nouveau mot de passe</>}
                  </button>
                </form>
              )}
              {tokenValid === true && success && (
                <div className="text-center py-6 space-y-6 animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                    <CheckCircle2 size={36} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className={`font-black uppercase italic text-base tracking-tighter ${isDark ? 'text-white' : 'text-[#0f2a55]'}`}>Mot de passe mis à jour !</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Redirection vers la connexion...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MODE LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Sélectionnez votre rôle</label>
                <div className="relative">
                  <select
                    value={selectedRole}
                    className={`w-full p-4 border rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer transition-all ${inputClass}`}
                    onChange={e => {
                      setSelectedRole(e.target.value);
                    }}>
                    <option value="client">Client / Entreprise</option>
                    <option value="admin">Administrateur</option>
                    <option value="chef">Chef d'Audit</option>
                    <option value="auditor">Auditeur Sécurité</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="email" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                    className={`w-full pl-12 pr-4 py-4 border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${inputClass}`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    className={`w-full pl-12 pr-12 py-4 border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${inputClass}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className={`text-[11px] font-bold hover:underline transition-colors ${isDark ? 'text-[#388BFD] hover:text-[#60a5fa]' : 'text-[#2563eb] hover:text-[#1d4ed8]'}`}>
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
              {error && <div className={`p-4 rounded-2xl border ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}><p className="text-rose-500 text-xs font-bold">⚠️ {error}</p></div>}
              <button type="submit" disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                {loading ? 'Connexion...' : <><span>Se connecter</span> <ChevronRight size={20} /></>}
              </button>
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-blue-50 border-blue-100'}`}>
                <Info size={16} className={`shrink-0 mt-0.5 ${isDark ? 'text-indigo-400' : 'text-blue-500'}`} />
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className={`font-black ${isDark ? 'text-indigo-400' : 'text-blue-600'}`}>Première connexion ?</span> Votre administrateur vous a envoyé vos identifiants par email sécurisé.
                </p>
              </div>
            </form>
          )}

          {/* ── MODE REGISTER ── */}
          {mode === 'register' && (
            <form onSubmit={step === 3 ? handleRegisterSubmit : (e) => { e.preventDefault(); handleRegisterNext(); }}>
              {renderStepIndicator()}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {error && <div className={`mt-4 p-4 rounded-2xl border ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}><p className="text-rose-500 text-xs font-bold">⚠️ {error}</p></div>}
              <div className="flex gap-4 mt-6">
                {step > 1 && <button type="button" onClick={() => { setStep(s => s - 1); setError(''); }}
                  className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <ChevronLeft size={16} /> Retour
                </button>}
                <button type="submit" disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                  {loading ? 'Envoi...' : step === 3
                    ? registerData.role === 'CLIENT' ? <><ShieldCheck size={16} /> Créer mon compte</> : <><Send size={16} /> Envoyer la demande</>
                    : <><span>Suivant</span> <ChevronRight size={16} /></>}
                </button>
              </div>
            </form>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="mt-8 text-center">
              <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {mode === 'login' ? 'Nouveau client ?' : 'Déjà un compte ?'}{' '}
                <button onClick={() => { mode === 'login' ? setMode('register') : resetToLogin(); }}
                  className={`font-black hover:underline uppercase tracking-widest ${isDark ? 'text-[#388BFD]' : 'text-[#2563eb]'}`}>
                  {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className={`text-[9px] uppercase tracking-widest font-black flex items-center justify-center gap-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              <ShieldCheck size={12} /> Infrastructure certifiée KSI V4.2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;