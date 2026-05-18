// backend/controllers/healthController.js
// ──────────────────────────────────────────────────────────────
// Récupère les métriques RÉELLES de la VM OpenVAS via SSH
// CPU, RAM, Disque, Conteneurs Docker, Uptime
// ──────────────────────────────────────────────────────────────

import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const VM_CONFIG = {
    host: process.env.GVM_HOST || '192.168.109.146',
    port: parseInt(process.env.GVM_SSH_PORT) || 22,
    username: process.env.GVM_SSH_USER || 'mariem',
    password: process.env.GVM_SSH_PASS || '',
};

// Cache des métriques (évite de spammer la VM)
let cachedMetrics = null;
let lastFetch = 0;
const CACHE_TTL = 15000; // 15 secondes

// ── Exécuter une commande SSH ─────────────────────────────────
function execSSH(command) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let output = '';
        let errorOutput = '';

        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) { conn.end(); return reject(err); }
                stream.on('data', (data) => { output += data.toString(); });
                stream.stderr.on('data', (data) => { errorOutput += data.toString(); });
                stream.on('close', () => {
                    conn.end();
                    resolve(output.trim());
                });
            });
        });

        conn.on('error', (err) => reject(err));

        conn.connect({
            host: VM_CONFIG.host,
            port: VM_CONFIG.port,
            username: VM_CONFIG.username,
            password: VM_CONFIG.password,
            readyTimeout: 10000,
        });
    });
}

