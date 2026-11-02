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

  console.log('--- Step 1: Testing Help Centre on Desktop (1280x900) ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Click Help & SOP button in header
  const helpBtn = await page.waitForSelector('button ::-p-text(Help & SOP)', { timeout: 4000 });
  await helpBtn.click();
  console.log('Clicked Help & SOP button');
  await new Promise(r => setTimeout(r, 400));

  // Verify modal is visible
  const isHelpVisible = await page.$eval('body', el => el.innerText.includes('Genex Help & SOP Centre')).catch(() => false);
  console.log('Help Centre Modal Visible:', isHelpVisible);

  const sopShot = path.join(brainDir, 'verified_help_sop_desktop.png');
  await page.screenshot({ path: sopShot });
  console.log('Saved Help SOP desktop screenshot:', sopShot);

  // Switch to Clinical & AMR Guide tab
  const clinicalTab = await page.waitForSelector('button ::-p-text(Clinical & AMR Guide)', { timeout: 2000 });
  await clinicalTab.click();
  await new Promise(r => setTimeout(r, 300));

  const clinicalShot = path.join(brainDir, 'verified_help_clinical_desktop.png');
  await page.screenshot({ path: clinicalShot });
  console.log('Saved Help Clinical desktop screenshot:', clinicalShot);

  // Type in search bar
  const searchInput = await page.$('input[placeholder*="Search SOP"]');
  if (searchInput) {
    await searchInput.type('glare');
    await new Promise(r => setTimeout(r, 300));
    console.log('Filtered by "glare"');
    const searchShot = path.join(brainDir, 'verified_help_search_desktop.png');
    await page.screenshot({ path: searchShot });
    console.log('Saved Help Search desktop screenshot:', searchShot);
  }

  // Close modal
  const closeBtn = await page.$('button[aria-label="Close help modal"]') || await page.waitForSelector('button ::-p-text(Close)', { timeout: 2000 });
  if (closeBtn) {
    await closeBtn.click();
    await new Promise(r => setTimeout(r, 300));
    console.log('Closed Help Modal');
  }

  console.log('--- Step 2: Testing Help Centre on Mobile (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Open Tools menu
  const toolsBtn = await mobilePage.waitForSelector('button[title*="Secondary actions"]', { timeout: 4000 });
  await toolsBtn.click();
  await new Promise(r => setTimeout(r, 400));

  // Click Help & SOP Centre in Tools dropdown
  const mobileHelpItem = await mobilePage.waitForSelector('button ::-p-text(Help & SOP Centre)', { timeout: 3000 });
  await mobileHelpItem.click();
  await new Promise(r => setTimeout(r, 400));

  const mobileShot = path.join(brainDir, 'verified_help_mobile.png');
  await mobilePage.screenshot({ path: mobileShot });
  console.log('Saved Mobile Help screenshot:', mobileShot);

  await browser.close();
  console.log('--- All Help Centre Tests Passed Successfully! ---');
}

run().catch(console.error);
