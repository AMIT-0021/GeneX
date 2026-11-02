import React from 'react';
import { AmrAnonymizerService } from '../../services/amrAnonymizerService';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  Lock,
  Globe,
  Info,
} from 'lucide-react';

interface AmrConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentChange?: (consent: boolean) => void;
}

export const AmrConsentModal: React.FC<AmrConsentModalProps> = ({
  isOpen,
  onClose,
  onConsentChange,
}) => {
  if (!isOpen) return null;

  const isConsented = AmrAnonymizerService.getUserConsent();

  const handleToggleConsent = (granted: boolean) => {
    AmrAnonymizerService.setUserConsent(granted);
    if (onConsentChange) {
      onConsentChange(granted);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="genex-card w-full max-w-lg p-5 sm:p-6 bg-white border border-[#D9D4C8] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-[#5C8A6B]/40 flex items-center justify-center text-[#5C8A6B] shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Anonymized AMR Surveillance Consent
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Public health crowdsourced resistance mapping — 100% Privacy Preserved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Body */}
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          Genex allows you to voluntarily contribute anonymized test findings to a public health surveillance map. Your data helps clinicians track local antibiotic resistance trends in real time.
        </p>

        {/* Auditable Data Boundary Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Shared */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px] uppercase font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>WHAT IS SHARED</span>
            </div>
            <ul className="text-[11px] text-slate-700 space-y-1 font-sans">
              <li>• Target pathogen ID (e.g. E. coli)</li>
              <li>• Resistance status (Sensitive/Resistant)</li>
              <li>• Coarse region (e.g. Delhi NCR, Punjab)</li>
              <li>• Scan timestamp</li>
            </ul>
          </div>

          {/* Never Shared */}
          <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-900 font-bold text-[11px] uppercase font-mono">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>WHAT IS NEVER SHARED</span>
            </div>
            <ul className="text-[11px] text-slate-700 space-y-1 font-sans">
              <li>• Your name or MRN number</li>
              <li>• Device ID or IP address</li>
              <li>• Exact GPS coordinates or home address</li>
              <li>• Patient profile or medical records</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-[#D98E3F] shrink-0 mt-0.5" />
          <span>
            <b>Privacy Guarantee:</b> Data stripping occurs locally on your device prior to any submission. You can toggle this setting off anytime.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
          <button
            onClick={() => handleToggleConsent(false)}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border transition ${
              !isConsented
                ? 'bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Keep Data Private (Opt-Out)
          </button>
          <button
            onClick={() => handleToggleConsent(true)}
            className="w-full sm:w-auto px-5 py-2 genex-btn-primary text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Opt-In & Enable Anonymous Sharing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
