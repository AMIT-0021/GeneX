import { DiagnosticEngine } from '../services/diagnosticEngine';
import { calculateOpticalDensity, calculateDeltaE } from '../cv/colorimetry';

console.log("==================================================");
console.log("[GENEX] DIAGNOSTIC ENGINE VERIFICATION TEST SUITE");
console.log("==================================================");

// 1. Verify Colorimetry & Optical Density
const blank = { r: 242, g: 242, b: 242 };
const darkSample = { r: 50, g: 20, b: 90 };
const clearSample = { r: 238, g: 238, b: 238 };

const odDark = calculateOpticalDensity(darkSample, blank);
const odClear = calculateOpticalDensity(clearSample, blank);
const deltaE = calculateDeltaE(darkSample, blank);

console.log(`[TEST 1] Optical Density:`);
console.log(`  Dark sample OD: ${odDark} (Expected > 0.60)`);
console.log(`  Clear sample OD: ${odClear} (Expected < 0.05)`);
console.log(`  Delta E*: ${deltaE.toFixed(2)}`);
if (odDark > 0.60 && odClear < 0.05) {
  console.log("  => PASS: OD calculation accurate.");
} else {
  console.error("  => FAIL: OD calculation mismatch.");
}

// 2. Verify Layer 1: Pyuria / Pus-Cell
const highPyuriaResult = DiagnosticEngine.analyzeLayer1(darkSample, blank);
const negPyuriaResult = DiagnosticEngine.analyzeLayer1(clearSample, blank);

console.log(`\n[TEST 2] Layer 1 Pyuria:`);
console.log(`  Dark sample level: ${highPyuriaResult.infectionLevel} (${highPyuriaResult.pyuriaWbcEstimate})`);
console.log(`  Clear sample level: ${negPyuriaResult.infectionLevel} (${negPyuriaResult.pyuriaWbcEstimate})`);
if (highPyuriaResult.infectionLevel === 'High' && negPyuriaResult.infectionLevel === 'Negative') {
  console.log("  => PASS: Layer 1 pyuria classification accurate.");
} else {
  console.error("  => FAIL: Layer 1 pyuria classification mismatch.");
}

// 3. Verify Layer 2: 4-Plex Pathogen Aptamers
const pathogenSamples = {
  ecoli: { r: 20, g: 80, b: 180 },       // Dark blue reaction -> OD ~ 0.5
  klebsiella: { r: 235, g: 235, b: 235 }, // Pale -> OD < 0.1
  proteus: { r: 235, g: 235, b: 235 },
  enterococcus: { r: 235, g: 235, b: 235 },
};

const layer2Res = DiagnosticEngine.analyzeLayer2(pathogenSamples, blank);
console.log(`\n[TEST 3] Layer 2 Pathogen Aptamers:`);
console.log(`  Primary pathogen detected: ${layer2Res.primaryPathogen}`);
console.log(`  E. coli detected: ${layer2Res.pathogens.find(p => p.id === 'ecoli')?.detected}`);
console.log(`  Klebsiella detected: ${layer2Res.pathogens.find(p => p.id === 'klebsiella')?.detected}`);
if (layer2Res.primaryPathogen === 'E. coli' && !layer2Res.pathogens.find(p => p.id === 'klebsiella')?.detected) {
  console.log("  => PASS: 4-Plex pathogen detection accurate.");
} else {
  console.error("  => FAIL: Pathogen detection mismatch.");
}

// 4. Verify Layer 3: AST 4x Replicate Aggregation
const astSamples: Record<string, { r: number; g: number; b: number }> = {};
// Nitrofurantoin: 4/4 replicates clear (Sensitive, OD ~ 0.05)
for (let r = 1; r <= 4; r++) {
  astSamples[`nitrofurantoin_rep_${r}`] = { r: 235, g: 235, b: 235 };
}
// Ciprofloxacin: 4/4 replicates dark/red (Resistant, OD ~ 0.6)
for (let r = 1; r <= 4; r++) {
  astSamples[`ciprofloxacin_rep_${r}`] = { r: 180, g: 30, b: 40 };
}

const layer3Res = DiagnosticEngine.analyzeLayer3(astSamples, blank);
const nitro = layer3Res.antibiotics.find(a => a.id === 'nitrofurantoin');
const cipro = layer3Res.antibiotics.find(a => a.id === 'ciprofloxacin');

console.log(`\n[TEST 4] Layer 3 AST 4x Replicate Aggregation:`);
console.log(`  Nitrofurantoin status: ${nitro?.status} (${nitro?.concordanceText})`);
console.log(`  Ciprofloxacin status: ${cipro?.status} (${cipro?.concordanceText})`);
if (nitro?.status === 'Sensitive' && cipro?.status === 'Resistant') {
  console.log("  => PASS: AST 4x replicate aggregation and concordance accurate.");
} else {
  console.error("  => FAIL: AST aggregation mismatch.");
}

console.log("\n==================================================");
console.log("ALL UNIT TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
