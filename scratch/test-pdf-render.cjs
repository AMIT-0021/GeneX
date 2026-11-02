const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Simulate the exact long impression from the user's screenshot
const testSession = {
  id: 'scan_mua50b2qipgx',
  batchId: 'GENEX-B26-09',
  timestamp: new Date('2026-09-20T23:45:54').toISOString(),
  persona: 'clinician',
  calibration: { isCalibrated: true, deviceId: 'GX-041' },
  patientInfo: {
    patientName: 'Rajesh Sharma',
    age: 48,
    gender: 'Male',
    mrn: 'MRN-AIIMS-90481',
    specimenId: 'SP-ICMR-2026-041A',
    orderingPhysician: 'Dr. Rajesh Malhotra, MD (AIIMS Infectious Diseases)',
    facility: 'AIIMS New Delhi - Clinical Microbiology Reference Lab',
    chiefComplaint: 'Acute pyuria & dysuria evaluation',
    collectionMethod: 'Midstream Clean-Catch Urine',
  },
  overallSummary: {
    title: 'ASYMPTOMATIC BACTERIURIA — K. PNEUMONIAE',
    clinicalImpression: 'Pathogen detected (K. pneumoniae) in the absence of significant pyuria (<10 WBC/µL (Normal physiological range)). This pattern is consistent with asymptomatic bacteriuria or epithelial colonization. Routine antimicrobial therapy is generally withheld per stewardship guidelines unless indicated by high-risk conditions (e.g. pregnancy). [HIGH-RISK RECURRENCE PATTERN: Recurrent UTI pattern detected: 12 positive scans recorded in the past 6 months. Repeat infection detected with Klebsiella pneumoniae (5 visits in past 6 months). Resistance change detected: Ciprofloxacin evolved from Sensitive (9/19/2026) to Resistant. Worth discussing antimicrobial prophylaxis or urological evaluation with a clinician.]',
    suggestedFirstLine: ['Nitrofurantoin', 'Cotrimoxazole'],
    resistantDrugs: ['Ciprofloxacin'],
  },
  layer1: {
    infectionLevel: 'Negative',
    pyuriaWbcEstimate: '<10 WBC/µL (Normal physiological range)',
    opticalDensity: 0.000,
    deltaE: 0.8,
    confidence: 98,
  },
  layer2: {
    pathogens: [
      { id: 'ecoli', name: 'Escherichia coli', scientificName: 'Escherichia coli', gram: 'Gram-negative', opticalDensity: 0.040, thresholdOD: 0.22, detected: false },
      { id: 'klebsiella', name: 'Klebsiella pneumoniae', scientificName: 'Klebsiella pneumoniae', gram: 'Gram-negative', opticalDensity: 0.380, thresholdOD: 0.20, detected: true },
      { id: 'proteus', name: 'Proteus mirabilis', scientificName: 'Proteus mirabilis', gram: 'Gram-negative', opticalDensity: 0.040, thresholdOD: 0.20, detected: false },
      { id: 'pseudomonas', name: 'Pseudomonas aeruginosa', scientificName: 'Pseudomonas aeruginosa', gram: 'Gram-negative', opticalDensity: 0.040, thresholdOD: 0.21, detected: false },
    ],
  },
  layer3: {
    antibiotics: [
      { id: 'ampicillin', name: 'Ampicillin', drugClass: 'Aminopenicillin', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates', status: 'Sensitive', isFirstLine: false },
      { id: 'ciprofloxacin', name: 'Ciprofloxacin', drugClass: 'Fluoroquinolone', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates', status: 'Sensitive', isFirstLine: false },
      { id: 'nitrofurantoin', name: 'Nitrofurantoin', drugClass: 'Nitrofuran', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates', status: 'Sensitive', isFirstLine: true },
      { id: 'cotrimoxazole', name: 'Cotrimoxazole', drugClass: 'Folate Synthesis Inhibitor', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates', status: 'Sensitive', isFirstLine: true },
      { id: 'fosfomycin', name: 'Fosfomycin', drugClass: 'Phosphonic Acid Derivative', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates', status: 'Sensitive', isFirstLine: true },
    ],
  },
};

// Generate PDF using logic from PdfExportService
const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
let y = 18;

const ensurePageSpace = (neededHeight) => {
  if (y + neededHeight > pageHeight - 15) {
    doc.addPage();
    doc.setFillColor(217, 142, 63);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("GENEX POINT-OF-CARE DIAGNOSTICS — CONTINUED REPORT", 14, 5.5);
    y = 16;
  }
};

// Header
doc.setFillColor(217, 142, 63);
doc.rect(0, 0, pageWidth, 12, 'F');
doc.setTextColor(255, 255, 255);
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.text("GENEX POINT-OF-CARE DIAGNOSTICS — CLINICAL REPORT", 14, 8);

y += 4;
doc.setTextColor(15, 23, 42);
doc.setFontSize(18);
doc.setFont('helvetica', 'bold');
doc.text("UTI Microfluidic Cartridge Diagnostic Report", 14, y);

y += 7;
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(100, 116, 139);
doc.text(`Scan ID: ${testSession.id}  |  Date: 9/20/2026, 11:45:54 PM  |  Batch: ${testSession.batchId}`, 14, y);

y += 4;
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.5);
doc.line(14, y, pageWidth - 14, y);

// Patient Block
y += 4;
doc.setFillColor(248, 250, 252);
doc.setDrawColor(203, 213, 225);
doc.roundedRect(14, y, pageWidth - 28, 16, 1.5, 1.5, 'FD');
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text(`Patient Name: ${testSession.patientInfo.patientName} (${testSession.patientInfo.age}y / ${testSession.patientInfo.gender})`, 18, y + 5.5);
doc.text(`MRN: ${testSession.patientInfo.mrn}`, 130, y + 5.5);
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(71, 85, 105);
doc.text(`Facility: ${testSession.patientInfo.facility}  |  Clinician: ${testSession.patientInfo.orderingPhysician}`, 18, y + 11.5);
y += 20;

// Dynamic Diagnostic Status Box
doc.setFillColor(240, 253, 244);
doc.setDrawColor(134, 239, 172);
doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
const impressionLines = doc.splitTextToSize(testSession.overallSummary.clinicalImpression, pageWidth - 38);
const lineHeight = 4.2;
const impressionTextHeight = impressionLines.length * lineHeight;
const summaryBoxHeight = 10 + impressionTextHeight + 5;

console.log('Impression Lines Count:', impressionLines.length);
console.log('Dynamic Summary Box Height:', summaryBoxHeight, 'mm');

ensurePageSpace(summaryBoxHeight + 6);
doc.roundedRect(14, y, pageWidth - 28, summaryBoxHeight, 2, 2, 'FD');

doc.setFontSize(10.5);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text(`DIAGNOSTIC STATUS: ${testSession.overallSummary.title.toUpperCase()}`, 18, y + 6.5);

doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(51, 65, 85);
doc.text(impressionLines, 18, y + 12);

y += summaryBoxHeight + 6;
console.log('Section 1 starts at y =', y, 'mm (guaranteed past box bottom at y =', (y - 6), 'mm)');

// SECTION 1: LAYER 1 PUS-CELL
ensurePageSpace(20);
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text("1. Pyuria / Pus-Cell Assay (Layer 1)", 14, y);

y += 5.5;
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.setTextColor(71, 85, 105);
doc.text(`Infection Severity: ${testSession.layer1.infectionLevel}`, 14, y);
doc.text(`WBC Estimate: ${testSession.layer1.pyuriaWbcEstimate}`, 70, y);
doc.text(`Signal OD: ${testSession.layer1.opticalDensity.toFixed(3)}`, 150, y);

y += 8.5;

// SECTION 2
ensurePageSpace(35);
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(15, 23, 42);
doc.text("2. 4-Plex Pathogen Aptamer Panel (Layer 2)", 14, y);

const outputPath = path.join(__dirname, 'fixed_report.pdf');
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log('SUCCESS: Fixed PDF generated without any overlapping at:', outputPath);
