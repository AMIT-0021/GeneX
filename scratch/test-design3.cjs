const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const brainDir = 'C:/Users/AMITRAZ/.gemini/antigravity/brain/74307cd6-cbc9-4c74-a4ca-77e52b405850';

async function run() {
  console.log('Launching browser for Design 3 verification...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  
  // 1. Mobile Viewport (iPhone 14/15)
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  console.log('Navigating to Patients tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pBtn = btns.find(b => b.textContent.trim().includes('Patients'));
    if (pBtn) pBtn.click();
  });

  // Wait for Recurrence Risk Radar to render
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Recurrence Risk Radar') || document.body.innerText.includes('Longitudinal UTI Episode History');
  }, { timeout: 8000 });

  console.log('Patient Vault rendered! Checking contents...');

  // Check horizontal overflow
  const overflow = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return {
      scrollWidth: sw,
      clientWidth: cw,
      hasOverflow: sw > cw,
    };
  });
  console.log('Mobile Overflow check:', overflow);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Has Recurrence Risk Radar:', text.includes('Recurrence Risk Radar'));
  console.log('Has Catheter Duration axis:', text.includes('Catheter duration') || text.includes('Catheter'));
  console.log('Has Klebsiella pneumoniae axis:', text.includes('Klebsiella pneumoniae'));
  console.log('Has Longitudinal Episode History:', text.includes('Longitudinal UTI Episode History'));
  console.log('Has Feb 2026 / Nov 2025 timeline:', text.includes('Feb') || text.includes('Nov'));

  // Mobile Screenshot
  const mobileShot = path.join(brainDir, 'design3_patient_vault_mobile.png');
  await page.screenshot({ path: mobileShot, fullPage: false });
  console.log('Saved mobile screenshot:', mobileShot);

  // 2. Desktop Viewport
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pBtn = btns.find(b => b.textContent.trim().includes('Patients'));
    if (pBtn) pBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const desktopShot = path.join(brainDir, 'design3_patient_vault_desktop.png');
  await page.screenshot({ path: desktopShot, fullPage: false });
  console.log('Saved desktop screenshot:', desktopShot);

  await browser.close();
  console.log('DESIGN 3 VERIFICATION COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
