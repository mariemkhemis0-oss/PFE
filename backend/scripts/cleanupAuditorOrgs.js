// Script one-shot pour nettoyer les AuditorOrganization
// Ne garde que les liens où l'auditeur a vraiment des clients dans l'org
// Usage: node backend/scripts/cleanupAuditorOrgs.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const UserSchema = new mongoose.Schema({ name: String, email: String, role: String, company: String, auditorId: mongoose.Schema.Types.ObjectId });
const OrgSchema = new mongoose.Schema({ name: String });
const AOSchema = new mongoose.Schema({ auditorId: mongoose.Schema.Types.ObjectId, organizationId: mongoose.Schema.Types.ObjectId, status: String });

async function cleanup() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Organization = mongoose.models.Organization || mongoose.model('Organization', OrgSchema);
  const AuditorOrganization = mongoose.models.AuditorOrganization || mongoose.model('AuditorOrganization', AOSchema);

  // 1. Lister tous les auditors
  const auditors = await User.find({ role: 'AUDITOR' });
  console.log(`\n📋 ${auditors.length} auditeurs trouvés\n`);

  for (const auditor of auditors) {
    // Trouver les clients assignés à cet auditeur
    const clients = await User.find({ auditorId: auditor._id, role: 'CLIENT' });
    const clientCompanies = [...new Set(clients.map(c => c.company).filter(Boolean))];
    
    console.log(`👤 ${auditor.name} (${auditor.email})`);
    console.log(`   Clients: ${clients.map(c => c.name).join(', ') || 'aucun'}`);
    console.log(`   Companies: ${clientCompanies.join(', ') || 'aucune'}`);

    // Trouver les orgs valides
    const validOrgIds = [];
    for (const company of clientCompanies) {
      const org = await Organization.findOne({ name: { $regex: new RegExp(`^${company.trim()}$`, 'i') } });
      if (org) validOrgIds.push(org._id.toString());
    }

    // Supprimer les AuditorOrganization qui ne correspondent pas
    const currentLinks = await AuditorOrganization.find({ auditorId: auditor._id });
    let removed = 0;
    for (const link of currentLinks) {
      if (!validOrgIds.includes(link.organizationId.toString())) {
        await AuditorOrganization.deleteOne({ _id: link._id });
        removed++;
      }
    }

    // Re-créer les liens manquants
    let added = 0;
    for (const company of clientCompanies) {
      const org = await Organization.findOne({ name: { $regex: new RegExp(`^${company.trim()}$`, 'i') } });
      if (org) {
        const exists = await AuditorOrganization.findOne({ auditorId: auditor._id, organizationId: org._id });
        if (!exists) {
          await AuditorOrganization.create({ auditorId: auditor._id, organizationId: org._id, status: 'ACTIVE' });
          added++;
        }
      }
    }

    console.log(`   → ${removed} liens supprimés, ${added} ajoutés, ${validOrgIds.length} valides\n`);
  }

  await mongoose.disconnect();
  console.log('🎉 Nettoyage terminé !');
}

cleanup().catch(e => { console.error(e); process.exit(1); });
