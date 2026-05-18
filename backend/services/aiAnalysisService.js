// backend/services/aiAnalysisService.js
// ──────────────────────────────────────────────────────────────
// Moteur IA — Groq LLaMA 3.3 70B
// Prompt optimisé : 10 sections d'audit professionnel ShieldOps
// + Score organisationnel (questionnaire maturité)
// ──────────────────────────────────────────────────────────────

import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ══════════════════════════════════════════════════════════════
//  CALCUL DU SCORE ORGANISATIONNEL (questionnaire KSI)
// ══════════════════════════════════════════════════════════════
export function computeOrganizationalScore(axes) {
  if (!axes || !Array.isArray(axes) || axes.length === 0) return null;

  const axisScores = axes.map(axis => {
    const questions = axis.questions || [];
    if (questions.length === 0) return { id: axis.id, title: axis.title, score: 0, answered: 0, total: 0, details: [] };

    let totalPoints = 0;
    let maxPoints = 0;
    let answered = 0;
    const details = [];

    questions.forEach(q => {
      maxPoints += 5; // max par question
      let points = 0;
      if (q.response === 'oui') { points = 5; answered++; }
      else if (q.response === 'partiel') { points = 2; answered++; }
      else if (q.response === 'non') { points = 0; answered++; }
      // Pas de réponse = 0 points
      totalPoints += points;
      details.push({
        question: q.text,
        response: q.response || 'non répondu',
        points,
        maturity: q.maturity || (points === 5 ? '5 (Optimisé)' : points === 2 ? '2 (Partiel)' : '0 (Inexistant)'),
        comment: q.comment || '',
        proof: q.proof || '',
      });
    });

    const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    return { id: axis.id, title: axis.title, score, answered, total: questions.length, details };
  });

  // Score global = moyenne des axes
  const totalScore = axisScores.reduce((sum, a) => sum + a.score, 0);
  const globalScore = Math.round(totalScore / axisScores.length);

  // Identifier les faiblesses (réponses NON)
  const weaknesses = [];
  axisScores.forEach(axis => {
    axis.details.forEach(d => {
      if (d.response === 'non') {
        weaknesses.push({ axis: axis.title, question: d.question });
      }
    });
  });

  return {
    globalScore,
    axisScores,
    weaknesses,
    totalAnswered: axisScores.reduce((s, a) => s + a.answered, 0),
    totalQuestions: axisScores.reduce((s, a) => s + a.total, 0),
  };
}

// ══════════════════════════════════════════════════════════════
//  FUSIONNER SCORE TECHNIQUE + SCORE ORGANISATIONNEL
// ══════════════════════════════════════════════════════════════
export function computeFinalScore(technicalScore, orgScore) {
  if (orgScore === null || orgScore === undefined) return technicalScore; // Pas de questionnaire
  // Pondération : 60% technique (OpenVAS) + 40% organisationnel (questionnaire)
  return Math.round(technicalScore * 0.6 + orgScore * 0.4);
}

