import connectDB from './db.js';
import Organization from './models/Organization.js';

connectDB();

const seedOrgs = async () => {
  try {
    await Organization.deleteMany({});
    
    await Organization.insertMany([
      {
        name: 'SOCIÉTÉ GÉNÉRALE TN',
        codeClient: 'SGT-2024-01',
        sector: 'Finance / Banque',
        type: 'Banque',
        address: 'Tunis, Tunisie',
        perimeters: []
      },
      {
        name: 'OOREDOO TN',
        codeClient: 'OOR-2024-42',
        sector: 'Technologie',
        type: 'PME',
        address: 'Tunis, Tunisie',
        perimeters: []
      }
    ]);
    
    console.log('✅ Organisations créées !');
    process.exit();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
};

seedOrgs();
