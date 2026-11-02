export interface CartridgeConfig {
  version: string;
  name: string;
  lastUpdated: string;
  qualityThresholds: {
    minBrightness: number;     // below is too dark (0-255 scale, e.g. 45)
    maxBrightness: number;     // above is overexposed/glare (e.g. 230)
    minContrastRatio: number;  // min standard deviation of luminance (e.g. 18)
    minSharpnessVariance: number; // Laplacian variance (e.g. 35)
  };
  layer1: {
    name: string;
    description: string;
    targetSubstrate: string; // Indoxyl esterase / diazonium purple
    thresholds: {
      negativeMaxOD: number; // < 0.12 -> Negative
      lowMaxOD: number;      // 0.12 - 0.28 -> Low pyuria
      moderateMaxOD: number; // 0.28 - 0.55 -> Moderate pyuria
      // > 0.55 -> High pyuria
    };
    wbcEstimates: {
      negative: string;
      low: string;
      moderate: string;
      high: string;
    };
  };
  layer2: {
    name: string;
    panelType: string; // 4-Plex Aptamer/DNAzyme Colorimetric
    targets: Array<{
      id: string;
      name: string;
      scientificName: string;
      gram: 'Gram-negative' | 'Gram-positive';
      thresholdOD: number; // OD change above which pathogen is declared Detected
      typicalCharacteristics: string;
      wellLabel: string;
      govtData?: {
        icmrPrevalence: string;
        amrGeneMarkers: string;
        ncdcSurveillanceAlert: string;
        mohfwRecommendedDrug: string;
      };
    }>;
  };
  layer3: {
    name: string;
    assayType: string; // Colorimetric viability indicator (Resazurin / Tetrazolium)
    replicatesPerDrug: number; // 4x replicates per PRD FR22
    minConcordanceRatio: number; // 0.75 means 3 of 4 replicates must agree
    antibiotics: Array<{
      id: string;
      name: string;
      brandName: string;
      drugClass: string;
      isFirstLine: boolean;
      susceptibleMaxOD: number; // Viability inhibition cutoff (low bacterial growth/metabolism)
      resistanceGuidance: string;
    }>;
  };
}

