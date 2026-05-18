import { parseOpenVASFile } from './services/openvasParser.js';

const test = async () => {
  try {
    const result = await parseOpenVASFile('./samples/sample_openvas.xml');
    console.log('✅ PARSING RÉUSSI !');
    console.log('Hosts:', result.hosts);
    console.log('Stats:', result.stats);
    console.log('Vulnérabilités:');
    result.vulnerabilities.forEach(v => {
      console.log(`  [${v.criticality}] ${v.name} - CVSS: ${v.cvss}`);
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  process.exit();
};

test();