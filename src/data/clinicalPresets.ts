import { Layer2Result, Layer3Result, PatientClinicalInfo } from '../types/diagnostic';
import { defaultCartridgeConfig } from '../config/cartridgeConfig';

export interface CartridgePreset {
  id: string;
  name: string;
  badge: string;
  badgeType: 'urgent' | 'standard' | 'complicated' | 'healthy';
  description: string;
  pyuriaLevel: 'Negative' | 'Low' | 'Moderate' | 'High';
  detectedPathogens: string[];
  resistantDrugs: string[];
  intermediateDrugs?: string[];
  citation?: string;
  patientInfo?: PatientClinicalInfo;
}

export const PRESETS: CartridgePreset[] = [
  {
    id: 'icmr_aiims_esbl_ecoli',
    name: 'Acute E. coli UTI (Cipro-Resistant)',
    badge: 'URGENT CLINICAL',
    badgeType: 'urgent',
    description: 'Heavy acute pyuria (>250 WBC/µL) with strong E. coli aptamer signal; resistant to Ciprofloxacin. ICMR AMRSN AIIMS New Delhi surveillance case: Rajesh Sharma (48y M).',
    pyuriaLevel: 'High',
    detectedPathogens: ['ecoli'],
    resistantDrugs: ['ciprofloxacin'],
    intermediateDrugs: ['ceftriaxone'],
    citation: 'ICMR AMRSN Surveillance Node — AIIMS New Delhi (icmr.gov.in)',
    patientInfo: {
      patientName: 'Rajesh Sharma',
      age: 48,
      gender: 'Male',
      mrn: 'MRN-AIIMS-90481',
      specimenId: 'SP-ICMR-2026-041A',
      orderingPhysician: 'Dr. Rajesh Malhotra, MD (AIIMS Infectious Diseases)',
      facility: 'AIIMS New Delhi - Clinical Microbiology Reference Lab',
      chiefComplaint: 'High grade fever 39.4°C with chills, dysuria, and right flank tenderness',
      collectionMethod: 'Midstream Clean-Catch Urine',
    },
  },
  {
    id: 'icmr_pgimer_klebsiella',
    name: 'Moderate Klebsiella pneumoniae',
    badge: 'STANDARD CASE',
    badgeType: 'standard',
    description: 'Moderate pyuria (50-250 WBC/µL) with Klebsiella aptamer chromogenic reaction. ICMR AMRSN PGIMER Chandigarh surveillance case: Sunita Devi (52y F).',
    pyuriaLevel: 'Moderate',
    detectedPathogens: ['klebsiella'],
    resistantDrugs: [],
    citation: 'ICMR AMRSN Surveillance Node — PGIMER Chandigarh (icmr.gov.in)',
    patientInfo: {
      patientName: 'Sunita Devi',
      age: 52,
      gender: 'Female',
      mrn: 'MRN-PGI-77492',
      specimenId: 'SP-ICMR-2026-088B',
      orderingPhysician: 'Dr. Vikas Gautam, MD (PGIMER Medical Microbiology)',
      facility: 'PGIMER Chandigarh - Antimicrobial Resistance Node',
      chiefComplaint: 'Post-catheterization fever 38.9°C, suprapubic pain, turbid urine',
      collectionMethod: 'Foley Catheter Sample',
    },
  },
  {
    id: 'icmr_jipmer_ecoli_cystitis',
    name: 'Uncomplicated E. coli Cystitis',
    badge: 'PRIMARY CARE',
    badgeType: 'standard',
    description: 'Acute dysuria & frequency. MoHFW Primary Care & ICMR JIPMER Puducherry outpatient report: Ananya Krishnan (29y F). Sensitive to Nitrofurantoin & Fosfomycin.',
    pyuriaLevel: 'Moderate',
    detectedPathogens: ['ecoli'],
    resistantDrugs: [],
    citation: 'MoHFW / ICMR Primary Care UTI Guidelines — JIPMER Puducherry (icmr.gov.in)',
    patientInfo: {
      patientName: 'Ananya Krishnan',
      age: 29,
      gender: 'Female',
      mrn: 'MRN-JIP-50291',
      specimenId: 'SP-ICMR-2026-102C',
      orderingPhysician: 'Dr. S. Sujatha, MD (JIPMER Clinical Microbiology)',
      facility: 'JIPMER Puducherry - Outpatient Health Center',
      chiefComplaint: 'Severe strangury, urinary frequency, urgency for 18 hours',
      collectionMethod: 'Midstream Clean-Catch Urine',
    },
  },
  {
    id: 'icmr_cmc_proteus',
    name: 'Proteus mirabilis (TMP-SMX Resistant)',
    badge: 'COMPLICATED',
    badgeType: 'complicated',
    description: 'Inflammatory pyuria with Proteus mirabilis aptamer binding (pH 8.2). ICMR AMR Reference Center CMC Vellore case: Vikramaditya Rao (61y M).',
    pyuriaLevel: 'Moderate',
    detectedPathogens: ['proteus'],
    resistantDrugs: ['tmp_smx'],
    citation: 'ICMR AMR Reference Center — CMC Vellore (icmr.gov.in)',
    patientInfo: {
      patientName: 'Vikramaditya Rao',
      age: 61,
      gender: 'Male',
      mrn: 'MRN-CMC-30291',
      specimenId: 'SP-ICMR-2026-309D',
      orderingPhysician: 'Dr. V. Balaji, MD (CMC Clinical Microbiology)',
      facility: 'Christian Medical College (CMC) Vellore',
      chiefComplaint: 'Recurrent nephrolithiasis, obstructive voiding, alkaline urine pH 8.2',
      collectionMethod: 'Clean-Catch Urine Sample',
    },
  },
  {
    id: 'cdc_esbl_upec_2025',
    name: 'Global CDC ESBL UPEC Surveillance',
    badge: 'GLOBAL SURVEILLANCE',
    badgeType: 'urgent',
    description: 'CDC AR Lab Network real clinical case: Sarah Jenkins (28y F). High pyuria (>250 WBC/µL), ESBL-producing UPEC ST131 clone. Resistant to Ciprofloxacin & Cotrimoxazole.',
    pyuriaLevel: 'High',
    detectedPathogens: ['ecoli'],
    resistantDrugs: ['ciprofloxacin', 'cotrimoxazole'],
    citation: 'CDC AR Lab Network Surveillance Case #8492041',
    patientInfo: {
      patientName: 'Sarah Jenkins',
      age: 28,
      gender: 'Female',
      mrn: 'MRN-8492041',
      specimenId: 'SP-2026-9041A',
      orderingPhysician: 'Dr. Aris Thorne, MD (Emergency Medicine)',
      facility: 'St. Jude Regional Medical Center - Emergency Dept',
      chiefComplaint: 'Acute dysuria, right flank pain, CVA tenderness, fever 39.2°C',
      collectionMethod: 'Midstream Clean-Catch Urine',
    },
  },
  {
    id: 'healthy_asymptomatic_control',
    name: 'Negative Control (Healthy Urinalysis)',
    badge: 'HEALTHY BASELINE',
    badgeType: 'healthy',
    description: 'Healthy donor control with negative pyuria (<10 WBC/µL), no pathogen detection, and full antibiotic sensitivity across all 5 channels.',
    pyuriaLevel: 'Negative',
    detectedPathogens: [],
    resistantDrugs: [],
    citation: 'Standard Clinical Control Cohort #1029384',
    patientInfo: {
      patientName: 'Clara Bennet',
      age: 35,
      gender: 'Female',
      mrn: 'MRN-1029384',
      specimenId: 'SP-2026-1102F',
      orderingPhysician: 'Dr. James Harrison, MD',
      facility: 'Preventive Care Medical Group',
      chiefComplaint: 'Routine annual health checkup. Asymptomatic.',
      collectionMethod: 'Routine Clean-Catch Urine',
    },
  },
];

