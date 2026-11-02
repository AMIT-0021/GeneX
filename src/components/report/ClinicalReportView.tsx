import React, { useState } from 'react';
import { ScanSession, SusceptibilityStatus } from '../../types/diagnostic';
import { PdfExportService } from '../../services/pdfExportService';
import { StorageService } from '../../services/storageService';
import { AstKineticChart } from './AstKineticChart';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import {
  Share2,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Microscope,
  Pill,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Stethoscope,
  Info,
  Cpu,
  Calendar,
  Building2,
  ShieldCheck,
  Globe,
  Droplets,
  Clock,
  FileText,
  Sparkles,
  Printer,
  Check,
  MessageCircle,
} from 'lucide-react';

interface ClinicalReportViewProps {
  session: ScanSession;
  onNewScan: () => void;
  onNavigateToPatients?: () => void;
}

interface DrugMeta {
  geneMarker?: string;
  efficacy?: string;
  micValue: string;
  clsiBreakpoint: string;
  patientAdvice: string;
  dosage: string;
}

const DRUG_METADATA: Record<string, DrugMeta> = {
  ciprofloxacin: {
    geneMarker: 'gyrA',
    micValue: 'MIC ≥ 4.0 µg/mL',
    clsiBreakpoint: 'CLSI M100: S ≤ 1.0, R ≥ 4.0 µg/mL',
    patientAdvice: 'Do not use. Bacterial DNA gyrase mutation renders this antibiotic ineffective.',
    dosage: 'Contraindicated due to high-level gyrA resistance',
  },
  nitrofurantoin: {
    efficacy: '99% Efficacy',
    micValue: 'MIC ≤ 16.0 µg/mL',
    clsiBreakpoint: 'CLSI M100: S ≤ 32, R ≥ 128 µg/mL',
    patientAdvice: 'Take 1 capsule (100mg) twice daily with meals for 5 days. Complete the entire course.',
    dosage: '100 mg orally every 12 hours with meals for 5 days',
  },
  fosfomycin: {
    efficacy: '98% Efficacy',
    micValue: 'MIC ≤ 32.0 µg/mL',
    clsiBreakpoint: 'CLSI M100: S ≤ 64, R ≥ 256 µg/mL',
    patientAdvice: 'Dissolve single 3g sachet in 100ml water and drink on an empty stomach at bedtime.',
    dosage: '3 g single oral sachet dissolved in water once',
  },
  ceftriaxone: {
    geneMarker: 'blaCTX-M',
    micValue: 'MIC = 2.0 µg/mL',
    clsiBreakpoint: 'CLSI M100: S ≤ 1.0, I = 2.0, R ≥ 4.0 µg/mL',
    patientAdvice: 'Intermediate sensitivity. Reserved for hospital intravenous use if oral options fail.',
    dosage: '1 g to 2 g IV/IM once daily (inpatient reserved)',
  },
  ampicillin: {
    geneMarker: 'blaTEM-1',
    micValue: 'MIC ≥ 32.0 µg/mL',
    clsiBreakpoint: 'CLSI M100: S ≤ 8, R ≥ 32 µg/mL',
    patientAdvice: 'Ineffective due to bacterial penicillinase production.',
    dosage: 'Contraindicated (beta-lactamase positive)',
  },
  cotrimoxazole: {
    geneMarker: 'sul1/dfrA',
    micValue: 'MIC ≤ 2/38 µg/mL',
    clsiBreakpoint: 'CLSI M100: S ≤ 2/38, R ≥ 4/76 µg/mL',
    patientAdvice: 'Trimethoprim/Sulfamethoxazole oral tablet twice daily if sensitive.',
    dosage: '160/800 mg (double strength) orally twice daily for 3 days',
  },
};

