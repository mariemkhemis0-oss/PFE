import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

export interface Organization {
  id: string;
  name: string;
  sector: string;
  type: string;
  assignedAt: string;
}

const API_URL = 'http://localhost:5000/api';

export const AuditContext = createContext<any>(undefined);

export const AuditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<string>('IDLE');
  const [scanTargets, setScanTargets] = useState('');
  const [scanProfile, setScanProfile] = useState('full-and-fast');
  const [gvmConnected, setGvmConnected] = useState<boolean | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] ShieldOps GVM Interface initialized.",
    "[INFO] Ready to connect to OpenVAS engine.",
    "[INFO] Configure targets and click 'Lancer Scan'."
  ]);
  const [scanRestored, setScanRestored] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ══════════════════════════════════════════════════════════════
  //  RESTAURATION AU MONTAGE — Retrouver un scan en cours
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const restoreActiveScan = async () => {
      try {
        // 1. Vérifier si on a un scanId sauvé dans localStorage
        const savedScanId = localStorage.getItem('activeScanId');
        
        // 2. Vérifier aussi côté serveur avec l'userId
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?._id || user?.id;

        if (savedScanId) {
          // Tester l'état du scan sauvé
          const res = await fetch(`${API_URL}/scans/${savedScanId}/status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            const activeStatuses = ['QUEUED', 'RUNNING', 'DONE', 'RETRIEVING_XML', 'PARSING', 'AI_ANALYSIS', 'GENERATING_PDF', 'SAVING'];
            
            if (activeStatuses.includes(data.status)) {
              // Scan encore en cours → restaurer
              setScanId(data.scanId);
              setScanStatus(data.status);
              setScanProgress(data.progress);
              setIsScanning(true);
              if (data.targets) setScanTargets(data.targets);
              if (data.logs && data.logs.length > 0) {
                setTerminalLogs(data.logs);
              }
              console.log('[AuditContext] ✅ Scan restauré depuis localStorage:', data.scanId, data.status);
              setScanRestored(true);
              return;
            } else if (data.status === 'COMPLETED' && data.summary) {
              // Scan terminé avec résultats → afficher le rapport
              setScanId(data.scanId);
              setScanStatus('COMPLETED');
              setScanProgress(100);
              setIsScanning(false);
              setGeneratedReport({ reportId: data.reportId, summary: data.summary });
              if (data.logs && data.logs.length > 0) setTerminalLogs(data.logs);
              localStorage.removeItem('activeScanId');
              console.log('[AuditContext] ✅ Scan terminé restauré avec résultats');
              setScanRestored(true);
              return;
            } else {
              // Scan terminé ou en erreur → nettoyer
              localStorage.removeItem('activeScanId');
            }
          }
        }

        // 3. Fallback : chercher un scan actif du user côté serveur
        if (userId) {
          const res = await fetch(`${API_URL}/scans/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            const scans = await res.json();
            const activeStatuses = ['QUEUED', 'RUNNING', 'DONE', 'RETRIEVING_XML', 'PARSING', 'AI_ANALYSIS', 'GENERATING_PDF', 'SAVING'];
            const activeScan = scans.find((s: any) => activeStatuses.includes(s.status));
            
            if (activeScan) {
              setScanId(activeScan.scanId);
              setScanStatus(activeScan.status);
              setScanProgress(activeScan.progress);
              setIsScanning(true);
              if (activeScan.targets) setScanTargets(activeScan.targets);
              if (activeScan.logs && activeScan.logs.length > 0) setTerminalLogs(activeScan.logs);
              localStorage.setItem('activeScanId', activeScan.scanId);
              console.log('[AuditContext] ✅ Scan actif trouvé côté serveur:', activeScan.scanId);
              setScanRestored(true);
              return;
            }

            // Vérifier si un scan récent est COMPLETED avec résultats
            const completedScan = scans.find((s: any) => s.status === 'COMPLETED' && s.summary);
            if (completedScan && !generatedReport) {
              setScanId(completedScan.scanId);
              setScanStatus('COMPLETED');
              setScanProgress(100);
              setGeneratedReport({ reportId: completedScan.reportId, summary: completedScan.summary });
              if (completedScan.logs && completedScan.logs.length > 0) setTerminalLogs(completedScan.logs);
              console.log('[AuditContext] ✅ Dernier scan complété restauré');
            }
          }
        }
      } catch (error) {
        console.error('[AuditContext] Erreur restauration scan:', error);
      } finally {
        setScanRestored(true);
      }
    };

    restoreActiveScan();
  }, []); // Run once on mount

  // ══════════════════════════════════════════════════════════════
  //  PERSIST scanId dans localStorage
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (scanId && isScanning) {
      localStorage.setItem('activeScanId', scanId);
    }
  }, [scanId, isScanning]);

  // ══════════════════════════════════════════════════════════════
  //  POLLING 5s — état du scan actif
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isScanning && scanId) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          try {
            const res = await fetch(`${API_URL}/scans/${scanId}/status`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();

            setScanStatus(data.status);
            setScanProgress(data.progress);
            if (data.logs) setTerminalLogs(data.logs);

            if ((data.status === 'COMPLETED' && data.summary) || data.status === 'ERROR' || data.status === 'STOPPED') {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              setIsScanning(false);
              localStorage.removeItem('activeScanId');
              if (data.status === 'COMPLETED' && data.summary) {
                setGeneratedReport({ reportId: data.reportId, summary: data.summary });
              }
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 5000);
      }
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [isScanning, scanId]);

  // ══════════════════════════════════════════════════════════════
  //  POLLING SILENCIEUX — Détection automatique de scans planifiés
  // ══════════════════════════════════════════════════════════════
  const autoScanPollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ne pas lancer si un scan est déjà actif ou suivi
    if (isScanning || scanId) {
      if (autoScanPollingRef.current) {
        clearInterval(autoScanPollingRef.current);
        autoScanPollingRef.current = null;
      }
      return;
    }

    // Attendre que la restauration soit terminée avant de lancer le polling
    if (!scanRestored) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    autoScanPollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/scans/my-active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const { scan } = await res.json();
        if (scan) {
          // Un scan automatisé est en cours → activer le terminal
          console.log('[AuditContext] 🔔 Scan planifié détecté automatiquement:', scan.scanId);
          setScanId(scan.scanId);
          setScanStatus(scan.status);
          setScanProgress(scan.progress);
          setIsScanning(true);
          if (scan.targets) setScanTargets(scan.targets);
          localStorage.setItem('activeScanId', scan.scanId);

          // Logs spéciaux pour scan auto
          const autoLogs = [
            '[SYSTEM] ShieldOps GVM Interface initialized.',
            `[AUTO] 🔔 Scan planifié détecté — cible : ${scan.targets}`,
            `[AUTO] 📋 Client: ${scan.clientCompany || 'Organisation'}`,
            '[GVM] ✅ Connexion active',
            ...(scan.logs || []).slice(-20),
          ];
          setTerminalLogs(autoLogs);
        }
      } catch (err) {
        // Silencieux — pas de spam console
      }
    }, 30000); // Toutes les 30 secondes

    return () => {
      if (autoScanPollingRef.current) {
        clearInterval(autoScanPollingRef.current);
        autoScanPollingRef.current = null;
      }
    };
  }, [isScanning, scanId, scanRestored]);

  const resetScanState = () => {
    setIsScanning(false);
    setScanId(null);
    setScanProgress(0);
    setScanStatus('IDLE');
    setScanTargets('');
    setGvmConnected(null);
    setGeneratedReport(null);
    setTerminalLogs([
      "[SYSTEM] ShieldOps GVM Interface initialized.",
      "[INFO] Ready to connect to OpenVAS engine.",
      "[INFO] Configure targets and click 'Lancer Scan'."
    ]);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const clearSelection = () => {
    setSelectedOrganization(null);
    resetScanState();
  };

  // Reset scan state when organization changes
  const handleSetSelectedOrganization = (org: Organization | null) => {
    if (org?.id !== selectedOrganization?.id) {
      resetScanState();
    }
    setSelectedOrganization(org);
  };

  const value = {
    selectedOrganization, setSelectedOrganization: handleSetSelectedOrganization, clearSelection,
    isScanning, setIsScanning,
    scanId, setScanId,
    scanProgress, setScanProgress,
    scanStatus, setScanStatus,
    scanTargets, setScanTargets,
    scanProfile, setScanProfile,
    gvmConnected, setGvmConnected,
    generatedReport, setGeneratedReport,
    terminalLogs, setTerminalLogs,
    scanRestored,
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error("useAudit doit être utilisé à l'intérieur d'un AuditProvider");
  }
  return context;
};
