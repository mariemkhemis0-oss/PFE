// backend/services/gvmService.js
// ──────────────────────────────────────────────────────────────
// v5 — GVM 22.7 nécessite <authenticate> avant chaque commande
// Flux : connect socket → authenticate → send command → read response
// ──────────────────────────────────────────────────────────────

import { Client } from 'ssh2';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const GVM_CONFIG = {
  host: process.env.GVM_HOST || '192.168.109.146',
  port: parseInt(process.env.GVM_SSH_PORT) || 22,
  username: process.env.GVM_SSH_USER || 'mariem',
  password: process.env.GVM_SSH_PASS || '',
  privateKeyPath: process.env.GVM_SSH_KEY_PATH || '',
  gmpUser: process.env.GVM_GMP_USER || 'admin',
  gmpPass: process.env.GVM_GMP_PASS || 'admin',
  container: process.env.GVM_CONTAINER || 'greenbone-community-edition-gvmd-1',
  socketPath: process.env.GVM_SOCKET_PATH || '/run/gvmd/gvmd.sock',
};

const SCAN_CONFIGS = {
  'full-and-fast':    'daba56c8-73ec-11df-a475-002264764cea',
  'full-and-deep':    '708f25c4-7489-11df-8094-002264764cea',
  'discovery':        '8715c877-47a0-438d-98a3-27c7a6ab2196',
  'host-discovery':   '2d3f051c-55ba-11e3-bf43-406186ea4fc5',
  'system-discovery': 'bbca7412-a950-11e3-9109-406186ea4fc5',
};

const DEFAULT_SCAN_CONFIG = SCAN_CONFIGS['full-and-fast'];
const DEFAULT_SCANNER_ID = '08b69003-5fc2-4037-a479-93b440211c73';

// ══════════════════════════════════════════════════════════════
//  Exécuter une commande GMP avec authentification
//  
//  GVM 22.7 protocole :
//    1. s.sendall(b'<authenticate>...</authenticate>')
//    2. Lire <authenticate_response status="200">
//    3. s.sendall(b'<create_target>...</create_target>')
//    4. Lire <create_target_response>
// ══════════════════════════════════════════════════════════════
function execGvmCommand(gmpXml) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    // XML d'authentification
    const authXml = `<authenticate><credentials><username>${GVM_CONFIG.gmpUser}</username><password>${GVM_CONFIG.gmpPass}</password></credentials></authenticate>`;

    // Encoder les deux XML en base64
    const authB64 = Buffer.from(authXml).toString('base64');
    const cmdB64 = Buffer.from(gmpXml).toString('base64');

    // Tag de fin pour la commande
    const tagMatch = gmpXml.match(/<(\w+)[\s/>]/);
    const rootTag = tagMatch ? tagMatch[1] : 'unknown';
    const endTag = `</${rootTag}_response>`;

    // Script Python : authenticate puis envoyer la commande
    const pyLines = [
      'import socket,base64,sys',
      `auth=base64.b64decode("${authB64}")`,
      `cmd=base64.b64decode("${cmdB64}")`,
      `end_tag=b"${endTag}"`,
      's=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM)',
      's.settimeout(120)',
      `s.connect("${GVM_CONFIG.socketPath}")`,
      '# Step 1: Authenticate',
      's.sendall(auth)',
      'r=b""',
      'while b"</authenticate_response>" not in r:',
      ' c=s.recv(65536)',
      ' if not c:break',
      ' r+=c',
      'if b\'status="200"\' not in r and b\'status="201"\' not in r:',
      ' sys.stderr.write("Auth failed: "+r.decode("utf-8","replace")[:200])',
      ' s.close()',
      ' sys.exit(1)',
      '# Step 2: Send command',
      's.sendall(cmd)',
      'd=b""',
      'while True:',
      ' try:',
      '  c=s.recv(65536)',
      '  if not c:break',
      '  d+=c',
      '  if end_tag in d:break',
      ' except:break',
      'sys.stdout.buffer.write(d)',
      's.close()',
    ];

    const pyScript = pyLines.join('\n');
    const scriptB64 = Buffer.from(pyScript).toString('base64');

    const cmd = `docker exec ${GVM_CONFIG.container} sh -c "echo '${scriptB64}' | base64 -d | python3"`;

    console.log(`[GVM] Sending (with auth): ${gmpXml.substring(0, 80)}`);

    const connectConfig = {
      host: GVM_CONFIG.host,
      port: GVM_CONFIG.port,
      username: GVM_CONFIG.username,
      readyTimeout: 15000,
    };

    if (GVM_CONFIG.password) {
      connectConfig.password = GVM_CONFIG.password;
    } else if (GVM_CONFIG.privateKeyPath) {
      try {
        connectConfig.privateKey = fs.readFileSync(GVM_CONFIG.privateKeyPath);
      } catch (e) { /* fallback */ }
    }

    conn.on('ready', () => {
      const chunks = [];
      let errorOutput = '';

      conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return reject(err); }

        stream.on('data', (data) => chunks.push(data));
        stream.stderr.on('data', (data) => { errorOutput += data.toString(); });

        stream.on('close', (code) => {
          conn.end();
          const output = Buffer.concat(chunks).toString('utf-8').trim();

          if (code !== 0 && !output) {
            reject(new Error(`GVM error (exit ${code}): ${errorOutput.substring(0, 300)}`));
          } else if (!output) {
            reject(new Error(`GVM: empty response. stderr: ${errorOutput.substring(0, 300)}`));
          } else {
            resolve(output);
          }
        });
      });
    });

    conn.on('error', (err) => reject(new Error(`SSH failed: ${err.message}`)));
    conn.connect(connectConfig);
  });
}