export const analyzeVulnerabilities = async (parsedReport, computedStats = {}, questionnaireAxes = null) => {
  try {
    const { vulnerabilities = [], hosts = [], stats = {} } = parsedReport;

    // Valeurs par défaut pour computedStats
    let scoreBase = 100 - (stats.critical || 0) * 25 - (stats.high || 0) * 15 - (stats.medium || 0) * 5 - (stats.low || 0);
    if (stats.critical > 0) scoreBase = Math.min(scoreBase, 39);
    else if (stats.high > 0) scoreBase = Math.min(scoreBase, 69);
    else if (stats.medium > 0) scoreBase = Math.min(scoreBase, 89);
    const safeGlobalScore = Math.max(0, scoreBase);

    let calculatedRisk = 'FAIBLE';
    if (safeGlobalScore < 40) calculatedRisk = 'CRITIQUE';
    else if (safeGlobalScore < 70) calculatedRisk = 'ÉLEVÉ';
    else if (safeGlobalScore < 90) calculatedRisk = 'MOYEN';

    // ── Calculer le score organisationnel si questionnaire fourni ──
    const orgResult = computeOrganizationalScore(questionnaireAxes);
    const orgScoreValue = orgResult ? orgResult.globalScore : null;

    // ── Score technique brut ──
    const rawTechScore = computedStats.globalScore ?? safeGlobalScore;

    // ── Score final fusionné (60% tech + 40% org) ──
    const finalScore = computeFinalScore(rawTechScore, orgScoreValue);

    // Recalculer le risque avec le score final
    let finalRisk = 'FAIBLE';
    if (finalScore < 40) finalRisk = 'CRITIQUE';
    else if (finalScore < 70) finalRisk = 'ÉLEVÉ';
    else if (finalScore < 90) finalRisk = 'MOYEN';

    const cs = {
      globalScore: finalScore,
      rawTechScore,
      orgScore: orgScoreValue,
      riskLevel: finalRisk,
      scoreTrend: computedStats.scoreTrend ?? 0,
      isoCompliance: computedStats.isoCompliance ?? Math.max(0, 85 - (stats.critical || 0) * 10 - (stats.high || 0) * 5),
      critTrend: computedStats.critTrend ?? 0,
      highTrend: computedStats.highTrend ?? 0,
      medTrend: computedStats.medTrend ?? 0,
      lowTrend: computedStats.lowTrend ?? 0,
    };

    // ── Résumé du questionnaire pour le prompt IA ──
    let questionnaireSummary = '';
    if (orgResult) {
      questionnaireSummary = `
ÉVALUATION ORGANISATIONNELLE (QUESTIONNAIRE MATURITÉ KSI) :
- Score Organisationnel Global : ${orgResult.globalScore}/100
- Questions répondues : ${orgResult.totalAnswered}/${orgResult.totalQuestions}
${orgResult.axisScores.map(a => `- ${a.title} : ${a.score}/100 (${a.answered}/${a.total} réponses)`).join('\n')}
${orgResult.weaknesses.length > 0 ? `\nPOINTS FAIBLES IDENTIFIÉS (réponses NON) :\n${orgResult.weaknesses.map(w => `- [${w.axis}] ${w.question}`).join('\n')}` : '\nAucun point faible majeur identifié.'}
`;
    }

    const backendDataSummary = `
DONNÉES PRÉ-CALCULÉES PAR LE BACKEND SHIELDOPS :
- Score Technique (OpenVAS) : ${cs.rawTechScore}/100
${orgScoreValue !== null ? `- Score Organisationnel (Questionnaire) : ${orgScoreValue}/100` : '- Score Organisationnel : Non évalué'}
- Score de Sécurité Global (Tech×0.6 + Org×0.4) : ${cs.globalScore}/100
- Niveau de risque obligatoire : ${cs.riskLevel}
- Tendance Score : ${cs.scoreTrend >= 0 ? '+' : ''}${cs.scoreTrend} points
- Conformité ISO 27001 déduite : ${cs.isoCompliance}%
- Tendances Vulnérabilités (vs N-1) : Critiques (${cs.critTrend}), Élevées (${cs.highTrend}), Moyennes (${cs.medTrend})
${questionnaireSummary}
`;

    const vulnerabilitiesList = vulnerabilities
      .slice(0, 20)
      .map((v, i) => `${i + 1}. [${v.criticality}] ${v.name} | Host: ${v.host}:${v.port} | CVSS: ${v.cvss}
       Description: ${(v.description || '').substring(0, 200)}...
       Solution: ${(v.solution || '').substring(0, 200)}...`)
      .join('\n');

    const hostsInfo = hosts.map(h => `${h.ip} (${h.hostname})`).join(', ') || 'N/A';

    // ══════════════════════════════════════════════════════════════
    //  PROMPT 10 SECTIONS — AUDITEUR SENIOR SHIELDOPS
    // ══════════════════════════════════════════════════════════════
    const prompt = `Tu es un Auditeur Senior en Cybersécurité pour ShieldOps. À partir des données XML OpenVAS, du questionnaire de maturité organisationnelle et des informations client fournies, génère un rapport d'audit structuré en 10 sections.
IMPORTANT : Le score final combine le score technique (vulnérabilités OpenVAS) à 60% et le score organisationnel (questionnaire de maturité) à 40%. Si des faiblesses organisationnelles sont détectées (ex: pas de PSSI, pas de RSSI, pas de MFA), tu DOIS les mentionner dans le résumé exécutif et ajouter des recommandations organisationnelles spécifiques dans section_8.

${backendDataSummary}

DONNÉES BRUTES DU SCAN OPENVAS :
- Cibles : ${hostsInfo}
- Nombre total vulnérabilités : ${stats.total || 0} (Critiques: ${stats.critical || 0}, Élevées: ${stats.high || 0}, Moyennes: ${stats.medium || 0}, Faibles: ${stats.low || 0})
- Vulnérabilités détaillées :
${vulnerabilitiesList}

CONSIGNES STRICTES :
1. Réponds EXCLUSIVEMENT avec un objet JSON valide. Aucun texte avant ou après.
2. Dans section_7 et section_8, utilise OBLIGATOIREMENT les noms réels des vulnérabilités, CVE, adresses IP et services trouvés dans les données du scan. AUCUN texte générique ou placeholder.
3. Chaque action dans section_7 doit référencer une vulnérabilité ou un hôte spécifique du scan.
4. Chaque recommandation dans section_8 doit être une réponse directe aux failles identifiées avec des étapes techniques précises et actionnables.

{
  "section_1_resume_executif": {
    "texte_complet": "Résumé exécutif de 2-3 paragraphes. Contexte global, principaux constats, niveau de risque global et recommandations prioritaires.",
    "indicateurs": {
      "score_securite": ${cs.globalScore},
      "niveau_risque": "${cs.riskLevel}",
      "conformite_iso": ${cs.isoCompliance},
      "total_vulnerabilites": ${stats.total || 0},
      "critiques": ${stats.critical || 0},
      "elevees": ${stats.high || 0}
    }
  },
  "section_2_contexte": {
    "presentation_entreprise": "Description du contexte de l'audit, secteur d'activité déduit, enjeux de sécurité.",
    "objectifs_audit": ["Objectif 1", "Objectif 2", "Objectif 3"],
    "cadre_reglementaire": "Normes et réglementations applicables (ISO 27001, RGPD, etc.)"
  },
  "section_3_methodologie": [
    { "outil": "OpenVAS (GVM)", "usage": "Scan infrastructure complet", "phase": "Reconnaissance & Scan" },
    { "outil": "CVSS v3.1", "usage": "Évaluation de la criticité", "phase": "Analyse" },
    { "outil": "ShieldOps AI Engine", "usage": "Corrélation et priorisation IA", "phase": "Analyse avancée" }
  ],
  "section_4_perimetre": [
    { "type": "Infrastructure", "cibles": "${hostsInfo}", "nombre_hotes": ${hosts.length}, "criticite": "Critique" }
  ],
  "section_5_resultats_detailles": [
    {
      "nom": "Nom de la vulnérabilité",
      "type": "RCE | CONFIGURATION | OBSOLESCENCE | INFORMATION_DISCLOSURE",
      "criticite": "CRITIQUE | ÉLEVÉ | MOYEN | FAIBLE",
      "cvss_score": 9.8,
      "cve": "CVE-XXXX-XXXX",
      "description": "Description technique détaillée de la faille et de son impact.",
      "systemes_affectes": ["IP1 (Hostname1)"],
      "poc": "Preuve de concept ou commande d'exploitation si applicable",
      "solution": "Remédiation recommandée"
    }
  ],
  "section_6_analyse_par_systeme": [
    { "systeme": "Hostname/IP", "os": "OS détecté", "critiques": 0, "elevees": 0, "moyennes": 0, "faibles": 0, "score_sante": 0, "commentaire": "Analyse contextuelle" }
  ],
  "section_7_plan_actions": {
    "actions_immediates_j0": [
      {
        "id": "U01",
        "action": "Corriger [NOM_VULN_REELLE_CVE] sur [HOST:PORT] — mise à jour vers version sécurisée ou désactivation du service",
        "responsable": "Admin Sys / Équipe Sécurité",
        "estimation": "2h à 4h",
        "impact_service": "Élimination du vecteur d'attaque [RCE/accès non autorisé/fuite données] — criticité CVSS [score]"
      }
    ],
    "actions_court_terme_j7": [
      {
        "id": "CT01",
        "action": "Action de remédiation à J+7 basée sur les vulnérabilités ÉLEVÉES détectées",
        "responsable": "Équipe Infra",
        "estimation": "2 jours",
        "detail_technique": "Étapes précises : mise à jour des packages, reconfiguration des services, tests de non-régression"
      }
    ],
    "chronologie": [
      { "tache": "Correction des vulnérabilités CRITIQUES identifiées", "debut": "J+0", "duree": "48h", "priorite": "CRITIQUE" },
      { "tache": "Correction des vulnérabilités ÉLEVÉES", "debut": "J+3", "duree": "4 jours", "priorite": "ÉLEVÉ" },
      { "tache": "Audit de suivi et vérification des correctifs", "debut": "J+30", "duree": "1 jour", "priorite": "MOYEN" }
    ]
  },
  "section_8_recommandations": [
    {
      "id": "RECO-01",
      "titre": "Titre spécifique basé sur les failles réelles trouvées (ex: Mise à jour OpenSSL, Désactivation Telnet)",
      "objectif": "Objectif précis et mesurable lié aux vulnérabilités détectées sur les hôtes scannés",
      "actions": [
        "Étape technique précise avec commande ou outil (ex: apt upgrade openssl=3.x.x)",
        "Étape de vérification et test de non-régression",
        "Étape de surveillance post-correctif avec outil SIEM/IDS"
      ],
      "estimation_cout": "Faible | Moyen | Élevé — préciser le nombre de jours/hommes",
      "kpi": "Indicateur précis et mesurable (ex: 0 vulnérabilité CVSS≥9 dans 30 jours, 100% MFA activé)"
    }
  ],
  "section_9_annexes": {
    "liste_cve": ["CVE-XXXX-XXXX"],
    "outils_utilises": ["OpenVAS GVM", "ShieldOps AI"],
    "references": ["ISO 27001:2022", "OWASP Top 10 2023", "NIST CSF"]
  },
  "section_10_glossaire": [
    { "terme": "CVE", "definition": "Common Vulnerabilities and Exposures — identifiant unique de vulnérabilité" },
    { "terme": "CVSS", "definition": "Common Vulnerability Scoring System — système de notation de criticité" },
    { "terme": "RCE", "definition": "Remote Code Execution — exécution de code à distance" }
  ]
}`;

    console.log('[AI] Envoi prompt Groq LLaMA 3.3 70B...');

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Tu es un expert en cybersécurité qui ne répond qu\'en JSON technique structuré. Pas de texte hors JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 8192,
    });

    const rawContent = completion.choices?.[0]?.message?.content || '';
    console.log('[AI] Réponse reçue, longueur:', rawContent.length);

    // ── Parsing JSON robuste ──
    let aiResult = null;
    try {
      aiResult = JSON.parse(rawContent);
    } catch (e) {
      // Tenter d'extraire le JSON si le LLM a ajouté du texte
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          aiResult = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('[AI] Impossible de parser le JSON:', e2.message);
        }
      }
    }

    if (!aiResult) {
      console.warn('[AI] Fallback — réponse IA invalide, utilisation des données calculées');
      return buildFallbackResult(parsedReport, cs);
    }

    // ── Normaliser la réponse pour la compatibilité avec le pipeline existant ──
    const s1 = aiResult.section_1_resume_executif || {};
    const s5 = aiResult.section_5_resultats_detailles || [];
    const s7 = aiResult.section_7_plan_actions || {};
    const s8 = aiResult.section_8_recommandations || [];

    const normalizedResult = {
      // Champs legacy pour compatibilité scanController.js / pdfReportService.js
      score_securite: s1.indicateurs?.score_securite ?? cs.globalScore,
      niveau_risque: s1.indicateurs?.niveau_risque ?? cs.riskLevel,
      resume_executif: s1.texte_complet || 'Analyse complétée.',
      priorites: s5
        .filter(v => ['CRITIQUE', 'CRITICAL', 'ÉLEVÉ', 'HIGH'].includes((v.criticite || '').toUpperCase()))
        .map((v, i) => ({
          ordre: i + 1,
          vulnerabilite: v.nom || '',
          raison: `Criticité ${v.criticite} — CVSS ${v.cvss_score || 0}${v.cve && v.cve !== 'N/A' ? ' — ' + v.cve : ''}`,
          impact: v.description || (v.systemes_affectes || []).join(', ') || 'Impact critique sur la sécurité du SI',
          solution_detaillee: v.solution || 'Appliquer le correctif constructeur et vérifier la configuration du service',
        })),
      recommandations_generales: s8.map(r => `${r.titre}: ${(r.actions || []).join(', ')}`),
      recommandations_detaillees: s8.map((r, i) => ({
        id: r.id || `RECO-${String(i + 1).padStart(2, '0')}`,
        titre: r.titre || '',
        objectif: r.objectif || '',
        actions: r.actions || [],
        kpi: r.kpi || '',
        estimation_cout: r.estimation_cout || '',
      })),
      actions_immediates: (s7.actions_immediates_j0 || []).map(a => ({
        id: a.id || 'U01',
        action: a.action || '',
        detail: a.impact_service || a.detail_technique || '',
        temps_estime: a.estimation || 'N/A',
        responsable: a.responsable || 'Admin Sys',
      })),
      top_vulnerabilites: s5.map(v => ({
        nom: v.nom || '',
        criticite: v.criticite || 'HIGH',
        cible: (v.systemes_affectes || []).join(', ') || 'N/A',
        cvss: v.cvss_score || 0,
        cve: v.cve || 'N/A',
        description_courte: (v.description || '').substring(0, 150),
      })),
      conclusion: aiResult.section_1_resume_executif?.texte_complet?.split('.').slice(-2).join('.') || 'Audit complété.',
      session_id: `AUD-${Date.now().toString().slice(-6)}`,

      // Score organisationnel pour le frontend
      organisational_score: orgResult,
      raw_tech_score: cs.rawTechScore,

      // Nouvelles sections complètes pour le PDF 10 sections
      full_report: aiResult,
    };

    console.log('[AI] ✅ Analyse complète — Score:', normalizedResult.score_securite);
    return normalizedResult;

  } catch (error) {
    console.error('[AI] ❌ Erreur analyse IA:', error.message);
    // Fallback gracieux
    return buildFallbackResult(parsedReport, computedStats);
  }
};

