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
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const mobilePreset = await page.waitForSelector('button ::-p-text(Acute E. coli UTI (Cipro-Resistant))', { timeout: 5000 }).catch(() => null);
  if (mobilePreset) await mobilePreset.click();

  const mobileModalDismiss = await page.waitForSelector('button ::-p-text(View Clinical Report)', { timeout: 3000 }).catch(() => null);
  if (mobileModalDismiss) {
    await mobileModalDismiss.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Scroll down to kinetic chart on mobile
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('AST Kinetic Growth Curves'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));

  const mobileKineticShot = path.join(brainDir, 'verified_mobile_kinetic_chart.png');
  await page.screenshot({ path: mobileKineticShot });
  console.log('Saved mobile kinetic chart screenshot:', mobileKineticShot);

  // Scroll to bottom action bar on mobile
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 600));

  const mobileActionShot = path.join(brainDir, 'verified_mobile_action_bar.png');
  await page.screenshot({ path: mobileActionShot });
  console.log('Saved mobile action bar screenshot:', mobileActionShot);

  await browser.close();
}

run().catch(console.error);
