export const getReportHtml = (parsedReport, aiAnalysis, clientInfo) => {
  const stats = parsedReport.stats || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
  const auditDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const refSession = aiAnalysis.session_id || `AUD-${Math.floor(Math.random() * 1000000)}`;

  const getRiskColor = (risk) => {
    switch (String(risk || '').toUpperCase()) {
      case 'CRITIQUE': case 'CRITICAL': return '#ef4444';
      case 'ÉLEVÉ': case 'HIGH': return '#f97316';
      case 'MOYEN': case 'MEDIUM': return '#eab308';
      case 'FAIBLE': case 'LOW': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  const getRiskBgClass = (risk) => {
    switch (String(risk || '').toUpperCase()) {
      case 'CRITIQUE': case 'CRITICAL': return 'bg-critical';
      case 'ÉLEVÉ': case 'HIGH': return 'bg-high';
      case 'MOYEN': case 'MEDIUM': return 'bg-medium';
      case 'FAIBLE': case 'LOW': return 'bg-low';
      default: return 'bg-medium';
    }
  };

  // ── Data mapping corrigé ──
  const resumeExecutif = aiAnalysis.resume_executif
    || aiAnalysis.full_report?.section_1_resume_executif?.texte_complet
    || 'Aucun résumé disponible.';

  const objectifs = aiAnalysis.full_report?.section_2_contexte?.objectifs_audit || [
    'Identification des vulnérabilités exploitables.',
    "Mesure de l'impact métier.",
    "Définition d'une feuille de route de remédiation.",
  ];

  const methodologie = aiAnalysis.full_report?.section_3_methodologie || [
    { outil: 'OpenVAS (GVM)', usage: 'Scan de vulnérabilité infrastructure complet' },
    { outil: 'CVSS V3.1', usage: 'Standard de calcul de criticité universel' },
    { outil: 'ShieldOps AI', usage: 'Analyse et priorisation des risques par IA' },
  ];

  const hosts = parsedReport.hosts || [];
  const vulns = parsedReport.vulnerabilities || [];

  // Section 6 — analyse par système : construite depuis les vulns si absente
  const systemAnalysis = (() => {
    const fromAI = aiAnalysis.full_report?.section_6_analyse_par_systeme;
    if (fromAI && fromAI.length > 0) return fromAI;
    // Construire depuis les vulns parsées
    const map = {};
    vulns.forEach(v => {
      const key = v.host || 'N/A';
      if (!map[key]) map[key] = { ip: key, critiques: 0, elevees: 0, moyennes: 0, faibles: 0 };
      const c = String(v.criticality || '').toUpperCase();
      if (c === 'CRITICAL') map[key].critiques++;
      else if (c === 'HIGH') map[key].elevees++;
      else if (c === 'MEDIUM') map[key].moyennes++;
      else map[key].faibles++;
    });
    return Object.values(map);
  })();

  // Section 7 — actions immédiates
  const actionPlan = (() => {
    const fromAI = aiAnalysis.full_report?.section_7_plan_actions?.actions_immediates_j0;
    if (fromAI && fromAI.length > 0) return fromAI;
    // Fallback depuis aiAnalysis.actions_immediates
    return (aiAnalysis.actions_immediates || []).map(a => ({
      action: a.action || '',
      responsable: a.responsable || 'Admin Sys',
      estimation: a.temps_estime || 'N/A',
    }));
  })();

  // Section 8 — recommandations
  const recommendations = (() => {
    const fromAI = aiAnalysis.full_report?.section_8_recommandations;
    if (fromAI && fromAI.length > 0) return fromAI;
    if (aiAnalysis.recommandations_detaillees && aiAnalysis.recommandations_detaillees.length > 0) {
      return aiAnalysis.recommandations_detaillees;
    }
    return (aiAnalysis.recommandations_generales || []).map((r, i) => ({
      titre: `Recommandation ${i + 1}`,
      objectif: r,
    }));
  })();

  // Toutes les vulnérabilités pour section 5
  const topVulns = vulns;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport d'Audit ShieldOps — ${clientInfo?.company || 'Client'}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    :root {
      --bg:        #0b0f19;
      --card:      #111827;
      --txt:       #f3f4f6;
      --muted:     #9ca3af;
      --accent:    #57a9d9;
      --critical:  #ef4444;
      --high:      #f97316;
      --medium:    #eab308;
      --low:       #3b82f6;
    }

    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: var(--bg);
      color: var(--txt);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── CONTENT CONTAINER ── */
    .page {
      padding: 0 20mm 14mm;
      background: var(--bg);
    }
    .page-first { padding-top: 14mm; }


    /* ── COVER ── */
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      min-height: 277mm;
      padding: 16mm 20mm 14mm;
      page-break-after: always;
    }

    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .logo { display:flex; align-items:center; gap:12px; }
    .logo-icon {
      width:48px; height:48px;
      background: rgba(87,169,217,.12);
      border: 1px solid var(--accent);
      border-radius:12px;
      display:flex; align-items:center; justify-content:center;
    }
    .logo-icon svg { width:28px; height:28px; stroke: var(--accent); }
    .logo-name { font-size:22px; font-weight:900; color:#fff; letter-spacing:1px; }
    .logo-sub  { font-size:8px;  font-weight:800; color:var(--muted); letter-spacing:4px; margin-top:2px; }

    .badge-conf {
      border:1px solid rgba(239,68,68,.4);
      background: rgba(239,68,68,.06);
      color:#ef4444;
      padding:6px 14px;
      border-radius:20px;
      font-size:8px;
      font-weight:800;
      letter-spacing:2px;
      text-transform:uppercase;
      display:flex; align-items:center; gap:6px;
    }

    .cover-body { text-align:center; margin-top: 55mm; flex: 1; }
    .cover-kicker {
      font-size:9px; font-weight:800; letter-spacing:6px;
      color:var(--accent); text-transform:uppercase;
      font-style:italic; margin-bottom:12px;
    }
    .cover-h1 {
      font-size:64px; font-weight:900; line-height:.9;
      color:#fff; text-transform:uppercase; font-style:italic;
    }
    .cover-h1 span { color:#818cf8; text-shadow:0 0 30px rgba(129,140,248,.35); }
    .cover-client { margin-top:40px; }
    .cover-client-label {
      font-size:8px; font-weight:800; letter-spacing:4px;
      color:var(--muted); text-transform:uppercase; margin-bottom:10px;
    }
    .cover-client-name {
      font-size:32px; font-weight:900; color:#fff;
      text-transform:uppercase; font-style:italic;
    }
    .cover-session {
      font-size:8px; font-weight:800; color:var(--muted);
      letter-spacing:2px; text-transform:uppercase; margin-top:6px;
    }

    .cover-footer {
      display:flex; justify-content:space-between; align-items:flex-end;
      border-top:1px solid rgba(255,255,255,.06); padding-top:16px;
      margin-top: auto;
    }
    .cover-footer-l { font-size:8px; font-weight:800; color:var(--muted); line-height:1.8; }
    .cover-footer-l strong { color:#fff; font-size:10px; font-style:italic; }
    .cover-footer-r { text-align:right; font-size:8px; font-weight:800; color:var(--muted); line-height:1.8; }
    .cover-footer-r strong { color:#fff; font-size:10px; font-style:italic; }

    /* ── TYPOGRAPHY ── */
    .section-title {
      font-size:20px; font-weight:900; color:#fff;
      text-transform:uppercase; font-style:italic;
      border-bottom:1px solid rgba(255,255,255,.06);
      padding-bottom:8px; margin-bottom:16px; margin-top:8mm;
    }
    /* section that must start at top of a new page */
    .section-title.new-page {
      margin-top: 0;
      padding-top: 16mm;
      page-break-before: always;
    }
    /* softer break - only breaks if less than 80mm left on page */
    .section-title.soft-break {
      margin-top: 12mm;
      page-break-before: auto;
      page-break-after: avoid;
    }

    /* ── HIGHLIGHT BOX ── */
    .highlight {
      background:var(--card);
      border:1px solid rgba(255,255,255,.05);
      border-left:3px solid var(--accent);
      padding:12px 16px;
      border-radius:8px;
      margin-bottom:14px;
      page-break-inside:avoid;
    }
    .highlight p {
      font-size:9px; font-weight:600;
      font-style:italic; color:#fff; line-height:1.6;
    }

    /* ── TABLE ── */
    .tbl {
      width:100%; border-collapse:collapse;
      background:var(--card);
      border:1px solid rgba(255,255,255,.05);
      border-radius:8px; overflow:hidden;
      margin-bottom:14px;
      page-break-inside:avoid;
    }
    .tbl th {
      background:rgba(0,0,0,.25);
      font-size:7px; font-weight:900; color:var(--muted);
      text-transform:uppercase; letter-spacing:1.5px;
      padding:8px 12px; text-align:left;
    }
    .tbl td {
      padding:8px 12px; font-size:8.5px; font-weight:600;
      border-top:1px solid rgba(255,255,255,.03); color:#fff;
    }
    .tbl tr:nth-child(even) td { background:rgba(255,255,255,.01); }

    /* ── KPI GRID ── */
    .kpi-grid {
      display:grid; grid-template-columns:repeat(3,1fr);
      gap:8px; margin-bottom:14px;
      page-break-inside:avoid;
    }
    .kpi-card {
      background:var(--card);
      border:1px solid rgba(255,255,255,.05);
      border-radius:8px; padding:10px;
      text-align:center;
    }
    .kpi-val { font-size:22px; font-weight:900; font-style:italic; }
    .kpi-lbl { font-size:6.5px; font-weight:800; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; margin-top:3px; }

    /* ── VULN CARD ── */
    .vuln-card {
      border-radius:8px; overflow:hidden;
      margin-bottom:8px; background:var(--card);
      page-break-inside:avoid;
    }
    .vuln-hdr {
      padding:7px 14px;
      display:flex; justify-content:space-between; align-items:center;
    }
    .bg-critical { background:var(--critical); }
    .bg-high     { background:var(--high); }
    .bg-medium   { background:var(--medium); }
    .bg-low      { background:var(--low); }

    .vuln-hdr-title { font-size:10px; font-weight:900; color:#fff; text-transform:uppercase; font-style:italic; }
    .vuln-hdr-badge {
      font-size:7.5px; font-weight:900; color:#fff;
      background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.35);
      padding:2px 7px; border-radius:5px; white-space:nowrap;
    }
    .vuln-body {
      padding:10px 14px;
      display:grid; grid-template-columns:1fr 1fr; gap:12px;
    }
    .vuln-label {
      font-size:6.5px; font-weight:900; color:var(--muted);
      text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px;
    }
    .vuln-txt   { font-size:8.5px; font-weight:600; color:#fff; line-height:1.45; }
    .vuln-fix   { font-size:8.5px; font-weight:600; color:var(--accent); font-style:italic; line-height:1.45; }

    /* ── RECO CARD ── */
    .reco-card {
      border-radius:8px; overflow:hidden;
      margin-bottom:10px; page-break-inside:avoid;
    }
    .reco-hdr {
      background:#4f46e5; padding:9px 14px;
      display:flex; justify-content:space-between; align-items:center;
      border-bottom:1px solid rgba(0,0,0,.15);
    }
    .reco-title { font-size:10px; font-weight:900; color:#fff; text-transform:uppercase; font-style:italic; }
    .reco-body {
      background:var(--card); padding:12px 14px;
      display:grid; grid-template-columns:1fr 1fr; gap:12px;
    }

    /* ── GRID ── */
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
    .info-box {
      background:var(--card); border:1px solid rgba(255,255,255,.05);
      border-radius:8px; padding:12px;
      page-break-inside:avoid;
    }
    .info-box-title { font-size:7px; font-weight:900; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:7px; }
    .info-box p { font-size:8.5px; color:#fff; margin-bottom:4px; line-height:1.45; }

    /* ── TERMINAL ── */
    .terminal {
      background:#000; border-radius:10px; padding:16px 20px;
      font-family:monospace; font-size:8.5px; color:#a8b1c2;
      border:1px solid rgba(255,255,255,.05); margin-bottom:16px;
      line-height:1.8;
      page-break-inside:avoid;
    }
    .term-ok  { color:#10b981; }
    .term-dim { color:#4b5563; }
  </style>
</head>
<body>

<!-- ═══════════════════════════════ COVER ═══════════════════════════════ -->
<div class="cover">
  <div class="cover-header">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div>
        <div class="logo-name">SHIELD<span style="color:var(--accent)">OPS</span></div>
        <div class="logo-sub">SECURE VISION</div>
      </div>
    </div>
    <div class="badge-conf">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      STRICTEMENT CONFIDENTIEL
    </div>
  </div>

  <div class="cover-body">
    <div class="cover-kicker">Sécurité Offensive &amp; Conformité</div>
    <div class="cover-h1">RAPPORT<br><span>D'AUDIT COMPLET</span></div>
    <div class="cover-client">
      <div class="cover-client-label">— CLIENT AUDITÉ —</div>
      <div class="cover-client-name">${clientInfo?.company || clientInfo?.name || 'CLIENT'}</div>
      <div class="cover-session">SESSION : ${refSession} • ${auditDate}</div>
    </div>
  </div>

  <div class="cover-footer">
    <div class="cover-footer-l">
      DOCUMENT CERTIFIÉ PAR<br>
      <strong>KSI SECURITY ENGINE V4.2</strong>
    </div>
    <div class="cover-footer-r">
      RESPONSABLE AUDIT<br>
      <strong>ÉQUIPE CERTIFICATION KSI</strong>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════ CONTENU ═══════════════════════════════ -->
<div class="page page-first">
  <h2 class="section-title">1. Résumé Exécutif</h2>
  <div class="highlight">
    <p>${resumeExecutif}</p>
  </div>

  <!-- KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-val" style="color:${getRiskColor(aiAnalysis.niveau_risque)}">${aiAnalysis.score_securite ?? 'N/A'}/100</div>
      <div class="kpi-lbl">Score Sécurité</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color:${getRiskColor(aiAnalysis.niveau_risque)}">${aiAnalysis.niveau_risque ?? 'N/A'}</div>
      <div class="kpi-lbl">Niveau de Risque</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color:#fff">${stats.total}</div>
      <div class="kpi-lbl">Total Vulnérabilités</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color:var(--critical)">${stats.critical}</div>
      <div class="kpi-lbl">Critiques</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color:var(--high)">${stats.high}</div>
      <div class="kpi-lbl">Élevées</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color:var(--medium)">${stats.medium}</div>
      <div class="kpi-lbl">Moyennes</div>
    </div>
  </div>

  <h2 class="section-title">2. Contexte et Objectifs</h2>
  <div class="grid-2">
    <div class="info-box">
      <div class="info-box-title">2.1 Présentation de l'entreprise</div>
      <p><strong>Entreprise :</strong> ${clientInfo?.company || clientInfo?.name || 'N/A'}</p>
      <p><strong>Date d'audit :</strong> ${auditDate}</p>
      <p><strong>Référence :</strong> ${refSession}</p>
      ${aiAnalysis.full_report?.section_2_contexte?.presentation_entreprise
        ? `<p style="margin-top:8px;font-style:italic;color:var(--muted);font-size:8.5px">${aiAnalysis.full_report.section_2_contexte.presentation_entreprise}</p>`
        : ''}
    </div>
    <div class="info-box">
      <div class="info-box-title">2.2 Objectifs de l'audit</div>
      ${objectifs.map(o => `<p>• ${o}</p>`).join('')}
      ${aiAnalysis.full_report?.section_2_contexte?.cadre_reglementaire
        ? `<p style="margin-top:8px;font-size:8px;color:var(--accent);font-weight:800">⚖ ${aiAnalysis.full_report.section_2_contexte.cadre_reglementaire}</p>`
        : ''}
    </div>
  </div>

<!-- ═══ MÉTHODOLOGIE + PÉRIMÈTRE ═══ -->
  <h2 class="section-title">3. Méthodologie</h2>
  <table class="tbl">
    <thead>
      <tr><th>Outil / Norme</th><th>Usage Technique</th><th>Phase</th></tr>
    </thead>
    <tbody>
      ${methodologie.map(m => `
        <tr>
          <td style="font-weight:900">${m.outil}</td>
          <td>${m.usage}</td>
          <td style="color:var(--accent)">${m.phase || 'Analyse'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2 class="section-title">4. Périmètre de l'Audit</h2>
  <table class="tbl">
    <thead>
      <tr><th>Adresse IP</th><th>Nom d'hôte</th><th>Vulnérabilités</th></tr>
    </thead>
    <tbody>
      ${hosts.length > 0 ? hosts.map(h => {
    const hostVulns = vulns.filter(v => v.host === h.ip).length;
    return `
          <tr>
            <td style="font-weight:900;font-family:monospace">${h.ip}</td>
            <td>${h.hostname || 'N/A'}</td>
            <td>${hostVulns}</td>
          </tr>
        `;
  }).join('') : `<tr><td colspan="3" style="text-align:center;color:var(--muted)">Aucun hôte détecté</td></tr>`}
    </tbody>
  </table>

<!-- ═══ RÉSULTATS DÉTAILLÉS ═══ -->
  <h2 class="section-title new-page">5. Résultats Détaillés (${topVulns.length} vulnérabilités)</h2>

  ${topVulns.length === 0
      ? '<p style="font-size:11px;color:var(--muted);font-style:italic">Aucune vulnérabilité détectée.</p>'
      : topVulns.map((v, idx) => `
      <div class="vuln-card">
        <div class="vuln-hdr ${getRiskBgClass(v.criticality)}">
          <div class="vuln-hdr-title">
            #${String(idx + 1).padStart(3, '0')} — ${v.name || 'Vulnérabilité'}
          </div>
          <div class="vuln-hdr-badge">
            ${String(v.criticality || 'UNKNOWN').toUpperCase()} • CVSS ${v.cvss || 'N/A'}
          </div>
        </div>
        <div class="vuln-body">
          <div>
            <div class="vuln-label">Cible</div>
            <div class="vuln-txt" style="font-family:monospace">${v.host || 'N/A'}:${v.port || 'N/A'}</div>
            ${v.cve ? `<div class="vuln-txt" style="color:var(--muted);margin-top:4px">${v.cve}</div>` : ''}
            ${v.description ? `
              <div class="vuln-label" style="margin-top:10px">Description</div>
              <div class="vuln-txt">${String(v.description).substring(0, 200)}${v.description.length > 200 ? '...' : ''}</div>
            ` : ''}
          </div>
          <div>
            <div class="vuln-label">Remédiation</div>
            <div class="vuln-fix">${v.solution || 'Appliquer le patch constructeur.'}</div>
          </div>
        </div>
      </div>
    `).join('')
    }

<!-- ═══ ANALYSE PAR SYSTÈME + PLAN D'ACTIONS ═══ -->
  <h2 class="section-title">6. Analyse par Système</h2>
  <table class="tbl">
    <thead>
      <tr>
        <th>Serveur / IP</th>
        <th style="text-align:center">Critiques</th>
        <th style="text-align:center">Élevées</th>
        <th style="text-align:center">Moyennes</th>
        <th style="text-align:center">Faibles</th>
      </tr>
    </thead>
    <tbody>
      ${systemAnalysis.length > 0 ? systemAnalysis.map(sys => `
        <tr>
          <td style="font-weight:900;font-family:monospace">${sys.ip || sys.systeme || sys.serveur || 'N/A'}</td>
          <td style="text-align:center;color:var(--critical);font-weight:900">${sys.critiques || 0}</td>
          <td style="text-align:center;color:var(--high);font-weight:900">${sys.elevees || 0}</td>
          <td style="text-align:center;color:var(--medium);font-weight:900">${sys.moyennes || 0}</td>
          <td style="text-align:center;color:var(--low);font-weight:900">${sys.faibles || 0}</td>
        </tr>
      `).join('') : `
        <tr>
          <td style="font-weight:900">${hosts[0]?.ip || 'Global'}</td>
          <td style="text-align:center;color:var(--critical);font-weight:900">${stats.critical}</td>
          <td style="text-align:center;color:var(--high);font-weight:900">${stats.high}</td>
          <td style="text-align:center;color:var(--medium);font-weight:900">${stats.medium}</td>
          <td style="text-align:center;color:var(--low);font-weight:900">${stats.low}</td>
        </tr>
      `}
    </tbody>
  </table>

  <h2 class="section-title soft-break">7. Plan d'Actions Correctives</h2>
  <table class="tbl">
    <thead>
      <tr>
        <th>ID</th>
        <th>Action Prioritaire</th>
        <th>Responsable</th>
        <th>Délai</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${actionPlan.length > 0 ? actionPlan.map((act, idx) => `
        <tr>
          <td style="font-weight:900;font-family:monospace;color:var(--accent)">${act.id || `U0${idx + 1}`}</td>
          <td style="font-weight:900;font-style:italic;text-transform:uppercase">${act.action || String(act)}</td>
          <td style="color:var(--muted)">${act.responsable || 'Admin Sys'}</td>
          <td style="color:var(--muted)">${act.estimation || act.temps_estime || 'N/A'}</td>
          <td style="color:var(--accent);font-weight:900">À FAIRE</td>
        </tr>
      `).join('') : `
        <tr><td colspan="5" style="text-align:center;color:var(--muted)">Aucune action immédiate requise.</td></tr>
      `}
    </tbody>
  </table>

<!-- ═══ RECOMMANDATIONS DÉTAILLÉES ═══ -->
  <h2 class="section-title soft-break">8. Recommandations Détaillées</h2>
  ${recommendations.length > 0 ? recommendations.map((rec, idx) => `
    <div class="reco-card">
      <div class="reco-hdr">
        <div class="reco-title">
          RECO ${String(idx + 1).padStart(2, '0')} : ${typeof rec === 'string' ? 'RECOMMANDATION STRATÉGIQUE' : (rec.titre || rec.id || 'AMÉLIORATION')}
        </div>
      </div>
      <div class="reco-body">
        <div>
          <div class="vuln-label">Objectif</div>
          <div class="vuln-txt" style="font-style:italic">
            "${typeof rec === 'string' ? rec : (rec.objectif || rec.description || '')}"
          </div>
          ${!!(rec.actions?.length) ? `
            <div class="vuln-label" style="margin-top:10px">Actions</div>
            ${rec.actions.map(a => `<div class="vuln-txt">• ${a}</div>`).join('')}
          ` : ''}
        </div>
        <div>
          <div class="vuln-label">KPI / Impact</div>
          <div class="vuln-txt" style="color:#10b981">
            ${rec.kpi || 'Amélioration directe de la posture de sécurité'}
          </div>
          ${rec.estimation_cout ? `
            <div class="vuln-label" style="margin-top:10px">Coût estimé</div>
            <div class="vuln-txt">${rec.estimation_cout}</div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('') : '<p style="font-size:11px;color:var(--muted);font-style:italic">Aucune recommandation disponible.</p>'}

<!-- ═══ MATURITÉ ORGANISATIONNELLE (QUESTIONNAIRE) ═══ -->
  ${(() => {
    const orgData = aiAnalysis.organisational_score;
    if (!orgData || !orgData.axisScores) return '';
    return `
  <h2 class="section-title soft-break">Évaluation de la Maturité Organisationnelle</h2>
  <div class="highlight">
    <p>Cette section présente les résultats du questionnaire de maturité KSI rempli par l'auditeur. 
    Le score organisationnel contribue à <strong>40%</strong> du score final (pondération : 60% technique / 40% organisationnel).</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-val" style="color:${orgData.globalScore >= 70 ? '#10b981' : orgData.globalScore >= 40 ? '#eab308' : '#ef4444'}">${orgData.globalScore}/100</div>
      <div class="kpi-lbl">Score Organisationnel</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color:#fff">${orgData.totalAnswered}/${orgData.totalQuestions}</div>
      <div class="kpi-lbl">Questions Répondues</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color:var(--critical)">${orgData.weaknesses?.length || 0}</div>
      <div class="kpi-lbl">Points Faibles (NON)</div>
    </div>
  </div>

  <table class="tbl">
    <thead>
      <tr><th>Axe d'évaluation</th><th style="text-align:center">Score</th><th style="text-align:center">Réponses</th><th>Niveau</th></tr>
    </thead>
    <tbody>
      ${orgData.axisScores.map(a => `
        <tr>
          <td style="font-weight:900">${a.title}</td>
          <td style="text-align:center;font-weight:900;color:${a.score >= 70 ? '#10b981' : a.score >= 40 ? '#eab308' : '#ef4444'}">${a.score}/100</td>
          <td style="text-align:center;color:var(--muted)">${a.answered}/${a.total}</td>
          <td style="color:${a.score >= 70 ? '#10b981' : a.score >= 40 ? '#eab308' : '#ef4444'};font-weight:800;font-style:italic">${a.score >= 80 ? 'Optimisé' : a.score >= 60 ? 'Géré' : a.score >= 40 ? 'Partiel' : 'Insuffisant'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${orgData.weaknesses && orgData.weaknesses.length > 0 ? `
  <div class="info-box" style="border-left:3px solid var(--critical);margin-bottom:14px">
    <div class="info-box-title" style="color:var(--critical)">Points Faibles Identifiés</div>
    ${orgData.weaknesses.map(w => `
      <p style="font-size:8.5px;margin-bottom:4px">
        <span style="color:var(--critical);font-weight:900">✗</span> 
        <span style="color:var(--muted);font-weight:800">[${w.axis}]</span> 
        ${w.question}
      </p>
    `).join('')}
  </div>
  ` : ''}
    `;
  })()}

<!-- ═══ ANNEXES + GLOSSAIRE ═══ -->
  <h2 class="section-title soft-break">9. Annexes Techniques</h2>
  <div class="terminal">
    <div class="term-dim"># SHIELDOPS_ENGINE — SESSION ${refSession}</div>
    <div class="term-ok">[✓] Scan OpenVAS/GVM — Complété</div>
    <div class="term-ok">[✓] Parsing XML — ${stats.total} vulnérabilités extraites</div>
    <div class="term-ok">[✓] Analyse IA (LLaMA 3.3 70B) — Complétée</div>
    <div class="term-ok">[✓] Génération PDF — En cours</div>
    <div class="term-dim" style="margin-top:8px"># MÉTRIQUES</div>
    <div>Score: ${aiAnalysis.score_securite}/100 | Risque: ${aiAnalysis.niveau_risque} | Hôtes: ${hosts.length} | Vulnérabilités: ${stats.total}</div>
    <div>Cibles: ${hosts.map(h => h.ip).join(', ') || 'N/A'}</div>
  </div>

  <h2 class="section-title">10. Glossaire</h2>
  <table class="tbl">
    <thead><tr><th>Terme</th><th>Définition</th></tr></thead>
    <tbody>
      ${[
      { t: 'CVE', d: 'Common Vulnerabilities and Exposures — identifiant unique de vulnérabilité publique' },
      { t: 'CVSS', d: 'Common Vulnerability Scoring System — score de 0 à 10 évaluant la criticité' },
      { t: 'RCE', d: 'Remote Code Execution — exécution de code arbitraire à distance' },
      { t: 'WAF', d: 'Web Application Firewall — pare-feu protégeant les applications web' },
      { t: 'MFA', d: 'Multi-Factor Authentication — authentification multi-facteurs' },
    ].map(g => `<tr><td style="font-weight:900;color:var(--accent)">${g.t}</td><td style="color:var(--muted)">${g.d}</td></tr>`).join('')}
    </tbody>
  </table>
</div>

</body>
</html>`;
};