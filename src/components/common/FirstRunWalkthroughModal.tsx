import React, { useState } from 'react';
import { LensMarkLogo } from './LensMarkLogo';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Camera,
  Cpu,
  Pill,
} from 'lucide-react';

interface FirstRunWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstRunWalkthroughModal: React.FC<FirstRunWalkthroughModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Welcome to Genex",
      subtitle: "Point-of-care UTI diagnostics platform",
      icon: <LensMarkLogo size={48} className="shrink-0" />,
      tag: "OVERVIEW",
      content: (
        <div className="space-y-3">
          <p className="text-slate-700 text-xs leading-relaxed">
            Genex combines smartphone computer vision with portable hardware sensing to provide rapid, point-of-care Urinary Tract Infection (UTI) analysis in under 5 minutes.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-2.5 bg-slate-50 border border-[#D9D4C8] rounded-xl text-center">
              <span className="text-xs font-mono font-bold text-[#D98E3F] block">LAYER 1</span>
              <span className="text-xs font-bold text-slate-800">Pyuria (WBC)</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-[#D9D4C8] rounded-xl text-center">
              <span className="text-xs font-mono font-bold text-[#5C8A6B] block">LAYER 2</span>
              <span className="text-xs font-bold text-slate-800">Pathogen ID</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-[#D9D4C8] rounded-xl text-center">
              <span className="text-xs font-mono font-bold text-purple-600 block">LAYER 3</span>
              <span className="text-xs font-bold text-slate-800">AST Viability</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Layer 1: Pyuria Optical Scanning",
      subtitle: "Smartphone camera pus-cell detection",
      icon: <Camera className="w-10 h-10 text-[#D98E3F]" />,
      tag: "CAMERA ANALYSIS",
      content: (
        <div className="space-y-3">
          <p className="text-slate-700 text-sm leading-relaxed">
            The smartphone camera scans the central Leukocyte Esterase chromogenic chamber on the cartridge to quantify White Blood Cell (pus cell) density and assess initial infection severity.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">✨ How to position your camera:</p>
            <p className="leading-relaxed">Align the cartridge reticle within the viewfinder. The on-device engine automatically checks focus, glare, and centering.</p>
          </div>
        </div>
      ),
    },
    {
      title: "Layer 2: 4-Plex Pathogen Identification",
      subtitle: "Hardware reader BLE transmission",
      icon: <Cpu className="w-10 h-10 text-[#5C8A6B]" />,
      tag: "PATHOGEN PANEL",
      content: (
        <div className="space-y-3">
          <p className="text-slate-700 text-sm leading-relaxed">
            The external reader hardware measures electrochemical aptamer binding signals for 4 key uropathogens: <b>E. coli</b>, <b>K. pneumoniae</b>, <b>P. mirabilis</b>, and <b>E. faecalis</b>.
          </p>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold">📡 BLE Connectivity:</p>
            <p className="leading-relaxed">Data streams securely over Bluetooth Low Energy directly into the report compiler without manual data entry.</p>
          </div>
        </div>
      ),
    },
    {
      title: "Layer 3: AST Antibiotic Susceptibility",
      subtitle: "Targeted first-line treatment guidance",
      icon: <Pill className="w-10 h-10 text-purple-600" />,
      tag: "SUSCEPTIBILITY MATRIX",
      content: (
        <div className="space-y-3">
          <p className="text-slate-700 text-sm leading-relaxed">
            Layer 3 measures bacterial viability across 5 first-line UTI antibiotics to classify each drug as <b>Sensitive</b> or <b>Resistant</b>, surfacing immediate targeted stewardship recommendations.
          </p>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
            <p className="font-bold">🛡️ Patient Health & AMR Protection:</p>
            <p className="leading-relaxed">Cross-references patient vault allergies and past recurrence patterns to protect against antimicrobial resistance.</p>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="genex-card bg-white w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D9D4C8] flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            {current.icon}
            <div>
              <span className="text-xs font-mono font-bold text-[#D98E3F] tracking-wider uppercase block">
                {current.tag} • STEP {currentSlide + 1} OF {slides.length}
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="p-5 sm:p-6 min-h-[220px] flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">{current.subtitle}</p>
            {current.content}
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-6 bg-[#D98E3F]'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#D9D4C8] bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 transition px-2 py-1"
          >
            Skip Walkthrough
          </button>

          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-[#D98E3F] hover:bg-[#c47d32] text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#5C8A6B] hover:bg-[#4d755a] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
