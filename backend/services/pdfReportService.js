import puppeteer from 'puppeteer';
import { getReportHtml } from './pdfTemplate.js';

export const generatePDFReport = async (parsedReport, aiAnalysis, clientInfo) => {
  try {
    const htmlContent = getReportHtml(parsedReport, aiAnalysis, clientInfo);

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ]
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // Set the HTML content — domcontentloaded évite d'attendre les ressources réseau externes
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Emulate print CSS media
    await page.emulateMediaType('print');

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <style>
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .footer-bar {
            width: 100%;
            background: #0b0f19 !important;
            border-top: 1px solid rgba(255,255,255,0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 20mm;
            font-size: 7px;
            font-weight: 800;
            color: #6b7280;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            box-sizing: border-box;
          }
          .footer-bar span { color: #6b7280; }
        </style>
        <div class="footer-bar">
          <span>ShieldOps — Rapport d'Audit Confidentiel</span>
          <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '18mm',
        left: '0px'
      }
    });

    await browser.close();
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF with Puppeteer:", error);
    throw error;
  }
};