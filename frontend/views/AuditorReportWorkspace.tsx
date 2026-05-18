import React, { useState, useEffect, useRef } from 'react';
import { 
  Info, ClipboardCheck, Server, Terminal,
  ChevronLeft, ChevronRight, Save, Plus, Trash2, 
  CheckCircle2, ShieldCheck, Zap, Globe, Monitor, 
  FileText, Loader2, X, MessageSquare, PlusCircle, 
  Link as LinkIcon, Shield, Cloud, HardDrive, Edit3,
  Search, Filter, Activity, AlertTriangle, Cpu, Download,
  StopCircle, Wifi, WifiOff, Calendar
} from 'lucide-react';
import { User } from '../types';
import OrganizationSelector from '../components/OrganizationSelector';
import { useAudit, Organization } from '../context/AuditContext';
import AssetManager from './AssetManager';
import ScheduleModal from '../components/ScheduleModal';

interface AuditorReportWorkspaceProps {
  user: User;
  isDark: boolean;
}

type Section = 'questionnaire' | 'assets' | 'targets' | 'scans' | 'validation';

interface Asset {
  id: string;
  category: string;
  name: string;
  ip: string;
  os: string;
  criticality: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Audited' | 'Pending';
}

interface Question {
  id: string;
  text: string;
  response?: 'oui' | 'non' | 'partiel';
  maturity?: string;
  comment?: string;
  proof?: string;
}

interface Axis {
  id: string;
  title: string;
  questions: Question[];
}

const API_URL = 'http://localhost:5000/api';