export const ClinicalReportView: React.FC<ClinicalReportViewProps> = ({
  session,
  onNewScan,
}) => {
  // Dual-perspective mode: 'clinician' = Doctor PDF Sign-off; 'patient' = Patient Plain Summary
  const [viewMode, setViewMode] = useState<'clinician' | 'patient'>('clinician');
  const [patientLanguage, setPatientLanguage] = useState<'en' | 'hi'>('en');
  const [expandedAstDrug, setExpandedAstDrug] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDoctorSigned, setIsDoctorSigned] = useState<boolean>(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showThermalModal, setShowThermalModal] = useState<boolean>(false);

  // Active profile & allergy cross-checks
  const activeProfile = StorageService.getActiveProfile();
  const patient = session.patientInfo || {
    patientName: activeProfile ? activeProfile.patientName : 'Rajesh Sharma',
    age: activeProfile ? activeProfile.age : 48,
    gender: activeProfile ? activeProfile.gender : 'Male',
    mrn: activeProfile ? activeProfile.mrn : 'MRN-AIIMS-90481',
    specimenId: 'SP-ICMR-2026-041A',
    orderingPhysician: 'Dr. Rajesh Malhotra, MD (AIIMS Infectious Diseases)',
    facility: 'AIIMS New Delhi — Clinical Microbiology Reference Lab',
    chiefComplaint: 'Acute pyuria & dysuria evaluation',
    collectionMethod: 'Midstream Clean-Catch Urine',
  };

  const userAllergies = activeProfile ? activeProfile.allergies : ['Ciprofloxacin', 'Ampicillin'];
  const highRiskRecords = activeProfile ? activeProfile.medicalRecords.filter((r) => r.isHighRiskCondition) : [];

  // Check if any suggested first line antibiotic conflicts with listed allergies
  const conflictingAllergies = session.overallSummary.suggestedFirstLine.filter((drug) =>
    userAllergies.some((allergy) => allergy.toLowerCase().includes(drug.toLowerCase()) || drug.toLowerCase().includes(allergy.toLowerCase()))
  );

  const detectedPathogens = session.layer2.pathogens.filter((p) => p.detected);
  const isUtiDetected =
    session.layer1.infectionLevel !== 'Negative' || detectedPathogens.length > 0;
  const [showUtiPopup, setShowUtiPopup] = useState<boolean>(isUtiDetected);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = async () => {
    const primaryPathogenObj = session.layer2.pathogens.find((p) => p.detected);
    const primaryPathogen = primaryPathogenObj?.name || 'Negative';

    const shareText = `[GENEX CLINICAL REPORT SUMMARY]\nPatient: ${patient.patientName} (${patient.age}y ${patient.gender})\nStatus: ${session.overallSummary.title}\nInfection Severity: ${session.layer1.infectionLevel}\nPathogen: ${primaryPathogen}\nEffective Antibiotics: ${session.overallSummary.suggestedFirstLine.join(', ') || 'Culture-directed'}\nResistant: ${session.overallSummary.resistantDrugs.join(', ') || 'None'}\nFacility: ${patient.facility}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Genex Diagnostic Report — ${patient.patientName}`,
          text: shareText,
          url: window.location.href,
        });
        showToast('Report shared successfully!');
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      showToast('Report summary copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Report summary copied to clipboard!');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await PdfExportService.generateClinicalReport(session);
      showToast('Lab-grade PDF report generated!');
    } catch (e) {
      console.error('PDF export error:', e);
      showToast('Failed to generate PDF. Please retry.');
    }
  };

  const handleWhatsAppShare = () => {
    const primaryPathogenObj = session.layer2.pathogens.find((p) => p.detected);
    const primaryPathogen = primaryPathogenObj?.name || 'Negative / Clear';
    const effectiveDrugs = session.overallSummary.suggestedFirstLine.join(', ') || 'Consult physician';
    const resistantDrugs = session.overallSummary.resistantDrugs.join(', ') || 'None';

    const text = patientLanguage === 'en'
      ? `*GENEX CLINICAL REPORT SUMMARY*\n` +
        `👤 *Patient:* ${patient.patientName} (${patient.age}y ${patient.gender})\n` +
        `📋 *MRN:* ${patient.mrn}\n` +
        `🔬 *Diagnostic Status:* ${session.overallSummary.title}\n` +
        `🧪 *Pyuria Severity:* ${session.layer1.infectionLevel}\n` +
        `🦠 *Pathogen:* ${primaryPathogen}\n` +
        `💊 *Effective Regimen:* ${effectiveDrugs}\n` +
        `🚫 *Do NOT Take (Resistant):* ${resistantDrugs}\n` +
        `💧 *Care Advice:* Drink 2.5–3L water daily & complete full prescribed course.\n` +
        `🏥 *Facility:* ${patient.facility}\n` +
        `_Confidential Point-of-Care Diagnostic Summary_`
      : `*जेनेक्स क्लिनिकल जांच रिपोर्ट संक्षेप*\n` +
        `👤 *मरीज:* ${patient.patientName} (${patient.age} वर्ष ${patient.gender})\n` +
        `📋 *MRN:* ${patient.mrn}\n` +
        `🔬 *जांच परिणाम:* ${session.overallSummary.title}\n` +
        `🧪 *संक्रमण स्तर:* ${session.layer1.infectionLevel}\n` +
        `🦠 *जीवाणु (Pathogen):* ${primaryPathogen}\n` +
        `💊 *सुझाई गई दवा:* ${effectiveDrugs}\n` +
        `🚫 *ये दवा बिलकुल न लें (प्रतिरोधी):* ${resistantDrugs}\n` +
        `💧 *सलाह:* प्रतिदिन 2.5-3 लीटर पानी पिएं और दवा का पूरा कोर्स लें।\n` +
        `🏥 *अस्पताल:* ${patient.facility}\n` +
        `_गोपनीय मेडिकल जांच रिपोर्ट_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getSeverityDescription = () => {
    switch (session.layer1.infectionLevel) {
      case 'High':
        return 'Acute Pyuria Detected (>250 WBC/µL)';
      case 'Moderate':
        return 'Moderate Pyuria Detected (50-250 WBC/µL)';
      case 'Low':
        return 'Mild / Low-Grade Pyuria (10-50 WBC/µL)';
      default:
        return 'Normal Leukocyte Count (<10 WBC/µL)';
    }
  };

  const primaryPathogen = detectedPathogens.length > 0 ? detectedPathogens[0] : null;

  // Status helper for antibiotics badge
  const renderStatusBadge = (status: SusceptibilityStatus) => {
    if (status === 'Resistant') {
      return (
        <span className="bg-[#E53E3E] text-white font-bold text-xs px-3 py-1 rounded-lg shadow-xs tracking-wide">
          Resistant
        </span>
      );
    }
    if (status === 'Intermediate') {
      return (
        <span className="bg-[#E59A1D] text-white font-bold text-xs px-3 py-1 rounded-lg shadow-xs tracking-wide">
          Intermediate
        </span>
      );
    }
    return (
      <span className="bg-[#2E9E5B] text-white font-bold text-xs px-3 py-1 rounded-lg shadow-xs tracking-wide">
        Susceptible
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-36 sm:pb-28">
      {/* SECTION 6: UTI DETECTED MODAL ALERT */}
      {showUtiPopup && isUtiDetected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in"
          onClick={() => setShowUtiPopup(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 relative flex flex-col items-center text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Alert Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D98E3F] to-rose-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-[#D98E3F]" />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <div className="inline-flex items-center justify-center gap-1.5 bg-amber-50 border border-[#D98E3F]/40 text-[#D98E3F] px-3 py-1 rounded-full text-[11px] font-mono font-bold">
                <User className="w-3.5 h-3.5" />
                <span>Patient: {patient.patientName} ({patient.mrn})</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                UTI IS DETECTED
              </h2>
            </div>

            {/* Message Body */}
            <div className="bg-amber-50/80 border border-[#D98E3F]/30 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed font-medium w-full text-left">
              {detectedPathogens.length > 0 ? (
                <p>
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Pathogen Identified: {detectedPathogens.map((p) => p.name).join(', ')}
                  </span>
                  {session.layer1.infectionLevel !== 'Negative' && (
                    <span>Inflammatory pyuria grade: {session.layer1.infectionLevel} severity. </span>
                  )}
                  Targeted antibiotic susceptibility matrix available below.
                </p>
              ) : (
                <p>
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Pyuria Severity: {session.layer1.infectionLevel} Inflammatory Response
                  </span>
                  Leukocyte esterase chromogenic signal indicates active inflammation.
                </p>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setShowUtiPopup(false)}
              className="w-full py-3 genex-btn-primary text-sm font-bold flex items-center justify-center gap-2 mt-2 shadow-md rounded-xl"
            >
              <span>View Clinical Report</span>
            </button>
          </div>
        </div>
      )}

      {/* ── DESIGN 2 HEADER: ELEVATED PATIENT BANNER ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Patient Name & Age/Gender */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {patient.patientName}, {patient.age}{patient.gender ? patient.gender[0].toUpperCase() : 'M'}
        </h1>

        {/* Clinical Node Badge */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 bg-[#C67C26] text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-xs tracking-wide max-w-full">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {session.layer1.infectionLevel === 'High'
              ? 'Urgent Clinical'
              : session.layer1.infectionLevel === 'Negative'
              ? 'Healthy Baseline'
              : 'Standard Case'} — {patient.facility ? patient.facility.split(' - ')[0].replace('All India Institute of Medical Sciences (AIIMS)', 'AIIMS') : 'Clinical Microbiology'}
          </span>
        </div>

        {/* Clinical Reference Metadata Chips */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 w-full flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-600">
          <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            MRN: <b className="text-slate-800">{patient.mrn}</b>
          </span>
          <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            Specimen: <b className="text-slate-800">{patient.specimenId}</b>
          </span>
          <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md hidden sm:inline-block">
            Method: <b className="text-slate-800">{patient.collectionMethod}</b>
          </span>
          <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            <b className="text-slate-800">{new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</b>
          </span>
        </div>
      </div>

      {/* ALLERGY CONFLICT WARNING BANNER */}
      {conflictingAllergies.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 text-xs sm:text-sm shadow-md space-y-1">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>CRITICAL DRUG ALLERGY CONFLICT DETECTED</span>
          </div>
          <p className="text-slate-800 font-medium leading-relaxed pl-6">
            Patient <b>{patient.patientName}</b> has a documented allergy to <b>{conflictingAllergies.join(', ')}</b>. Do NOT prescribe these medications.
          </p>
        </div>
      )}

      {/* HIGH-RISK CLINICAL PROFILE ALERT BANNER */}
      {highRiskRecords.length > 0 && (
        <div className="bg-amber-50 border border-[#D98E3F] rounded-xl p-3.5 text-xs sm:text-sm text-amber-950 font-medium space-y-1 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldCheck className="w-4 h-4 text-[#D98E3F]" />
            <span>HIGH-RISK CLINICAL PROFILE DETECTED</span>
          </div>
          <p className="pl-6 text-slate-700 leading-relaxed text-xs">
            Active condition(s): <b>{highRiskRecords.map((r) => r.description).join('; ')}</b>. Antimicrobial therapy is indicated per clinical protocol.
          </p>
        </div>
      )}

      {/* ── DESIGN 2: DIAGNOSTIC SUMMARY CARD ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Diagnostic Summary
        </h2>

        {/* Acute Pyuria Detected Title in Amber */}
        <p className="text-[#B87024] font-bold text-base sm:text-lg">
          {getSeverityDescription()}
        </p>

        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Pathogen Detection Row with Pill Icon */}
          <div className="inline-flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <Pill className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs sm:text-sm text-slate-700">
              Pathogen:{' '}
              <b className="text-slate-900 font-bold">
                {primaryPathogen ? primaryPathogen.scientificName : 'No Panel Pathogen Detected'}
              </b>{' '}
              <span className="text-emerald-700 font-semibold text-xs">
                ({primaryPathogen ? `${primaryPathogen.confidence}% Conf` : 'Negative'})
              </span>
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-center">
            {session.batchId} • ISO-13485
          </span>
        </div>
      </div>

      {/* ── DESIGN 2: ANTIBIOTIC SUSCEPTIBILITY MATRIX (AST) ── */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Antibiotic Susceptibility Matrix (AST)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            {session.layer3.sensitiveCount} Sensitive / {session.layer3.resistantCount} Resistant
          </span>
        </div>

        {/* Antibiotic Cards List (Matching Design 2 Mockup) */}
        <div className="space-y-3">
          {session.layer3.antibiotics.map((ab) => {
            const meta = DRUG_METADATA[ab.id] || DRUG_METADATA[ab.name.toLowerCase()] || {
              micValue: 'MIC not determined',
              clsiBreakpoint: 'CLSI M100 standard',
              patientAdvice: ab.clinicalRecommendation,
              dosage: 'Per clinician direction',
            };
            const isExpanded = expandedAstDrug === ab.id;

            return (
              <div
                key={ab.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  ab.status === 'Resistant'
                    ? 'border-rose-200/80 shadow-xs hover:border-rose-300'
                    : ab.status === 'Intermediate'
                    ? 'border-amber-200/80 shadow-xs hover:border-amber-300'
                    : 'border-slate-200/80 shadow-xs hover:border-emerald-300'
                }`}
              >
                {/* Main Card Header / Row */}
                <div
                  onClick={() => setExpandedAstDrug(isExpanded ? null : ab.id)}
                  className="p-4 sm:p-5 flex items-start justify-between cursor-pointer gap-3"
                >
                  {/* Left Column: Drug Name & Gene / Class Tag */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                        {ab.name}
                      </span>
                      {ab.isFirstLine && (
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          1st-Line
                        </span>
                      )}
                    </div>

                    {/* Secondary tag: Resistance Gene or Drug Class */}
                    <div className="flex flex-wrap items-center gap-2">
                      {ab.status === 'Resistant' && meta.geneMarker ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-slate-200">
                          <span>🚩</span> {meta.geneMarker}
                        </span>
                      ) : ab.status === 'Intermediate' && meta.geneMarker ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-slate-200">
                          <span>⚠️</span> {meta.geneMarker}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {ab.brandName} • {ab.drugClass}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status Badge & Efficacy Tag */}
                  <div className="flex flex-col items-end shrink-0">
                    {renderStatusBadge(ab.status)}

                    {/* Efficacy or Resistance Marker underneath */}
                    {ab.status === 'Sensitive' && meta.efficacy && (
                      <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1.5 block">
                        {meta.efficacy}
                      </span>
                    )}

                    {ab.status === 'Resistant' && (
                      <span className="text-xs font-mono text-rose-700 font-semibold mt-1.5 block">
                        Resistance Flagged
                      </span>
                    )}

                    {ab.status === 'Intermediate' && (
                      <span className="text-xs font-mono text-amber-700 font-semibold mt-1.5 block">
                        Borderline Zone
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable Technical Details & Replicate Inspection */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">MIC & BREAKPOINT</span>
                        <span className="font-bold text-slate-800 block mt-0.5">{meta.micValue}</span>
                        <span className="text-[10px] text-slate-500 block">{meta.clsiBreakpoint}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">DOSAGE & SCHEDULE</span>
                        <span className="font-semibold text-slate-800 block mt-0.5">{meta.dosage}</span>
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed font-sans text-xs">
                      <b className="text-slate-900">Clinical Recommendation: </b>
                      {ab.clinicalRecommendation}
                    </p>

                    {/* 4 Micro-well Replicate Assay Readings */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-[10.5px] font-mono text-slate-500 mb-2">
                        <span>
                          Concordance: <b className="text-emerald-700">{ab.concordanceText}</b>
                        </span>
                        <span>
                          Mean OD: <b className="text-slate-900">{ab.meanOD.toFixed(3)}</b> ± {ab.stdDev.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {ab.replicates.map((rep) => (
                          <div
                            key={rep.replicateIndex}
                            className={`p-1.5 rounded-md border text-center text-[10px] font-mono ${
                              rep.isSensitive
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                          >
                            <span className="block font-bold">R{rep.replicateIndex}</span>
                            <span>{rep.opticalDensity.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DESIGN 2: AST KINETIC GROWTH CURVES (0-30 MIN) ── */}
      <AstKineticChart antibiotics={session.layer3.antibiotics} />

      {/* ── DESIGN 2 DUAL-PERSPECTIVE TOGGLE BAR ── */}
      <div className="pt-2 sticky bottom-20 sm:bottom-6 z-40">
        <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-700 max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setViewMode('clinician')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'clinician'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor PDF Sign-off</span>
          </button>

          <div className="w-px h-6 bg-slate-700 mx-1" />

          <button
            onClick={() => setViewMode('patient')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'patient'
                ? 'bg-white text-slate-900 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient Plain Summary</span>
          </button>
        </div>
      </div>

      {/* ── VIEW MODE 1: DOCTOR PDF SIGN-OFF VIEW ── */}
      {viewMode === 'clinician' && (
        <div className="space-y-4 animate-fade-in pt-1">
          {/* Doctor Clinical Impression & Sign-off Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  Clinical Synthesis & Physician Sign-Off
                </h3>
              </div>
              <span className="text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                CLSI M100 / EUCAST
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {session.overallSummary.clinicalImpression}
            </p>

            {/* Electronic Signature Block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{patient.orderingPhysician}</span>
                  {isDoctorSigned && (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      <Check className="w-3 h-3" /> Signed
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-mono block">
                  Credential ID: AIIMS-ID-88421 • Ref Lab Node #041
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Timestamp: {new Date(session.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setIsDoctorSigned(true);
                    showToast('Clinical Rx electronic signature verified!');
                  }}
                  className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Re-Sign</span>
                </button>
                <button
                  onClick={() => setShowThermalModal(true)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-300"
                  title="Print 58mm / 80mm OPD Thermal Prescription Slip"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Thermal Slip</span>
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="py-2 px-3.5 genex-btn-primary text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Signed PDF</span>
                </button>
              </div>
            </div>

            {/* Technical Detail Collapsible Toggle */}
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full py-2.5 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <span>{showTechnicalDetails ? 'Hide Government AMRSN & Optical Heuristics' : 'View ICMR AMRSN & Optical Density Telemetry'}</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Optical & ICMR Govt Benchmarks */}
          {showTechnicalDetails && (
            <div className="space-y-4 animate-fade-in">
              {/* AI Diagnostic Neural CV */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-700" />
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Optical Density Telemetry & Heuristics
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Confidence: {session.layer1.confidence}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">SIGNAL OD</span>
                    <span className="font-bold text-slate-900 text-xs">{session.layer1.opticalDensity.toFixed(3)}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">DELTA E*</span>
                    <span className="font-bold text-slate-900 text-xs">{session.layer1.deltaE}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block">WBC ESTIMATE</span>
                    <span className="font-bold text-slate-900 text-xs">{session.layer1.infectionLevel}</span>
                  </div>
                </div>
              </div>

              {/* ICMR AMRSN National Isolation Rates Table */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-700" />
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Assay Correlation with ICMR AMRSN Surveillance
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">icmr.gov.in</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Pathogen</th>
                        <th className="p-2">Assay Result</th>
                        <th className="p-2">National Isolation Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {session.layer2.pathogens.map((p) => (
                        <tr key={p.id} className={p.detected ? 'bg-amber-50/40 font-semibold' : ''}>
                          <td className="p-2 font-bold text-slate-900">{p.name}</td>
                          <td className="p-2">
                            {p.detected ? (
                              <span className="text-[#D98E3F] font-bold">DETECTED (OD {p.opticalDensity.toFixed(3)})</span>
                            ) : (
                              <span className="text-slate-400">Clear</span>
                            )}
                          </td>
                          <td className="p-2 text-slate-700">
                            {p.govtData?.icmrPrevalence.split(' (')[0] || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW MODE 2: PATIENT PLAIN SUMMARY VIEW ── */}
      {viewMode === 'patient' && (
        <div className="space-y-4 animate-fade-in pt-1">
          {/* Conversational Explanation Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{patientLanguage === 'en' ? 'What Your Test Means' : 'आपकी जांच रिपोर्ट का सरल अर्थ'}</span>
              </div>

              {/* Language Switcher */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                <button
                  onClick={() => setPatientLanguage('en')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    patientLanguage === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setPatientLanguage('hi')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    patientLanguage === 'hi'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {patientLanguage === 'en'
                ? session.overallSummary.patientGuidance
                : `आपकी जांच में मूत्र मार्ग में जीवाणु संक्रमण (UTI) की पुष्टि हुई है। जांच से पता चला है कि ई. कोलाई (E. coli) बैक्टीरिया मौजूद है। नीचे दी गई उपयुक्त एंटीबायोटिक दवा का समय पर पूरा कोर्स लें।`}
            </p>

            {/* Prescribed Medicine Highlight Box */}
            {session.overallSummary.suggestedFirstLine.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{patientLanguage === 'en' ? 'Your Prescribed Treatment' : 'आपकी निर्धारित दवा (First-Line Treatment)'}</span>
                </div>
                <div className="pl-6 space-y-1 text-xs sm:text-sm text-slate-800">
                  {patientLanguage === 'en' ? (
                    <>
                      <p>
                        Take <b className="text-emerald-900">{session.overallSummary.suggestedFirstLine.join(' or ')}</b> as directed by your physician.
                      </p>
                      <p className="text-xs text-slate-600">
                        • Take with meals and plenty of water.<br />
                        • Complete the full course even if you feel better after a few days.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        चिकित्सक द्वारा सुझाई गई दवा <b className="text-emerald-900">{session.overallSummary.suggestedFirstLine.join(' या ')}</b> का सेवन करें।
                      </p>
                      <p className="text-xs text-slate-600">
                        • दवा को भोजन के साथ और पर्याप्त पानी के साथ लें।<br />
                        • 2-3 दिन में आराम महसूस होने पर भी 5 दिन का पूरा कोर्स अवश्य समाप्त करें।
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Medications to Avoid */}
            {session.overallSummary.resistantDrugs.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{patientLanguage === 'en' ? 'Medications to Avoid' : 'ये दवाइयां बिलकुल न लें (प्रतिरोधी / Resistant)'}</span>
                </div>
                <div className="pl-6 space-y-1 text-xs sm:text-sm text-slate-800">
                  {patientLanguage === 'en' ? (
                    <>
                      <p>
                        Do <b className="text-rose-900">NOT</b> take <b>{session.overallSummary.resistantDrugs.join(', ')}</b>.
                      </p>
                      <p className="text-xs text-slate-600">
                        The bacteria causing your infection has developed resistance to these drugs, meaning they will not cure the infection.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        कृपया <b className="text-rose-900">{session.overallSummary.resistantDrugs.join(', ')}</b> का सेवन न करें।
                      </p>
                      <p className="text-xs text-slate-600">
                        संक्रमण फैलाने वाले बैक्टीरिया में इस दवा के प्रति प्रतिरोध (Resistance) विकसित हो चुका है, इसलिए यह दवा असर नहीं करेगी।
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Daily Care & Hydration Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>{patientLanguage === 'en' ? 'Drink 2.5–3 Liters of Water' : 'प्रतिदिन 2.5–3 लीटर पानी पिएं'}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                  {patientLanguage === 'en'
                    ? 'Hydration flushes bacteria out of your urinary tract naturally and speeds up recovery.'
                    : 'भरपूर पानी पीने से मूत्र मार्ग से बैक्टीरिया प्राकृतिक रूप से बाहर निकल जाता है।'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>{patientLanguage === 'en' ? 'Urinate Frequently' : 'पेशाब को न रोकें'}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                  {patientLanguage === 'en'
                    ? 'Do not hold your urine. Emptying your bladder frequently prevents bacteria from multiplying.'
                    : 'पेशाब रोकने से बचें। मूत्राशय को समय-समय पर खाली करने से संक्रमण तेजी से फैलता नहीं है।'}
                </p>
              </div>
            </div>

            {/* Red Flag Warning Signs */}
            <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>{patientLanguage === 'en' ? 'When to Seek Immediate Medical Care:' : 'तुरंत डॉक्टर से कब संपर्क करें:'}</span>
              </span>
              <ul className="list-disc list-inside pl-1 space-y-0.5 text-slate-700 text-[11px]">
                {patientLanguage === 'en' ? (
                  <>
                    <li>Fever above 38.5°C (101.3°F) or shaking chills</li>
                    <li>Severe flank or lower back pain (kidney area)</li>
                    <li>Persistent vomiting or inability to keep fluids down</li>
                  </>
                ) : (
                  <>
                    <li>101°F (38.5°C) से अधिक तेज बुखार या कंपकंपी होना</li>
                    <li>कमर या पसलियों के निचले हिस्से में तीव्र दर्द</li>
                    <li>लगातार उल्टी होना या पानी भी न पच पाना</li>
                  </>
                )}
              </ul>
            </div>

            {/* Share with Family, WhatsApp & Download PDF Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{patientLanguage === 'en' ? 'Share on WhatsApp' : 'व्हाट्सएप पर भेजें'}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>{copiedLink ? 'Summary Copied!' : (patientLanguage === 'en' ? 'Copy Text Summary' : 'संक्षेप कॉपी करें')}</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>{patientLanguage === 'en' ? 'PDF' : 'पीडीएफ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar: Start New Scan & Utilities */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={onNewScan}
          className="w-full sm:w-auto py-3 px-6 genex-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Start New Scan</span>
        </button>

        <button
          onClick={() => setShowThermalModal(true)}
          className="w-full sm:w-auto py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs transition"
          title="Print 58mm / 80mm OPD Thermal Prescription Slip"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Thermal Slip</span>
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="w-full sm:w-auto py-3 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs transition"
          title="Send Bilingual Summary via WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Rx</span>
        </button>

        <button
          onClick={handleShare}
          className="w-full sm:w-auto py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs"
        >
          <Share2 className="w-4 h-4 text-[#D98E3F]" />
          <span>Share</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          className="w-full sm:w-auto py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thermal Receipt Print Modal */}
      {showThermalModal && (
        <ThermalReceiptModal
          session={session}
          onClose={() => setShowThermalModal(false)}
        />
      )}
    </div>
  );
};
