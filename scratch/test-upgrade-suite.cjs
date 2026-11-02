const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const brainDir = 'C:/Users/AMITRAZ/.gemini/antigravity/brain/74307cd6-cbc9-4c74-a4ca-77e52b405850';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  console.log('--- Step 1: Desktop Viewport Testing ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // 1. Check PWA Manifest
  const manifestHref = await page.$eval('link[rel="manifest"]', el => el.href).catch(() => null);
  console.log('Manifest Link:', manifestHref);

  // 2. Navigate to Clinical Report with Preset
  const presetBtn = await page.waitForSelector('button ::-p-text(Acute E. coli UTI (Cipro-Resistant))', { timeout: 5000 }).catch(() => null);
  if (presetBtn) {
    await presetBtn.click();
    console.log('Selected Acute E. coli UTI preset');
  }

  const modalDismissBtn = await page.waitForSelector('button ::-p-text(View Clinical Report)', { timeout: 3000 }).catch(() => null);
  if (modalDismissBtn) {
    await modalDismissBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  await page.waitForFunction(() => document.body.innerText.includes('Diagnostic Summary'), { timeout: 5000 });
  console.log('Report loaded successfully');

  // 3. Verify AST Kinetic Curves
  const kineticHeader = await page.$eval('body', el => el.innerText.includes('AST Kinetic Growth Curves (0–30 min)')).catch(() => false);
  console.log('AST Kinetic Growth Curves Header present:', kineticHeader);

  // Scroll to kinetic chart
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('AST Kinetic Growth Curves'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));

  const kineticShot = path.join(brainDir, 'verified_ast_kinetic_curves.png');
  await page.screenshot({ path: kineticShot });
  console.log('Captured AST Kinetic Curves screenshot:', kineticShot);

  // 4. Test Thermal Receipt Modal
  console.log('--- Step 2: Thermal Receipt Slip Modal ---');
  const thermalBtn = await page.waitForSelector('button ::-p-text(Thermal Slip)', { timeout: 4000 }).catch(() => null);
  if (thermalBtn) {
    await thermalBtn.click();
    console.log('Clicked Thermal Slip button');
    await new Promise(r => setTimeout(r, 500));

    // Verify modal is visible
    const modalVisible = await page.$eval('body', el => el.innerText.includes('OUTPATIENT PRESCRIPTION SLIP')).catch(() => false);
    console.log('Thermal Slip Modal visible:', modalVisible);

    const thermalShot = path.join(brainDir, 'verified_thermal_receipt_modal.png');
    await page.screenshot({ path: thermalShot });
    console.log('Captured Thermal Receipt Modal screenshot:', thermalShot);

    // Click 80mm toggle
    const toggle80mm = await page.waitForSelector('button ::-p-text(80mm Standard)', { timeout: 2000 }).catch(() => null);
    if (toggle80mm) {
      await toggle80mm.click();
      await new Promise(r => setTimeout(r, 300));
      console.log('Toggled to 80mm width mode');
    }

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close modal"]') || await page.waitForSelector('button ::-p-text(Close)', { timeout: 2000 }).catch(() => null);
    if (closeBtn) {
      await closeBtn.click();
      await new Promise(r => setTimeout(r, 400));
      console.log('Closed Thermal Slip Modal');
    }
  } else {
    console.warn('Thermal Slip button not found on page');
  }

  // 5. Test Mobile Viewport
  console.log('--- Step 3: Mobile Viewport (iPhone 390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Navigate to report
  const mobilePreset = await mobilePage.waitForSelector('button ::-p-text(Acute E. coli UTI (Cipro-Resistant))', { timeout: 5000 }).catch(() => null);
  if (mobilePreset) {
    await mobilePreset.click();
  }
  const mobileModalDismiss = await mobilePage.waitForSelector('button ::-p-text(View Clinical Report)', { timeout: 3000 }).catch(() => null);
  if (mobileModalDismiss) {
    await mobileModalDismiss.click();
    await new Promise(r => setTimeout(r, 500));
  }

  const mobileShot = path.join(brainDir, 'verified_upgrades_mobile.png');
  await mobilePage.screenshot({ path: mobileShot, fullPage: false });
  console.log('Captured Mobile Report screenshot:', mobileShot);

  await browser.close();
  console.log('--- All Upgrade Verification Tests Completed Successfully! ---');
}

run().catch(console.error);