const AuditorReportWorkspace: React.FC<AuditorReportWorkspaceProps> = ({ user, isDark }) => {
  const { 
    selectedOrganization, setSelectedOrganization, clearSelection,
    isScanning, setIsScanning,
    scanId, setScanId,
    scanProgress, setScanProgress,
    scanStatus, setScanStatus,
    scanTargets, setScanTargets,
    scanProfile, setScanProfile,
    gvmConnected, setGvmConnected,
    generatedReport, setGeneratedReport,
    terminalLogs, setTerminalLogs
  } = useAudit();
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('questionnaire');
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<string | null>(null);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [loadingOrgData, setLoadingOrgData] = useState(false);
  const [configuredTargets, setConfiguredTargets] = useState<any[]>([]);

  // Charger les cibles configurées quand l'org change ou quand on va sur scans
  useEffect(() => {
    if (selectedOrganization) {
      const orgId = (selectedOrganization as any)._id || (selectedOrganization as any).id || '';
      fetch(`http://localhost:5000/api/targets?orgId=${orgId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setConfiguredTargets(Array.isArray(data) ? data : []);
        })
        .catch(() => setConfiguredTargets([]));
    } else {
      setConfiguredTargets([]);
    }
  }, [selectedOrganization, activeSection]);

  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reportTab, setReportTab] = useState<'resume' | 'detail'>('resume');

  const [assets, setAssets] = useState<Asset[]>([]);

  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ name: '', ip: '', os: '', criticality: 'Medium' });
  
  const [axes, setAxes] = useState<Axis[]>([
    {
      id: 'axe1', title: '1. Mesures Organisationnelles',
      questions: [
        { id: 'q1', text: "L'organisme dispose-t-il d'une PSSI (Politique de Sécurité) formelle et approuvée ?" },
        { id: 'q2', text: "Un Responsable de la Sécurité (RSSI) a-t-il été officiellement désigné ?" },
        { id: 'q3', text: "Existe-t-il un inventaire à jour de tous les actifs critiques (matériel et logiciels) ?" },
        { id: 'q4', text: "Une procédure de gestion des incidents de sécurité est-elle documentée ?" },
      ]
    },
    {
      id: 'axe2', title: '2. Mesures liées aux Personnes',
      questions: [
        { id: 'q5', text: "Les employés reçoivent-ils une sensibilisation régulière à la cybersécurité ?" },
        { id: 'q6', text: "Les contrats incluent-ils des clauses de confidentialité et de responsabilité cyber ?" },
        { id: 'q7', text: "Existe-t-il une procédure pour révoquer les accès dès le départ d'un employé ?" },
      ]
    },
    {
      id: 'axe3', title: "3. Mesures d'Ordre Physique",
      questions: [
        { id: 'q8', text: "L'accès à la salle serveur est-il protégé par un contrôle d'accès (badge/clé) ?" },
        { id: 'q9', text: "La salle serveur dispose-t-elle de détection d'incendie et de climatisation ?" },
        { id: 'q10', text: "Les écrans des postes de travail se verrouillent-ils automatiquement après inactivité ?" },
      ]
    },
    {
      id: 'axe4', title: '4. Mesures Technologiques',
      questions: [
        { id: 'q11', text: "Une solution de sauvegarde (Backup) est-elle en place et testée régulièrement ?" },
        { id: 'q12', text: "L'authentification à deux facteurs (MFA) est-elle activée pour les accès distants ?" },
        { id: 'q13', text: "Le réseau est-il segmenté pour isoler les serveurs des postes utilisateurs ?" },
        { id: 'q14', text: "Un antivirus centralisé est-il déployé et à jour sur tout le parc ?" },
        { id: 'q15', text: "Existe-t-il une politique de mise à jour (Patch Management) pour les systèmes critiques ?" },
      ]
    }
  ]);

  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [newQuestionData, setNewQuestionData] = useState({ axisId: 'axe1', text: '' });
  const [auditDataLoaded, setAuditDataLoaded] = useState(false);
  const [isSavingAuditData, setIsSavingAuditData] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  useEffect(() => {
    if (scanStatus === 'COMPLETED' && generatedReport && activeSection !== 'validation') {
      setTimeout(() => setActiveSection('validation'), 1500);
    }
  }, [scanStatus, generatedReport, activeSection]);

  // Test GVM connection on section change to scans
  useEffect(() => {
    if (activeSection === 'scans') testGvmConnection();
  }, [activeSection]);

  // Charger les données de l'organisation quand elle est sélectionnée
  useEffect(() => {
    if (!selectedOrganization) return;
    const loadOrgData = async () => {
      try {
        setLoadingOrgData(true);
        const token = localStorage.getItem('token');
        const hostsRes = await fetch(`${API_URL}/audits/organizations/${selectedOrganization.id}/hosts`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!hostsRes.ok) throw new Error('Erreur chargement hosts');
        const hostsData = await hostsRes.json();
        setOrganizationData({ hosts: hostsData.hosts || [] });
      } catch (error) {
        console.error('Erreur chargement données organisation:', error);
      } finally {
        setLoadingOrgData(false);
      }
    };
    loadOrgData();
  }, [selectedOrganization]);

  // ── Charger questionnaire + assets depuis la DB ──
  useEffect(() => {
    if (!selectedOrganization) return;
    const orgId = (selectedOrganization as any)._id || (selectedOrganization as any).id;
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/audit-data?orgId=${orgId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.axes && data.axes.length > 0) {
          setAxes(data.axes);
        }
        if (data && data.assets && data.assets.length > 0) {
          setAssets(data.assets.map((a: any, i: number) => ({ ...a, id: a._id || a.id || String(i) })));
        }
        setAuditDataLoaded(true);
      })
      .catch(() => setAuditDataLoaded(true));
  }, [selectedOrganization]);

  // ── Auto-save questionnaire + assets (debounce 2s) ──
  useEffect(() => {
    if (!selectedOrganization || !auditDataLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const orgId = (selectedOrganization as any)._id || (selectedOrganization as any).id;
      const token = localStorage.getItem('token');
      try {
        setIsSavingAuditData(true);
        await fetch(`${API_URL}/audit-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ organizationId: orgId, axes, assets }),
        });
      } catch (e) {
        console.error('[AuditData] Auto-save error:', e);
      } finally {
        setIsSavingAuditData(false);
      }
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [axes, assets, selectedOrganization, auditDataLoaded]);

  // ══════════════════════════════════════════════════════════════
  //  FONCTIONS SCAN — BRANCHÉES SUR LE VRAI BACKEND
  // ══════════════════════════════════════════════════════════════

  const testGvmConnection = async () => {
    try {
      const res = await fetch(`${API_URL}/scans/test-connection`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setGvmConnected(data.connected);
      if (data.connected) {
        setTerminalLogs((prev: string[]) => [...prev, `[GVM] ✅ Connecté — Version: ${data.version}`]);
      } else {
        setTerminalLogs((prev: string[]) => [...prev, `[GVM] ❌ Non connecté: ${data.error || 'Vérifiez la VM'}`]);
      }
    } catch {
      setGvmConnected(false);
      setTerminalLogs((prev: string[]) => [...prev, '[GVM] ❌ Backend non joignable']);
    }
  };

  /** ── LE SEUL BOUTON : Lancer Scan → tout le pipeline auto ── */
  const startGvmScan = async () => {
    if (isScanning || !scanTargets.trim()) {
      if (!scanTargets.trim()) alert('Entrez au moins une IP cible');
      return;
    }

    setIsScanning(true);
    setScanStatus('LAUNCHING');
    setScanProgress(0);
    setTerminalLogs([`[${new Date().toLocaleTimeString()}] 🚀 Lancement du scan...`]);

    try {
      const res = await fetch(`${API_URL}/scans/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          targets: scanTargets,
          scanProfile,
          clientName: clientName || selectedOrganization?.name || 'Client',
          clientCompany: clientCompany || selectedOrganization?.name || 'Organisation',
          auditorId: (user as any)._id || user.id,
          organizationId: selectedOrganization?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lancement');

      setScanId(data.scanId);
      setTerminalLogs((prev: string[]) => [...prev, `[SCAN] ✅ Scan lancé — ID: ${data.scanId}`]);

      // Le polling est géré par l'AuditContext
    } catch (error: any) {
      setTerminalLogs((prev: string[]) => [...prev, `[ERREUR] ❌ ${error.message}`]);
      setIsScanning(false);
      setScanStatus('ERROR');
    }
  };

  /** Arrêter le scan */
  const stopGvmScan = async () => {
    if (!scanId) return;
    try {
      const res = await fetch(`${API_URL}/scans/${scanId}/stop`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      setTerminalLogs((prev: string[]) => [...prev, `[SCAN] ⛔ Arrêt demandé`]);
      if (res.ok) {
        setScanStatus('STOPPED');
        setIsScanning(false);
        setScanProgress(0);
        localStorage.removeItem('activeScanId');
        setTerminalLogs((prev: string[]) => [...prev, `[SCAN] ✅ Scan arrêté avec succès`]);
      }
    } catch (error: any) {
      setTerminalLogs((prev: string[]) => [...prev, `[ERREUR] ${error.message}`]);
    }
  };

  const sections: { id: Section; label: string; icon: any; step: number }[] = [
    { id: 'questionnaire', label: 'SECURITY QUESTIONNAIRE', icon: ClipboardCheck, step: 1 },
    { id: 'assets', label: 'EQUIPMENT MANAGEMENT', icon: Server, step: 2 },
    { id: 'targets' as Section, label: 'CIBLES & CREDENTIALS', icon: Shield, step: 3 },
    { id: 'scans', label: 'OPENVAS SCANS', icon: Terminal, step: 4 },
    { id: 'validation', label: 'VALIDATION', icon: CheckCircle2, step: 5 },
  ];

  const currentStepIndex = sections.findIndex(s => s.id === activeSection);
  const progressPercentage = ((currentStepIndex + 1) / sections.length) * 100;

  const handleNext = () => { if (currentStepIndex < sections.length - 1) setActiveSection(sections[currentStepIndex + 1].id); };
  const handleBack = () => { if (currentStepIndex > 0) setActiveSection(sections[currentStepIndex - 1].id); };

  const updateResponse = (axisId: string, qId: string, value: 'oui' | 'non' | 'partiel') => {
    let maturityValue = '0 (Inexistant)';
    if (value === 'oui') maturityValue = '5 (Optimisé)';
    if (value === 'partiel') maturityValue = '2 (Partiel)';
    setAxes(prev => prev.map(axis => axis.id === axisId ? { ...axis, questions: axis.questions.map(q => q.id === qId ? { ...q, response: value, maturity: maturityValue } : q) } : axis));
  };

  const updateQuestionField = (axisId: string, qId: string, field: string, value: string) => {
    setAxes(prev => prev.map(axis => axis.id === axisId ? { ...axis, questions: axis.questions.map(q => q.id === qId ? { ...q, [field]: value } : q) } : axis));
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.ip) return;
    setAssets([...assets, { id: Date.now().toString(), category: selectedAssetCategory || 'net', name: newAsset.name, ip: newAsset.ip, os: newAsset.os || 'N/A', criticality: newAsset.criticality as any, status: 'Pending' }]);
    setNewAsset({ name: '', ip: '', os: '', criticality: 'Medium' });
  };

  const deleteAsset = (id: string) => setAssets(assets.filter(a => a.id !== id));

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionData.text.trim()) return;
    setAxes(prev => prev.map(axis => axis.id === newQuestionData.axisId ? { ...axis, questions: [...axis.questions, { id: `custom-${Date.now()}`, text: newQuestionData.text }] } : axis));
    setNewQuestionData({ ...newQuestionData, text: '' });
    setIsAddQuestionModalOpen(false);
  };

  // ── Ancien handleGenerate gardé comme fallback (upload XML manuel) ──
  const handleGenerate = async () => {
    if (!xmlFile) return alert('Veuillez sélectionner un fichier XML OpenVAS');
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('xmlFile', xmlFile);
      formData.append('clientName', clientName || user.name);
      formData.append('clientCompany', clientCompany || (user as any).company || 'Organisation');
      const response = await fetch(`${API_URL}/reports/generate`, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Erreur génération'); }
      const data = await response.json();
      setGeneratedReport(data);
      setReportTab('resume');
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitReport = async () => {
    // Priorité: summary.reportId (toujours = le vrai _id MongoDB du rapport créé par le pipeline)
    // puis reportId (peut être stale si restauré depuis un ancien scan)
    const reportId = generatedReport?.summary?.reportId || generatedReport?.reportId || (generatedReport as any)?._id;
    if (!reportId) return alert("❌ Impossible de soumettre : ID du rapport introuvable. Générez d'abord le rapport.");
    console.log('[SUBMIT] Report ID résolu:', reportId, '| summary.reportId:', generatedReport?.summary?.reportId, '| top-level reportId:', generatedReport?.reportId);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const orgId = (selectedOrganization as any)?._id || (selectedOrganization as any)?.id;
      const response = await fetch(`${API_URL}/reports/${reportId}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          auditorId: (user as any)._id || user.id,
          organizationId: orgId,
          auditData: { axes, assets },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur soumission');
      setSubmitSuccess(true);
    } catch (e: any) {
      alert('❌ Erreur : ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewScan = () => {
    setSubmitSuccess(false);
    setGeneratedReport(null);
    setIsScanning(false);
    setScanId(null);
    setScanProgress(0);
    setScanStatus('IDLE');
    setScanTargets('');
    setTerminalLogs([
      "[SYSTEM] ShieldOps GVM Interface initialized.",
      "[INFO] Ready for new scan.",
    ]);
    setActiveSection('scans');
  };

  const handleDownloadPDF = async () => {
    const reportId = generatedReport?.summary?.reportId || generatedReport?.reportId || (generatedReport as any)?._id;
    if (!reportId) {
      alert("❌ Impossible de télécharger le PDF : le rapport n'a pas encore été sauvegardé en base de données. Veuillez réessayer ou lancer un nouveau scan.");
      console.error("Missing reportId in generatedReport:", generatedReport);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reports/${reportId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur téléchargement');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const riskColor = (level: string) => {
    if (!level) return 'text-slate-400';
    const l = level.toUpperCase();
    if (l === 'CRITIQUE' || l === 'CRITICAL') return 'text-rose-500';
    if (l === 'ÉLEVÉ' || l === 'HIGH') return 'text-amber-500';
    if (l === 'MOYEN' || l === 'MEDIUM') return 'text-orange-400';
    return 'text-emerald-500';
  };

  const critBadge = (c: string) => {
    const u = (c || '').toUpperCase();
    if (u === 'CRITICAL') return 'bg-rose-500 text-white';
    if (u === 'HIGH') return 'bg-amber-500 text-white';
    if (u === 'MEDIUM') return 'bg-orange-400 text-white';
    return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
  };

  // ══════════════════════════════════════════════════════════════
  //  RENDER SECTIONS
  // ══════════════════════════════════════════════════════════════

  const renderGeneral = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#5c56e3] flex items-center justify-center text-[#5c56e3]"><Info size={20} /></div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Step 1: Informations Générales</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identification du client</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'organisation</label>
              <input type="text" placeholder="Acme Corp" value={clientCompany} onChange={e => setClientCompany(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom du contact</label>
              <input type="text" placeholder="Nom du client" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold dark:text-white outline-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestionnaire = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[20px] border-2 border-[#5c56e3] dark:border-[#347ABF] flex items-center justify-center text-[#5c56e3] dark:text-[#347ABF] shadow-lg shadow-indigo-500/10 dark:shadow-[#347ABF]/10"><ClipboardCheck size={24} /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Step 1: Questionnaire KSI</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Maturité automatisée par réponse</p>
          </div>
        </div>
        <button onClick={() => setIsAddQuestionModalOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all shadow-sm active:scale-95">
          <PlusCircle size={18} /> Ajouter une question personnalisée
        </button>
      </div>
      <div className="space-y-16">
        {axes.map((axis) => (
          <div key={axis.id} className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-2 h-8 bg-[#5c56e3] dark:bg-[#347ABF] rounded-full"></div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{axis.title}</h3>
            </div>
            <div className="space-y-4">
              {axis.questions.map((q) => (
                <div key={q.id} className="p-8 bg-white dark:bg-slate-900/40 rounded-[40px] border border-slate-200 dark:border-slate-800 flex flex-col group hover:border-indigo-500/20 transition-all gap-8 shadow-sm dark:shadow-none">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                    <div className="flex-1">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200 italic leading-snug">{q.text}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${q.maturity?.includes('5') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : q.maturity?.includes('2') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-50'}`}>
                          Score: {q.maturity || 'Non évalué'}
                        </span>
                      </div>
                    </div>
                    <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                      {[{ id: 'oui', label: 'OUI', color: 'bg-emerald-500' }, { id: 'non', label: 'NON', color: 'bg-rose-500' }, { id: 'partiel', label: 'PARTIEL', color: 'bg-amber-500' }].map(btn => (
                        <button key={btn.id} onClick={() => updateResponse(axis.id, q.id, btn.id as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${q.response === btn.id ? `${btn.color} text-white shadow-lg` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>{btn.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><LinkIcon size={12} className="text-indigo-400" /> Preuve / Référence</label>
                      <input type="text" placeholder="Ex: Procédure PSSI_v2.pdf..." value={q.proof || ''} onChange={(e) => updateQuestionField(axis.id, q.id, 'proof', e.target.value)} className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><MessageSquare size={12} className="text-indigo-400" /> Observation</label>
                      <input type="text" placeholder="Précisez le contexte..." value={q.comment || ''} onChange={(e) => updateQuestionField(axis.id, q.id, 'comment', e.target.value)} className="w-full px-5 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {isAddQuestionModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[56px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-12 pb-8 flex justify-between items-start border-b border-slate-50 dark:border-slate-800">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Question Custom</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic">Adapter le questionnaire au contexte métier</p>
              </div>
              <button onClick={() => setIsAddQuestionModalOpen(false)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all"><X size={24} className="text-slate-300" /></button>
            </div>
            <form className="p-12 space-y-8" onSubmit={handleAddQuestion}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Thématique</label>
                  <select value={newQuestionData.axisId} onChange={(e) => setNewQuestionData({...newQuestionData, axisId: e.target.value})} className="w-full p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-black text-xs uppercase tracking-widest outline-none text-slate-700 dark:text-white">
                    {axes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Texte de la question</label>
                  <textarea required placeholder="Ex: Le chiffrement AES-256 est-il appliqué sur les backups ?" value={newQuestionData.text} onChange={(e) => setNewQuestionData({...newQuestionData, text: e.target.value})} className="w-full p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all h-32" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddQuestionModalOpen(false)} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400">Annuler</button>
                <button type="submit" className="flex-[2] py-5 bg-[#5c56e3] dark:bg-[#347ABF] text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-700 dark:hover:bg-[#347ABF] transition-all flex items-center justify-center gap-3"><Plus size={16} /> Ajouter à l'audit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[20px] border-2 border-[#5c56e3] dark:border-[#347ABF] flex items-center justify-center text-[#5c56e3] dark:text-[#347ABF] shadow-lg shadow-indigo-500/10 dark:shadow-[#347ABF]/10"><Server size={24} /></div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Step 2: Gestion des équipements</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Cartographie technique du SI audité</p>
          </div>
        </div>
        <div className="flex bg-white dark:bg-slate-900 p-2 px-6 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actifs:</span>
          <span className="text-xl font-black text-indigo-600 italic">{assets.length}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: 'net', title: 'Équipements réseau', icon: Globe, items: ['Switchs', 'Firewalls', 'Routeurs'] },
          { id: 'srv', title: 'Serveurs', icon: Server, items: ['AD', 'Linux', 'Windows', 'Cloud'] },
          { id: 'cli', title: 'Postes clients', icon: Monitor, items: ['Workstations', 'Laptops', 'Mobiles'] },
          { id: 'app', title: 'Applications', icon: Terminal, items: ['SaaS', 'Web Apps', 'Databases'] },
        ].map((type) => (
          <div key={type.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 dark:hover:border-[#347ABF]/30 transition-all flex flex-col justify-between min-h-[220px] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner text-[#5c56e3] dark:text-[#347ABF] group-hover:scale-110 transition-transform"><type.icon size={24} /></div>
              <div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tighter italic">{type.title}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{assets.filter(a => a.category === type.id).length} éléments</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {type.items.map(it => <span key={it} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase text-slate-400 tracking-widest border border-slate-100 dark:border-slate-700">{it}</span>)}
            </div>
            <button onClick={() => { setSelectedAssetCategory(type.id); setIsInventoryModalOpen(true); }} className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-[#5c56e3] dark:hover:bg-[#347ABF] hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2">
              <Edit3 size={14} /> Gérer l'inventaire
            </button>
          </div>
        ))}
      </div>
      {/* Modal inventaire — identique à l'original, pas touché */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-full max-h-[90vh] rounded-[48px] md:rounded-[60px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative">
            <div className="p-8 md:p-12 pb-6 md:pb-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-start bg-gradient-to-r from-indigo-50 dark:from-indigo-900/10 to-transparent shrink-0">
              <div className="flex items-center gap-6 md:gap-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-indigo-500/30"><HardDrive size={32} /></div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Gestion de l'Inventaire</h2>
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest">Catégorie: {selectedAssetCategory?.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => setIsInventoryModalOpen(false)} className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                {assets.filter(a => !selectedAssetCategory || a.category === selectedAssetCategory).map((asset) => (
                  <div key={asset.id} className="p-5 md:p-6 bg-white dark:bg-slate-900 rounded-[28px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/40 transition-all shadow-sm">
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 ${asset.status === 'Audited' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                        {asset.category === 'net' ? <Globe size={20} /> : <Server size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2 mb-0.5">
                          <h4 className="font-black text-slate-800 dark:text-white uppercase italic tracking-tight">{asset.name}</h4>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${asset.criticality === 'Critical' ? 'bg-rose-500 text-white' : asset.criticality === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{asset.criticality.toUpperCase()}</span>
                        </div>
                        <p className="text-[10px] font-black text-indigo-500 font-mono tracking-widest">{asset.ip} • <span className="text-slate-400">{asset.os}</span></p>
                      </div>
                    </div>
                    <button onClick={() => deleteAsset(asset.id)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-all active:scale-90"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <div className="w-full lg:w-[400px] p-8 md:p-12 bg-white dark:bg-slate-900 border-l border-slate-50 dark:border-slate-800 flex flex-col shrink-0">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-8 border-l-4 border-indigo-600 pl-4">Injecter un Actif</h3>
                <form onSubmit={handleAddAsset} className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {[{ label: 'Dénomination', key: 'name', placeholder: "Nom de l'équipement" }, { label: 'Adresse IP', key: 'ip', placeholder: '192.168.x.x' }, { label: 'Système (OS)', key: 'os', placeholder: 'Linux, Cisco, etc.' }].map(f => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{f.label}</label>
                      <input required={f.key !== 'os'} type="text" placeholder={f.placeholder} className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm" value={(newAsset as any)[f.key]} onChange={e => setNewAsset({...newAsset, [f.key]: e.target.value})} />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Criticité</label>
                    <select className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl font-black text-[10px] uppercase outline-none cursor-pointer text-slate-700 dark:text-white" value={newAsset.criticality} onChange={e => setNewAsset({...newAsset, criticality: e.target.value as any})}>
                      <option value="Low">Basse</option><option value="Medium">Moyenne</option><option value="High">Haute</option><option value="Critical">Critique</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-5 bg-[#5c56e3] dark:bg-[#347ABF] text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 dark:shadow-[#347ABF]/30 hover:bg-indigo-700 dark:hover:bg-[#347ABF] transition-all flex items-center justify-center gap-3 active:scale-95"><PlusCircle size={18} /> Ajouter</button>
                </form>
              </div>
            </div>
            <div className="p-8 md:p-10 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center shrink-0">
              <button onClick={() => setIsInventoryModalOpen(false)} className="px-12 py-5 bg-slate-800 dark:bg-[#0f172a] text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95">VALIDER L'INVENTAIRE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════
  //  STEP 4 : SCANS — BRANCHÉE SUR LE VRAI BACKEND
  // ══════════════════════════════════════════════════════════════
  const renderScans = () => {
    const statusLabel: Record<string, string> = {
      IDLE: 'En attente', LAUNCHING: 'Lancement...', QUEUED: 'En file d\'attente',
      RUNNING: 'Scan en cours', DONE: 'Scan terminé', RETRIEVING_XML: 'Récupération XML...',
      PARSING: 'Parsing...', AI_ANALYSIS: 'Analyse IA...', GENERATING_PDF: 'Génération PDF...',
      SAVING: 'Sauvegarde...', COMPLETED: '✅ Pipeline terminé', ERROR: '❌ Erreur', STOPPED: '⛔ Arrêté',
    };

    const isActive = ['LAUNCHING','QUEUED','RUNNING','RETRIEVING_XML','PARSING','AI_ANALYSIS','GENERATING_PDF','SAVING'].includes(scanStatus);
    const progressDisplay = scanStatus === 'COMPLETED' ? 100 : scanStatus === 'RUNNING' ? scanProgress : isActive ? (scanProgress || 5) : 0;

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#5c56e3] dark:border-[#347ABF] flex items-center justify-center text-[#5c56e3] dark:text-[#347ABF]"><Terminal size={20} /></div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Step 3: Scan OpenVAS</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Un seul bouton — scan + parsing + IA + PDF automatique</p>
          </div>
          {/* Indicateur connexion GVM */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest ${gvmConnected ? 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30' : gvmConnected === false ? 'border-rose-200 text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30' : 'border-slate-200 text-slate-400 bg-slate-50 dark:bg-slate-800 dark:border-slate-700'}`}>
            {gvmConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {gvmConnected ? 'GVM Connecté' : gvmConnected === false ? 'GVM Déconnecté' : 'Test...'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Panneau Configuration ── */}
          <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Configuration du Scan</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Profil de scan</label>
                  <select disabled={isActive} value={scanProfile} onChange={e => setScanProfile(e.target.value)} className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none disabled:opacity-50 text-slate-700 dark:text-white">
                    <option value="full-and-fast">Full and Fast</option>
                    <option value="full-and-deep">Full and Deep</option>
                    <option value="discovery">Discovery</option>
                    <option value="host-discovery">Host Discovery</option>
                    <option value="system-discovery">System Discovery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Outil</label>
                  <select disabled className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none opacity-70 text-slate-700 dark:text-white">
                    <option>OpenVAS / GVM</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cible préconfigurée</label>
                <select
                  disabled={isActive}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none disabled:opacity-50 text-slate-700 dark:text-white"
                  onChange={e => {
                    const val = e.target.value;
                    if (val) {
                      const [hosts] = val.split('||');
                      setScanTargets(hosts);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">— Saisie manuelle —</option>
                  {configuredTargets.map((t: any) => (
                    <option key={t._id} value={`${t.hosts}||${t.name}`}>
                      {t.name} ({t.hosts.substring(0, 40)}{t.hosts.length > 40 ? '...' : ''})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cibles (IP / Subnets)</label>
                <textarea disabled={isActive} value={scanTargets} onChange={e => setScanTargets(e.target.value)} className="w-full p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl font-mono text-xs h-24 outline-none disabled:opacity-50 text-slate-700 dark:text-white" placeholder="Ex: 192.168.1.0/24, 10.0.0.10"></textarea>
              </div>

              {/* ── Barre de progression ── */}
              {isActive && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">{statusLabel[scanStatus] || scanStatus}</span>
                    <span className="text-indigo-500">{progressDisplay}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 p-0.5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-[#5c56e3] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(92,86,227,0.4)]" style={{ width: `${progressDisplay}%` }}></div>
                  </div>
                </div>
              )}

              {/* ── Boutons ── */}
              <div className="flex gap-4">
                <button onClick={startGvmScan} disabled={isActive || !gvmConnected} className={`flex-1 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isActive ? 'bg-amber-500 text-white cursor-not-allowed' : 'bg-[#5c56e3] dark:bg-[#347ABF] text-white hover:scale-[1.02] shadow-indigo-500/20 dark:shadow-[#347ABF]/20 disabled:opacity-50 disabled:cursor-not-allowed'}`}>
                  {isActive ? <><Loader2 size={20} className="animate-spin" /> {statusLabel[scanStatus] || 'En cours...'}</> : <><Zap size={20} /> Lancer le Scan</>}
                </button>
                <button onClick={() => setIsScheduleModalOpen(true)} disabled={isActive || !scanTargets.trim()} className={`px-6 py-5 rounded-[24px] bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`} title="Planifier un scan récurrent">
                  <Calendar size={18} /> Planifier
                </button>
                {isActive && (
                  <button onClick={stopGvmScan} className="px-6 py-5 rounded-[24px] bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all flex items-center gap-2 active:scale-95">
                    <StopCircle size={18} /> Stop
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Terminal Live ── */}
          <div className="bg-slate-900 rounded-[48px] p-10 flex flex-col h-[500px] border border-slate-800 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Live Terminal</h3>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{statusLabel[scanStatus] || scanStatus}</span>
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : scanStatus === 'COMPLETED' ? 'bg-emerald-500' : scanStatus === 'ERROR' ? 'bg-rose-500' : 'bg-slate-600'}`}></div>
              </div>
            </div>
            <div className="flex-1 font-mono text-[10px] text-emerald-400 space-y-2 overflow-y-auto custom-scrollbar pr-2">
              {terminalLogs.map((l: string, i: number)  => (
                <p key={i} className={`opacity-80 leading-relaxed border-l-2 pl-2 transition-all ${l.includes('❌') ? 'text-rose-400 border-rose-500/50' : l.includes('✅') ? 'text-emerald-400 border-emerald-500/50' : l.includes('⚠️') ? 'text-amber-400 border-amber-500/50' : l.includes('══') ? 'text-indigo-400 border-indigo-500/50 font-bold' : 'border-transparent hover:border-emerald-500/50'}`}>{l}</p>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* ── Upload XML Manuel (fallback) ── */}
        <details className="mt-6">
          <summary className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-500 transition-colors">
            Alternative : Upload XML manuel (si scan offline)
          </summary>
          <div className="mt-4 bg-slate-50 dark:bg-slate-900 p-8 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4 cursor-pointer hover:border-indigo-500/50 transition-all" onClick={() => document.getElementById('xml-upload')?.click()}>
            <input id="xml-upload" type="file" accept=".xml" className="hidden" onChange={e => setXmlFile(e.target.files?.[0] || null)} />
            <FileText size={28} className={xmlFile ? 'text-indigo-500 mx-auto' : 'text-slate-300 mx-auto'} />
            <p className="text-sm font-black text-slate-600 dark:text-slate-300">{xmlFile ? xmlFile.name : 'Cliquez pour importer un XML OpenVAS'}</p>
            {xmlFile && (
              <button onClick={(e) => { e.stopPropagation(); handleGenerate(); }} disabled={isGenerating} className="px-8 py-3 bg-[#5c56e3] dark:bg-[#347ABF] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                {isGenerating ? 'Analyse...' : 'Générer le rapport'}
              </button>
            )}
          </div>
        </details>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  //  STEP 5 : VALIDATION — résumé + soumettre au chef
  // ══════════════════════════════════════════════════════════════
  const renderValidation = () => {
    if (submitSuccess) {
      return (
        <div className="space-y-10 animate-in fade-in duration-500 text-center py-20">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Rapport Soumis !</h2>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest max-w-lg mx-auto">Le rapport est en attente de validation par le Chef d'Audit. Après validation, il sera publié et visible par le client.</p>
          </div>
          <div className="flex gap-4 justify-center pt-6">
            <button onClick={handleNewScan} className="px-10 py-5 bg-[#5c56e3] dark:bg-[#347ABF] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl flex items-center gap-3">
              <Zap size={18} /> Nouveau Scan
            </button>
            <button onClick={() => clearSelection()} className="px-10 py-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-3">
              <Globe size={18} /> Changer d'Organisation
            </button>
          </div>
        </div>
      );
    }

    // Chercher les données soit dans summary (scan auto) soit dans data directe (upload XML)
    const s = generatedReport?.summary || generatedReport?.data || generatedReport;
    if (!s) {
      return (
        <div className="space-y-10 animate-in fade-in duration-500 text-center py-20">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[32px] flex items-center justify-center mx-auto">
            <FileText size={48} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Aucun rapport généré</h2>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest max-w-lg mx-auto">Lancez un scan dans l'étape précédente. Le rapport sera généré automatiquement.</p>
            <button onClick={() => setActiveSection('scans')} className="mt-4 px-8 py-4 bg-[#5c56e3] dark:bg-[#347ABF] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">← Retour aux Scans</button>
          </div>
        </div>
      );
    }

    const score   = s.score ?? s.score_securite ?? 0;
    const risque  = s.niveauRisque ?? s.niveau_risque ?? 'N/A';
    const resume  = s.resumeExecutif ?? s.resume_executif ?? '';
    const stats   = s.stats ?? { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    const vulns   = s.vulnerabilities ?? [];
    const prios   = s.priorites ?? [];
    const recos   = s.recommandations ?? s.recommandations_generales ?? [];
    const recosDetaillees = s.recommandations_detaillees ?? s.recommandationsDetaillees ?? [];
    const conclusion = s.conclusion ?? '';
    const actions = s.actions_immediates ?? [];
    const topVulns = s.top_vulnerabilites ?? [];
    const orgScore = s.organisational_score ?? null;
    const rawTechScore = s.raw_tech_score ?? null;

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#5c56e3] dark:border-[#347ABF] flex items-center justify-center text-[#5c56e3] dark:text-[#347ABF]"><CheckCircle2 size={20} /></div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Step 4: Validation & Soumission</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1 italic">Rapport généré automatiquement — prêt à soumettre</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
          {[
            { label: 'Score Sécurité', val: `${score}/100`, color: 'text-indigo-500' },
            { label: 'Niveau Risque', val: risque, color: riskColor(risque) },
            { label: 'Critiques', val: stats.critical ?? 0, color: 'text-rose-500' },
            { label: 'Élevées', val: stats.high ?? 0, color: 'text-amber-500' },
            { label: 'Moyennes', val: stats.medium ?? 0, color: 'text-orange-400' },
            { label: 'Faibles', val: stats.low ?? 0, color: 'text-emerald-500' },
            { label: 'Total Vulns', val: stats.total ?? 0, color: 'text-slate-400' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 text-center">
              <p className={`text-3xl font-black italic ${item.color}`}>{item.val}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Score organisationnel (si questionnaire rempli) */}
        {orgScore && (
          <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-500/5 dark:to-emerald-500/5 p-6 rounded-[28px] border border-indigo-100 dark:border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ClipboardCheck size={20} className="text-indigo-500" />
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Score combiné : Tech ({rawTechScore ?? '?'}/100 × 60%) + Org ({orgScore.globalScore}/100 × 40%)</p>
              </div>
              <span className="text-sm font-black text-indigo-500">{orgScore.totalAnswered}/{orgScore.totalQuestions} questions</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {orgScore.axisScores?.map((axis: any, i: number) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className={`text-xl font-black italic ${axis.score >= 70 ? 'text-emerald-500' : axis.score >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{axis.score}%</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 line-clamp-1">{axis.title?.replace(/^\d+\.\s*/, '')}</p>
                </div>
              ))}
            </div>
            {orgScore.weaknesses?.length > 0 && (
              <p className="text-[10px] text-rose-500 font-bold mt-3 italic">⚠ {orgScore.weaknesses.length} point(s) faible(s) identifié(s) dans le questionnaire</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button onClick={() => setReportTab('resume')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${reportTab === 'resume' ? 'text-indigo-600 dark:text-[#347ABF] border-b-2 border-indigo-600 dark:border-[#347ABF] bg-indigo-50/50 dark:bg-[#347ABF]/10' : 'text-slate-400 hover:text-slate-600'}`}>
            <FileText size={15} /> Résumé Exécutif
          </button>
          <button onClick={() => setReportTab('detail')} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${reportTab === 'detail' ? 'text-indigo-600 dark:text-[#347ABF] border-b-2 border-indigo-600 dark:border-[#347ABF] bg-indigo-50/50 dark:bg-[#347ABF]/10' : 'text-slate-400 hover:text-slate-600'}`}>
            <AlertTriangle size={15} /> Rapport Détaillé
          </button>
        </div>

        {reportTab === 'resume' && (
          <div className="space-y-6">
            {resume && (
              <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                <p className="text-[9px] font-black text-indigo-500 dark:text-[#347ABF] uppercase tracking-widest mb-3">Résumé Exécutif IA</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">{resume}</p>
              </div>
            )}
            {topVulns.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Top Vulnérabilités</p>
                {topVulns.map((v: any, i: number) => (
                  <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md shrink-0 ${critBadge(v.criticite)}`}>{v.criticite}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 dark:text-white text-sm uppercase italic tracking-tight">{v.nom}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.cible} • CVSS: {v.cvss} • {v.cve}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{v.description_courte}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {actions.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions Immédiates</p>
                {actions.map((a: any, i: number) => (
                  <div key={i} className="p-5 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/20 flex items-start gap-4">
                    <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-1 rounded-md shrink-0">{a.id}</span>
                    <div>
                      <p className="font-black text-slate-800 dark:text-white text-sm uppercase italic tracking-tight">{a.action}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{a.detail}</p>
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1">⏱ {a.temps_estime} • 👤 {a.responsable}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(recosDetaillees.length > 0 || recos.length > 0) && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommandations Détaillées</p>
                {recosDetaillees.length > 0 ? recosDetaillees.map((rec: any, i: number) => (
                  <div key={i} className="bg-emerald-50 dark:bg-emerald-500/5 rounded-[24px] border border-emerald-100 dark:border-emerald-500/20 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20">
                      <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-[9px] font-black shrink-0">{rec.id || `RECO-${String(i+1).padStart(2,'0')}`}</div>
                      <h4 className="font-black text-emerald-800 dark:text-emerald-300 uppercase italic tracking-tight text-sm">{rec.titre}</h4>
                    </div>
                    <div className="p-6 space-y-4">
                      {rec.objectif && (
                        <div>
                          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Objectif</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">{rec.objectif}</p>
                        </div>
                      )}
                      {rec.actions?.length > 0 && (
                        <div>
                          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Actions</p>
                          <ul className="space-y-1">
                            {rec.actions.map((a: string, j: number) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <span className="text-emerald-500 font-black mt-0.5">▸</span>
                                <span>{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-100 dark:border-emerald-500/20">
                        {rec.kpi && (
                          <div>
                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">KPI</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">{rec.kpi}</p>
                          </div>
                        )}
                        {rec.estimation_cout && (
                          <div>
                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Coût estimé</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{rec.estimation_cout}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : recos.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">{i+1}</div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            )}
            {conclusion && (
              <div className="p-6 bg-slate-900 rounded-[28px] border border-slate-700">
                <p className="text-[9px] font-black text-indigo-400 dark:text-[#347ABF] uppercase tracking-widest mb-2">Conclusion</p>
                <p className="text-sm text-slate-300 font-medium italic leading-relaxed">{conclusion}</p>
              </div>
            )}
          </div>
        )}

        {reportTab === 'detail' && (
          <div className="space-y-6">
            {prios.length > 0 && (
              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priorités de Remédiation</p>
                {prios.map((p: any, i: number) => (
                  <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 bg-indigo-600 dark:bg-[#347ABF] text-white rounded-lg flex items-center justify-center text-xs font-black">#{p.ordre}</span>
                      <h4 className="font-black text-slate-800 dark:text-white uppercase italic tracking-tight text-sm">{p.vulnerabilite}</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic"><span className="font-black text-slate-600 dark:text-slate-300">Raison : </span>{p.raison}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic"><span className="font-black text-slate-600 dark:text-slate-300">Impact : </span>{p.impact}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic"><span className="font-black text-slate-600 dark:text-slate-300">Solution : </span>{p.solution_detaillee}</p>
                  </div>
                ))}
              </div>
            )}
            {vulns.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vulnérabilités ({vulns.length})</p>
                {vulns.slice(0, 50).map((v: any, i: number) => (
                  <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md shrink-0 ${critBadge(v.criticality)}`}>{v.criticality}</span>
                    <div>
                      <p className="font-black text-slate-800 dark:text-white text-sm uppercase italic tracking-tight">{v.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.host}:{v.port} • CVSS: {v.cvss}</p>
                      {v.solution && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1"><span className="font-black">Fix: </span>{v.solution}</p>}
                    </div>
                  </div>
                ))}
                {vulns.length > 50 && <p className="text-[10px] text-slate-400 font-black text-center uppercase tracking-widest">... et {vulns.length - 50} de plus (voir PDF)</p>}
              </div>
            )}
          </div>
        )}

        {/* Boutons finaux */}
        <div className="flex gap-4 pt-4">
          <button onClick={handleDownloadPDF} className="flex items-center gap-3 px-8 py-5 bg-slate-700 dark:bg-slate-700 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-md">
            <Download size={16} /> PDF
          </button>
          <button onClick={handleSubmitReport} disabled={isSubmitting} className="flex-1 py-5 bg-emerald-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Soumission...</> : <><ShieldCheck size={20} /> Soumettre au Chef d'Audit</>}
          </button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  //  SÉLECTION ORGANISATION (si pas encore choisie)
  // ══════════════════════════════════════════════════════════════
  if (!selectedOrganization) {
    return (
      <div className="p-10 max-w-[1400px] mx-auto">
        <OrganizationSelector 
          isDark={isDark}
          onSelect={(orgId, org) => setSelectedOrganization(org)}
          isLoading={loadingOrgData}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  //  LAYOUT PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">Audit in Progress</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
            <ShieldCheck size={12} className="text-[#5c56e3] dark:text-[#347ABF]" /> Organisation: <span className="text-[#5c56e3] dark:text-[#347ABF]">{selectedOrganization?.name}</span> • Auditeur: {user.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { if (confirm('Changer d\'organisation?')) clearSelection(); }} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${isDark ? 'text-[#347ABF] hover:bg-[#347ABF]/10 border border-[#347ABF]/30' : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-300'}`}>
            Changer d'organisation
          </button>
          <div className="flex items-center gap-6 bg-white dark:bg-slate-900 p-4 px-8 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Progress</span>
            <div className="w-48 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 p-0.5">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-[#5c56e3] dark:from-[#347ABF] dark:to-[#347ABF] rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(92,86,227,0.4)] dark:shadow-[0_0_15px_rgba(56,189,248,0.4)]" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-[#347ABF] italic">{Math.round(progressPercentage)}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 relative z-10">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const isDone = sections.findIndex(s => s.id === activeSection) > sections.findIndex(s => s.id === section.id);
          return (
            <button key={section.id} onClick={() => setActiveSection(section.id)} className={`w-[180px] p-6 rounded-[28px] flex flex-col items-center justify-center gap-4 transition-all border-2 group relative ${isActive ? 'bg-[#5c56e3] dark:bg-[#347ABF] border-[#5c56e3] dark:border-[#347ABF] text-white shadow-2xl shadow-indigo-500/30 dark:shadow-[#347ABF]/30 scale-105 z-20' : isDone ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-[#347ABF]/50 text-[#5c56e3] dark:text-[#347ABF]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 hover:border-indigo-200 dark:hover:border-[#347ABF]/50'}`}>
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-white/20' : ''}`}><section.icon size={26} strokeWidth={isActive ? 3 : 2} /></div>
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] text-center leading-tight max-w-[80px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#5c56e3] dark:group-hover:text-[#347ABF]'}`}>{section.label}</span>
              {isDone && !isActive && <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"></div>}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.03)] min-h-[600px] flex flex-col relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.02] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="p-16 flex-1 relative z-10">
          {activeSection === 'questionnaire' && renderQuestionnaire()}
          {activeSection === 'assets' && renderAssets()}
          {activeSection === 'targets' && selectedOrganization && (
            <AssetManager
              organizationId={(selectedOrganization as any)._id || (selectedOrganization as any).id}
              organizationName={selectedOrganization.name}
              isDark={isDark}
            />
          )}
          {activeSection === 'scans' && renderScans()}
          {activeSection === 'validation' && renderValidation()}
        </div>
        <div className="p-10 px-16 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center relative z-20 bg-slate-50/20 dark:bg-slate-950/10">
          <button onClick={handleBack} disabled={currentStepIndex === 0} className="flex items-center gap-3 px-8 py-4 text-slate-400 hover:text-[#5c56e3] dark:hover:text-[#347ABF] font-black uppercase text-[10px] tracking-[0.2em] transition-all disabled:opacity-0 group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <div className="flex gap-4">
            <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              {isSavingAuditData ? (
                <><Loader2 size={18} className="animate-spin" /> Sauvegarde...</>
              ) : (
                <><Save size={18} /> Auto-sauvegardé ✓</>
              )}
            </button>
            <button onClick={handleNext} className="flex items-center gap-4 px-12 py-5 bg-slate-800 dark:bg-[#0f172a] text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-900 dark:hover:bg-black transition-all shadow-2xl dark:shadow-black/10 active:scale-95 group">
              {currentStepIndex === sections.length - 1 ? 'Soumettre le Rapport' : 'Next Step'}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        targets={scanTargets}
        scanProfile={scanProfile}
        clientName={clientName}
        clientCompany={clientCompany || (selectedOrganization as any)?.name || ''}
        onScheduleCreated={(schedule) => {
          alert(`✅ Scan planifié avec succès pour le ${new Date(schedule.nextRun).toLocaleString('fr-FR')}`);
        }}
      />
    </div>
  );
};

export default AuditorReportWorkspace;