// ══════════════════════════════════════════════════════════════
//  GET /api/health/vm — Métriques complètes de la VM
// ══════════════════════════════════════════════════════════════
export const getVmHealth = async (req, res) => {
    try {
        // Vérifier le cache
        const now = Date.now();
        if (cachedMetrics && (now - lastFetch) < CACHE_TTL) {
            return res.json(cachedMetrics);
        }

        // Commande unique qui récupère TOUT en une seule connexion SSH
        const cmd = `echo "===CPU===" && top -bn1 | head -5 && echo "===MEM===" && free -m && echo "===DISK===" && df -h / && echo "===UPTIME===" && uptime -p && echo "===LOAD===" && cat /proc/loadavg && echo "===DOCKER===" && docker ps --format "{{.Names}}|{{.Status}}|{{.Image}}" 2>/dev/null && echo "===DOCKER_STATS===" && docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}" 2>/dev/null && echo "===NET===" && cat /proc/net/dev | grep -E "eth0|ens" | head -1 && echo "===HOSTNAME===" && hostname && echo "===OS===" && cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2`;

        const raw = await execSSH(cmd);

        // Parser les résultats
        const sections = {};
        let currentSection = '';
        raw.split('\n').forEach(line => {
            if (line.startsWith('===') && line.endsWith('===')) {
                currentSection = line.replace(/===/g, '').trim();
                sections[currentSection] = [];
            } else if (currentSection) {
                sections[currentSection].push(line);
            }
        });

        // ── CPU ──
        let cpuUsage = 0;
        const cpuLines = sections['CPU'] || [];
        for (const line of cpuLines) {
            // Format: %Cpu(s):  5.9 us,  1.2 sy, ...  92.0 id
            const idleMatch = line.match(/(\d+\.?\d*)\s*id/);
            if (idleMatch) {
                cpuUsage = Math.round(100 - parseFloat(idleMatch[1]));
                break;
            }
        }

        // ── RAM ──
        let ramTotal = 0, ramUsed = 0, ramFree = 0, ramPercent = 0;
        const memLines = sections['MEM'] || [];
        for (const line of memLines) {
            // Format: Mem:  16000  8000  4000  ...
            const match = line.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/);
            if (match) {
                ramTotal = parseInt(match[1]);
                ramUsed = parseInt(match[2]);
                ramFree = parseInt(match[3]);
                ramPercent = Math.round((ramUsed / ramTotal) * 100);
                break;
            }
        }

        // ── Disque ──
        let diskTotal = '', diskUsed = '', diskFree = '', diskPercent = 0;
        const diskLines = sections['DISK'] || [];
        for (const line of diskLines) {
            const match = line.match(/(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)%\s+\//);
            if (match) {
                diskTotal = match[2];
                diskUsed = match[3];
                diskFree = match[4];
                diskPercent = parseInt(match[5]);
                break;
            }
        }

        // ── Uptime ──
        const uptime = (sections['UPTIME'] || []).join(' ').replace('up ', '') || 'N/A';

        // ── Load Average ──
        let loadAvg = { '1m': 0, '5m': 0, '15m': 0 };
        const loadLine = (sections['LOAD'] || []).join('');
        const loadMatch = loadLine.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
        if (loadMatch) {
            loadAvg = { '1m': parseFloat(loadMatch[1]), '5m': parseFloat(loadMatch[2]), '15m': parseFloat(loadMatch[3]) };
        }

        // ── Docker Containers ──
        const containers = [];
        const dockerLines = sections['DOCKER'] || [];
        for (const line of dockerLines) {
            const parts = line.split('|');
            if (parts.length >= 3) {
                containers.push({
                    name: parts[0].replace('greenbone-community-edition-', ''),
                    fullName: parts[0],
                    status: parts[1],
                    image: parts[2],
                    isUp: parts[1].toLowerCase().includes('up'),
                });
            }
        }

        // ── Docker Stats (CPU/RAM par conteneur) ──
        const containerStats = {};
        const statsLines = sections['DOCKER_STATS'] || [];
        for (const line of statsLines) {
            const parts = line.split('|');
            if (parts.length >= 3) {
                const name = parts[0].replace('greenbone-community-edition-', '');
                containerStats[name] = {
                    cpu: parts[1],
                    memory: parts[2],
                };
            }
        }

        // Fusionner stats dans containers
        containers.forEach(c => {
            if (containerStats[c.name]) {
                c.cpu = containerStats[c.name].cpu;
                c.memory = containerStats[c.name].memory;
            }
        });

        // ── Hostname & OS ──
        const hostname = (sections['HOSTNAME'] || []).join('') || 'VM';
        const os = (sections['OS'] || []).join('') || 'Linux';

        // ── Réseau ──
        let networkRx = 0, networkTx = 0;
        const netLine = (sections['NET'] || []).join('');
        const netMatch = netLine.match(/:\s*(\d+)/g);
        if (netMatch && netMatch.length >= 2) {
            networkRx = parseInt(netMatch[0].replace(':', '').trim());
            networkTx = parseInt(netMatch[1] ? netMatch[1].replace(':', '').trim() : 0);
        }

        // ── Statut global ──
        const allContainersUp = containers.every(c => c.isUp);
        const systemStatus = cpuUsage > 90 ? 'CRITIQUE' : cpuUsage > 70 ? 'ATTENTION' : allContainersUp ? 'STABLE' : 'DÉGRADÉ';
        const statusColor = systemStatus === 'STABLE' ? 'emerald' : systemStatus === 'ATTENTION' ? 'amber' : 'rose';

        const metrics = {
            connected: true,
            timestamp: new Date().toISOString(),
            hostname,
            os,
            uptime,
            systemStatus,
            statusColor,

            cpu: {
                usage: cpuUsage,
                loadAvg,
            },

            ram: {
                total: ramTotal,
                used: ramUsed,
                free: ramFree,
                percent: ramPercent,
                totalFormatted: `${(ramTotal / 1024).toFixed(1)} GB`,
                usedFormatted: `${(ramUsed / 1024).toFixed(1)} GB`,
            },

            disk: {
                total: diskTotal,
                used: diskUsed,
                free: diskFree,
                percent: diskPercent,
            },

            docker: {
                totalContainers: containers.length,
                runningContainers: containers.filter(c => c.isUp).length,
                containers,
            },

            network: {
                rxBytes: networkRx,
                txBytes: networkTx,
                rxFormatted: `${(networkRx / 1024 / 1024).toFixed(1)} MB`,
                txFormatted: `${(networkTx / 1024 / 1024).toFixed(1)} MB`,
            },
        };

        // Mettre en cache
        cachedMetrics = metrics;
        lastFetch = now;

        res.json(metrics);

    } catch (error) {
        console.error('[HEALTH] Erreur:', error.message);
        res.json({
            connected: false,
            error: error.message,
            systemStatus: 'DÉCONNECTÉ',
            statusColor: 'rose',
            cpu: { usage: 0, loadAvg: { '1m': 0, '5m': 0, '15m': 0 } },
            ram: { total: 0, used: 0, free: 0, percent: 0, totalFormatted: '0 GB', usedFormatted: '0 GB' },
            disk: { total: '0', used: '0', free: '0', percent: 0 },
            docker: { totalContainers: 0, runningContainers: 0, containers: [] },
        });
    }
};

// ══════════════════════════════════════════════════════════════
//  GET /api/health/vm/history — Historique métriques (dernières 24h)
// ══════════════════════════════════════════════════════════════
const metricsHistory = [];
const MAX_HISTORY = 288; // 24h avec 1 point toutes les 5 minutes

export const getVmHealthHistory = async (req, res) => {
    res.json(metricsHistory);
};

// Collecter les métriques toutes les 5 minutes pour le graphique
setInterval(async () => {
    try {
        const cmd = `top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}' && free -m | grep Mem | awk '{print int($3/$2*100)}'`;
        const raw = await execSSH(cmd);
        const lines = raw.split('\n');
        const cpu = parseFloat(lines[0]) || 0;
        const ram = parseInt(lines[1]) || 0;

        metricsHistory.push({
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            cpu: Math.round(cpu),
            ram,
            timestamp: Date.now(),
        });

        // Garder seulement les dernières 24h
        while (metricsHistory.length > MAX_HISTORY) {
            metricsHistory.shift();
        }
    } catch (e) {
        // VM déconnectée, pas grave
    }
}, 300000); // 5 minutes