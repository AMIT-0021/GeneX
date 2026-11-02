export type InfectionLevel = 'Negative' | 'Low' | 'Moderate' | 'High';

export type SusceptibilityStatus = 'Sensitive' | 'Resistant' | 'Intermediate';

export type ScanStage =
  | 'calibration'
  | 'layer1'
  | 'layer2'
  | 'layer3'
  | 'full'
  | 'patient_dashboard'
  | 'regional_trends';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface CIELabColor {
  L: number;
  a: number;
  b: number;
}

export interface CalibrationData {
  isCalibrated: boolean;
  calibratedAt: string;
  blankRgb: RGBColor;
  ambientLuminance: number;
  deviceId: string;
}

export interface Layer1Result {
  infectionLevel: InfectionLevel;
  opticalDensity: number;
  deltaE: number;
  pyuriaWbcEstimate: string;
  sampleRgb: RGBColor;
  confidence: number;
  clinicalNote: string;
}

export interface GovtSurveillanceInfo {
  icmrPrevalence: string;
  amrGeneMarkers: string;
  ncdcSurveillanceAlert: string;
  mohfwRecommendedDrug: string;
}

export interface PathogenResult {
  id: string;
  name: string;
  scientificName: string;
  detected: boolean;
  opticalDensity: number;
  deltaE: number;
  thresholdOD: number;
  confidence: number;
  gram: 'Gram-negative' | 'Gram-positive';
  typicalCharacteristics: string;
  sampleRgb: RGBColor;
  govtData?: GovtSurveillanceInfo;
}

export interface Layer2Result {
  pathogens: PathogenResult[];
  primaryPathogen: string | null;
  coinfectionDetected: boolean;
  summary: string;
}

export interface ASTReplicate {
  replicateIndex: number;
  opticalDensity: number;
  deltaE: number;
  isSensitive: boolean;
  sampleRgb: RGBColor;
}

export interface AntibioticResult {
  id: string;
  name: string;
  brandName: string;
  drugClass: string;
  isFirstLine: boolean;
  status: SusceptibilityStatus;
  meanOD: number;
  stdDev: number;
  concordanceScore: number; // e.g. 1.0 = 4/4, 0.75 = 3/4
  concordanceText: string;
  replicates: ASTReplicate[];
  clinicalRecommendation: string;
}

export interface Layer3Result {
  antibiotics: AntibioticResult[];
  sensitiveCount: number;
  resistantCount: number;
  stewardshipAdvice: string;
}

export interface FrameQualityCheck {
  passed: boolean;
  brightnessScore: number; // 0-100
  contrastScore: number;   // 0-100
  sharpnessScore: number;  // Laplacian variance
  warnings: string[];
}

export interface PatientClinicalInfo {
  patientName: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  mrn: string;
  specimenId: string;
  orderingPhysician: string;
  facility: string;
  chiefComplaint: string;
  collectionMethod: string;
}

export interface MedicalRecordEntry {
  id: string;
  dateAdded: string;
  description: string;
  isHighRiskCondition: boolean;
  notes?: string;
}

export interface PatientProfile {
  id: string;
  patientName: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  dob: string;
  phone: string;
  email: string;
  mrn: string;
  allergies: string[];
  medicalRecords: MedicalRecordEntry[];
}

export type RecurrenceFlagType = 'recurrent_uti' | 'repeat_organism' | 'resistance_change';

export interface RecurrenceFlag {
  flagType: RecurrenceFlagType;
  windowMonths: number;
  occurrences: number;
  pathogen?: string;
  pathogenName?: string;
  drugName?: string;
  detail: string;
  severity: 'warning' | 'critical';
}

export interface AnonymizedAmrSubmission {
  id: string;
  pathogen: string; // e.g. 'ecoli'
  pathogenName: string; // e.g. 'E. coli'
  resistance: Record<string, SusceptibilityStatus>; // e.g. { "Ciprofloxacin": "Resistant", "Nitrofurantoin": "Sensitive" }
  region: string; // district/city level e.g. "Delhi NCR", "PGIMER Chandigarh (Punjab)", etc.
  timestamp: string; // ISO8601
}

export interface ScanSession {
  id: string;
  timestamp: string;
  batchId: string;
  persona: 'patient' | 'clinician';
  calibration: CalibrationData;
  layer1: Layer1Result;
  layer2: Layer2Result;
  layer3: Layer3Result;
  quality: FrameQualityCheck;
  patientInfo?: PatientClinicalInfo;
  recurrenceFlags?: RecurrenceFlag[];
  overallSummary: {
    title: string;
    clinicalImpression: string;
    patientGuidance: string;
    urgencyLevel: 'routine' | 'moderate' | 'urgent';
    suggestedFirstLine: string[];
    resistantDrugs: string[];
  };
  capturedThumbnails: {
    layer1?: string;
    layer2?: string;
    layer3?: string;
    full?: string;
  };
}
