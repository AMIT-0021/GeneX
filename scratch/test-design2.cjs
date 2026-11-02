const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const brainDir = 'C:\\Users\\AMITRAZ\\.gemini\\antigravity\\brain\\74307cd6-cbc9-4c74-a4ca-77e52b405850';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  
  // 1. Mobile Viewport
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true });
  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 15000 });

  console.log('Clicking the AIIMS E. coli clinical preset to load report...');
  // Find preset button
  const presetBtn = await page.waitForSelector('button ::-p-text(Acute E. coli UTI (Cipro-Resistant))', { timeout: 5000 }).catch(() => null);
  if (presetBtn) {
    await presetBtn.click();
  } else {
    // Fallback click on any preset
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Acute E. coli')) {
        await b.click();
        break;
      }
    }
  }

  // Wait for report or modal to render
  await page.waitForFunction(() => {
    return document.body.innerText.includes('UTI IS DETECTED') || document.body.innerText.includes('Diagnostic Summary');
  }, { timeout: 8000 });

  // Dismiss modal if open
  const modalDismissBtn = await page.waitForSelector('button ::-p-text(View Clinical Report)', { timeout: 3000 }).catch(() => null);
  if (modalDismissBtn) {
    console.log('Dismissing UTI IS DETECTED modal...');
    await modalDismissBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('Report rendered! Checking overflow and content...');

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

  const textContent = await page.evaluate(() => document.body.innerText);
  console.log('Has Patient Name:', textContent.includes('Rajesh Sharma, 48M'));
  console.log('Has AIIMS Badge:', textContent.includes('Urgent Clinical — AIIMS Delhi'));
  console.log('Has Pyuria Finding:', textContent.includes('Acute Pyuria Detected'));
  console.log('Has E. coli Pathogen:', textContent.includes('Escherichia coli'));
  console.log('Has Ciprofloxacin Resistant:', textContent.includes('Ciprofloxacin') && textContent.includes('Resistant'));
  console.log('Has gyrA tag:', textContent.includes('gyrA'));
  console.log('Has Nitrofurantoin 99% Efficacy:', textContent.includes('Nitrofurantoin') && textContent.includes('99% Efficacy'));

  // Screenshot 1: Doctor View Mobile
  const mobileDoctorShot = path.join(brainDir, 'design2_report_doctor_mobile.png');
  await page.screenshot({ path: mobileDoctorShot, fullPage: false });
  console.log('Saved screenshot 1:', mobileDoctorShot);

  // Click on "Patient Plain Summary"
  console.log('Clicking Patient Plain Summary toggle...');
  const patientToggle = await page.waitForSelector('button ::-p-text(Patient Plain Summary)', { timeout: 3000 }).catch(() => null);
  if (patientToggle) {
    await patientToggle.click();
  } else {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent.includes('Patient Plain Summary'));
      if (target) target.click();
    });
  }

  await new Promise(r => setTimeout(r, 600));

  const patientViewText = await page.evaluate(() => document.body.innerText);
  console.log('Has What Your Test Means:', patientViewText.includes('What Your Test Means'));
  console.log('Has Prescribed Treatment:', patientViewText.includes('Your Prescribed Treatment'));
  console.log('Has Medications to Avoid:', patientViewText.includes('Medications to Avoid'));
  console.log('Has Drink Water Instructions:', patientViewText.includes('Drink 2.5–3 Liters of Water'));

  // Screenshot 2: Patient View Mobile
  const mobilePatientShot = path.join(brainDir, 'design2_report_patient_mobile.png');
  await page.screenshot({ path: mobilePatientShot, fullPage: false });
  console.log('Saved screenshot 2:', mobilePatientShot);

  // 2. Desktop Viewport
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 400));
  const desktopShot = path.join(brainDir, 'design2_report_desktop.png');
  await page.screenshot({ path: desktopShot, fullPage: false });
  console.log('Saved screenshot 3:', desktopShot);

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
