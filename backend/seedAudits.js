import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Organization from './models/Organization.js';
import AuditorOrganization from './models/AuditorOrganization.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cyberaudit:CyberAudit2024@cyberauditmongodb.n7dew.mongodb.net/cyberaudit?retryWrites=true&w=majority';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');

    // 1. Trouver ou créer des organisations
    const organizations = await Organization.find().limit(3);
    
    if (organizations.length === 0) {
      console.log('ℹ Pas d\'organisations trouvées. Création de données de test...');
      
      const newOrgs = await Organization.insertMany([
        { name: 'Acme Corporation', sector: 'Finance', type: 'ENTERPRISE' },
        { name: 'TechStart Inc', sector: 'Technology', type: 'Startup' },
        { name: 'Global Bank', sector: 'Banking', type: 'ENTERPRISE' },
      ]);
      
      console.log(`✓ ${newOrgs.length} organisations créées`);
      
      // 2. Trouver les auditeurs
      const auditors = await User.find({ role: 'AUDITOR' }).limit(2);
      
      if (auditors.length > 0) {
        // 3. Créer les associations
        const associations = [];
        for (let i = 0; i < auditors.length; i++) {
          for (let j = 0; j < newOrgs.length; j++) {
            associations.push({
              auditorId: auditors[i]._id,
              organizationId: newOrgs[j]._id,
              status: 'ACTIVE',
            });
          }
        }
        
        await AuditorOrganization.insertMany(associations);
        console.log(`✓ ${associations.length} associations créées`);
      }
    } else {
      console.log(`✓ ${organizations.length} organisations trouvées`);
      
      // Vérifier les associations
      const assocs = await AuditorOrganization.find();
      console.log(`✓ ${assocs.length} associations existantes`);
      
      if (assocs.length === 0) {
        console.log('ℹ Création des associations manquantes...');
        const auditors = await User.find({ role: 'AUDITOR' }).limit(2);
        
        if (auditors.length > 0) {
          const newAssocs = [];
          for (let i = 0; i < auditors.length; i++) {
            for (let j = 0; j < organizations.length; j++) {
              newAssocs.push({
                auditorId: auditors[i]._id,
                organizationId: organizations[j]._id,
                status: 'ACTIVE',
              });
            }
          }
          
          await AuditorOrganization.insertMany(newAssocs);
          console.log(`✓ ${newAssocs.length} associations créées`);
        }
      }
    }

    console.log('✓ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed error:', error.message);
    process.exit(1);
  }
}

seedData();
