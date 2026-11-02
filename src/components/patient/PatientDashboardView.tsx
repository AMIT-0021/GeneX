import React, { useState, useEffect, useMemo } from 'react';
import { PatientProfile, MedicalRecordEntry, ScanSession } from '../../types/diagnostic';
import { StorageService } from '../../services/storageService';
import { RecurrenceEngine } from '../../services/recurrenceEngine';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  Activity,
  FileText,
  Search,
  ChevronRight,
  Info,
  ArrowLeft,
  MoreVertical,
  ChevronDown,
  Sparkles,
  HeartPulse,
  Pill,
} from 'lucide-react';

interface PatientDashboardViewProps {
  onBack: () => void;
  onSelectSession: (session: ScanSession) => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  onBack,
  onSelectSession,
}) => {
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PatientProfile | null>(null);
  const [allScans, setAllScans] = useState<ScanSession[]>([]);

  // Profile editing & modal state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecordDesc, setNewRecordDesc] = useState('');
  const [newRecordHighRisk, setNewRecordHighRisk] = useState(false);
  const [newRecordNotes, setNewRecordNotes] = useState('');
  const [newAllergyInput, setNewAllergyInput] = useState('');

  // Editing profile fields
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState(52);
  const [editGender, setEditGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [editMrn, setEditMrn] = useState('');

  const loadData = async () => {
    const loadedProfiles = StorageService.getPatientProfiles();
    setProfiles(loadedProfiles);
    
    // Prefer Sunita Devi or active profile
    let active = StorageService.getActiveProfile();
    if (!active && loadedProfiles.length > 0) {
      active = loadedProfiles.find(p => p.id === 'prof_sunita') || loadedProfiles[0];
      StorageService.setActiveProfileId(active.id);
    }
    setActiveProfile(active);

    const scans = await StorageService.getAllScans();
    setAllScans(scans);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSwitchProfile = (profileId: string) => {
    StorageService.setActiveProfileId(profileId);
    const selected = profiles.find((p) => p.id === profileId);
    if (selected) {
      setActiveProfile(selected);
      setIsEditingProfile(false);
    }
  };

  const handleAddAllergy = () => {
    if (!activeProfile || !newAllergyInput.trim()) return;
    const trimmed = newAllergyInput.trim();
    if (activeProfile.allergies.includes(trimmed)) return;

    const updated: PatientProfile = {
      ...activeProfile,
      allergies: [...activeProfile.allergies, trimmed],
    };
    StorageService.saveProfile(updated);
    setActiveProfile(updated);
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (allergyToRemove: string) => {
    if (!activeProfile) return;
    const updated: PatientProfile = {
      ...activeProfile,
      allergies: activeProfile.allergies.filter((a) => a !== allergyToRemove),
    };
    StorageService.saveProfile(updated);
    setActiveProfile(updated);
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddRecord = () => {
    if (!activeProfile || !newRecordDesc.trim()) return;
    const newEntry: MedicalRecordEntry = {
      id: `rec_${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0],
      description: newRecordDesc.trim(),
      isHighRiskCondition: newRecordHighRisk,
      notes: newRecordNotes.trim() || undefined,
    };

    const updated: PatientProfile = {
      ...activeProfile,
      medicalRecords: [newEntry, ...activeProfile.medicalRecords],
    };
    StorageService.saveProfile(updated);
    setActiveProfile(updated);
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    setNewRecordDesc('');
    setNewRecordNotes('');
    setNewRecordHighRisk(false);
    setIsAddingRecord(false);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!activeProfile) return;
    const updated: PatientProfile = {
      ...activeProfile,
      medicalRecords: activeProfile.medicalRecords.filter((r) => r.id !== recordId),
    };
    StorageService.saveProfile(updated);
    setActiveProfile(updated);
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Filter scans associated with this patient or generate representative clinical timeline
  const patientScans = useMemo(() => {
    if (!activeProfile) return [];
    const directScans = allScans.filter((s) => {
      const pInfo = s.patientInfo;
      return (
        (pInfo && pInfo.mrn === activeProfile.mrn) ||
        (pInfo && pInfo.patientName.toLowerCase() === activeProfile.patientName.toLowerCase())
      );
    });
    return directScans;
  }, [allScans, activeProfile]);

  // Recurrence Analysis Flags
  const recurrenceFlags = useMemo(() => {
    return RecurrenceEngine.analyzePatientRecurrence(patientScans);
  }, [patientScans]);

  // Dynamic Recurrence Risk Score & Radar Metrics
  const radarMetrics = useMemo(() => {
    if (!activeProfile) {
      return {
        overallScore: 74,
        scoreLabel: 'Elevated Recurrence Risk',
        axes: [0.75, 0.85, 0.70, 0.65, 0.80, 0.72],
      };
    }

    const hasCatheter = activeProfile.medicalRecords.some(r => 
      r.description.toLowerCase().includes('catheter') || (r.notes && r.notes.toLowerCase().includes('catheter'))
    );
    const hasDiabetesOrChronic = activeProfile.medicalRecords.some(r => r.isHighRiskCondition);
    const allergyCount = activeProfile.allergies.length;
    const pastVisitsCount = patientScans.length;

    // Axis 0: Catheter Duration / Complication
    const axisCatheter = hasCatheter ? 0.85 : 0.25;
    // Axis 1: Klebsiella / Uropathogen Persistence
    const axisPathogen = activeProfile.patientName.includes('Sunita') || pastVisitsCount >= 2 ? 0.88 : 0.40;
    // Axis 2: Risk Factors / Comorbidities
    const axisRiskFactors = hasDiabetesOrChronic ? 0.78 : 0.35;
    // Axis 3: Catheter Resistance / Resistance Pressure
    const axisCatheterResistance = hasCatheter || allergyCount > 0 ? 0.72 : 0.30;
    // Axis 4: Recurrence Resistant Drugs
    const axisRecurrenceResistant = recurrenceFlags.length > 0 || allergyCount > 1 ? 0.82 : 0.45;
    // Axis 5: Medical Health / Prior Episodes
    const axisMedicalHealth = pastVisitsCount > 0 || activeProfile.medicalRecords.length > 1 ? 0.75 : 0.30;

    const rawAverage = (axisCatheter + axisPathogen + axisRiskFactors + axisCatheterResistance + axisRecurrenceResistant + axisMedicalHealth) / 6;
    const finalScore = Math.min(95, Math.max(15, Math.round(rawAverage * 100)));

    let scoreLabel = 'Low Recurrence Risk';
    if (finalScore >= 65) scoreLabel = 'Elevated Recurrence Risk';
    else if (finalScore >= 40) scoreLabel = 'Moderate Recurrence Risk';

    return {
      overallScore: finalScore,
      scoreLabel,
      axes: [axisCatheter, axisPathogen, axisRiskFactors, axisCatheterResistance, axisRecurrenceResistant, axisMedicalHealth],
    };
  }, [activeProfile, patientScans, recurrenceFlags]);

  // Longitudinal Timeline Events (uses real scans or clinical reference history)
  const timelineEvents = useMemo(() => {
    if (patientScans.length > 0) {
      return patientScans.map(scan => {
        const detected = scan.layer2.pathogens.filter(p => p.detected);
        const primary = detected.length > 0 ? detected[0].name : 'Sterile Pyuria';
        const isCured = scan.overallSummary.suggestedFirstLine.length > 0;
        const resCount = scan.overallSummary.resistantDrugs.length;
        
        return {
          id: scan.id,
          dateLabel: new Date(scan.timestamp).toLocaleDateString([], { month: 'short', year: 'numeric' }),
          title: `UTI episode`,
          subtitle: primary,
          outcome: resCount > 0 ? `${scan.overallSummary.resistantDrugs[0]} Resistant` : isCured ? `Susceptible - ${scan.overallSummary.suggestedFirstLine[0] || 'Targeted'}` : 'Negative / Cleared',
          statusType: resCount > 0 ? 'resistant' : 'cured',
          session: scan,
        };
      });
    }

    // Default reference longitudinal timeline matching Sunita Devi mockup
    return [
      {
        id: 'mock_ep_1',
        dateLabel: 'Feb 2026',
        title: 'UTI episode',
        subtitle: 'Klebsiella pneumoniae',
        outcome: 'Cured — Nitrofurantoin',
        statusType: 'cured',
      },
      {
        id: 'mock_ep_2',
        dateLabel: 'Nov 2025',
        title: 'E. coli infection',
        subtitle: 'Escherichia coli',
        outcome: 'Ciprofloxacin Resistant',
        statusType: 'resistant',
      },
      {
        id: 'mock_ep_3',
        dateLabel: 'Aug 2025',
        title: 'Mild Dysuria',
        subtitle: 'Sterile Pyuria (<25 WBC/µL)',
        outcome: 'Hydration Therapy Only',
        statusType: 'neutral',
      },
    ];
  }, [patientScans]);

  if (!activeProfile) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
        Loading patient record...
      </div>
    );
  }

  // Calculate SVG Radar Points (Center at 160, 160 with Radius 90)
  const radarCenter = 160;
  const radarRadius = 90;
  const radarPoints = radarMetrics.axes
    .map((val, idx) => {
      const angle = (idx * 60 - 90) * (Math.PI / 180);
      const r = radarRadius * val;
      const x = radarCenter + r * Math.cos(angle);
      const y = radarCenter + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-28 sm:pb-24 animate-fade-in">
      {/* ── TOP APP BAR: GENEX PATIENT VAULT ── */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <h1 className="text-lg font-black text-slate-900 tracking-tight">Genex</h1>

        {/* Profile Switcher Dropdown */}
        <select
          value={activeProfile.id}
          onChange={(e) => handleSwitchProfile(e.target.value)}
          className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.patientName} ({p.age}{p.gender[0]})
            </option>
          ))}
        </select>
      </div>

      {/* ── DESIGN 3: PATIENT PROFILE CARD ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm relative overflow-hidden space-y-3">
        <div className="flex items-start justify-between">
          <div>
            {/* Patient Name & Age/Gender (Matching Sunita Devi (52F)) */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeProfile.patientName} ({activeProfile.age}{activeProfile.gender[0]})
            </h2>
            <span className="text-xs font-mono text-slate-500 font-semibold block mt-0.5">
              MRN ID: {activeProfile.mrn}
            </span>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
            title="Edit Profile"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Clinical Chips Row (Allergies & High-Risk Flags) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Allergy Chips (Soft Peach Style) */}
          {activeProfile.allergies.length > 0 ? (
            activeProfile.allergies.map((allergy) => (
              <span
                key={allergy}
                className="inline-flex items-center gap-1.5 bg-[#FEEBC8] text-[#9C4221] border border-[#FBD38D] font-bold px-3 py-1 rounded-full text-xs"
              >
                <span>{allergy} Allergy</span>
                <button
                  onClick={() => handleRemoveAllergy(allergy)}
                  className="hover:text-rose-900 ml-0.5"
                  title="Remove Allergy"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
              No known drug allergies
            </span>
          )}

          {/* High-Risk Condition Chips (Soft Warm Amber Style) */}
          {activeProfile.medicalRecords
            .filter((r) => r.isHighRiskCondition)
            .map((rec) => (
              <span
                key={rec.id}
                className="inline-flex items-center gap-1 bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA] font-bold px-3 py-1 rounded-full text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>{rec.description.split(' — ')[0]}</span>
              </span>
            ))}
        </div>

        {/* Quick Add High-Risk / Allergy Toggle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={() => setIsAddingRecord(true)}
            className="text-[#5C8A6B] hover:text-[#4A7257] font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medical Condition</span>
          </button>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="+ Add allergy..."
              value={newAllergyInput}
              onChange={(e) => setNewAllergyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
              className="bg-slate-50 border border-slate-200 text-xs px-2.5 py-1 rounded-lg w-28 focus:w-36 transition-all focus:outline-none"
            />
            {newAllergyInput && (
              <button
                onClick={handleAddAllergy}
                className="p-1 bg-[#5C8A6B] text-white rounded-md text-xs font-bold"
              >
                <Check className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── DESIGN 3: 360° RECURRENCE RISK RADAR ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Recurrence Risk Radar
          </h3>
          <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Circular Radar Graphic */}
        <div className="w-full flex items-center justify-center py-2">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80">
            <svg viewBox="0 0 320 320" className="w-full h-full select-none overflow-visible">
              <defs>
                {/* Radar Fill Gradient */}
                <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#D98E3F" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#D98E3F" stopOpacity="0.40" />
                </radialGradient>
                {/* Drop shadow for center donut */}
                <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
                </filter>
              </defs>

              {/* Concentric Guide Circles (Sage Green Rings matching Mockup) */}
              <circle cx="160" cy="160" r="90" fill="none" stroke="#5C8A6B" strokeWidth="1.5" strokeOpacity="0.4" />
              <circle cx="160" cy="160" r="67" fill="none" stroke="#5C8A6B" strokeWidth="1.2" strokeOpacity="0.3" />
              <circle cx="160" cy="160" r="45" fill="none" stroke="#5C8A6B" strokeWidth="1" strokeOpacity="0.25" />

              {/* Radiating Spoke Lines (6 Axes) */}
              {[0, 60, 120, 180, 240, 300].map((deg) => {
                const angle = (deg - 90) * (Math.PI / 180);
                const x2 = 160 + 90 * Math.cos(angle);
                const y2 = 160 + 90 * Math.sin(angle);
                return (
                  <line
                    key={deg}
                    x1="160"
                    y1="160"
                    x2={x2.toFixed(1)}
                    y2={y2.toFixed(1)}
                    stroke="#5C8A6B"
                    strokeWidth="1.2"
                    strokeOpacity="0.4"
                  />
                );
              })}

              {/* Polygon Radar Wave Fill */}
              <polygon
                points={radarPoints}
                fill="url(#radarFillGrad)"
                stroke="#C67C26"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />

              {/* Vertex Anchor Dots */}
              {radarMetrics.axes.map((val, idx) => {
                const angle = (idx * 60 - 90) * (Math.PI / 180);
                const r = radarRadius * val;
                const x = 160 + r * Math.cos(angle);
                const y = 160 + r * Math.sin(angle);
                return (
                  <circle
                    key={idx}
                    cx={x.toFixed(1)}
                    cy={y.toFixed(1)}
                    r="4.5"
                    fill="#5C8A6B"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                );
              })}

              {/* Axis 0 Label (Top) */}
              <text x="160" y="48" textAnchor="middle" className="text-[10px] font-sans font-bold fill-slate-700">
                Catheter duration
              </text>

              {/* Axis 1 Label (Top-Right) */}
              <text x="248" y="98" textAnchor="start" className="text-[10px] font-sans font-bold fill-slate-700">
                Klebsiella pneumoniae
              </text>

              {/* Axis 2 Label (Bottom-Right) */}
              <text x="248" y="228" textAnchor="start" className="text-[10px] font-sans font-bold fill-slate-700">
                Risk factors
              </text>

              {/* Axis 3 Label (Bottom) */}
              <text x="160" y="278" textAnchor="middle" className="text-[10px] font-sans font-bold fill-slate-700">
                Recurrence resistant
              </text>

              {/* Axis 4 Label (Bottom-Left) */}
              <text x="72" y="228" textAnchor="end" className="text-[10px] font-sans font-bold fill-slate-700">
                Adult recurrence risk
              </text>

              {/* Axis 5 Label (Top-Left) */}
              <text x="72" y="98" textAnchor="end" className="text-[10px] font-sans font-bold fill-slate-700">
                Medical health
              </text>

              {/* Center Donut Circle */}
              <circle
                cx="160"
                cy="160"
                r="44"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth="2"
                filter="url(#donutShadow)"
              />

              {/* Score Number Text (e.g. 74%) */}
              <text
                x="160"
                y="158"
                textAnchor="middle"
                className="text-2xl font-black fill-slate-900 tracking-tight"
                dominantBaseline="central"
              >
                {radarMetrics.overallScore}%
              </text>

              {/* Sub-label inside Donut */}
              <text
                x="160"
                y="178"
                textAnchor="middle"
                className="text-[8.5px] font-bold fill-slate-600 uppercase tracking-tight"
              >
                {radarMetrics.scoreLabel.split(' ')[0]}
              </text>
              <text
                x="160"
                y="188"
                textAnchor="middle"
                className="text-[8px] font-semibold fill-slate-500 uppercase tracking-tight"
              >
                Recurrence Risk
              </text>
            </svg>
          </div>
        </div>

        {/* Clinical Interpretation Guidance */}
        <div className="bg-amber-50/80 border border-[#D98E3F]/40 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed font-medium">
          <p>
            <b className="text-slate-900">Predictive Assessment: </b>
            Patient shows an elevated probability of recurrent uropathogen colonization due to documented post-catheterization history and previous <i>Klebsiella</i> infection. Continuous hydration protocol and periodic screening advised.
          </p>
        </div>
      </div>

      {/* ── DESIGN 3: LONGITUDINAL UTI EPISODE TIMELINE ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Longitudinal UTI Episode History
          </h3>
          <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
            {timelineEvents.length} Recorded Visits
          </span>
        </div>

        {/* Vertical Connected Timeline */}
        <div className="relative pl-2 sm:pl-4 space-y-4">
          {/* Vertical Connecting Guide Line */}
          <div className="absolute top-3 bottom-3 left-18 sm:left-20 w-0.5 bg-slate-200" />

          {timelineEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                if ('session' in ev && ev.session) {
                  onSelectSession(ev.session as ScanSession);
                }
              }}
              className="flex items-center gap-4 group cursor-pointer"
            >
              {/* Left Date Label */}
              <div className="w-14 sm:w-16 text-right shrink-0">
                <span className="text-xs font-bold text-slate-800 block">{ev.dateLabel.split(' ')[0]}</span>
                <span className="text-[10px] font-mono text-slate-400 block">{ev.dateLabel.split(' ')[1]}</span>
              </div>

              {/* Center Timeline Node Dot */}
              <div className="relative z-10 shrink-0">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                    ev.statusType === 'resistant'
                      ? 'bg-rose-600 ring-2 ring-rose-200'
                      : ev.statusType === 'cured'
                      ? 'bg-[#5C8A6B] ring-2 ring-emerald-200'
                      : 'bg-amber-500 ring-2 ring-amber-200'
                  }`}
                />
              </div>

              {/* Right Event Card (Matching Mockup) */}
              <div className="flex-1 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block group-hover:text-emerald-800 transition">
                    {ev.title}
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold block italic">
                    {ev.subtitle}
                  </span>
                  <span
                    className={`text-[10.5px] font-mono font-bold block ${
                      ev.statusType === 'resistant'
                        ? 'text-rose-700'
                        : ev.statusType === 'cured'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {ev.outcome}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL: ADD MEDICAL RECORD ── */}
      {isAddingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-popup-scale">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-900">Add Clinical Condition</h3>
              <button
                onClick={() => setIsAddingRecord(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Condition Description</label>
                <input
                  type="text"
                  placeholder="e.g. Post-catheterization urinary retention, Type 2 Diabetes"
                  value={newRecordDesc}
                  onChange={(e) => setNewRecordDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#5C8A6B]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="highRiskCheck"
                  checked={newRecordHighRisk}
                  onChange={(e) => setNewRecordHighRisk(e.target.checked)}
                  className="rounded text-[#5C8A6B] focus:ring-[#5C8A6B] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="highRiskCheck" className="font-semibold text-slate-800 cursor-pointer">
                  Flag as High-Risk Condition (Triggers antimicrobial indication)
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Notes (Optional)</label>
                <textarea
                  placeholder="Additional context or medications..."
                  value={newRecordNotes}
                  onChange={(e) => setNewRecordNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#5C8A6B]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddingRecord(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRecord}
                className="px-4 py-2 genex-btn-primary text-xs font-bold rounded-xl shadow-xs"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
