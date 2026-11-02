import React, { useState } from 'react';
import { AmrAnonymizerService } from '../../services/amrAnonymizerService';
import { AmrConsentModal } from './AmrConsentModal';
import {
  Globe,
  BarChart3,
  ShieldCheck,
  Building2,
  Info,
} from 'lucide-react';

export const RegionalTrendsView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions (India Aggregate)');
  const [selectedPathogen, setSelectedPathogen] = useState<string>('ecoli');
  const [isConsentModalOpen, setIsConsentModalOpen] = useState<boolean>(false);

  const summary = AmrAnonymizerService.getRegionalAmrSummary(selectedRegion);
  const isUserConsented = AmrAnonymizerService.getUserConsent();

  const currentPathogenStats =
    summary.pathogenStats.find((p) => p.pathogenId === selectedPathogen) ||
    summary.pathogenStats[0];

  const regionsList = [
    'All Regions (India Aggregate)',
    'Delhi NCR (AIIMS Hub)',
    'Punjab (PGIMER Chandigarh Hub)',
    'Tamil Nadu (CMC Vellore Hub)',
    'Maharashtra (Mumbai Metro)',
    'Puducherry (JIPMER Hub)',
  ];

  const pathogensList = [
    { id: 'ecoli', name: 'Escherichia coli', label: 'E. coli' },
    { id: 'klebsiella', name: 'Klebsiella pneumoniae', label: 'K. pneumoniae' },
    { id: 'proteus', name: 'Proteus mirabilis', label: 'P. mirabilis' },
    { id: 'pseudomonas', name: 'Pseudomonas aeruginosa', label: 'P. aeruginosa' },
  ];

  const drugsList = [
    { id: 'ciprofloxacin', name: 'Ciprofloxacin', firstLine: false },
    { id: 'ampicillin', name: 'Ampicillin', firstLine: false },
    { id: 'cotrimoxazole', name: 'Cotrimoxazole', firstLine: true },
    { id: 'nitrofurantoin', name: 'Nitrofurantoin', firstLine: true },
    { id: 'fosfomycin', name: 'Fosfomycin', firstLine: true },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-16 animate-fade-in">
      {/* Consent Modal */}
      <AmrConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
      />

      {/* Header Banner */}
      <div className="genex-card p-5 bg-white border border-[#D9D4C8] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D98E3F]/10 to-[#5C8A6B]/20 border border-[#5C8A6B]/40 flex items-center justify-center text-[#5C8A6B] shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Regional AMR Surveillance & Crowdsourced Antibiogram
                </h2>
                <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-[#5C8A6B]/40 px-2 py-0.5 rounded">
                  LIVE DATA ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anonymous population-level uropathogen resistance patterns vs ICMR AMRSN benchmarks
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsConsentModalOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 ${
              isUserConsented
                ? 'bg-emerald-50 text-emerald-800 border-[#5C8A6B]/40 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-[#D98E3F]/40 hover:bg-amber-100'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isUserConsented ? 'text-[#5C8A6B]' : 'text-[#D98E3F]'}`} />
            <span>{isUserConsented ? 'Privacy Opt-In Active' : 'Enable Opt-In Sharing'}</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#5C8A6B]" />
              Select Geographic Surveillance Zone
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#5C8A6B]"
            >
              {regionsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">POC SAMPLES ANALYZED:</span>
              <span className="font-bold text-slate-900 text-sm">{summary.totalSubmissions} Scans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pathogen Selector Tabs */}
      <div className="genex-card p-4 bg-white border border-[#D9D4C8] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
            <BarChart3 className="w-4 h-4 text-[#D98E3F]" />
            Pathogen Antibiogram Matrix
          </span>
          <span className="text-xs font-mono text-slate-500">
            Updated: {new Date(summary.lastUpdated).toLocaleDateString()}
          </span>
        </div>

        {/* Pathogen Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {pathogensList.map((p) => {
            const isSelected = selectedPathogen === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPathogen(p.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-left ${
                  isSelected
                    ? 'bg-amber-50 text-amber-950 border-[#D98E3F] shadow-xs font-bold ring-1 ring-[#D98E3F]/40'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-slate-900">{p.label}</div>
                <div className="text-xs text-slate-500 italic truncate">{p.name}</div>
              </button>
            );
          })}
        </div>

        {/* Resistance Rate Bar Charts */}
        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
            <span>{currentPathogenStats?.pathogenName} Resistance Rates</span>
            <span className="text-xs font-mono font-normal text-slate-500">
              Sample Count: <b>{currentPathogenStats?.sampleCount || 0}</b>
            </span>
          </h3>

          <div className="space-y-3">
            {drugsList.map((drug) => {
              const dStats = currentPathogenStats?.drugResistance[drug.name] || {
                resistantCount: 0,
                totalCount: 0,
                resistantPercent: 0,
              };
              const resistantPct = dStats.resistantPercent || 0;
              const sensitivePct = 100 - resistantPct;

              return (
                <div key={drug.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {drug.name}
                      {drug.firstLine && (
                        <span className="text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                          1st Line
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {resistantPct}% Resistant
                      <span className="text-xs font-normal text-slate-500 ml-1">
                        ({sensitivePct}% Sensitive)
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        resistantPct >= 50
                          ? 'bg-rose-500'
                          : resistantPct >= 30
                          ? 'bg-[#D98E3F]'
                          : 'bg-[#5C8A6B]'
                      }`}
                      style={{ width: `${resistantPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Regional Clinical Advisory Banner */}
      <div className="genex-card p-4 bg-slate-50 border border-[#D9D4C8] space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
          <Info className="w-4 h-4 text-[#D98E3F]" />
          <span>Regional Clinical Surveillance Guidance (ICMR AMRSN Benchmark)</span>
        </div>
        <p className="leading-relaxed text-sm text-slate-600">
          High fluoroquinolone (Ciprofloxacin) resistance rates (&gt;65%) in <i>E. coli</i> isolates across North and South Indian tertiary care centers underscore the importance of reserving fluoroquinolones and prioritizing Nitrofurantoin or Fosfomycin for uncomplicated lower UTI stewardship.
        </p>
      </div>

      {/* Public Health Context & Disclaimer Box */}
      <div className="genex-card p-4 bg-slate-50 border border-[#D9D4C8] text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
          <Info className="w-4 h-4 text-[#5C8A6B]" />
          <span>Public Health & Clinical Utility Context</span>
        </div>
        <p className="leading-relaxed text-sm text-slate-600">
          Unlike hospital surveillance (which predominantly captures severe, inpatient cases), Genex regional trends capture real-time point-of-care outpatient urinary pathogen profiles. This helps clinicians understand local empirical treatment options and preserves first-line oral regimens.
        </p>
      </div>
    </div>
  );
};
