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

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Click report tab or preset
  const presetBtn = await page.waitForSelector('button ::-p-text(Acute E. coli UTI (Cipro-Resistant))', { timeout: 5000 }).catch(() => null);
  if (presetBtn) await presetBtn.click();

  // Dismiss modal if open
  const modalDismissBtn = await page.waitForSelector('button ::-p-text(View Clinical Report)', { timeout: 3000 }).catch(() => null);
  if (modalDismissBtn) {
    await modalDismissBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  await page.waitForFunction(() => document.body.innerText.includes('Diagnostic Summary'), { timeout: 5000 });

  const desktopShot = path.join(brainDir, 'design2_report_desktop.png');
  await page.screenshot({ path: desktopShot, fullPage: false });
  console.log('Saved desktop report screenshot:', desktopShot);

  await browser.close();
}

run().catch(console.error);
