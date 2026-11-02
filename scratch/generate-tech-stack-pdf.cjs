const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const brainDir = 'C:/Users/AMITRAZ/.gemini/antigravity/brain/74307cd6-cbc9-4c74-a4ca-77e52b405850';
const outputPdfPath = path.join(brainDir, 'Genex_Technology_Stack.pdf');
const publicPdfPath = path.join(__dirname, '../public/Genex_Technology_Stack.pdf');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Genex App - Software Technology Stack Whitepaper</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 15mm 16mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.48;
      font-size: 10pt;
      background: #ffffff;
    }
    .header {
      border-bottom: 2.5px solid #D98E3F;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-title span {
      color: #D98E3F;
    }
    .doc-subtitle {
      font-size: 10.5pt;
      color: #64748b;
      margin-top: 2px;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 2.5px 7px;
      border-radius: 5px;
      font-size: 7.5pt;
      font-weight: 700;
      font-family: monospace;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .badge-primary {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;
    }
    .badge-success {
      background: #dcfce7;
      color: #166534;
      border-color: #bbf7d0;
    }
    .meta-box {
      text-align: right;
    }
    .meta-item {
      font-size: 8pt;
      color: #64748b;
    }
    .meta-item strong {
      color: #334155;
    }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 14px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    h2::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 13px;
      background: #D98E3F;
      border-radius: 2px;
    }
    p {
      margin-bottom: 7px;
      color: #334155;
      font-size: 9.5pt;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 9px 11px;
    }
    .card-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card p {
      font-size: 8.5pt;
      color: #475569;
      margin-bottom: 4px;
    }
    .card ul {
      list-style-type: none;
      padding-left: 0;
      font-size: 8.2pt;
      color: #334155;
    }
    .card ul li {
      margin-bottom: 2.5px;
      position: relative;
      padding-left: 11px;
    }
    .card ul li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #D98E3F;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 14px;
      font-size: 8pt;
    }
    th, td {
      padding: 6px 8px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .highlight-row td {
      background: #fffbeb !important;
      font-weight: 600;
    }
    .page-break {
      page-break-after: always;
    }
    .footer-note {
      margin-top: 14px;
      padding: 9px 12px;
      background: #f8fafc;
      border-left: 3px solid #5C8A6B;
      border-radius: 4px;
      font-size: 8pt;
      color: #475569;
    }
  </style>
</head>
<body>

  <!-- Page 1 Header -->
  <div class="header">
    <div>
      <div class="brand-title">GENEX <span>APPLICATION</span></div>
      <div class="doc-subtitle">Software Engineering &amp; Client-Side Technology Stack Specification</div>
      <div style="margin-top: 5px;">
        <span class="badge badge-primary">React 18 + TypeScript</span>
        <span class="badge badge-success">Offline-First PWA</span>
        <span class="badge">Client-Side Computer Vision</span>
      </div>
    </div>
    <div class="meta-box">
      <div class="meta-item"><strong>Document:</strong> GENEX-APP-SPEC-2026</div>
      <div class="meta-item"><strong>Software Build:</strong> v2.4 (Production)</div>
      <div class="meta-item"><strong>Runtime:</strong> Standalone Web App</div>
      <div class="meta-item"><strong>Date:</strong> September 2026</div>
    </div>
  </div>

  <!-- Software Architecture Overview -->
  <h2>1. Software Architecture &amp; Client-First Paradigm</h2>
  <p>
    The <strong>Genex Application</strong> is built on a 100% <em>client-first, zero-backend-dependency</em> paradigm. All image acquisition, computer vision colorimetry, algorithmic diagnostic inference, and medical document generation execute directly within the browser runtime on the user's smartphone or PC. This guarantees sub-second responsiveness, absolute patient data privacy (HIPAA/DISHA compliant), and uninterrupted operation in low-resource clinics without internet connectivity.
  </p>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">
        <span>Zero-Cloud Edge Processing</span>
        <span class="badge badge-success">&lt; 100ms</span>
      </div>
      <p>Local browser computation eliminates cloud server latency and recurring subscription API costs.</p>
      <ul>
        <li><strong>On-Device Pixel Analysis:</strong> Raw camera frames are analyzed in-memory via HTML5 Canvas buffers.</li>
        <li><strong>Privacy by Design:</strong> Zero patient images or PHI (Protected Health Information) leave the device.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">
        <span>Offline-First PWA Engine</span>
        <span class="badge badge-primary">100% Offline</span>
      </div>
      <p>Native app installability with immediate cache-first operational readiness.</p>
      <ul>
        <li><strong>Service Worker Cache:</strong> Pre-caches application bundles for offline rural OPD deployment.</li>
        <li><strong>Local Persistence:</strong> IndexedDB / LocalStorage stores patient history and sensor calibration.</li>
      </ul>
    </div>
  </div>

  <!-- Detailed Frontend Stack -->
  <h2>2. Frontend &amp; Framework Technology Stack</h2>
  <p>
    The user interface is engineered with a modern, strictly-typed reactive framework designed for rapid clinical execution and error-free operator interaction.
  </p>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Core Runtime &amp; Build Tools</div>
      <ul>
        <li><strong>React 18 / 19:</strong> Declarative component architecture managing complex diagnostic stages, interactive modals, and real-time state transitions.</li>
        <li><strong>TypeScript 5.x:</strong> Strict static type checking across all clinical data structures, optical density math, and diagnostic payload contracts.</li>
        <li><strong>Vite 8.x:</strong> High-performance ES module bundler delivering sub-400ms production builds and instant hot module replacement.</li>
        <li><strong>Tailwind CSS 3.4:</strong> Utility-first styling engine enforcing responsive layout grids, custom clinical color tokens, and zero screen overflows.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">UI/UX Innovations &amp; Design System</div>
      <ul>
        <li><strong>Dual-Perspective Architecture:</strong> Instant toggle between Doctor PDF Sign-Off view and Patient Plain Summary (English &amp; Hindi).</li>
        <li><strong>Mobile-First Thumb Ergonomics:</strong> Floating bottom navigation bar and 44px+ touch targets optimized for gloved clinic operation.</li>
        <li><strong>SVG Vector Kinetics:</strong> High-precision interactive time-series charts rendering 0–30 min bacterial lysis vs replication curves.</li>
        <li><strong>Lucide React Icons:</strong> Tree-shaken, ultra-lightweight clinical and diagnostic iconography.</li>
      </ul>
    </div>
  </div>

  <!-- Computer Vision -->
  <h2>3. In-Browser Computer Vision &amp; Color Science</h2>
  <p>
    The app implements a full computer vision pipeline running directly on HTML5 Canvas without requiring heavy external computer vision servers or OpenCV binaries.
  </p>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Optical Pre-Flight Quality Filters</div>
      <ul>
        <li><strong>Laplacian Variance Sharpness:</strong> Computes edge gradient variance to reject motion-blurred or soft-focus photos automatically.</li>
        <li><strong>Ambient Illuminance (Lux):</strong> Measures relative luminance to verify clinic lighting is &ge; 200 lux.</li>
        <li><strong>Specular Glare Filter:</strong> Analyzes pixel highlight saturation to flag direct fluorescent or lamp reflections.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Scientific Colorimetric Algorithms</div>
      <ul>
        <li><strong>CIE L*a*b* Color Space:</strong> Converts raw sRGB data into device-independent perceptual color coordinates.</li>
        <li><strong>CIE76 Delta-E (&Delta;E):</strong> Computes Euclidean color distance against reference blanks for pyuria WBC quantification.</li>
        <li><strong>Optical Density (OD):</strong> Logarithmic absorbance calculation: OD = -log10(I_sample / I_blank).</li>
      </ul>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- Page 2 -->
  <div class="header">
    <div>
      <div class="brand-title">GENEX <span>APPLICATION</span></div>
      <div class="doc-subtitle">Offline Engine, Clinical Outputs &amp; Technology Master Reference</div>
    </div>
    <div class="meta-box">
      <div class="meta-item"><strong>Page 2 of 2</strong></div>
      <div class="meta-item">GENEX-APP-SPEC-2026</div>
    </div>
  </div>

  <!-- Offline & Storage -->
  <h2>4. Progressive Web App (PWA) &amp; Storage Architecture</h2>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Service Worker &amp; PWA Manifest</div>
      <ul>
        <li><strong>Service Worker (sw.js):</strong> Employs a stale-while-revalidate strategy for instant offline launches without an active network connection.</li>
        <li><strong>Web App Manifest:</strong> Configured for standalone display mode, maskable icons, and medical theme color (#D98E3F).</li>
        <li><strong>Native Install Triggers:</strong> Desktop and mobile install prompts for Android, iOS Safari, and Chromium browsers.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">Client-Side Health Vault Storage</div>
      <ul>
        <li><strong>LocalStorage &amp; IndexedDB:</strong> Manages patient profiles, MRNs, past diagnostic sessions, and baseline calibration values.</li>
        <li><strong>Zero Data Leakage:</strong> Full compliance with digital health privacy frameworks (DISHA, HIPAA, and GDPR).</li>
        <li><strong>Surveillance Anonymizer:</strong> Locally strips PII before populating regional AMR heatmaps and antibiograms.</li>
      </ul>
    </div>
  </div>

  <!-- Clinical Outputs & Printing -->
  <h2>5. Clinical Documentation &amp; Grassroots OPD Outputs</h2>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">A4 Lab-Grade PDF Generation</div>
      <ul>
        <li><strong>jsPDF &amp; html2canvas:</strong> Client-side synthesis of formal, signed diagnostic certificates with verification QR codes.</li>
        <li><strong>Clinical Metadata:</strong> Includes CLSI M100 breakpoints, MIC values, and ICMR AMRSN surveillance alerts.</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-title">OPD Thermal Slip &amp; WhatsApp Rx</div>
      <ul>
        <li><strong>ESC/POS Thermal Printing:</strong> Isolated CSS @media print layout for 58mm / 80mm portable receipt printers.</li>
        <li><strong>WhatsApp API (wa.me):</strong> Preformatted bilingual (English &amp; Hindi) prescription summaries sent directly to patients in 1 tap.</li>
      </ul>
    </div>
  </div>

  <!-- Summary Table -->
  <h2>6. Software Technology Stack Master Reference Table</h2>
  <table>
    <thead>
      <tr>
        <th>Software Layer</th>
        <th>Technology / Library</th>
        <th>Version / Spec</th>
        <th>Specific Application Function</th>
      </tr>
    </thead>
    <tbody>
      <tr class="highlight-row">
        <td><strong>Frontend Framework</strong></td>
        <td>React + TypeScript</td>
        <td>v18.3+ / 5.x</td>
        <td>Component-driven SPA architecture, custom hooks, and strict type-safe state</td>
      </tr>
      <tr>
        <td><strong>Build &amp; Bundler</strong></td>
        <td>Vite</td>
        <td>v8.2</td>
        <td>Sub-second compilation, modern ES module bundling, tree-shaking</td>
      </tr>
      <tr>
        <td><strong>UI Styling &amp; Layout</strong></td>
        <td>Tailwind CSS</td>
        <td>v3.4</td>
        <td>Responsive mobile-first utility styling, custom medical color tokens, zero overflow</td>
      </tr>
      <tr>
        <td><strong>Iconography</strong></td>
        <td>Lucide React</td>
        <td>Latest</td>
        <td>Lightweight, scalable vector icons for clinical status, alerts, and navigation</td>
      </tr>
      <tr class="highlight-row">
        <td><strong>Camera Acquisition</strong></td>
        <td>HTML5 MediaStreams API</td>
        <td>W3C Standard</td>
        <td>Direct smartphone camera stream acquisition with autofocus reticle overlay</td>
      </tr>
      <tr>
        <td><strong>Computer Vision Engine</strong></td>
        <td>HTML5 Canvas API</td>
        <td>W3C Standard</td>
        <td>In-browser image buffer processing, pixel sampling across 26 micro-wells</td>
      </tr>
      <tr>
        <td><strong>Image Quality Analysis</strong></td>
        <td>Custom Laplacian Algorithm</td>
        <td>On-Device JS</td>
        <td>Automated sharpness variance check, glare filter, and ambient lux validation</td>
      </tr>
      <tr>
        <td><strong>Color Science &amp; Math</strong></td>
        <td>CIE L*a*b* &amp; Delta-E</td>
        <td>CIE76 Standard</td>
        <td>Perceptual color distance (&Delta;E) and optical density (OD) calculation</td>
      </tr>
      <tr class="highlight-row">
        <td><strong>Offline PWA Engine</strong></td>
        <td>Service Worker API</td>
        <td>W3C PWA Spec</td>
        <td>Pre-caches application assets; delivers 100% offline functionality in remote clinics</td>
      </tr>
      <tr>
        <td><strong>Local Data Storage</strong></td>
        <td>LocalStorage / IndexedDB</td>
        <td>Client Storage</td>
        <td>Stores patient health records, scan history, and white-balance calibration locally</td>
      </tr>
      <tr>
        <td><strong>Vector Data Graphics</strong></td>
        <td>Inline SVG (React)</td>
        <td>Scalable Vector</td>
        <td>Real-time interactive AST kinetic growth curves (0–30 min) and cartridge schematic</td>
      </tr>
      <tr>
        <td><strong>Certified PDF Export</strong></td>
        <td>jsPDF + html2canvas</td>
        <td>Client-Side</td>
        <td>Generates downloadable signed diagnostic reports with QR verification</td>
      </tr>
      <tr>
        <td><strong>OPD Thermal Printing</strong></td>
        <td>CSS @media print</td>
        <td>ESC/POS 58/80mm</td>
        <td>High-contrast monospace receipt slip formatted for clinic thermal printers</td>
      </tr>
      <tr>
        <td><strong>Patient Messaging</strong></td>
        <td>WhatsApp URI Protocol</td>
        <td>wa.me API</td>
        <td>Dispatches preformatted English/Hindi prescription summaries to patient phones</td>
      </tr>
      <tr class="highlight-row">
        <td><strong>Standards Alignment</strong></td>
        <td>CLSI M100 / ICMR AMRSN</td>
        <td>Ed. 34 / 2024</td>
        <td>Evidence-based antibiotic susceptibility cutoffs and clinical resistance rules</td>
      </tr>
    </tbody>
  </table>

  <!-- Concluding Statement -->
  <div class="footer-note">
    <strong>Software Engineering Summary:</strong> The Genex application is completely self-contained and operates entirely on the client side. By removing server dependencies, the platform eliminates recurring backend hosting costs, ensures 100% data confidentiality under medical privacy regulations, and provides instant, offline diagnostic execution on any modern smartphone, tablet, or PC browser.
  </div>

</body>
</html>
`;

async function generatePdf() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('Rendering PDF to:', outputPdfPath);
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '14mm',
      right: '14mm',
    },
  });

  try {
    fs.copyFileSync(outputPdfPath, publicPdfPath);
    console.log('Copied PDF to public folder:', publicPdfPath);
  } catch (err) {
    console.error('Error copying to public:', err);
  }

  await browser.close();
  console.log('Pure Software App Tech Stack PDF generation complete!');
}

generatePdf().catch(console.error);