// ── Helpers ───────────────────────────────────────────────────
function extractAttribute(xml, attr) {
  const match = xml.match(new RegExp(`${attr}="([^"]+)"`));
  return match ? match[1] : null;
}

// ══════════════════════════════════════════════════════════════
//  API PUBLIQUE
// ══════════════════════════════════════════════════════════════

export async function createTarget(name, hosts) {
  // Port list "All IANA Assigned TCP" — ID par défaut de GVM
  const portListId = '33d0cd82-57c6-11e1-8ed1-406186ea4fc5';
  const xml = `<create_target><name>${name} - ${Date.now()}</name><hosts>${hosts}</hosts><port_list id="${portListId}"/></create_target>`;
  const res = await execGvmCommand(xml);
  console.log('[GVM] Create target:', res.substring(0, 200));
  const id = extractAttribute(res, 'id');
  if (!id) throw new Error('Failed to create target: ' + res.substring(0, 300));
  return id;
}

export async function createTask(name, targetId, scanProfile = 'full-and-fast') {
  const configId = SCAN_CONFIGS[scanProfile] || DEFAULT_SCAN_CONFIG;
  const xml = `<create_task><name>${name}</name><config id="${configId}"/><target id="${targetId}"/><scanner id="${DEFAULT_SCANNER_ID}"/></create_task>`;
  const res = await execGvmCommand(xml);
  console.log('[GVM] Create task:', res.substring(0, 200));
  const id = extractAttribute(res, 'id');
  if (!id) throw new Error('Failed to create task: ' + res.substring(0, 300));
  return id;
}

export async function startTask(taskId) {
  const res = await execGvmCommand(`<start_task task_id="${taskId}"/>`);
  console.log('[GVM] Start task:', res.substring(0, 200));
  const match = res.match(/<report_id>([^<]+)<\/report_id>/);
  return { taskId, reportId: match ? match[1] : null };
}

export async function getTaskStatus(taskId) {
  const res = await execGvmCommand(`<get_tasks task_id="${taskId}"/>`);
  const statusMatch = res.match(/<status>([^<]+)<\/status>/);
  const progressMatch = res.match(/<progress>([^<]+)<\/progress>/);
  const status = statusMatch ? statusMatch[1] : 'Unknown';
  const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
  console.log(`[GVM] Task ${taskId} raw status: "${status}", progress: ${progress}`);
  const map = {
    'New':'QUEUED', 'Requested':'QUEUED', 'Queued':'QUEUED',
    'Running':'RUNNING',
    'Done':'DONE',
    'Stopped':'STOPPED', 'Stop Requested':'STOPPED',
    'Interrupted':'STOPPED',
  };
  return { status: map[status] || 'RUNNING', progress, rawStatus: status };
}

export async function getReportXML(reportId) {
  // format_id = XML format in GVM
  const res = await execGvmCommand(`<get_reports report_id="${reportId}" format_id="a994b278-1f62-11e1-96ac-406186ea4fc5" details="1"/>`);
  
  console.log(`[GVM] getReportXML response length: ${res.length} chars`);
  console.log(`[GVM] Response starts with: ${res.substring(0, 200)}`);
  
  // GVM peut retourner le XML encodé en base64 ou directement
  // Cas 1: Base64 dans la réponse (format XML exporté)
  const b64Match = res.match(/<report[^>]*format_id[^>]*>[\s\S]*?<report_format>[^<]*<\/report_format>[\s\S]*?<\/report>[\s\S]*?<report[^>]*>([\s\S]*?)<\/report>\s*<\/report>/);
  
  // Cas 2: Chercher un gros bloc de base64 n'importe où
  const b64Block = res.match(/([A-Za-z0-9+/]{200,}={0,2})/);
  
  if (b64Block) {
    try {
      const decoded = Buffer.from(b64Block[1].replace(/\s/g, ''), 'base64').toString('utf-8');
      if (decoded.includes('<report') || decoded.includes('<result')) {
        console.log(`[GVM] Decoded base64 XML: ${decoded.length} chars`);
        console.log(`[GVM] Decoded starts: ${decoded.substring(0, 200)}`);
        return decoded;
      }
    } catch (e) {
      console.log('[GVM] Base64 decode failed, using raw response');
    }
  }
  
  // Cas 3: La réponse contient directement les données XML (non encodé)
  if (res.includes('<results>') || res.includes('<result>')) {
    console.log('[GVM] Response contains raw XML results directly');
    return res;
  }
  
  // Cas 4: Essayer le format "details" à la place
  console.log('[GVM] Trying alternative: get_reports with details...');
  try {
    const res2 = await execGvmCommand(`<get_reports report_id="${reportId}" details="1" ignore_pagination="1"/>`);
    if (res2.includes('<results') || res2.includes('<result')) {
      console.log(`[GVM] Details response: ${res2.length} chars with results`);
      return res2;
    }
    // Même cette réponse peut servir
    return res2;
  } catch (e) {
    console.log(`[GVM] Details fallback failed: ${e.message}`);
  }
  
  console.log('[GVM] WARNING: Returning raw response as-is');
  return res;
}