export const defaultCartridgeConfig: CartridgeConfig = {
  version: "1.1.0-BLE",
  name: "Genex 3-Layer Microfluidic Cartridge Configuration",
  lastUpdated: "2026-09-08",
  qualityThresholds: {
    minBrightness: 40,
    maxBrightness: 235,
    minContrastRatio: 18,
    minSharpnessVariance: 25,
  },
  layer1: {
    name: "Pus-Cell / Pyuria Detection",
    description: "Leukocyte esterase enzymatic release reacting with diazonium salt to produce violet-purple chromophore",
    targetSubstrate: "Indoxyl Esterase + Diazonium",
    thresholds: {
      negativeMaxOD: 0.10,
      lowMaxOD: 0.20,
      moderateMaxOD: 0.40,
    },
    wbcEstimates: {
      negative: "<10 WBC/µL (Normal physiological range)",
      low: "10-50 WBC/µL (Mild inflammation / early stage)",
      moderate: "50-250 WBC/µL (Moderate pyuria / active cystitis)",
      high: ">250 WBC/µL (Acute pyuria / heavy bacterial infection)",
    },
  },
  layer2: {
    name: "4-Plex Pathogen Aptamer Panel",
    panelType: "Specific DNA Aptamer-Enzyme Conjugate Array",
    targets: [
      {
        id: "ecoli",
        name: "E. coli",
        scientificName: "Escherichia coli",
        gram: "Gram-negative",
        thresholdOD: 0.22,
        typicalCharacteristics: "Accounts for ~80% of uncomplicated community-acquired UTIs",
        wellLabel: "A1",
        govtData: {
          icmrPrevalence: "68.4% (Rank #1 uropathogen in ICMR AMRSN India network)",
          amrGeneMarkers: "CTX-M-15 (ESBL ~74%), NDM-1 (Carbapenemase ~18%)",
          ncdcSurveillanceAlert: "High resistance (>70%) to Ciprofloxacin & Ampicillin",
          mohfwRecommendedDrug: "Nitrofurantoin (84% susceptible) or Fosfomycin (91% susceptible)",
        },
      },
      {
        id: "klebsiella",
        name: "K. pneumoniae",
        scientificName: "Klebsiella pneumoniae",
        gram: "Gram-negative",
        thresholdOD: 0.20,
        typicalCharacteristics: "Associated with recurrent or catheter-associated UTIs, frequent ESBL producer",
        wellLabel: "A2",
        govtData: {
          icmrPrevalence: "18.2% (Rank #2 uropathogen in Indian hospital wards & ICUs)",
          amrGeneMarkers: "OXA-48-like (OXA-181 ~34%), NDM-5 (Carbapenemase ~28%)",
          ncdcSurveillanceAlert: "Significant resistance to 3rd-Gen Cephalosporins & Fluoroquinolones",
          mohfwRecommendedDrug: "AST-directed therapy; reserve Carbapenems",
        },
      },
      {
        id: "proteus",
        name: "P. mirabilis",
        scientificName: "Proteus mirabilis",
        gram: "Gram-negative",
        thresholdOD: 0.20,
        typicalCharacteristics: "Urease producer, raises urinary pH and predisposes to struvite calculi",
        wellLabel: "A3",
        govtData: {
          icmrPrevalence: "5.1% (Implicated in renal calculi & obstructive UTIs)",
          amrGeneMarkers: "Plasmid AmpC beta-lactamases & qnrS genes",
          ncdcSurveillanceAlert: "Causes urinary pH elevation (>7.5) via urease enzyme",
          mohfwRecommendedDrug: "Ciprofloxacin or Ceftriaxone (naturally resistant to Nitrofurantoin)",
        },
      },
      {
        id: "pseudomonas",
        name: "P. aeruginosa",
        scientificName: "Pseudomonas aeruginosa",
        gram: "Gram-negative",
        thresholdOD: 0.21,
        typicalCharacteristics: "Non-fermenting Gram-negative bacillus; implicated in complicated and catheter-associated UTIs; intrinsic resistance to many antibiotics",
        wellLabel: "A4",
        govtData: {
          icmrPrevalence: "4.2% (Major pathogen in catheterized ICU patients - CAUTI)",
          amrGeneMarkers: "VIM-2, IMP-1 metallo-beta-lactamases & MexAB efflux",
          ncdcSurveillanceAlert: "Intrinsic resistance to Ampicillin, Cotrimoxazole & Cefotaxime",
          mohfwRecommendedDrug: "Targeted anti-pseudomonal agent (Amikacin / Ceftazidime-Avibactam)",
        },
      },
    ],
  },
  layer3: {
    name: "Antibiotic Susceptibility Testing (AST)",
    assayType: "Metabolic Viability Micro-Well Array (4× Replicates)",
    replicatesPerDrug: 4,
    minConcordanceRatio: 0.75, // 3 of 4 required for high confidence
    antibiotics: [
      {
        id: "ampicillin",
        name: "Ampicillin",
        brandName: "Principen",
        drugClass: "Aminopenicillin",
        isFirstLine: false,
        susceptibleMaxOD: 0.27,
        resistanceGuidance: "Broad-spectrum aminopenicillin. High resistance rates in E. coli limit empirical use.",
      },
      {
        id: "ciprofloxacin",
        name: "Ciprofloxacin",
        brandName: "Cipro",
        drugClass: "Fluoroquinolone",
        isFirstLine: false,
        susceptibleMaxOD: 0.24,
        resistanceGuidance: "Reserve for complicated UTI, acute pyelonephritis, or proven multi-drug resistance to curb fluoroquinolone resistance.",
      },
      {
        id: "nitrofurantoin",
        name: "Nitrofurantoin",
        brandName: "Macrobid",
        drugClass: "Nitrofuran",
        isFirstLine: true,
        susceptibleMaxOD: 0.26,
        resistanceGuidance: "Standard first-line empirical agent for uncomplicated lower UTI. High urinary concentration with minimal collateral systemic resistance.",
      },
      {
        id: "cotrimoxazole",
        name: "Cotrimoxazole",
        brandName: "Bactrim / Septra",
        drugClass: "Folate Synthesis Inhibitor",
        isFirstLine: true,
        susceptibleMaxOD: 0.28,
        resistanceGuidance: "Trimethoprim/Sulfamethoxazole combination. Excellent tissue penetration. Prescribe if local resistance is <20%.",
      },
      {
        id: "fosfomycin",
        name: "Fosfomycin",
        brandName: "Monurol",
        drugClass: "Phosphonic Acid Derivative",
        isFirstLine: true,
        susceptibleMaxOD: 0.25,
        resistanceGuidance: "Single-dose 3g regimen. Effective against common ESBL-producing uropathogens.",
      },
      {
        id: "ceftriaxone",
        name: "Ceftriaxone",
        brandName: "Rocephin",
        drugClass: "3rd-Gen Cephalosporin",
        isFirstLine: false,
        susceptibleMaxOD: 0.25,
        resistanceGuidance: "Parenteral 3rd-generation cephalosporin. Reserve for pyelonephritis, complicated inpatient UTI, or multidrug resistance.",
      },
    ],
  },
};
