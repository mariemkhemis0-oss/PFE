import { parseOpenVASFile } from './services/openvasParser.js';
import { analyzeVulnerabilities } from './services/aiAnalysisService.js';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
  try {
    console.log('📄 Parsing XML...');
    const parsed = await parseOpenVASFile('./samples/sample_openvas.xml');
    
    console.log('🤖 Analyse IA Groq en cours...');
    const analysis = await analyzeVulnerabilities(parsed);
    
    console.log('✅ SUCCÈS !');
    console.log('Score sécurité:', analysis.score_securite);
    console.log('Niveau risque:', analysis.niveau_risque);
    console.log('Résumé:', analysis.resume_executif);
    analysis.priorites.forEach(p => console.log(`  ${p.ordre}. ${p.vulnerabilite}`));
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  }
  process.exit();
};

test();