# CyberAudit AI Platform - Backend API

Backend Node.js/Express pour la plateforme CyberAudit AI avec tous les endpoints nécessaires.

## 🚀 Installation

```bash
cd backend
npm install
```

## 📝 Configuration

Créer un fichier `.env` à partir du `.env.example`:

```bash
copy .env.example .env
```

**Variables d'environnement:**
- `PORT`: Port du serveur (défaut: 5000)
- `NODE_ENV`: Environnement (development/production)
- `FRONTEND_URL`: URL du frontend (défaut: http://localhost:3000)

## ▶️ Démarrage

**Mode développement (avec rechargement automatique):**
```bash
npm run dev
```

**Mode production:**
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 🔌 Endpoints API

### **USERS** (`/api/users`)
- `GET /api/users` - Récupérer tous les utilisateurs
- `GET /api/users/:id` - Récupérer un utilisateur
- `GET /api/users/role/:role` - Récupérer utilisateurs par rôle
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### **VULNERABILITIES** (`/api/vulnerabilities`)
- `GET /api/vulnerabilities` - Récupérer toutes les vulnérabilités
- `GET /api/vulnerabilities?severity=CRITICAL` - Filtrer par sévérité
- `GET /api/vulnerabilities/:id` - Récupérer une vulnérabilité
- `GET /api/vulnerabilities/stats` - Statistiques
- `POST /api/vulnerabilities` - Créer une vulnérabilité
- `PUT /api/vulnerabilities/:id` - Modifier une vulnérabilité
- `DELETE /api/vulnerabilities/:id` - Supprimer une vulnérabilité

### **REPORTS** (`/api/reports`)
- `GET /api/reports` - Récupérer tous les rapports
- `GET /api/reports/:id` - Récupérer un rapport
- `GET /api/reports/stats` - Statistiques des rapports
- `POST /api/reports` - Créer un rapport
- `PUT /api/reports/:id` - Modifier un rapport
- `DELETE /api/reports/:id` - Supprimer un rapport
- `GET /api/reports/:id/export` - Exporter un rapport

### **HOSTS** (`/api/hosts`)
- `GET /api/hosts` - Récupérer tous les hôtes
- `GET /api/hosts/:id` - Récupérer un hôte
- `GET /api/hosts/stats` - Statistiques des hôtes
- `POST /api/hosts` - Créer un hôte
- `PUT /api/hosts/:id` - Modifier un hôte
- `DELETE /api/hosts/:id` - Supprimer un hôte

### **ORGANIZATIONS** (`/api/organizations`)
- `GET /api/organizations` - Récupérer les organisations
- `GET /api/organizations/:id` - Récupérer une organisation
- `POST /api/organizations` - Créer une organisation
- `PUT /api/organizations/:id` - Modifier une organisation
- `DELETE /api/organizations/:id` - Supprimer une organisation

### **NOTIFICATIONS** (`/api/notifications`)
- `GET /api/notifications` - Récupérer les notifications
- `GET /api/notifications/:id` - Récupérer une notification
- `POST /api/notifications` - Créer une notification
- `PUT /api/notifications/:id` - Marquer comme lue
- `DELETE /api/notifications/:id` - Supprimer une notification
- `POST /api/notifications/mark-all-read` - Marquer toutes comme lues

### **SCANNERS** (`/api/scanners`)
- `GET /api/scanners` - Récupérer les scanners
- `GET /api/scanners/:id` - Récupérer un scanner
- `GET /api/scanners/:id/health` - État du scanner
- `GET /api/scanners/stats` - Statistiques
- `POST /api/scanners` - Créer un scanner
- `PUT /api/scanners/:id` - Modifier un scanner
- `DELETE /api/scanners/:id` - Supprimer un scanner

### **ROLE REQUESTS** (`/api/role-requests`)
- `GET /api/role-requests` - Récupérer les demandes de rôle
- `GET /api/role-requests/:id` - Récupérer une demande
- `POST /api/role-requests` - Créer une demande
- `POST /api/role-requests/:id/approve` - Approuver
- `POST /api/role-requests/:id/reject` - Rejeter

### **CVE LIBRARY** (`/api/cves`)
- `GET /api/cves` - Récupérer les CVE
- `GET /api/cves/search?cveId=CVE-2024-12345` - Rechercher une CVE
- `GET /api/cves/:id` - Récupérer une CVE
- `POST /api/cves` - Créer une CVE
- `PUT /api/cves/:id` - Modifier une CVE
- `DELETE /api/cves/:id` - Supprimer une CVE

### **CONFIGURATION** (`/api/config`)
- `GET /api/config/scaling` - Config. d'autoscaling
- `PUT /api/config/scaling` - Modifier config d'autoscaling

### **DASHBOARD** 
- `GET /api/dashboard` - Données du tableau de bord
- `GET /api/health` - État du système
- `GET /ping` - Vérifier la connexion

## 📊 Structure des Données (Mock)

Les données actuellement utilisent des **mock data en mémoire**. Elles seront remplacées par MongoDB dans la phase 2.

### Fichiers:
- `mockData.js` - Toutes les données de test
- `controllers/` - Tous les contrôleurs CRUD
- `routes/api.js` - Configuration des routes

## 🔄 Phase 2: Intégration MongoDB

Prochaines étapes:
1. Installer mongoose
2. Créer les schémas MongoDB
3. Remplacer mock data par requêtes DB
4. Ajouter la validation des données

## 🔐 Phase 3: Authentification JWT

Prochaines étapes:
1. Installer jsonwebtoken
2. Créer middleware d'authentification
3. Implémenter login/logout
4. Protéger les endpoints

## 📚 Exemple d'utilisation

### Créer un utilisateur:
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "AUDITOR",
    "company": "SecureX"
  }'
```

### Récupérer les vulnérabilités critiques:
```bash
curl http://localhost:5000/api/vulnerabilities?severity=CRITICAL
```

### Obtenir les statistiques:
```bash
curl http://localhost:5000/api/vulnerabilities/stats
```

## 🐛 Débogage

Activez les logs détaillés:
```bash
DEBUG=* npm run dev
```

## 📝 Licence

Propriétaire - CyberAudit AI Platform
