import {
  RGBColor,
  CalibrationData,
  Layer1Result,
  Layer2Result,
  Layer3Result,
  ScanSession,
  FrameQualityCheck,
  InfectionLevel,
  SusceptibilityStatus,
  PathogenResult,
  AntibioticResult,
  ASTReplicate
} from '../types/diagnostic';
import { defaultCartridgeConfig } from '../config/cartridgeConfig';
import { calculateOpticalDensity, calculateDeltaE } from '../cv/colorimetry';

export class DiagnosticEngine {
  /**
   * Analyzes Layer 1: Pus-Cell / Pyuria
   */
  public static analyzeLayer1(
    sampleRgb: RGBColor,
    blankRgb: RGBColor
  ): Layer1Result {
    const cfg = defaultCartridgeConfig.layer1;
    const od = calculateOpticalDensity(sampleRgb, blankRgb);
    const deltaE = calculateDeltaE(sampleRgb, blankRgb);

    let infectionLevel: InfectionLevel = 'Negative';
    let pyuriaWbcEstimate = cfg.wbcEstimates.negative;
    let confidence = 95;
    let clinicalNote = "No significant pyuria detected. Urinalysis within physiological limits.";

    if (od > cfg.thresholds.moderateMaxOD) {
      infectionLevel = 'High';
      pyuriaWbcEstimate = cfg.wbcEstimates.high;
      confidence = Math.min(99, 85 + (od - cfg.thresholds.moderateMaxOD) * 25);
      clinicalNote = "Heavy leukocyte esterase activity indicating dense pyuria. Strong indicator of acute bacterial cystitis or upper tract involvement.";
    } else if (od > cfg.thresholds.lowMaxOD) {
      infectionLevel = 'Moderate';
      pyuriaWbcEstimate = cfg.wbcEstimates.moderate;
      confidence = 90;
      clinicalNote = "Moderate leukocyte esterase signal present. Consistent with active lower urinary tract infection.";
    } else if (od > cfg.thresholds.negativeMaxOD) {
      infectionLevel = 'Low';
      pyuriaWbcEstimate = cfg.wbcEstimates.low;
      confidence = 86;
      clinicalNote = "Trace to low leukocyte activity. May indicate early-stage infection, resolving episode, or sample contamination.";
    }

    return {
      infectionLevel,
      opticalDensity: od,
      deltaE: parseFloat(deltaE.toFixed(2)),
      pyuriaWbcEstimate,
      sampleRgb,
      confidence: parseFloat(confidence.toFixed(1)),
      clinicalNote,
    };
  }

  /**
   * @deprecated Superseded by BLE hardware reader data (bleParser.parseLayer2).
   * This method performs colorimetric aptamer analysis on camera-captured images.
   * It is retained for use by the Test Bench Simulator (VirtualCartridgeModal)
   * which synthesizes colors directly. It is NO LONGER called in the live
   * camera capture flow — Layer 2 results are now received via BLE and parsed
   * by bleParser.ts. Do not call this method from App.tsx.
   *
   * TODO(cleanup): Remove after hardware BLE integration is fully validated in production.
   */
  public static analyzeLayer2(
    sampleColors: Record<string, RGBColor>,
    blankRgb: RGBColor
  ): Layer2Result {
    const cfg = defaultCartridgeConfig.layer2;
    const pathogens: PathogenResult[] = [];

    for (const target of cfg.targets) {
      const rgb = sampleColors[target.id] || { r: 240, g: 240, b: 240 };
      const od = calculateOpticalDensity(rgb, blankRgb);
      const deltaE = calculateDeltaE(rgb, blankRgb);

      const detected = od >= target.thresholdOD;
      const confidence = detected
        ? Math.min(99, Math.round(82 + (od / target.thresholdOD) * 12))
        : Math.min(98, Math.round(85 + (1 - od / target.thresholdOD) * 12));

      pathogens.push({
        id: target.id,
        name: target.name,
        scientificName: target.scientificName,
        detected,
        opticalDensity: od,
        deltaE: parseFloat(deltaE.toFixed(2)),
        thresholdOD: target.thresholdOD,
        confidence,
        gram: target.gram,
        typicalCharacteristics: target.typicalCharacteristics,
        sampleRgb: rgb,
        govtData: target.govtData,
      });
    }

    const detectedPathogens = pathogens.filter(p => p.detected);
    const primaryPathogen = detectedPathogens.length > 0 ? detectedPathogens[0].name : null;
    const coinfectionDetected = detectedPathogens.length > 1;

    let summary = "No uropathogens detected above aptamer binding thresholds.";
    if (coinfectionDetected) {
      summary = `Polymicrobial profile detected: ${detectedPathogens.map(p => p.name).join(', ')}.`;
    } else if (detectedPathogens.length === 1) {
      summary = `Positive identification for ${detectedPathogens[0].scientificName} (${detectedPathogens[0].gram}).`;
    }

    return {
      pathogens,
      primaryPathogen,
      coinfectionDetected,
      summary,
    };
  }