export async function stopTask(taskId) {
  const res = await execGvmCommand(`<stop_task task_id="${taskId}"/>`);
  return { stopped: res.includes('status="202"') };
}

export async function deleteTask(taskId) {
  await execGvmCommand(`<delete_task task_id="${taskId}" ultimate="1"/>`);
}

export async function testConnection() {
  try {
    const res = await execGvmCommand('<get_version/>');
    const match = res.match(/<version>([^<]+)<\/version>/);
    return { connected: true, version: match ? match[1] : 'Unknown' };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

export function getAvailableScanProfiles() {
  return Object.entries(SCAN_CONFIGS).map(([key, id]) => ({
    key, id,
    label: key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }));
}

// ══════════════════════════════════════════════════════════════
//  CREDENTIAL MANAGEMENT (Scans authentifiés)
// ══════════════════════════════════════════════════════════════

export async function createGvmCredential(name, type, login, password) {
  // type: 'up' (user/pass), 'usk' (SSH key)
  const gmpType = type === 'SSH' ? 'up' : type === 'SMB' ? 'up' : 'up';
  const xml = `<create_credential><name>${name} - ${Date.now()}</name><type>${gmpType}</type><login>${login}</login><password>${password}</password></create_credential>`;
  const res = await execGvmCommand(xml);
  console.log('[GVM] Create credential:', res.substring(0, 200));
  const id = extractAttribute(res, 'id');
  if (!id) throw new Error('Failed to create credential: ' + res.substring(0, 300));
  return id;
}

export async function createTargetWithCredential(name, hosts, excludeHosts, credentialId, credType) {
  const portListId = '33d0cd82-57c6-11e1-8ed1-406186ea4fc5';
  let credXml = '';
  if (credentialId) {
    if (credType === 'SMB') {
      credXml = `<smb_credential id="${credentialId}"/>`;
    } else if (credType === 'ESXi') {
      credXml = `<esxi_credential id="${credentialId}"/>`;
    } else {
      credXml = `<ssh_credential id="${credentialId}"><port>22</port></ssh_credential>`;
    }
  }
  const excludeXml = excludeHosts ? `<exclude_hosts>${excludeHosts}</exclude_hosts>` : '';
  const xml = `<create_target><name>${name} - ${Date.now()}</name><hosts>${hosts}</hosts>${excludeXml}<port_list id="${portListId}"/>${credXml}</create_target>`;
  const res = await execGvmCommand(xml);
  console.log('[GVM] Create target with cred:', res.substring(0, 200));
  const id = extractAttribute(res, 'id');
  if (!id) throw new Error('Failed to create target: ' + res.substring(0, 300));
  return id;
}

export async function deleteGvmTarget(targetId) {
  try {
    await execGvmCommand(`<delete_target target_id="${targetId}" ultimate="1"/>`);
    return true;
  } catch (e) {
    console.error('[GVM] Delete target error:', e.message);
    return false;
  }
}

export async function deleteGvmCredential(credentialId) {
  try {
    await execGvmCommand(`<delete_credential credential_id="${credentialId}" ultimate="1"/>`);
    return true;
  } catch (e) {
    console.error('[GVM] Delete credential error:', e.message);
    return false;
  }
}

export async function getGvmTargets() {
  const res = await execGvmCommand('<get_targets/>');
  const targets = [];
  const regex = /<target id="([^"]+)"[\s\S]*?<name>([^<]*)<\/name>/g;
  let match;
  while ((match = regex.exec(res)) !== null) {
    targets.push({ id: match[1], name: match[2] });
  }
  return targets;
}

export async function getGvmCredentials() {
  const res = await execGvmCommand('<get_credentials/>');
  const creds = [];
  const regex = /<credential id="([^"]+)"[\s\S]*?<name>([^<]*)<\/name>/g;
  let match;
  while ((match = regex.exec(res)) !== null) {
    creds.push({ id: match[1], name: match[2] });
  }
  return creds;
}