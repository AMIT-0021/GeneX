import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  Droplets,
  Camera,
  Cpu,
  Pill,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Compass,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWalkthrough?: () => void;
}

type HelpTab = 'sop' | 'troubleshooting' | 'clinical' | 'contact';

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onLaunchWalkthrough,
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('sop');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');

  if (!isOpen) return null;

  // Search filter across FAQ items
  const faqs = [
    {
      id: 'faq-1',
      tab: 'clinical',
      question: 'What do the Pyuria WBC levels indicate?',
      answer: 'Layer 1 measures indoxyl esterase release from lysed white blood cells. >250 WBC/µL indicates acute pyuria / active bacterial cystitis; 50–250 WBC/µL is moderate; 10–50 WBC/µL is low-grade inflammation; <10 WBC/µL is normal physiological baseline.',
      keywords: 'wbc pyuria pus cells leukocytes infection level',
    },
    {
      id: 'faq-2',
      tab: 'clinical',
      question: 'Why is an antibiotic marked "Intermediate"?',
      answer: 'An Intermediate (I) result indicates that the minimum inhibitory concentration (MIC) approaches achievable blood or tissue concentrations. It should not be used as primary monotherapy unless higher dosing is clinically feasible or alternatives are contraindicated.',
      keywords: 'intermediate ast mic resistance antibiotic susceptibility',
    },
    {
      id: 'faq-3',
      tab: 'clinical',
      question: 'When should a patient be transferred immediately to a tertiary hospital?',
      answer: 'Immediately refer any patient presenting with: (1) Temperature >38.5°C with rigors/chills, (2) Costovertebral angle / severe flank tenderness (suspected acute pyelonephritis), (3) SBP <90 mmHg or tachycardia (suspected urosepsis), or (4) Inability to retain oral liquids.',
      keywords: 'emergency red flags fever flank pain pyelonephritis sepsis transfer',
    },
    {
      id: 'faq-4',
      tab: 'troubleshooting',
      question: 'Camera reports "Motion blur or soft focus" — how to resolve?',
      answer: 'Hold your smartphone steady with both hands at a distance of 15–20 cm directly above the cartridge. Tap the screen once on the center crosshair to lock autofocus before pressing capture.',
      keywords: 'motion blur camera soft focus alignment reticle fuzzy',
    },
    {
      id: 'faq-5',
      tab: 'troubleshooting',
      question: 'Camera reports "Excessive glare / specular reflection" — how to resolve?',
      answer: 'Specular glare happens when direct overhead LED or tube lights bounce off the cartridge plastic. Tilt your phone 10–15° off perpendicular, or hold a sheet of paper / clipboard to shield the direct light.',
      keywords: 'glare reflection flash bright lighting overexposed',
    },
    {
      id: 'faq-6',
      tab: 'troubleshooting',
      question: 'How do I pair the Genex Bluetooth Reader?',
      answer: 'Ensure the reader power switch is ON (green/blue LED blinking). In the app, switch to 3-Stage Mode, tap "Connect Reader", and select "Genex Reader" from the browser Bluetooth pairing prompt.',
      keywords: 'bluetooth ble connect reader pairing hardware disconnect',
    },
    {
      id: 'faq-7',
      tab: 'sop',
      question: 'What is the required sample volume for the cartridge?',
      answer: 'Pipette exactly 75 µL (approx. 2 drops) of midstream clean-catch urine into the central sample inlet port. Do not overfill the capillary overflow reservoir.',
      keywords: 'volume urine pipette drops inlet sample port',
    },
    {
      id: 'faq-8',
      tab: 'sop',
      question: 'How should used cartridges be disposed?',
      answer: 'Cartridges contain biological urine samples and must be treated as Category 1 Biomedical Waste. Immerse in 1% sodium hypochlorite solution for 30 minutes or dispose into yellow biohazard autoclave bags.',
      keywords: 'disposal biohazard waste bleach sodium hypochlorite safety',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      (f.tab === activeTab || searchQuery.trim().length > 0) &&
      (searchQuery.trim() === '' ||
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.keywords.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#D9D4C8] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-[#D98E3F]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Genex Help &amp; SOP Centre
                </h2>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  IFU v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Standard operating procedures, clinical guidelines &amp; troubleshooting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            aria-label="Close help modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SOP, error codes, antibiotics, or symptoms..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-[#D9D4C8] focus:border-[#D98E3F] focus:bg-white focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          {!searchQuery && (
            <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('sop')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'sop'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cartridge SOP</span>
              </button>

              <button
                onClick={() => setActiveTab('troubleshooting')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'troubleshooting'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera &amp; Hardware</span>
              </button>

              <button
                onClick={() => setActiveTab('clinical')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'clinical'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Clinical &amp; AMR Guide</span>
              </button>

              <button
                onClick={() => setActiveTab('contact')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'contact'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Helpline &amp; Tools</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* SEARCH ACTIVE VIEW */}
          {searchQuery ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Search results for "{searchQuery}"</span>
                <span>{filteredFaqs.length} match(es)</span>
              </div>
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No matching articles found</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Try searching for "WBC", "glare", "volume", or "antibiotic".
                  </p>
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-[#D9D4C8] transition space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {faq.tab}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{faq.question}</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-1">{faq.answer}</p>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'sop' ? (
            /* TAB 1: CARTRIDGE SOP */
            <div className="space-y-4">
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-[#D98E3F] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Standard Operating Procedure (ISO 13485):</strong> Follow aseptic technique.
                  Always collect midstream urine in a sterile specimen container.
                </p>
              </div>

              {/* 4-Step Visual SOP Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#D98E3F] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      STEP 1 • SAMPLE
                    </span>
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Midstream Urine Collection</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Instruct patient to discard the first few milliliters of urine and collect 10–20 mL midstream. Test within 1 hour or refrigerate at 4°C.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#5C8A6B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      STEP 2 • INOCULATE
                    </span>
                    <Cpu className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Load Cartridge Port</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Using a sterile micro-pipette, dispense exactly <strong>75 µL</strong> into the central inlet. Capillary action fills all analytical chambers automatically.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      STEP 3 • INCUBATE
                    </span>
                    <Pill className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Reaction Timing</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    • <strong>Layer 1 (Pyuria):</strong> Ready in 60 seconds at room temperature.<br />
                    • <strong>Layer 3 (AST):</strong> Incubate for 30 minutes at 37°C inside the benchtop reader.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      STEP 4 • SCAN
                    </span>
                    <Camera className="w-4 h-4 text-slate-700" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Optical Alignment</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Align the cartridge within the viewfinder reticle or insert into the Bluetooth reader dock. Capture verified photo for instant diagnosis.
                  </p>
                </div>
              </div>

              {/* Biohazard Disposal Note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bio-Safety &amp; Cartridge Disposal:</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                  Used cartridges contain human biological material. After scan completion, immerse in 1% sodium hypochlorite solution or discard directly into yellow biomedical waste containers.
                </p>
              </div>
            </div>
          ) : activeTab === 'troubleshooting' ? (
            /* TAB 2: CAMERA & HARDWARE TROUBLESHOOTING */
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Optical Quality Check Engine:</span>
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  The on-device CV engine evaluates Laplacian focus variance, ambient luminance (lux), and glare spots before confirming a valid scan.
                </p>
              </div>

              {/* Troubleshooting Accordions */}
              <div className="space-y-2">
                {[
                  {
                    title: 'Fixing "Motion blur or soft focus detected"',
                    desc: 'Hold the smartphone with both hands. Tap the center crosshair on the screen to trigger autofocus. Maintain 15–20 cm distance.',
                  },
                  {
                    title: 'Fixing "Excessive glare / specular highlights"',
                    desc: 'Do not aim direct desk lamps straight down on the cartridge. Angle the phone 10–15° or use a folded paper sheet to shield the overhead lamp.',
                  },
                  {
                    title: 'Fixing "Low lighting / underexposed frame (<200 lux)"',
                    desc: 'Move closer to room lighting or toggle the smartphone torch. Standard clinic illumination of 250–500 lux is optimal.',
                  },
                  {
                    title: 'Hardware Reader Bluetooth Connection Drops',
                    desc: '1. Check that the reader power LED is blue or green.\n2. Tap "Disconnect Reader" in the header, wait 3 seconds, then tap "Connect Reader" and select "Genex Reader".\n3. Ensure browser Bluetooth permissions are set to "Allowed".',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-[#D9D4C8] rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D98E3F]" />
                      <span>{item.title}</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line pl-4">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'clinical' ? (
            /* TAB 3: CLINICAL & AMR GUIDE */
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-purple-700" />
                  <span>Evidence-Based Clinical Guidelines (ICMR AMRSN / CLSI M100):</span>
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  All susceptibility breakpoints and first-line suggestions conform to the Indian Council of Medical Research (ICMR) and National Center for Disease Control (NCDC) antimicrobial stewardship protocols.
                </p>
              </div>

              {/* Clinical FAQ Accordions */}
              <div className="space-y-2">
                {filteredFaqs
                  .filter((f) => f.tab === 'clinical')
                  .map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-[#D9D4C8] rounded-xl overflow-hidden bg-white shadow-2xs"
                    >
                      <button
                        onClick={() =>
                          setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                        }
                        className="w-full text-left p-3 flex items-center justify-between bg-slate-50/60 hover:bg-slate-100 transition"
                      >
                        <span className="text-xs font-bold text-slate-900">{faq.question}</span>
                        <ChevronRight
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            expandedFaq === faq.id ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="p-3 text-[11px] text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* TAB 4: HELPLINE & TOOLS */
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold">Replay Guided Walkthrough</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Need a refresher on how the 3-layer cartridge, camera checks, and reports work?
                  Re-launch the interactive onboarding guide anytime.
                </p>
                {onLaunchWalkthrough && (
                  <button
                    onClick={() => {
                      onClose();
                      onLaunchWalkthrough();
                    }}
                    className="mt-2 py-2 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <span>Launch 5-Step Product Tour</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D98E3F]" />
                  </button>
                )}
              </div>

              {/* Technical & Clinical Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp Clinical Support</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Direct technical query channel for on-site clinic nurses and doctors.
                  </p>
                  <a
                    href="https://wa.me/?text=Hello%20Genex%20Support%2C%20I%20need%20assistance%20with%20my%20device."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 pt-1"
                  >
                    <span>Chat with Support</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <PhoneCall className="w-4 h-4 text-[#D98E3F]" />
                    <span>Reference Lab Node</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    AIIMS Clinical Microbiology Reference Node #041, New Delhi.
                  </p>
                  <span className="text-xs font-mono font-bold text-slate-800 block pt-1">
                    support@genex-dx.internal
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Genex Diagnostics • ISO-13485 Spec
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
