const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const base = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  const token = localStorage.getItem('token');
  if (token) {
    base['Authorization'] = `Bearer ${token}`;
  }
  return base;
};

// ===== TOAST "ACCÈS BLOQUÉ" =====
const showAccessBlockedToast = (message) => {
  // Supprimer un toast existant s'il y en a un
  const existing = document.getElementById('rbac-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'rbac-toast';
  toast.style.cssText = `
    position: fixed; top: 24px; right: 24px; z-index: 99999;
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white; padding: 18px 28px; border-radius: 14px;
    box-shadow: 0 8px 32px rgba(220,38,38,0.4);
    font-family: 'Inter', 'Segoe UI', sans-serif;
    font-size: 15px; font-weight: 600;
    display: flex; align-items: center; gap: 12px;
    animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 420px;
  `;
  toast.innerHTML = `
    <span style="font-size: 24px;">🚫</span>
    <div>
      <div style="font-size: 16px; font-weight: 700; margin-bottom: 2px;">Accès bloqué</div>
      <div style="font-size: 13px; opacity: 0.9; font-weight: 400;">${message}</div>
    </div>
  `;

  // Ajouter l'animation CSS si elle n'existe pas encore
  if (!document.getElementById('rbac-toast-style')) {
    const style = document.createElement('style');
    style.id = 'rbac-toast-style';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Disparaître après 4 secondes
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

// Fonction helper pour les requêtes
const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      // 🚫 Accès bloqué — rôle non autorisé (403)
      if (response.status === 403) {
        const msg = errorData.error || 'Vous n\'avez pas les permissions nécessaires pour cette action.';
        showAccessBlockedToast(msg);
        throw new Error(`🚫 Accès bloqué : ${msg}`);
      }

      // 🔒 Non authentifié (401) — toast uniquement si session réellement expirée
      if (response.status === 401) {
        const token = localStorage.getItem('token');
        if (token) {
          showAccessBlockedToast('Session expirée. Veuillez vous reconnecter.');
        }
        throw new Error('Non authentifié');
      }

      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ===== USERS =====
export const usersAPI = {
  getAll: () => fetchData(`${API_URL}/users`),
  getById: (id) => fetchData(`${API_URL}/users/${id}`),
  create: (data) =>
    fetchData(`${API_URL}/users`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/users/${id}`, { method: 'DELETE' }),
  getByRole: (role) => fetchData(`${API_URL}/users/role/${role}`),
  assignClient: (data) =>
  fetchData(`${API_URL}/users/assign-client`, { method: 'POST', body: JSON.stringify(data) }),
};

// ===== VULNERABILITIES =====
export const vulnerabilitiesAPI = {
  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchData(`${API_URL}/vulnerabilities${query ? '?' + query : ''}`);
  },
  getById: (id) => fetchData(`${API_URL}/vulnerabilities/${id}`),
  getStats: () => fetchData(`${API_URL}/vulnerabilities/stats`),
  create: (data) =>
    fetchData(`${API_URL}/vulnerabilities`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/vulnerabilities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/vulnerabilities/${id}`, { method: 'DELETE' }),
};

// ===== REPORTS =====
export const reportsAPI = {
  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchData(`${API_URL}/reports${query ? '?' + query : ''}`);
  },
  getById: (id) => fetchData(`${API_URL}/reports/${id}`),
  getStats: () => fetchData(`${API_URL}/reports/stats`),
  create: (data) =>
    fetchData(`${API_URL}/reports`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/reports/${id}`, { method: 'DELETE' }),
  export: (id, format = 'pdf') =>
    fetchData(`${API_URL}/reports/${id}/export?format=${format}`),
  getAll: () => fetchData(`${API_URL}/reports`),
  generate: (formData) =>
    fetch(`${API_URL}/reports/generate`, {
      method: 'POST',
      body: formData, // FormData avec le fichier XML
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    }),
  downloadPDF: (id) => `${API_URL}/reports/${id}/download`,
};

// ===== HOSTS =====
export const hostsAPI = {
  getAll: () => fetchData(`${API_URL}/hosts`),
  getById: (id) => fetchData(`${API_URL}/hosts/${id}`),
  getStats: () => fetchData(`${API_URL}/hosts/stats`),
  create: (data) =>
    fetchData(`${API_URL}/hosts`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/hosts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/hosts/${id}`, { method: 'DELETE' }),
};

// ===== ORGANIZATIONS =====
export const organizationsAPI = {
  getAll: () => fetchData(`${API_URL}/organizations`),
  getById: (id) => fetchData(`${API_URL}/organizations/${id}`),
  create: (data) =>
    fetchData(`${API_URL}/organizations`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/organizations/${id}`, { method: 'DELETE' }),
};

// ===== NOTIFICATIONS =====
export const notificationsAPI = {
  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchData(`${API_URL}/notifications${query ? '?' + query : ''}`);
  },
  getStats: () => fetchData(`${API_URL}/notifications/stats`),
  create: (data) =>
    fetchData(`${API_URL}/notifications`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/notifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/notifications/${id}`, { method: 'DELETE' }),
  markAllRead: (userId) =>
    fetchData(`${API_URL}/notifications/mark-all-read`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};

// ===== SCANNERS =====
export const scannersAPI = {
  getAll: () => fetchData(`${API_URL}/scanners`),
  getStats: () => fetchData(`${API_URL}/scanners/stats`),
  getHealth: (id) => fetchData(`${API_URL}/scanners/${id}/health`),
  create: (data) =>
    fetchData(`${API_URL}/scanners`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/scanners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/scanners/${id}`, { method: 'DELETE' }),
};

// ===== DASHBOARD & CONFIG =====
export const dashboardAPI = {
  getDashboard: () => fetchData(`${API_URL}/dashboard`),
  getHealth: () => fetchData(`${API_URL}/health`),
  getScalingConfig: () => fetchData(`${API_URL}/config/scaling`),
  updateScalingConfig: (data) =>
    fetchData(`${API_URL}/config/scaling`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ===== ROLE REQUESTS =====
export const roleRequestsAPI = {
  getAll: () => fetchData(`${API_URL}/role-requests`),
  getStats: () => fetchData(`${API_URL}/role-requests/stats`),
  create: (data) =>
    fetchData(`${API_URL}/role-requests`, { method: 'POST', body: JSON.stringify(data) }),
  approve: (id, body = {}) => fetchData(`${API_URL}/role-requests/${id}/approve`, { 
  method: 'POST', 
  body: JSON.stringify(body) 
}),
  reject: (id) =>
    fetchData(`${API_URL}/role-requests/${id}/reject`, { method: 'POST' }),
};

// ===== CVE LIBRARY =====
export const cvesAPI = {
  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return fetchData(`${API_URL}/cves${query ? '?' + query : ''}`);
  },
  search: (cveId) => fetchData(`${API_URL}/cves/search?cveId=${cveId}`),
  create: (data) =>
    fetchData(`${API_URL}/cves`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchData(`${API_URL}/cves/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    fetchData(`${API_URL}/cves/${id}`, { method: 'DELETE' }),
};
// ===== AUTH =====
export const authAPI = {
  login: (data) =>
    fetchData(`${API_URL}/auth/login`, { method: 'POST', body: JSON.stringify(data) }),
  register: (data) =>
    fetchData(`${API_URL}/auth/register`, { method: 'POST', body: JSON.stringify(data) }),
};
