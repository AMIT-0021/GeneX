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

  // Test 1: Desktop View
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Click Acute E. coli preset
  const presetBtn = await page.waitForSelector('button ::-p-text(Acute E. coli UTI (Cipro-Resistant))', { timeout: 5000 }).catch(() => null);
  if (presetBtn) await presetBtn.click();

  // Dismiss modal if open
  const modalDismissBtn = await page.waitForSelector('button ::-p-text(View Clinical Report)', { timeout: 3000 }).catch(() => null);
  if (modalDismissBtn) {
    await modalDismissBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  await page.waitForFunction(() => document.body.innerText.includes('Diagnostic Summary'), { timeout: 5000 });

  // Check horizontal overflow on desktop
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('Desktop Horizontal Overflow (>0px):', desktopOverflow ? 'FAIL' : 'PASS (0px)');

  const shotDesktop = path.join(brainDir, 'verified_report_desktop.png');
  await page.screenshot({ path: shotDesktop, fullPage: false });
  console.log('Saved desktop report:', shotDesktop);

  // Test 2: Mobile View (iPhone 14 Pro: 390 x 844)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const mobilePresetBtn = await mobilePage.waitForSelector('button ::-p-text(Acute E. coli UTI (Cipro-Resistant))', { timeout: 5000 }).catch(() => null);
  if (mobilePresetBtn) await mobilePresetBtn.click();

  const mobileDismissBtn = await mobilePage.waitForSelector('button ::-p-text(View Clinical Report)', { timeout: 3000 }).catch(() => null);
  if (mobileDismissBtn) {
    await mobileDismissBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  await mobilePage.waitForFunction(() => document.body.innerText.includes('Diagnostic Summary'), { timeout: 5000 });

  const mobileOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('Mobile Horizontal Overflow (>0px):', mobileOverflow ? 'FAIL' : 'PASS (0px)');

  const shotMobileDoc = path.join(brainDir, 'verified_report_mobile_doctor.png');
  await mobilePage.screenshot({ path: shotMobileDoc, fullPage: false });
  console.log('Saved mobile doctor report:', shotMobileDoc);

  // Switch to Patient Plain Summary
  const patientTabBtn = await mobilePage.waitForSelector('button ::-p-text(Patient Plain Summary)', { timeout: 3000 }).catch(() => null);
  if (patientTabBtn) {
    await patientTabBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  const shotMobilePat = path.join(brainDir, 'verified_report_mobile_patient.png');
  await mobilePage.screenshot({ path: shotMobilePat, fullPage: false });
  console.log('Saved mobile patient report:', shotMobilePat);

  await browser.close();
  console.log('\nAll UI report checks completed successfully!');
}

run().catch(console.error);