  /**
   * @deprecated Superseded by BLE hardware reader data (bleParser.parseLayer3).
   * This method performs colorimetric viability assay analysis on camera images.
   * It is retained for use by the Test Bench Simulator (VirtualCartridgeModal)
   * which synthesizes colors directly. It is NO LONGER called in the live
   * camera capture flow — Layer 3 results are now received via BLE and parsed
   * by bleParser.ts. Do not call this method from App.tsx.
   *
   * TODO(cleanup): Remove after hardware BLE integration is fully validated in production.
   */
  public static analyzeLayer3(
    sampleColors: Record<string, RGBColor>,
    blankRgb: RGBColor
  ): Layer3Result {
    const cfg = defaultCartridgeConfig.layer3;
    const antibiotics: AntibioticResult[] = [];
    let sensitiveCount = 0;
    let resistantCount = 0;

    for (const drug of cfg.antibiotics) {
      const replicates: ASTReplicate[] = [];
      let sumOD = 0;

      for (let rep = 1; rep <= cfg.replicatesPerDrug; rep++) {
        const wellId = `${drug.id}_rep_${rep}`;
        const rgb = sampleColors[wellId] || { r: 240, g: 240, b: 240 };
        const od = calculateOpticalDensity(rgb, blankRgb);
        const deltaE = calculateDeltaE(rgb, blankRgb);

        // In viability assays, higher OD indicates bacterial survival/growth (Resistant)
        // Lower OD indicates metabolic inhibition / kill (Sensitive)
        const isSensitive = od <= drug.susceptibleMaxOD;

        replicates.push({
          replicateIndex: rep,
          opticalDensity: od,
          deltaE: parseFloat(deltaE.toFixed(2)),
          isSensitive,
          sampleRgb: rgb,
        });

        sumOD += od;
      }

      const meanOD = parseFloat((sumOD / replicates.length).toFixed(3));
      
      // Calculate variance and stdDev across the 4 replicates
      let varSum = 0;
      for (const rep of replicates) {
        varSum += Math.pow(rep.opticalDensity - meanOD, 2);
      }
      const stdDev = parseFloat(Math.sqrt(varSum / replicates.length).toFixed(3));

      // Replicate concordance
      const sensitiveReplicates = replicates.filter(r => r.isSensitive).length;
      const concordanceScore = Math.max(sensitiveReplicates, 4 - sensitiveReplicates) / 4;
      const concordanceText = `${Math.max(sensitiveReplicates, 4 - sensitiveReplicates)}/4 replicates concordant (${Math.round(concordanceScore * 100)}%)`;

      let status: SusceptibilityStatus = 'Sensitive';
      if (sensitiveReplicates === 4) {
        status = 'Sensitive';
        sensitiveCount++;
      } else if (sensitiveReplicates === 3) {
        status = meanOD <= drug.susceptibleMaxOD ? 'Sensitive' : 'Intermediate';
        if (status === 'Sensitive') sensitiveCount++;
      } else if (sensitiveReplicates === 0) {
        status = 'Resistant';
        resistantCount++;
      } else if (sensitiveReplicates === 1) {
        status = 'Resistant';
        resistantCount++;
      } else {
        // 2 sensitive, 2 resistant (discordant)
        status = 'Intermediate';
      }

      antibiotics.push({
        id: drug.id,
        name: drug.name,
        brandName: drug.brandName,
        drugClass: drug.drugClass,
        isFirstLine: drug.isFirstLine,
        status,
        meanOD,
        stdDev,
        concordanceScore,
        concordanceText,
        replicates,
        clinicalRecommendation: drug.resistanceGuidance,
      });
    }

    const sensitiveFirstLineDrugs = antibiotics
      .filter(a => a.isFirstLine && a.status === 'Sensitive')
      .map(a => a.name);
    const resistantDrugNames = antibiotics
      .filter(a => a.status === 'Resistant')
      .map(a => a.name);

    let stewardshipAdvice = "Panel demonstrates broad susceptibility to standard first-line oral regimens.";
    if (resistantDrugNames.length > 0) {
      stewardshipAdvice = `Antimicrobial stewardship alert: Resistance to ${resistantDrugNames.join(', ')} detected. Target therapy strictly to sensitive first-line agents (${sensitiveFirstLineDrugs.join(', ') || 'consult culture sensitivities'}). Avoid empirical broad-spectrum quinolones.`;
    }

    return {
      antibiotics,
      sensitiveCount,
      resistantCount,
      stewardshipAdvice,
    };
  }

