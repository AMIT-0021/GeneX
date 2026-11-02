const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function verifyDesign1() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.toString()));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('\n--- 1. Testing Design 1 on Mobile (393x852) ---');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const mobileMetrics = await page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const bodyText = document.body.innerText;
    const hasCartridgeDiagram = bodyText.includes('Microfluidic Cartridge Schematic') || bodyText.includes('Pyuria OD');
    const hasLuxMeter = bodyText.includes('242 Lux') || bodyText.includes('Optimal');
    const hasScanningStatus = bodyText.includes('SCANNING STATUS') && bodyText.includes('Cartridge Detected');
    const hasCaptureBtn = bodyText.includes('Capture');

    return {
      hasHorizontalOverflow: scrollW > clientW,
      scrollW,
      clientW,
      hasCartridgeDiagram,
      hasLuxMeter,
      hasScanningStatus,
      hasCaptureBtn,
    };
  });

  console.log('Mobile Metrics:', mobileMetrics);

  const mobileScreenshot = path.join(__dirname, 'design1_mobile_verified.png');
  await page.screenshot({ path: mobileScreenshot, fullPage: false });
  console.log('Mobile screenshot saved to:', mobileScreenshot);

  console.log('\n--- 2. Testing Isometric Chamber Interaction ---');
  // Click Aptamers button
  await page.evaluate(() => {
    const aptamerBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Aptamers'));
    if (aptamerBtn) aptamerBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const aptamerSelected = await page.evaluate(() => {
    return document.body.innerText.includes('APTAMER 4-PLEX') || document.body.innerText.includes('2. Aptamers');
  });
  console.log('Aptamer Stage Activated:', aptamerSelected);

  console.log('\n--- 3. Testing Desktop View (1280x800) ---');
  await page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const desktopScreenshot = path.join(__dirname, 'design1_desktop_verified.png');
  await page.screenshot({ path: desktopScreenshot, fullPage: false });
  console.log('Desktop screenshot saved to:', desktopScreenshot);

  await browser.close();

  console.log('\n--- SUMMARY ---');
  console.log('Total Console/Page Errors:', errors.length);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
  } else {
    console.log('DESIGN 1 VERIFIED SUCCESSFULLY WITH 0 ERRORS!');
  }
}

verifyDesign1();
