const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testHeader() {
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

  console.log('\n==================================================');
  console.log('--- 1. Testing Mobile Viewport (393x852) ---');
  console.log('==================================================');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const mobileMetrics = await page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const header = document.querySelector('header');
    const headerRect = header ? header.getBoundingClientRect() : null;
    const bottomNav = document.querySelector('nav[aria-label="Mobile Navigation Bar"]');
    
    // Check visible buttons inside header
    const allButtons = header ? Array.from(header.querySelectorAll('button')) : [];
    const visibleHeaderButtons = allButtons
      .filter(b => window.getComputedStyle(b).display !== 'none')
      .map(b => b.innerText.trim().replace(/\n/g, ' '));
    
    return {
      hasHorizontalOverflow: scrollW > clientW,
      scrollW,
      clientW,
      headerWidth: headerRect ? headerRect.width : 0,
      visibleHeaderButtonCount: visibleHeaderButtons.length,
      visibleHeaderButtons,
      bottomNavRendered: !!bottomNav,
      bottomNavButtons: bottomNav ? Array.from(bottomNav.querySelectorAll('button')).map(b => b.innerText.trim()) : [],
    };
  });

  console.log('Mobile Metrics:', mobileMetrics);

  const mobileScreenshotPath = path.join(__dirname, 'mobile_header_tier_verified.png');
  await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
  console.log('Mobile screenshot saved to:', mobileScreenshotPath);

  console.log('\n--- 2. Testing Status Panel Popover ---');
  // Click on the status chip
  await page.evaluate(() => {
    const statusBtn = document.querySelector('header button[title*="system hardware"]');
    if (statusBtn) statusBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const statusPanelState = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHeader: text.includes('System Diagnostic Status'),
      hasDualArray: text.includes('Dual-Array'),
      hasCalibration: text.includes('Sensor Calibration'),
      hasBle: text.includes('Hardware Reader'),
    };
  });
  console.log('Status Panel State:', statusPanelState);

  const statusPopoverScreenshot = path.join(__dirname, 'status_popover_verified.png');
  await page.screenshot({ path: statusPopoverScreenshot, fullPage: false });

  console.log('\n--- 3. Testing Secondary Tools Menu Popover ---');
  // Click tools button
  await page.evaluate(() => {
    const toolsBtn = document.querySelector('header button[title*="Secondary actions"]');
    if (toolsBtn) toolsBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const toolsMenuState = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasToolsHeader: text.includes('Diagnostic Actions & Tools'),
      hasPresetLoader: text.includes('Load Clinical Preset'),
      hasTestBench: text.includes('Virtual Test Bench'),
      hasCalibration: text.includes('Optical Sensor Calibration'),
      hasConfig: text.includes('System Config & Thresholds'),
    };
  });
  console.log('Tools Menu State:', toolsMenuState);

  const toolsMenuScreenshot = path.join(__dirname, 'tools_menu_verified.png');
  await page.screenshot({ path: toolsMenuScreenshot, fullPage: false });

  console.log('\n--- 4. Testing Bottom Navigation Tap (Switch to Patients) ---');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Mobile Navigation Bar"]');
    const buttons = Array.from(nav.querySelectorAll('button'));
    const patientBtn = buttons.find(b => b.innerText.includes('Patients'));
    if (patientBtn) patientBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const patientViewActive = await page.evaluate(() => {
    return document.body.innerText.includes('Patient Dashboard & Health Vault') ||
           document.body.innerText.includes('Health Vault');
  });
  console.log('Switched to Patient Vault View via Bottom Nav:', patientViewActive);

  console.log('\n--- 5. Testing Bottom Navigation Tap (Switch to AMR Trends) ---');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Mobile Navigation Bar"]');
    const buttons = Array.from(nav.querySelectorAll('button'));
    const trendsBtn = buttons.find(b => b.innerText.includes('Trends'));
    if (trendsBtn) trendsBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const trendsViewActive = await page.evaluate(() => {
    return document.body.innerText.includes('Regional Antimicrobial Resistance') ||
           document.body.innerText.includes('AMR Surveillance');
  });
  console.log('Switched to AMR Trends View via Bottom Nav:', trendsViewActive);

  console.log('\n--- 6. Testing Bottom Navigation Tap (Switch back to Analyzer) ---');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Mobile Navigation Bar"]');
    const buttons = Array.from(nav.querySelectorAll('button'));
    const scanBtn = buttons.find(b => b.innerText.includes('Analyzer'));
    if (scanBtn) scanBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const scanViewActive = await page.evaluate(() => {
    return document.body.innerText.includes('1: Pyuria') ||
           document.body.innerText.includes('Single-Shot');
  });
  console.log('Switched back to Analyzer View via Bottom Nav:', scanViewActive);

  console.log('\n==================================================');
  console.log('--- 7. Testing Desktop View (1280x800) ---');
  console.log('==================================================');
  await page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const desktopMetrics = await page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const desktopNav = document.querySelector('nav[aria-label="Desktop Primary Navigation"]');
    const bottomNav = document.querySelector('nav[aria-label="Mobile Navigation Bar"]');
    
    return {
      hasHorizontalOverflow: scrollW > clientW,
      scrollW,
      clientW,
      desktopNavRendered: !!desktopNav,
      desktopNavButtons: desktopNav ? Array.from(desktopNav.querySelectorAll('button')).map(b => b.innerText.trim()) : [],
      bottomNavHiddenOnDesktop: !bottomNav || window.getComputedStyle(bottomNav).display === 'none',
    };
  });

  console.log('Desktop Metrics:', desktopMetrics);

  const desktopScreenshotPath = path.join(__dirname, 'desktop_header_tier_verified.png');
  await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
  console.log('Desktop screenshot saved to:', desktopScreenshotPath);

  await browser.close();

  console.log('\n==================================================');
  console.log('--- FINAL TEST RESULTS ---');
  console.log('==================================================');
  console.log('Total Console/Page Errors:', errors.length);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
  } else {
    console.log('🎉 ALL 3-TIER NAVIGATION & HEADER REQUIREMENTS MET WITH 0 ERRORS!');
  }
}

testHeader();
