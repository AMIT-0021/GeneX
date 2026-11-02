const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function renderPdf(pdfPath, outImagePath) {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  const pdfData = fs.readFileSync(pdfPath).toString('base64');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <style>
        body { margin: 0; background: #525659; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        canvas { box-shadow: 0 4px 12px rgba(0,0,0,0.3); margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div id="container"></div>
      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdfData = atob('${pdfData}');
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        loadingTask.promise.then(async function(pdf) {
          const container = document.getElementById('container');
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.id = 'page-' + pageNum;
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            container.appendChild(canvas);
            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
          }
          window.RENDER_DONE = true;
        });
      </script>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.RENDER_DONE === true, { timeout: 15000 });

  // Screenshot the canvas
  const canvasElement = await page.$('#page-1');
  if (canvasElement) {
    await canvasElement.screenshot({ path: outImagePath });
    console.log(`Rendered page 1 to ${outImagePath}`);
  }

  // If page 2 exists, screenshot it as well
  const canvas2 = await page.$('#page-2');
  if (canvas2) {
    const p2Path = outImagePath.replace('.png', '_page2.png');
    await canvas2.screenshot({ path: p2Path });
    console.log(`Rendered page 2 to ${p2Path}`);
  }

  await browser.close();
}

async function run() {
  const pdfs = [
    { in: 'scratch/output_pdfs/test_report_1.pdf', out: 'scratch/output_pdfs/rendered_report_1.png' },
    { in: 'scratch/output_pdfs/test_report_2.pdf', out: 'scratch/output_pdfs/rendered_report_2.png' },
    { in: 'scratch/output_pdfs/test_report_3.pdf', out: 'scratch/output_pdfs/rendered_report_3.png' },
  ];

  for (const item of pdfs) {
    console.log(`Rendering ${item.in}...`);
    await renderPdf(path.resolve(item.in), path.resolve(item.out));
  }
}

run().catch(console.error);
