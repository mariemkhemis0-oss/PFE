import { parseOpenVASFile } from './services/openvasParser.js';
import { analyzeVulnerabilities } from './services/aiAnalysisService.js';
import { generatePDFReport } from './services/pdfReportService.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
  try {
    console.log('📄 Parsing XML...');
    const parsed = await parseOpenVASFile('./samples/sample_openvas.xml');

    console.log('🤖 Analyse IA...');
    const analysis = await analyzeVulnerabilities(parsed);

    console.log('📝 Génération PDF...');
    const clientInfo = { name: 'Mariem Khemis', company: 'SOCIÉTÉ GÉNÉRALE TN' };
    const pdfBuffer = await generatePDFReport(parsed, analysis, clientInfo);

    fs.writeFileSync('./samples/test_report.pdf', pdfBuffer);
    console.log('✅ PDF généré : backend/samples/test_report.pdf');
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  }
  process.exit();
};

test();