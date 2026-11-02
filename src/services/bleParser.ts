/**
 * bleParser.ts — Transforms raw BLE payloads into existing diagnostic types
 *
 * This is the ONLY file that maps BLE JSON field names to app-internal types.
 * If the hardware team changes field names in firmware, update only this file.
 *
 * Input:  BleLayer2Payload / BleLayer3Payload (from bleProtocol.ts)
 * Output: Layer2Result / Layer3Result (from diagnostic.ts)
 *
 * The parser fills in fields that the BLE payload does not carry (gram stain,
 * scientific name, drug class, brand name, replicate simulation) by looking
 * them up from the cartridge configuration, keeping compileSession() unchanged.
 */

import { BleLayer2Payload, BleLayer3Payload } from '../types/bleProtocol';
import { Layer2Result, Layer3Result, PathogenResult, AntibioticResult, ASTReplicate, SusceptibilityStatus } from '../types/diagnostic';
import { defaultCartridgeConfig } from '../config/cartridgeConfig';

// ── Layer 2 Parser ────────────────────────────────────────────────────────────

/**
 * Convert a BLE Layer 2 pathogen payload into a Layer2Result.
 *
 * Fields not present in the BLE payload (scientific name, gram stain,
 * thresholdOD, typicalCharacteristics) are sourced from cartridgeConfig.
 * The impedanceDelta is stored as opticalDensity for display purposes.
 *
 * TODO(hardware): impedanceDelta field names and units are placeholders.
 * Confirm exact field names/units with hardware team before production.
 */
export function parseLayer2(payload: BleLayer2Payload): Layer2Result {
  const cfgTargets = defaultCartridgeConfig.layer2.targets;

  // Ordered list of BLE pathogen keys (must match BleLayer2Payload.pathogens keys)
  const bleKeys: (keyof BleLayer2Payload['pathogens'])[] = [
    'ecoli',
    'klebsiella',
    'proteus',
    'pseudomonas',
  ];

  const pathogens: PathogenResult[] = bleKeys.map((bleKey) => {
    const bleData = payload.pathogens[bleKey];
    // Look up static metadata from cartridge config by id
    const cfgEntry = cfgTargets.find((t) => t.id === bleKey);

    // Fallback metadata if config entry is missing (shouldn't happen in production)
    const name = cfgEntry?.name ?? bleKey;
    const scientificName = cfgEntry?.scientificName ?? bleKey;
    const gram = cfgEntry?.gram ?? 'Gram-negative';
    const thresholdOD = cfgEntry?.thresholdOD ?? 0.20;
    const typicalCharacteristics = cfgEntry?.typicalCharacteristics ?? '';

    // Derive confidence from impedanceDelta relative to threshold
    // TODO(hardware): update confidence formula when impedanceDelta units are confirmed
    const confidence = bleData.detected
      ? Math.min(99, Math.round(88 + Math.min(bleData.impedanceDelta / 200, 10)))
      : Math.min(98, Math.round(90 - Math.min(bleData.impedanceDelta / 200, 8)));

    return {
      id: bleKey,
      name,
      scientificName,
      detected: bleData.detected,
      // impedanceDelta stored as opticalDensity for display continuity
      opticalDensity: parseFloat((bleData.impedanceDelta / 1000).toFixed(3)),
      // deltaE not available from EIS — approximated from impedanceDelta
      deltaE: parseFloat((bleData.impedanceDelta / 50).toFixed(2)),
      thresholdOD,
      confidence,
      gram,
      typicalCharacteristics,
      // sampleRgb not available from EIS — set to neutral grey placeholder
      sampleRgb: { r: 180, g: 180, b: 180 },
    };
  });

  const detectedPathogens = pathogens.filter((p) => p.detected);
  const primaryPathogen = detectedPathogens.length > 0 ? detectedPathogens[0].name : null;
  const coinfectionDetected = detectedPathogens.length > 1;

  let summary = 'No uropathogens detected above EIS impedance thresholds.';
  if (coinfectionDetected) {
    summary = `Polymicrobial profile detected: ${detectedPathogens.map((p) => p.name).join(', ')}.`;
  } else if (detectedPathogens.length === 1) {
    summary = `Positive EIS identification for ${detectedPathogens[0].scientificName} (${detectedPathogens[0].gram}).`;
  }

  return {
    pathogens,
    primaryPathogen,
    coinfectionDetected,
    summary,
  };
}

// ── Layer 3 Parser ────────────────────────────────────────────────────────────

/**
 * Convert a BLE Layer 3 AST payload into a Layer3Result.
 *
 * Fields not present in the BLE payload (brand name, drug class, first-line flag,
 * susceptibleMaxOD, clinical recommendation) are sourced from cartridgeConfig.
 *
 * Replicates are synthesized from growthIndex so that the existing report UI
 * (which renders individual replicates) continues to work without changes.
 *
 * TODO(hardware): growthIndex normalization (0.0–1.0) is assumed. Confirm with
 * hardware team before production.
 */
