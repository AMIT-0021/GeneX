const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testMobile(targetUrl) {
  console.log(`\n========================================`);
  console.log(`TESTING MOBILE URL: ${targetUrl}`);
  console.log(`========================================\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
    ],
  });

  const page = await browser.newPage();

  // Pixel 7 Mobile Emulation
  await page.setViewport({
    width: 393,
    height: 851,
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
  });

  await page.setUserAgent(
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  );

  const logs = [];
  const errors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    const text = `[Console ${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    const text = `[Page Error] ${err.toString()}`;
    errors.push(text);
    console.error(text);
  });

  page.on('requestfailed', (req) => {
    const text = `[Request Failed] ${req.url()} (${req.failure()?.errorText || 'failed'})`;
    failedRequests.push(text);
    console.warn(text);
  });

  const startTime = Date.now();
  console.log('Navigating...');
  
  try {
    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });
  } catch (navErr) {
    console.warn('Navigation warning/timeout:', navErr.message);
  }

  const loadDuration = Date.now() - startTime;
  console.log(`Network Idle reached in: ${loadDuration}ms`);

  // Wait an extra 1.5s to observe post-mount
  await new Promise((r) => setTimeout(r, 1500));

  // Check DOM state
  const domState = await page.evaluate(() => {
    const loader = document.getElementById('app-loader');
    const header = document.querySelector('header');
    const root = document.getElementById('root');
    const bodyText = document.body.innerText;
    const isLoaderVisible = loader ? window.getComputedStyle(loader).display !== 'none' : false;
    const buttons = Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim());

    return {
      loaderExists: !!loader,
      isLoaderVisible,
      headerExists: !!header,
      rootChildCount: root ? root.children.length : 0,
      bodyTextSnippet: bodyText.slice(0, 300),
      buttonsFound: buttons,
    };
  });

  console.log('\n--- DOM STATE ANALYSIS ---');
  console.log('Loader Exists:', domState.loaderExists);
  console.log('Loader Visible:', domState.isLoaderVisible);
  console.log('Header Rendered:', domState.headerExists);
  console.log('Root Children Count:', domState.rootChildCount);
  console.log('Buttons Detected:', domState.buttonsFound);
  console.log('Body Text Snippet:', JSON.stringify(domState.bodyTextSnippet));

  // Save screenshot
  const screenshotPath = path.join(__dirname, 'mobile_test_live_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();

  console.log('\n--- SUMMARY ---');
  console.log(`Total Errors: ${errors.length}`);
  console.log(`Failed Requests: ${failedRequests.length}`);
  if (errors.length > 0) {
    console.error('ERRORS FOUND:', errors);
  } else if (!domState.headerExists) {
    console.error('FAIL: Header was NOT rendered. App did not mount properly!');
  } else {
    console.log('SUCCESS: Mobile interface rendered completely!');
  }
}

const target = process.argv[2] || 'https://stridedx-app.vercel.app';
testMobile(target);
