const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

function buildPdfDocument(session) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 14;
  const rightMargin = 14;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let y = 15;

  const ensurePageSpace = (neededHeight, onNewPage) => {
    if (y + neededHeight > pageHeight - 12) {
      doc.addPage();
      doc.setFillColor(217, 142, 63); // #D98E3F
      doc.rect(0, 0, pageWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text("GENEX POINT-OF-CARE DIAGNOSTICS — CONTINUED REPORT", leftMargin, 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Doc ID: ${session.id}`, pageWidth - rightMargin, 5.5, { align: 'right' });
      y = 14;
      if (onNewPage) onNewPage();
    }
  };

  // Top Header Banner
  doc.setFillColor(217, 142, 63);
  doc.rect(0, 0, pageWidth, 11, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text("GENEX POINT-OF-CARE DIAGNOSTICS — CLINICAL REPORT", leftMargin, 7.2);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("ISO-13485 CERTIFIED POCT", pageWidth - rightMargin, 7.2, { align: 'right' });

  // Title
  y = 18.5;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text("UTI Microfluidic Cartridge Diagnostic Report", leftMargin, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const dateFormatted = new Date(session.timestamp).toLocaleString();
  doc.text(`Scan ID: ${session.id}   |   Date: ${dateFormatted}   |   Batch: ${session.batchId}`, leftMargin, y);

  y += 3;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 3.5;

  // Patient Block
  const patient = session.patientInfo || {
    patientName: 'Rajesh Sharma',
    age: 48,
    gender: 'Male',
    mrn: 'MRN-AIIMS-90481',
    specimenId: 'SP-ICMR-2026-041A',
    orderingPhysician: 'Dr. Rajesh Malhotra, MD (AIIMS Infectious Diseases)',
    facility: 'AIIMS New Delhi - Clinical Microbiology Reference Lab',
    chiefComplaint: 'Acute pyuria & dysuria evaluation',
    collectionMethod: 'Midstream Clean-Catch Urine',
  };

  const col1Width = 86;
  const col2Width = 84;
  const col2X = leftMargin + col1Width + 6;

  doc.setFontSize(8);
  const pNameLines = doc.splitTextToSize(`Patient: ${patient.patientName} (${patient.age}y / ${patient.gender})`, col1Width);
  const pFacilityLines = doc.splitTextToSize(`Facility: ${patient.facility}`, col1Width);
  const pComplaintLines = doc.splitTextToSize(`Chief Complaint: ${patient.chiefComplaint || 'Dysuria / pyuria evaluation'}`, col1Width);

  const pMrnLines = doc.splitTextToSize(`MRN: ${patient.mrn}   |   Specimen: ${patient.specimenId || 'N/A'}`, col2Width);
  const pDoctorLines = doc.splitTextToSize(`Clinician: ${patient.orderingPhysician}`, col2Width);
  const pMethodLines = doc.splitTextToSize(`Collection: ${patient.collectionMethod || 'Clean-Catch Midstream'}`, col2Width);

  const col1LineCount = pNameLines.length + pFacilityLines.length + pComplaintLines.length;
  const col2LineCount = pMrnLines.length + pDoctorLines.length + pMethodLines.length;
  const maxPatientLines = Math.max(col1LineCount, col2LineCount);
  const patientCardHeight = Math.max(20, 4 + maxPatientLines * 3.4 + 3);

  ensurePageSpace(patientCardHeight + 4);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(leftMargin, y, contentWidth, patientCardHeight, 1.5, 1.5, 'FD');

  let py1 = y + 4.2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(pNameLines, leftMargin + 3, py1);
  py1 += pNameLines.length * 3.4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(pFacilityLines, leftMargin + 3, py1);
  py1 += pFacilityLines.length * 3.4;
  doc.text(pComplaintLines, leftMargin + 3, py1);

  let py2 = y + 4.2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(pMrnLines, col2X, py2);
  py2 += pMrnLines.length * 3.4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(pDoctorLines, col2X, py2);
  py2 += pDoctorLines.length * 3.4;
  doc.text(pMethodLines, col2X, py2);

  y += patientCardHeight + 4;

  // Diagnostic Status Card
  const isHigh = session.layer1.infectionLevel === 'High';
  const isMod = session.layer1.infectionLevel === 'Moderate';
  const isLow = session.layer1.infectionLevel === 'Low';

  if (isHigh) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
  } else if (isMod) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
  } else if (isLow) {
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(94, 234, 212);
  } else {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(134, 239, 172);
  }

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const statusTitleLines = doc.splitTextToSize(`DIAGNOSTIC STATUS: ${session.overallSummary.title.toUpperCase()}`, contentWidth - 8);
  const titleBlockHeight = statusTitleLines.length * 4.4;

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  const impressionLines = doc.splitTextToSize(session.overallSummary.clinicalImpression, contentWidth - 8);
  const impressionBlockHeight = impressionLines.length * 3.7;

  const summaryBoxHeight = 4 + titleBlockHeight + 2 + impressionBlockHeight + 3.5;

  ensurePageSpace(summaryBoxHeight + 4);

  doc.roundedRect(leftMargin, y, contentWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(statusTitleLines, leftMargin + 4, y + 4.2);

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(impressionLines, leftMargin + 4, y + 4.2 + titleBlockHeight + 1.5);

  y += summaryBoxHeight + 4;

  // Section 1: Pyuria
  ensurePageSpace(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("1. Pyuria / Pus-Cell Assay (Layer 1 — Leukocyte Esterase)", leftMargin, y);
  y += 3.5;

  const cardW = (contentWidth - 6) / 3;
  const cardH = 13;

  // Box 1
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, y, cardW, cardH, 1, 1, 'FD');
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text("INFECTION SEVERITY", leftMargin + 3, y + 3.8);
  doc.setFontSize(8.5);
  if (isHigh) doc.setTextColor(185, 28, 28);
  else if (isMod) doc.setTextColor(180, 83, 9);
  else doc.setTextColor(21, 128, 61);
  doc.text(session.layer1.infectionLevel.toUpperCase(), leftMargin + 3, y + 9.2);

  // Box 2
  const box2X = leftMargin + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(box2X, y, cardW, cardH, 1, 1, 'FD');
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text("PYURIA WBC ESTIMATE", box2X + 3, y + 3.8);
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const wbcLines = doc.splitTextToSize(session.layer1.pyuriaWbcEstimate, cardW - 6);
  if (wbcLines.length > 1) {
    doc.text(wbcLines[0], box2X + 3, y + 8);
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(wbcLines[1], box2X + 3, y + 11.2);
  } else {
    doc.text(wbcLines[0], box2X + 3, y + 9.2);
  }

  // Box 3
  const box3X = box2X + cardW + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(box3X, y, cardW, cardH, 1, 1, 'FD');
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text("SIGNAL OPTICAL DENSITY", box3X + 3, y + 3.8);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${session.layer1.opticalDensity.toFixed(3)} OD`, box3X + 3, y + 9.2);

  y += cardH + 4;

  // Section 2: Pathogens
  ensurePageSpace(32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("2. 4-Plex Pathogen Aptamer Panel (Layer 2 — Aptamer Capture)", leftMargin, y);
  y += 3.5;

  const renderL2Header = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin, y, contentWidth, 5, 'F');
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("TARGET ORGANISM", leftMargin + 2, y + 3.6);
    doc.text("GRAM STAIN", leftMargin + 66, y + 3.6);
    doc.text("OPTICAL DENSITY", leftMargin + 102, y + 3.6);
    doc.text("STATUS", leftMargin + 148, y + 3.6);
    y += 5;
  };

  renderL2Header();

  session.layer2.pathogens.forEach((p, idx) => {
    const organismLabel = p.scientificName || p.name;
    doc.setFontSize(7.8);
    const col1Lines = doc.splitTextToSize(organismLabel, 62);
    const col2Lines = doc.splitTextToSize(p.gram, 32);
    const col3Lines = doc.splitTextToSize(`${p.opticalDensity.toFixed(3)} (Cutoff: ${p.thresholdOD})`, 42);
    const col4Lines = doc.splitTextToSize(p.detected ? "[DETECTED]" : "Not Detected", 30);
    const maxLines = Math.max(col1Lines.length, col2Lines.length, col3Lines.length, col4Lines.length);
    const rowHeight = Math.max(maxLines * 3.8 + 1.8, 5.5);

    ensurePageSpace(rowHeight + 2, () => renderL2Header());

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, y, contentWidth, rowHeight, 'F');
    }

    if (p.detected) {
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
    }

    doc.text(col1Lines, leftMargin + 2, y + 3.6);
    doc.text(col2Lines, leftMargin + 66, y + 3.6);
    doc.text(col3Lines, leftMargin + 102, y + 3.6);
    doc.text(col4Lines, leftMargin + 148, y + 3.6);

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y + rowHeight, pageWidth - rightMargin, y + rowHeight);

    y += rowHeight;
  });

  y += 3.5;

  // Section 3: AST
  ensurePageSpace(42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("3. Antibiotic Susceptibility Testing (Layer 3 — 4× Replicate Panel)", leftMargin, y);
  y += 3.5;

  const renderL3Header = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(leftMargin, y, contentWidth, 5, 'F');
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("ANTIMICROBIAL AGENT", leftMargin + 2, y + 3.6);
    doc.text("CLASS / LINE", leftMargin + 50, y + 3.6);
    doc.text("MEAN OD ± SD", leftMargin + 96, y + 3.6);
    doc.text("CONCORDANCE", leftMargin + 128, y + 3.6);
    doc.text("RESULT", leftMargin + 158, y + 3.6);
    y += 5;
  };

  renderL3Header();

  session.layer3.antibiotics.forEach((a, idx) => {
    const isSens = a.status === 'Sensitive';
    const isRes = a.status === 'Resistant';

    const drugLabel = a.isFirstLine ? `${a.name}* (1st-Line)` : a.name;
    doc.setFontSize(7.8);
    const col1Lines = doc.splitTextToSize(drugLabel, 46);
    const col2Lines = doc.splitTextToSize(a.drugClass, 44);
    const col3Lines = doc.splitTextToSize(`${a.meanOD.toFixed(3)} ± ${a.stdDev.toFixed(2)}`, 30);
    const col4Lines = doc.splitTextToSize(a.concordanceText.replace(' replicates', ''), 28);
    const col5Lines = doc.splitTextToSize(a.status.toUpperCase(), 22);

    const maxLines = Math.max(col1Lines.length, col2Lines.length, col3Lines.length, col4Lines.length, col5Lines.length);
    const rowHeight = Math.max(maxLines * 3.8 + 1.8, 5.5);

    ensurePageSpace(rowHeight + 2, () => renderL3Header());

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftMargin, y, contentWidth, rowHeight, 'F');
    }

    if (isSens) {
      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
    } else if (isRes) {
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
    }

    doc.text(col1Lines, leftMargin + 2, y + 3.6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(col2Lines, leftMargin + 50, y + 3.6);
    doc.text(col3Lines, leftMargin + 96, y + 3.6);
    doc.text(col4Lines, leftMargin + 128, y + 3.6);

    if (isSens) {
      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
    } else if (isRes) {
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(col5Lines, leftMargin + 158, y + 3.6);

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y + rowHeight, pageWidth - rightMargin, y + rowHeight);

    y += rowHeight;
  });

  y += 3.5;

  // Stewardship Note
  const isScanNegative = session.layer1.infectionLevel === 'Negative' && !session.layer2.pathogens.some(p => p.detected);
  let recText = "";
  if (isScanNegative) {
    recText = "No active uropathogen or significant pyuria detected. Antimicrobial therapy is not indicated under clinical stewardship guidelines. Hydration and observation recommended.";
  } else if (session.overallSummary.suggestedFirstLine.length > 0) {
    recText = `Sensitive First-Line Options: ${session.overallSummary.suggestedFirstLine.join(', ')}. Reserve fluoroquinolones (Ciprofloxacin) to preserve efficacy and prevent resistance escalation.`;
  } else {
    recText = "No sensitive standard first-line oral regimens identified. Seek physician review for culture-directed or parenteral alternatives.";
  }

  doc.setFontSize(7.5);
  const splitRec = doc.splitTextToSize(recText, contentWidth - 8);
  const recBoxHeight = 5 + splitRec.length * 3.4 + 2.5;

  ensurePageSpace(recBoxHeight + 10);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, y, contentWidth, recBoxHeight, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("ANTIMICROBIAL STEWARDSHIP & FIRST-LINE RECOMMENDATIONS:", leftMargin + 3, y + 3.6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(splitRec, leftMargin + 3, y + 7.2);

  y += recBoxHeight + 3.5;

  // Legal Medical Disclaimer (FR28)
  ensurePageSpace(12);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, y, pageWidth - rightMargin, y);
  y += 2.8;

  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  const disclaimer = "LEGAL MEDICAL DISCLAIMER: Genex is an investigational point-of-care software reader for microfluidic cartridges. This report does not constitute a certified medical diagnosis and is intended to support clinical decision-making. Treatment must be confirmed by a licensed medical practitioner in accordance with local antimicrobial guidelines.";
  const discLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(discLines, leftMargin, y);

  // Multi-page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, pageHeight - 7, pageWidth - rightMargin, pageHeight - 7);

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Genex Point-of-Care Diagnostics  •  Report ID: ${session.id}  •  Batch: ${session.batchId}`, leftMargin, pageHeight - 4.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - rightMargin, pageHeight - 4.5, { align: 'right' });
  }

  return doc;
}

// Test suite for multiple clinical scenarios
const testCases = [
  {
    name: 'User Recurrence High-Risk Case (Exact screenshot case)',
    session: {
      id: 'scan_rec_user_01',
      batchId: 'GENEX-B26-09',
      timestamp: new Date('2026-09-20T23:45:54').toISOString(),
      patientInfo: {
        patientName: 'Anita Sharma',
        age: 45,
        gender: 'Female',
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
          { id: 'ampicillin', name: 'Ampicillin', drugClass: 'Aminopenicillin', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: false },
          { id: 'ciprofloxacin', name: 'Ciprofloxacin', drugClass: 'Fluoroquinolone', meanOD: 0.780, stdDev: 0.03, concordanceText: '4/4 replicates concordant (100%)', status: 'Resistant', isFirstLine: false },
          { id: 'nitrofurantoin', name: 'Nitrofurantoin', drugClass: 'Nitrofuran', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: true },
          { id: 'cotrimoxazole', name: 'Cotrimoxazole', drugClass: 'Folate Synthesis Inhibitor', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: true },
          { id: 'fosfomycin', name: 'Fosfomycin', drugClass: 'Phosphonic Acid Derivative', meanOD: 0.058, stdDev: 0.02, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: true },
        ],
      },
    },
  },
  {
    name: 'Extreme Edge Case (Super long names, multi-line titles & polymicrobial)',
    session: {
      id: 'scan_extreme_poly_02',
      batchId: 'GENEX-B26-EXTREME',
      timestamp: new Date().toISOString(),
      patientInfo: {
        patientName: 'Dr. Vikramaditya Somasekharan Balasubramanian-Mukhopadhyay',
        age: 72,
        gender: 'Male',
        mrn: 'MRN-AIIMS-DELHI-SURVEILLANCE-NODE-90481-EXTENDED',
        specimenId: 'SP-ICMR-MOHFW-2026-999-URINE-CLEAN-CATCH',
        orderingPhysician: 'Prof. Dr. Rajeshwar Somasekharan Malhotra, MD, PhD, FAMS (Head of Infectious Diseases)',
        facility: 'All India Institute of Medical Sciences (AIIMS) New Delhi — ICMR Advanced AMR Surveillance Reference Lab Node #041',
        chiefComplaint: 'Post-transurethral prostatectomy acute severe pyuria, recurrent high fever 39.8°C with rigors, obstructive uropathy',
        collectionMethod: 'Sterile Closed-System Foley Catheter Collection',
      },
      overallSummary: {
        title: 'ACUTE MULTIDRUG-RESISTANT POLYMICROBIAL PYELONEPHRITIS WITH EXTENSIVE RESISTANCE PATTERN AND HIGH RECURRENCE RISK',
        clinicalImpression: 'Severe inflammatory pyuria (>250 WBC/µL) confirmed with dual pathogen co-infection (E. coli and K. pneumoniae). Uropathogen isolates exhibit widespread fluoroquinolone resistance and beta-lactam resistance. [HIGH-RISK RECURRENCE PATTERN: Patient has 14 prior documented episodes over 12 months with indwelling catheterization. Cross-resistance emerging across second-line agents. Immediate parenteral therapy with Carbapenems or culture-guided IV aminoglycosides warranted per hospital antimicrobial stewardship policy. Ensure renal function monitoring.]',
        suggestedFirstLine: ['Fosfomycin'],
        resistantDrugs: ['Ampicillin', 'Ciprofloxacin', 'Cotrimoxazole'],
      },
      layer1: {
        infectionLevel: 'High',
        pyuriaWbcEstimate: '> 250 WBC/µL (Severe Acute Inflammatory Pyuria)',
        opticalDensity: 0.842,
        deltaE: 14.2,
        confidence: 99,
      },
      layer2: {
        pathogens: [
          { id: 'ecoli', name: 'Escherichia coli (UPEC ST131)', scientificName: 'Escherichia coli (UPEC clone ST131)', gram: 'Gram-negative bacillus', opticalDensity: 0.720, thresholdOD: 0.22, detected: true },
          { id: 'klebsiella', name: 'Klebsiella pneumoniae (Hypervirulent)', scientificName: 'Klebsiella pneumoniae subsp. pneumoniae', gram: 'Gram-negative encapsulated bacillus', opticalDensity: 0.650, thresholdOD: 0.20, detected: true },
          { id: 'proteus', name: 'Proteus mirabilis', scientificName: 'Proteus mirabilis (Urease Producer)', gram: 'Gram-negative swarming bacillus', opticalDensity: 0.040, thresholdOD: 0.20, detected: false },
          { id: 'pseudomonas', name: 'Pseudomonas aeruginosa', scientificName: 'Pseudomonas aeruginosa (Mucoid strain)', gram: 'Gram-negative non-fermenter', opticalDensity: 0.040, thresholdOD: 0.21, detected: false },
        ],
      },
      layer3: {
        antibiotics: [
          { id: 'ampicillin', name: 'Ampicillin', drugClass: 'Aminopenicillin (Cell Wall Inhibitor)', meanOD: 0.790, stdDev: 0.04, concordanceText: '4/4 replicates concordant (100%)', status: 'Resistant', isFirstLine: false },
          { id: 'ciprofloxacin', name: 'Ciprofloxacin', drugClass: 'Fluoroquinolone (DNA Gyrase Inhibitor)', meanOD: 0.812, stdDev: 0.03, concordanceText: '4/4 replicates concordant (100%)', status: 'Resistant', isFirstLine: false },
          { id: 'nitrofurantoin', name: 'Nitrofurantoin', drugClass: 'Nitrofuran (Bacterial Ribosome Inactivator)', meanOD: 0.310, stdDev: 0.05, concordanceText: '2/4 replicates concordant (50%)', status: 'Intermediate', isFirstLine: true },
          { id: 'cotrimoxazole', name: 'Cotrimoxazole', drugClass: 'Folate Synthesis Inhibitor (DHFR/DHPS)', meanOD: 0.740, stdDev: 0.02, concordanceText: '4/4 replicates concordant (100%)', status: 'Resistant', isFirstLine: true },
          { id: 'fosfomycin', name: 'Fosfomycin', drugClass: 'Phosphonic Acid Derivative (MurA Inactivator)', meanOD: 0.062, stdDev: 0.01, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: true },
        ],
      },
    },
  },
  {
    name: 'Healthy Baseline Control',
    session: {
      id: 'scan_healthy_03',
      batchId: 'GENEX-B26-HEALTHY',
      timestamp: new Date().toISOString(),
      patientInfo: {
        patientName: 'Clara Bennet',
        age: 35,
        gender: 'Female',
        mrn: 'MRN-1029384',
        specimenId: 'SP-2026-1102F',
        orderingPhysician: 'Dr. James Harrison, MD',
        facility: 'Preventive Care Medical Group - Wellness Pavilion',
        chiefComplaint: 'Routine annual physical exam. Completely asymptomatic.',
        collectionMethod: 'Routine Clean-Catch Urine',
      },
      overallSummary: {
        title: 'NEGATIVE / HEALTHY BASELINE — NO ACTIVE UTI',
        clinicalImpression: 'Normal leukocyte esterase activity (<10 WBC/µL) and absence of detectable uropathogens across all aptamer panel channels. Broad susceptibility profile observed. No antimicrobial therapy indicated.',
        suggestedFirstLine: [],
        resistantDrugs: [],
      },
      layer1: {
        infectionLevel: 'Negative',
        pyuriaWbcEstimate: '< 10 WBC/µL (Normal Physiological Range)',
        opticalDensity: 0.012,
        deltaE: 0.4,
        confidence: 99,
      },
      layer2: {
        pathogens: [
          { id: 'ecoli', name: 'Escherichia coli', scientificName: 'Escherichia coli', gram: 'Gram-negative', opticalDensity: 0.020, thresholdOD: 0.22, detected: false },
          { id: 'klebsiella', name: 'Klebsiella pneumoniae', scientificName: 'Klebsiella pneumoniae', gram: 'Gram-negative', opticalDensity: 0.018, thresholdOD: 0.20, detected: false },
          { id: 'proteus', name: 'Proteus mirabilis', scientificName: 'Proteus mirabilis', gram: 'Gram-negative', opticalDensity: 0.015, thresholdOD: 0.20, detected: false },
          { id: 'pseudomonas', name: 'Pseudomonas aeruginosa', scientificName: 'Pseudomonas aeruginosa', gram: 'Gram-negative', opticalDensity: 0.016, thresholdOD: 0.21, detected: false },
        ],
      },
      layer3: {
        antibiotics: [
          { id: 'ampicillin', name: 'Ampicillin', drugClass: 'Aminopenicillin', meanOD: 0.045, stdDev: 0.01, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: false },
          { id: 'ciprofloxacin', name: 'Ciprofloxacin', drugClass: 'Fluoroquinolone', meanOD: 0.040, stdDev: 0.01, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: false },
          { id: 'nitrofurantoin', name: 'Nitrofurantoin', drugClass: 'Nitrofuran', meanOD: 0.038, stdDev: 0.01, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: true },
          { id: 'cotrimoxazole', name: 'Cotrimoxazole', drugClass: 'Folate Synthesis Inhibitor', meanOD: 0.042, stdDev: 0.01, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: true },
          { id: 'fosfomycin', name: 'Fosfomycin', drugClass: 'Phosphonic Acid Derivative', meanOD: 0.035, stdDev: 0.01, concordanceText: '4/4 replicates concordant (100%)', status: 'Sensitive', isFirstLine: true },
        ],
      },
    },
  },
];

const outputDir = path.join(__dirname, 'output_pdfs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

testCases.forEach((tc, idx) => {
  console.log(`\n==============================================`);
  console.log(`Testing Case ${idx + 1}: ${tc.name}`);
  const doc = buildPdfDocument(tc.session);
  const numPages = doc.getNumberOfPages();
  const filename = `test_report_${idx + 1}.pdf`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
  console.log(`  -> Generated: ${filename}`);
  console.log(`  -> Pages: ${numPages}`);
  console.log(`  -> Size: ${fs.statSync(filePath).size} bytes`);
});

console.log('\nAll PDF test cases executed successfully!');