  /**
   * Synthesizes full session results into a structured clinical report
   */
  public static compileSession(
    batchId: string,
    persona: 'patient' | 'clinician',
    calibration: CalibrationData,
    layer1: Layer1Result,
    layer2: Layer2Result,
    layer3: Layer3Result,
    quality: FrameQualityCheck,
    thumbnails: { layer1?: string; layer2?: string; layer3?: string; full?: string },
    recurrenceFlags?: import('../types/diagnostic').RecurrenceFlag[]
  ): ScanSession {
    const hasDetectedPathogen = layer2.pathogens.some(p => p.detected);
    const isNegative = layer1.infectionLevel === 'Negative' && !hasDetectedPathogen;
    const primaryPathogen = layer2.primaryPathogen;

    let sensitiveFirstLine = layer3.antibiotics
      .filter(a => a.isFirstLine && a.status === 'Sensitive')
      .map(a => a.name);

    let resistantDrugs = layer3.antibiotics
      .filter(a => a.status === 'Resistant')
      .map(a => a.name);

    let title = "Presumptive Urinary Tract Infection";
    let clinicalImpression = "";
    let patientGuidance = "";
    let urgencyLevel: 'routine' | 'moderate' | 'urgent' = 'moderate';
    let layer3Output = { ...layer3 };

    if (isNegative) {
      // 1. Completely Negative Urinalysis & Pathogen Screen (Healthy Control)
      title = "No UTI Detected (Within Normal Limits)";
      urgencyLevel = 'routine';
      clinicalImpression = `Cartridge layers demonstrate physiological baseline: absence of significant pyuria (${layer1.pyuriaWbcEstimate}) and negative pathogen aptamer reaction. Antibiotic susceptibility testing is not applicable in the absence of infection.`;
      patientGuidance = "Your test shows no signs of an active urinary tract infection. No antibiotic treatment is indicated. If symptoms persist (such as pain, burning, or fever), please consult your healthcare provider.";
      sensitiveFirstLine = [];
      resistantDrugs = [];
      layer3Output.stewardshipAdvice = "No evidence of urinary tract infection. In accordance with antimicrobial stewardship guidelines, antibiotic therapy is withheld.";
    } else if (layer1.infectionLevel === 'Negative' && hasDetectedPathogen) {
      // 2. Pathogen detected without significant inflammation (Asymptomatic Bacteriuria / Colonization)
      title = `Asymptomatic Bacteriuria — ${primaryPathogen || 'Target Organism'}`;
      urgencyLevel = 'routine';
      clinicalImpression = `Pathogen detected (${primaryPathogen || 'isolate'}) in the absence of significant pyuria (${layer1.pyuriaWbcEstimate}). This pattern is consistent with asymptomatic bacteriuria or epithelial colonization. Routine antimicrobial therapy is generally withheld per stewardship guidelines unless indicated by high-risk conditions (e.g. pregnancy).`;
      patientGuidance = `Bacteria were identified (${primaryPathogen || 'isolate'}), but there are no signs of active bladder inflammation or pus cells. Antibiotics are generally not recommended for asymptomatic cases unless directed by your physician.`;
      if (resistantDrugs.length > 0) {
        layer3Output.stewardshipAdvice = `Antimicrobial stewardship alert: Asymptomatic bacteriuria profile. If treatment is indicated by pregnancy or pre-procedural risk, target therapy to sensitive agents (${sensitiveFirstLine.join(', ') || 'culture-directed'}).`;
      } else {
        layer3Output.stewardshipAdvice = "Asymptomatic bacteriuria profile: Routine antimicrobial therapy is not recommended per IDSA stewardship guidelines.";
      }
    } else if (layer1.infectionLevel !== 'Negative' && !hasDetectedPathogen) {
      // 3. Pyuria present without 4-plex panel pathogen (Sterile / Non-Panel Pyuria)
      const severityWord = layer1.infectionLevel === 'High' ? 'Acute' : layer1.infectionLevel === 'Moderate' ? 'Moderate' : 'Mild';
      title = `${severityWord} Pyuria — Non-Panel Etiology`;
      urgencyLevel = layer1.infectionLevel === 'High' ? 'urgent' : 'moderate';
      clinicalImpression = `Inflammatory leukocyte response present (${layer1.pyuriaWbcEstimate}) without detection of the 4 primary panel uropathogens. Suggests infection by a non-panel organism (e.g. S. saprophyticus, Pseudomonas) or sterile inflammatory etiology. Confirmatory laboratory urine culture is advised prior to targeted therapy.`;
      patientGuidance = "Your test shows elevated white blood cells indicating urinary inflammation, but the 4 standard bacteria were not detected. A doctor can review your symptoms and order a laboratory urine culture to identify the exact cause.";
      sensitiveFirstLine = [];
      resistantDrugs = [];
      layer3Output.stewardshipAdvice = "Non-panel pyuria: Causative pathogen unconfirmed. Antibiotic selection should be guided by formal laboratory culture and microscopy.";
    } else if (layer1.infectionLevel === 'High') {
      // 4. Acute UTI (High pyuria + pathogen detected)
      title = `Acute UTI — ${primaryPathogen || 'Bacterial Infection'}`;
      urgencyLevel = 'urgent';
      clinicalImpression = `Significant acute inflammatory response (${layer1.pyuriaWbcEstimate}) with ${layer2.summary}. Prompt targeted oral therapy indicated based on susceptibility matrix.`;
      patientGuidance = `Your cartridge indicates an acute bacterial infection with ${primaryPathogen || 'bacteria'}. Consult a healthcare professional promptly for targeted prescription treatment.`;
      if (resistantDrugs.length > 0) {
        layer3Output.stewardshipAdvice = `Antimicrobial stewardship alert: Resistance to ${resistantDrugs.join(', ')} detected. Prescribe sensitive first-line options (${sensitiveFirstLine.join(', ')}). Avoid resistant quinolones.`;
      }
    } else if (layer1.infectionLevel === 'Moderate') {
      // 5. Moderate UTI (Moderate pyuria + pathogen detected)
      title = `Moderate UTI — ${primaryPathogen || 'Bacterial Infection'}`;
      urgencyLevel = 'moderate';
      clinicalImpression = `Active pyuria (${layer1.pyuriaWbcEstimate}) with ${layer2.summary}. Targeted therapy indicated based on susceptibility matrix.`;
      patientGuidance = `Your cartridge shows evidence of a moderate urinary tract infection with ${primaryPathogen || 'bacteria'}. A healthcare provider can review these results to prescribe a sensitive antibiotic.`;
      if (resistantDrugs.length > 0) {
        layer3Output.stewardshipAdvice = `Antimicrobial stewardship alert: Resistance to ${resistantDrugs.join(', ')} detected. Target therapy to sensitive first-line agents (${sensitiveFirstLine.join(', ')}).`;
      }
    } else {
      // 6. Mild / Early-Stage UTI (Low pyuria + pathogen detected)
      title = `Mild / Early-Stage UTI — ${primaryPathogen || 'Bacterial Infection'}`;
      urgencyLevel = 'moderate';
      clinicalImpression = `Low-grade pyuria (${layer1.pyuriaWbcEstimate}) with ${layer2.summary}. Consistent with early-stage or resolving urinary tract infection.`;
      patientGuidance = `Your cartridge shows mild signs of early urinary infection with ${primaryPathogen || 'bacteria'}. A doctor can evaluate your symptoms and recommend appropriate management.`;
      if (resistantDrugs.length > 0) {
        layer3Output.stewardshipAdvice = `Antimicrobial stewardship alert: Resistance to ${resistantDrugs.join(', ')} detected. If treatment is indicated, use sensitive first-line regimens (${sensitiveFirstLine.join(', ')}).`;
      }
    }

    // High-Risk Recurrence Intelligence Integration
    if (recurrenceFlags && recurrenceFlags.length > 0) {
      const recSummary = recurrenceFlags.map((f) => f.detail).join(' ');
      clinicalImpression += ` [HIGH-RISK RECURRENCE PATTERN: ${recSummary} Worth discussing antimicrobial prophylaxis or urological evaluation with a clinician.]`;
      patientGuidance += ` Note: Your health history shows a pattern of recurring urinary infections. It is worth discussing these repeat episodes with a clinician for long-term management.`;
      if (urgencyLevel === 'moderate') {
        urgencyLevel = 'urgent';
      }
    }

    return {
      id: 'scan_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      batchId: batchId || "GENEX-B26-09",
      persona,
      calibration,
      layer1,
      layer2,
      layer3: layer3Output,
      quality,
      recurrenceFlags,
      overallSummary: {
        title,
        clinicalImpression,
        patientGuidance,
        urgencyLevel,
        suggestedFirstLine: sensitiveFirstLine,
        resistantDrugs,
      },
      capturedThumbnails: thumbnails,
    };
  }
}