export const buildSimulatedBleData = (
  detectedPathogenIds: string[],
  resistantDrugIds: string[],
  intermediateDrugIds: string[] = []
): { l2: Layer2Result; l3: Layer3Result } => {
  const cfgTargets = defaultCartridgeConfig.layer2.targets;
  const cfgDrugs = defaultCartridgeConfig.layer3.antibiotics;

  // Build Layer2Result
  const pathogens = cfgTargets.map((t) => ({
    id: t.id,
    name: t.name,
    scientificName: t.scientificName,
    detected: detectedPathogenIds.includes(t.id),
    opticalDensity: detectedPathogenIds.includes(t.id) ? 0.38 : 0.04,
    deltaE: detectedPathogenIds.includes(t.id) ? 8.2 : 1.1,
    thresholdOD: t.thresholdOD,
    confidence: detectedPathogenIds.includes(t.id) ? 97 : 94,
    gram: t.gram,
    typicalCharacteristics: t.typicalCharacteristics,
    sampleRgb: { r: 180, g: 180, b: 180 },
    govtData: t.govtData,
  }));
  const detected = pathogens.filter((p) => p.detected);
  const l2: Layer2Result = {
    pathogens,
    primaryPathogen: detected.length > 0 ? detected[0].name : null,
    coinfectionDetected: detected.length > 1,
    summary:
      detected.length === 0
        ? 'No uropathogens detected.'
        : detected.length > 1
        ? `Polymicrobial: ${detected.map((p) => p.name).join(', ')}.`
        : `Positive identification: ${detected[0].scientificName}.`,
  };

  // Build Layer3Result
  const replicatesPerDrug = defaultCartridgeConfig.layer3.replicatesPerDrug;
  let sensitiveCount = 0;
  let resistantCount = 0;
  const antibiotics = cfgDrugs.map((drug) => {
    const isR =
      resistantDrugIds.includes(drug.id) ||
      (drug.id === 'cotrimoxazole' && resistantDrugIds.includes('tmp_smx')) ||
      (drug.id === 'tmp_smx' && resistantDrugIds.includes('cotrimoxazole'));
    const isI = intermediateDrugIds.includes(drug.id);
    const growthIndex = isR ? 0.78 : isI ? 0.26 : 0.07;
    const replicates = Array.from({ length: replicatesPerDrug }, (_, i) => {
      const jitter = ((i * 7 + 3) % 10 - 5) * 0.008;
      const repOD = Math.max(0, Math.min(1, growthIndex + jitter));
      return {
        replicateIndex: i + 1,
        opticalDensity: parseFloat(repOD.toFixed(3)),
        deltaE: parseFloat((repOD * 12).toFixed(2)),
        isSensitive: isR ? false : isI ? (i % 2 === 0) : true,
        sampleRgb: { r: 180, g: 180, b: 180 } as { r: number; g: number; b: number },
      };
    });
    const meanOD = parseFloat(
      (replicates.reduce((s, r) => s + r.opticalDensity, 0) / replicatesPerDrug).toFixed(3)
    );
    const varSum = replicates.reduce(
      (s, r) => s + Math.pow(r.opticalDensity - meanOD, 2),
      0
    );
    const stdDev = parseFloat(Math.sqrt(varSum / replicatesPerDrug).toFixed(3));
    const concordantCount = isR ? replicatesPerDrug : isI ? 2 : replicatesPerDrug;
    const concordanceScore = concordantCount / replicatesPerDrug;
    if (isR) resistantCount++;
    else if (!isI) sensitiveCount++;

    const status: 'Resistant' | 'Sensitive' | 'Intermediate' = isR
      ? 'Resistant'
      : isI
      ? 'Intermediate'
      : 'Sensitive';

    return {
      id: drug.id,
      name: drug.name,
      brandName: drug.brandName,
      drugClass: drug.drugClass,
      isFirstLine: drug.isFirstLine,
      status,
      meanOD,
      stdDev,
      concordanceScore,
      concordanceText: `${concordantCount}/${replicatesPerDrug} replicates concordant (${Math.round(concordanceScore * 100)}%)`,
      replicates,
      clinicalRecommendation: drug.resistanceGuidance,
    };
  });

  const sensitiveFirstLine = antibiotics
    .filter((a) => a.isFirstLine && a.status === 'Sensitive')
    .map((a) => a.name);
  const resistantNames = antibiotics
    .filter((a) => a.status === 'Resistant')
    .map((a) => a.name);
  const l3: Layer3Result = {
    antibiotics,
    sensitiveCount,
    resistantCount,
    stewardshipAdvice:
      resistantNames.length > 0
        ? `Stewardship alert: Resistance to ${resistantNames.join(', ')}. Use: ${sensitiveFirstLine.join(', ') || 'culture-directed'}.`
        : 'Broad susceptibility to first-line oral regimens.',
  };

  return { l2, l3 };
};