// ══════════════════════════════════════════════════════════════
//  FALLBACK — si l'IA échoue, on génère un rapport basique
// ══════════════════════════════════════════════════════════════
function buildFallbackResult(parsedReport, cs = {}) {
  const stats = parsedReport?.stats || {};
  const vulns = parsedReport?.vulnerabilities || [];
  
  let scoreBase = 100 - (stats.critical || 0) * 25 - (stats.high || 0) * 15 - (stats.medium || 0) * 5 - (stats.low || 0);
  if (stats.critical > 0) scoreBase = Math.min(scoreBase, 39);
  else if (stats.high > 0) scoreBase = Math.min(scoreBase, 69);
  else if (stats.medium > 0) scoreBase = Math.min(scoreBase, 89);
  const globalScore = cs.globalScore ?? Math.max(0, scoreBase);

  let riskLevel = 'FAIBLE';
  if (globalScore < 40) riskLevel = 'CRITIQUE';
  else if (globalScore < 70) riskLevel = 'ÉLEVÉ';
  else if (globalScore < 90) riskLevel = 'MOYEN';

  const critVulns = vulns.filter(v => v.criticality === 'CRITICAL');
  const hasBackdoor = vulns.some(v => /backdoor|trojan|rootkit/i.test(v.name));
  const hasDefaultCreds = vulns.some(v => /default|brute|credential|password/i.test(v.name));
  const hasEOL = vulns.some(v => /end.of.life|eol|unsupported/i.test(v.name));
  const hasWebVuln = vulns.some(v => /xss|sql|csrf|php|apache|tomcat/i.test(v.name));

  const recos = [];
  if (critVulns.length > 0) recos.push({
    titre: 'Correction des vulns critiques',
    objectif: 'Corriger les ' + critVulns.length + ' vulns critiques (CVSS >= 9.0) pour supprimer les vecteurs d\'attaque majeurs.',
    actions: [
      'Appliquer les correctifs pour: ' + critVulns.slice(0, 3).map(v => v.name).join(', '),
      'Isoler temporairement les services sans patch disponible',
      'Verifier les CVE Advisory pour chaque faille'
    ],
    kpi: 'Reduction des vulns critiques de ' + critVulns.length + ' a 0',
    estimation_cout: 'Moyen - Equipe sysadmin 2-5 jours'
  });
  if (hasBackdoor) recos.push({
    titre: 'Neutralisation des backdoors',
    objectif: 'Eradiquer les backdoors detectees permettant un acces root non autorise.',
    actions: [
      'Nettoyage complet des systemes compromis (reinstallation recommandee)',
      'Analyse des logs pour identifier les intrusions passees',
      'Deploiement IDS/IPS pour detection en temps reel',
      'Rotation de tous les credentials du perimetre'
    ],
    kpi: 'Elimination de 100% des backdoors',
    estimation_cout: 'Eleve - Analyse forensique 3-7 jours'
  });
  if (hasDefaultCreds) recos.push({
    titre: 'Renforcement de l\'authentification',
    objectif: 'Supprimer tous les identifiants par defaut et mots de passe faibles detectes.',
    actions: [
      'Changer tous les mots de passe par defaut (FTP, PostgreSQL, VNC, etc.)',
      'Imposer politique de complexite: min. 12 caracteres avec majuscules, chiffres, symboles',
      'Activer le MFA sur les services exposes',
      'Desactiver les comptes de service inutilises'
    ],
    kpi: '0 service accessible avec identifiants par defaut',
    estimation_cout: 'Faible - Configuration 1-2 jours'
  });
  if (hasEOL) recos.push({
    titre: 'Migration des systemes obsoletes (EOL)',
    objectif: 'Remplacer les OS et logiciels en fin de vie qui ne recoivent plus de correctifs.',
    actions: [
      'Inventaire complet des systemes EOL',
      'Planifier migration vers versions supportees (ex: Ubuntu 22.04 LTS)',
      'Isoler les systemes EOL dans un VLAN dedie en attendant la migration'
    ],
    kpi: 'Tous les systemes sur des versions supportees',
    estimation_cout: 'Eleve - Migration 1-4 semaines'
  });
  if (hasWebVuln) recos.push({
    titre: 'Securisation des applications web',
    objectif: 'Corriger les vulns applicatives web et durcir la configuration des serveurs.',
    actions: [
      'Mettre a jour Apache, PHP, Tomcat vers les dernieres versions stables',
      'Deployer un WAF devant les services web exposes',
      'Supprimer les pages sensibles (phpinfo, status pages)',
      'Appliquer les headers de securite HTTP (CSP, HSTS, X-Frame-Options)'
    ],
    kpi: 'Reduction des vulns web de 100%',
    estimation_cout: 'Moyen - Configuration + tests 2-5 jours'
  });
  if (recos.length < 3) recos.push({
    titre: 'Segmentation reseau et surveillance',
    objectif: 'Limiter la surface d\'attaque et la propagation laterale en cas de compromission.',
    actions: [
      'Segmenter le reseau en zones de confiance (DMZ, production, administration)',
      'Deployer un SIEM pour centraliser les logs de securite',
      'Planifier des scans mensuels automatises',
      'Former les equipes aux bonnes pratiques de securite'
    ],
    kpi: 'Reduction du MTTD de 50%',
    estimation_cout: 'Moyen - Mise en place progressive 2-4 semaines'
  });

  const detailedActions = critVulns.slice(0, 5).map((v, i) => ({
    id: 'U0' + (i + 1),
    action: v.name.length > 60 ? v.name.substring(0, 57) + '...' : v.name,
    detail: v.host + ':' + v.port + ' - CVSS ' + v.cvss,
    temps_estime: v.cvss >= 10 ? '2h' : v.cvss >= 9 ? '4h' : '8h',
    responsable: 'Admin Sys',
  }));

  return {
    score_securite: globalScore,
    niveau_risque: riskLevel,
    resume_executif: `L'audit de sécurité a identifié ${stats.total || 0} vulnérabilités dont ${stats.critical || 0} critiques et ${stats.high || 0} élevées. Le score global est de ${globalScore}/100, plaçant l'infrastructure à un niveau de risque ${riskLevel}. ${critVulns.length > 0 ? 'Les failles les plus sévères incluent : ' + critVulns.slice(0, 3).map(v => v.name).join(', ') + '.' : ''} Des actions correctives immédiates sont impératives.`,
    priorites: vulns.filter(v => v.criticality === 'CRITICAL' || v.criticality === 'HIGH').slice(0, 5).map((v, i) => ({
      ordre: i + 1,
      vulnerabilite: v.name,
      raison: `Criticité ${v.criticality} — CVSS ${v.cvss}`,
      impact: v.description ? v.description.substring(0, 150) : `Exploitation possible permettant un accès ${v.criticality === 'CRITICAL' ? 'root/administrateur au système' : 'non autorisé aux données'}`,
      solution_detaillee: v.solution ? v.solution.substring(0, 250) : 'Appliquer le correctif constructeur et vérifier la configuration du service',
    })),
    recommandations_generales: recos.map(r => r.objectif),
    recommandations_detaillees: recos,
    actions_immediates: detailedActions,
    top_vulnerabilites: vulns.map(v => ({
      nom: v.name || '',
      criticite: v.criticality || 'MEDIUM',
      cible: `${v.host}:${v.port}`,
      cvss: v.cvss || 0,
      cve: v.cve || 'N/A',
      description_courte: (v.description || '').substring(0, 150),
    })),
    conclusion: `L'audit révèle un niveau de risque ${globalScore >= 70 ? 'acceptable' : globalScore >= 40 ? 'préoccupant nécessitant des actions correctives rapides' : 'critique nécessitant une intervention immédiate. L\'infrastructure présente des failles exploitables permettant un accès non autorisé'}. Un audit de suivi est recommandé sous 30 jours.`,
    session_id: `AUD-${Date.now().toString().slice(-6)}`,
    full_report: null,
  };
}