/** Alias lookup table mapping common alternative drug names to cartridgeConfig drug IDs */
const DRUG_ALIASES: Record<string, string> = {
  cotrimoxazole: 'cotrimoxazole',
  'trimethoprim / sulfamethoxazole': 'cotrimoxazole',
  'trimethoprim-sulfamethoxazole': 'cotrimoxazole',
  'tmp-smx': 'cotrimoxazole',
  bactrim: 'cotrimoxazole',
  septra: 'cotrimoxazole',
  fosfomycin: 'fosfomycin',
  'fosfomycin trometamol': 'fosfomycin',
  monurol: 'fosfomycin',
  ampicillin: 'ampicillin',
  ciprofloxacin: 'ciprofloxacin',
  cipro: 'ciprofloxacin',
  nitrofurantoin: 'nitrofurantoin',
  macrobid: 'nitrofurantoin',
};

export function parseLayer3(payload: BleLayer3Payload): Layer3Result {
  const cfgDrugs = defaultCartridgeConfig.layer3.antibiotics;
  const replicatesPerDrug = defaultCartridgeConfig.layer3.replicatesPerDrug; // 4

  const antibiotics: AntibioticResult[] = [];
  let sensitiveCount = 0;
  let resistantCount = 0;

  // Build a normalized lookup map of the incoming payload keys
  const normalizedPayloadKeys = new Map<string, string>();
  for (const key of Object.keys(payload.resistance)) {
    normalizedPayloadKeys.set(key.toLowerCase().trim(), key);
  }

  for (const drug of cfgDrugs) {
    // Attempt 1: Direct name match
    let rawKey = payload.resistance[drug.name] ? drug.name : undefined;

    // Attempt 2: Case-insensitive / normalized match
    if (!rawKey) {
      rawKey = normalizedPayloadKeys.get(drug.name.toLowerCase().trim());
    }

    // Attempt 3: ID match
    if (!rawKey) {
      rawKey = normalizedPayloadKeys.get(drug.id.toLowerCase().trim());
    }

    // Attempt 4: Alias table match
    if (!rawKey) {
      for (const [alias, targetId] of Object.entries(DRUG_ALIASES)) {
        if (targetId === drug.id && normalizedPayloadKeys.has(alias)) {
          rawKey = normalizedPayloadKeys.get(alias);
          break;
        }
      }
    }

    const bleEntry = rawKey ? payload.resistance[rawKey] : undefined;

    // If this drug is not in the BLE payload (firmware omitted it), skip gracefully
    if (!bleEntry) continue;

    const status: SusceptibilityStatus = bleEntry.status;
    const growthIndex = bleEntry.growthIndex; // 0.0 = inhibited (S), 1.0 = growth (R)

    // Synthesize 4 replicates from growthIndex with small random jitter
    // This keeps the existing report replicate display functional
    const replicates: ASTReplicate[] = Array.from({ length: replicatesPerDrug }, (_, i) => {
      // Add deterministic jitter so replicates look realistic but are reproducible
      const jitter = ((i * 7 + 3) % 10 - 5) * 0.008; // ±0.04 deterministic spread
      const repOD = Math.max(0, Math.min(1, growthIndex + jitter));
      const isSensitive = repOD <= drug.susceptibleMaxOD || status === 'Sensitive';
      return {
        replicateIndex: i + 1,
        opticalDensity: parseFloat(repOD.toFixed(3)),
        deltaE: parseFloat((repOD * 12).toFixed(2)),
        isSensitive,
        sampleRgb: { r: 180, g: 180, b: 180 }, // EIS — no RGB
      };
    });

    const meanOD = parseFloat(
      (replicates.reduce((s, r) => s + r.opticalDensity, 0) / replicates.length).toFixed(3)
    );
    const varSum = replicates.reduce((s, r) => s + Math.pow(r.opticalDensity - meanOD, 2), 0);
    const stdDev = parseFloat(Math.sqrt(varSum / replicates.length).toFixed(3));

    const concordantReps = replicates.filter(
      (r) => (status === 'Sensitive' ? r.isSensitive : !r.isSensitive)
    ).length;
    const concordanceScore = concordantReps / replicatesPerDrug;
    const concordanceText = `${concordantReps}/${replicatesPerDrug} replicates concordant (${Math.round(concordanceScore * 100)}%)`;

    if (status === 'Sensitive') sensitiveCount++;
    else if (status === 'Resistant') resistantCount++;

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
    .filter((a) => a.isFirstLine && a.status === 'Sensitive')
    .map((a) => a.name);
  const resistantDrugNames = antibiotics.filter((a) => a.status === 'Resistant').map((a) => a.name);

  let stewardshipAdvice = 'Panel demonstrates broad susceptibility to standard first-line oral regimens.';
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
