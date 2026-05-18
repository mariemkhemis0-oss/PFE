import xml2js from 'xml2js';
import fs from 'fs';

export const parseOpenVASReport = async (xmlContent) => {
  try {
    const parser = new xml2js.Parser({ explicitArray: false, trim: true });
    const result = await parser.parseStringPromise(xmlContent);

    console.log('[PARSER] Root keys:', Object.keys(result));

    // ── Trouver le noeud "report" — GVM peut emballer de multiples façons ──
    let report = null;

    // Helper: chercher récursivement un noeud qui contient "results"
    function findReportWithResults(obj, depth = 0) {
      if (!obj || depth > 5) return null;
      if (obj.results && (obj.results.result || Array.isArray(obj.results))) return obj;
      if (obj.report) {
        const inner = Array.isArray(obj.report) ? obj.report[0] : obj.report;
        const found = findReportWithResults(inner, depth + 1);
        if (found) return found;
        return inner; // retourner quand même l'inner report
      }
      return null;
    }

    if (result.get_reports_response) {
      console.log('[PARSER] Structure: get_reports_response');
      report = findReportWithResults(result.get_reports_response);
    } else if (result.report) {
      console.log('[PARSER] Structure: report');
      report = findReportWithResults(result);
      if (!report) {
        report = Array.isArray(result.report) ? result.report[0] : result.report;
      }
    }

    if (!report) {
      // Dernier recours : chercher dans TOUTES les clés racine
      for (const key of Object.keys(result)) {
        const found = findReportWithResults(result[key]);
        if (found) { report = found; break; }
      }
    }

    if (!report) {
      const rootKeys = Object.keys(result);
      console.error('[PARSER] ÉCHEC: pas de report trouvé. Clés:', rootKeys);
      // Debug: afficher la structure
      const sample = JSON.stringify(result).substring(0, 500);
      console.error('[PARSER] Structure sample:', sample);
      throw new Error(`Structure XML invalide. Clés racine: [${rootKeys.join(', ')}]`);
    }

    console.log('[PARSER] Report keys:', Object.keys(report));

    // ── Chercher les results ──
    let results = null;
    if (report.results && report.results.result) {
      results = report.results.result;
      console.log('[PARSER] Found results in report.results.result');
    } else if (report.results && Array.isArray(report.results)) {
      results = report.results;
      console.log('[PARSER] Found results as array');
    } else if (report.result) {
      results = report.result;
      console.log('[PARSER] Found results in report.result');
    } else {
      console.log('[PARSER] WARNING: No results node found in report');
      console.log('[PARSER] Report keys:', Object.keys(report));
      if (report.results) {
        console.log('[PARSER] results keys:', typeof report.results === 'object' ? Object.keys(report.results) : typeof report.results);
      }
    }

    // ── Extraire les hosts ──
    const hosts = [];
    if (report.host) {
      const hostData = Array.isArray(report.host) ? report.host : [report.host];
      hostData.forEach(h => {
        const ip = typeof h === 'string' ? h : (h.ip || h._ || h.name || 'N/A');
        const hostname = typeof h === 'object' ? (h.hostname || h.name || '') : '';
        hosts.push({ ip, hostname: hostname || 'N/A' });
      });
    }

    // ── Extraire les vulnérabilités ──
    const vulnerabilities = [];

    if (results) {
      const resultArray = Array.isArray(results) ? results : [results];

      resultArray.forEach(r => {
        // ── Extraire host ──
        // GVM 22.7: <host>192.168.109.146<asset...>...</host>
        // xml2js parse ça comme { _: "192.168.109.146", asset: {...}, hostname: "" }
        let hostValue = 'N/A';
        if (r.host) {
          if (typeof r.host === 'string') {
            hostValue = r.host;
          } else if (r.host._) {
            hostValue = r.host._;
          } else if (r.host.ip) {
            hostValue = r.host.ip;
          }
        }

        // ── Extraire severity ──
        const severity = parseFloat(r.severity) || 0;

        // ── Criticality mapping ──
        let criticality;
        if (severity >= 9.0) criticality = 'CRITICAL';
        else if (severity >= 7.0) criticality = 'HIGH';
        else if (severity >= 4.0) criticality = 'MEDIUM';
        else if (severity > 0) criticality = 'LOW';
        else return; // skip log/info (severity 0)

        // ── Extraire CVE depuis nvt.refs ou nvt.tags ──
        let cve = 'N/A';
        if (r.nvt) {
          // Méthode 1: nvt.refs.ref (GVM 22.7)
          if (r.nvt.refs && r.nvt.refs.ref) {
            const refs = Array.isArray(r.nvt.refs.ref) ? r.nvt.refs.ref : [r.nvt.refs.ref];
            const cveRef = refs.find(ref => ref.$ && ref.$.type === 'cve');
            if (cveRef && cveRef.$.id) cve = cveRef.$.id;
          }
          // Méthode 2: attribut direct
          if (cve === 'N/A' && r.nvt.cve) {
            cve = typeof r.nvt.cve === 'string' ? r.nvt.cve : 'N/A';
          }
        }
        if (r.cve && cve === 'N/A') {
          cve = typeof r.cve === 'string' ? r.cve : 'N/A';
        }

        // ── CVSS ──
        let cvss = severity.toString();
        if (r.nvt && r.nvt.cvss_base) {
          cvss = r.nvt.cvss_base;
        }

        // ── Solution ──
        let solution = '';
        if (r.nvt && r.nvt.solution) {
          solution = typeof r.nvt.solution === 'string'
            ? r.nvt.solution
            : (r.nvt.solution._ || r.nvt.solution.$ && r.nvt.solution.$.type || '');
        }

        // ── Name ──
        const name = r.name || (r.nvt && r.nvt.name) || 'Unknown';

        // ── Description ──
        const description = r.description || '';

        // ── Port ──
        const port = r.port || 'N/A';

        // ── Threat ──
        const threat = r.threat || r.original_threat || 'N/A';

        vulnerabilities.push({
          name,
          host: hostValue,
          port,
          severity,
          criticality,
          threat,
          description: description.substring(0, 500),
          solution,
          cvss,
          cve,
        });
      });
    }

    // Trier par sévérité décroissante
    vulnerabilities.sort((a, b) => b.severity - a.severity);

    // ── Extraire hosts des vulns si hosts vide ──
    if (hosts.length === 0 && vulnerabilities.length > 0) {
      const uniqueHosts = [...new Set(vulnerabilities.map(v => v.host).filter(h => h && h !== 'N/A'))];
      uniqueHosts.forEach(ip => hosts.push({ ip, hostname: 'N/A' }));
      console.log(`[PARSER] Hosts extraits des vulnérabilités: ${hosts.length}`);
    }

    // ── Statistiques ──
    const stats = {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.criticality === 'CRITICAL').length,
      high: vulnerabilities.filter(v => v.criticality === 'HIGH').length,
      medium: vulnerabilities.filter(v => v.criticality === 'MEDIUM').length,
      low: vulnerabilities.filter(v => v.criticality === 'LOW').length,
    };

    console.log(`[PARSER] ✅ FINAL: ${stats.total} vulns (C:${stats.critical} H:${stats.high} M:${stats.medium} L:${stats.low}) from ${hosts.length} hosts`);

    return {
      hosts,
      vulnerabilities,
      stats,
    };

  } catch (error) {
    throw new Error(`Erreur parsing XML: ${error.message}`);
  }
};

// Lire et parser un fichier XML
export const parseOpenVASFile = async (filePath) => {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  return parseOpenVASReport(xmlContent);
};