import React from 'react';
import { LensMarkLogo } from './LensMarkLogo';
import {
  X,
  ShieldAlert,
  Info,
  Sliders,
  Cpu,
  BookOpen,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWalkthrough?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onLaunchWalkthrough,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="genex-card bg-white w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D9D4C8] flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <LensMarkLogo size={36} className="shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                About & Troubleshooting Diagnostics
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Genex Platform • Version 1.1.0-BLE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-sm leading-relaxed">
          {/* Status Callout Banner */}
          <div className="p-3.5 bg-amber-50/90 rounded-xl border border-[#D98E3F] flex items-start gap-3">
            <Info className="w-5 h-5 text-[#D98E3F] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 text-xs mb-1">
                Research Prototype Status
              </p>
              <p className="text-amber-900 text-sm font-medium leading-relaxed">
                This is a research prototype. Pathogen and resistance classification currently uses a threshold-based heuristic model, not a clinically validated trained model.
              </p>
            </div>
          </div>

          {/* Technical Architecture Overview */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#5C8A6B]" />
              Hybrid Detection Architecture
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-[#D9D4C8] space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-slate-900">Layer 1 (Pus-Cells):</span>
                <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">On-Device Camera</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-slate-900">Layer 2 (Pathogen ID):</span>
                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Hardware Reader via BLE</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-slate-900">Layer 3 (AST Susceptibility):</span>
                <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">Hardware Reader via BLE</span>
              </div>
            </div>
          </div>

          {/* Known Limitations */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#D98E3F]" />
              Known Limitations & Guidance
            </h4>
            <ul className="space-y-2 text-slate-600 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#D98E3F] font-bold">•</span>
                <span><b>Lighting Sensitivity:</b> Camera-based pyuria scoring relies on consistent ambient lighting. Avoid direct glare or shadows over the microfluidic reticle.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D98E3F] font-bold">•</span>
                <span><b>Hardware Reader Availability:</b> Electrochemical BLE reader hardware is an in-progress hardware workstream. Use the built-in <b>Demo Mode Simulator</b> for offline software testing.</span>
              </li>
            </ul>
          </div>

          {/* Medical & Clinical Disclaimer */}
          <div className="p-3.5 bg-slate-100 rounded-xl border border-[#D9D4C8] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-slate-700" />
              <span>Medical Disclaimer</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              The results provided by this application are for research and investigative demonstration purposes only. They do not constitute formal medical diagnosis or treatment advice. Always consult a qualified healthcare professional before making any medical decisions.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#D9D4C8] bg-slate-50/80 flex items-center justify-between gap-3">
          {onLaunchWalkthrough && (
            <button
              onClick={() => {
                onClose();
                onLaunchWalkthrough();
              }}
              className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4 text-[#5C8A6B]" />
              <span>Launch Guided Walkthrough</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#5C8A6B] hover:bg-[#4d755a] text-white font-bold text-xs shadow-xs transition ml-auto"
          >
            Close Troubleshooting
          </button>
        </div>
      </div>
    </div>
  );
};
