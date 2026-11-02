import React from 'react';
import { defaultCartridgeConfig } from '../../config/cartridgeConfig';
import { X, Settings2, Sliders, Shield, AlertCircle } from 'lucide-react';

interface ConfigInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigInspectorModal: React.FC<ConfigInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white border border-slate-200 border-t-[3px] border-t-[#D98E3F] border-b-[3px] border-b-[#5C8A6B] w-full max-w-xl rounded-2xl p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D98E3F]">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cartridge Config & Thresholds</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Config-driven threshold specifications for clinical recalibration
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 mb-4 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-600">Spec Version: <b className="text-[#D98E3F]">{defaultCartridgeConfig.version}</b></span>
          <span className="text-slate-600">Updated: <b className="text-slate-900">{defaultCartridgeConfig.lastUpdated}</b></span>
        </div>

        {/* Scrollable Sections */}
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Quality Thresholds */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-2 border-t-[#D98E3F]">
            <h4 className="text-xs font-bold text-[#D98E3F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Capture Quality Assurance Filter
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500">Min/Max Luminance:</span>
                <p className="font-mono text-slate-900 font-bold">
                  {defaultCartridgeConfig.qualityThresholds.minBrightness} - {defaultCartridgeConfig.qualityThresholds.maxBrightness} / 255
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500">Min Contrast StdDev:</span>
                <p className="font-mono text-slate-900 font-bold">
                  {defaultCartridgeConfig.qualityThresholds.minContrastRatio}
                </p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 col-span-2">
                <span className="text-slate-500">Laplacian Sharpness Filter (Blur Cutoff):</span>
                <p className="font-mono text-slate-900 font-bold">
                  σ²(∇²I) ≥ {defaultCartridgeConfig.qualityThresholds.minSharpnessVariance}
                </p>
              </div>
            </div>
          </div>

          {/* Layer 1 Pyuria Cutoffs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-2 border-t-[#D98E3F]">
            <h4 className="text-xs font-bold text-[#D98E3F] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Layer 1: Pyuria Optical Density Bounds
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-emerald-700 font-semibold">Negative (Normal)</span>
                <span className="font-mono text-slate-700">OD &lt; {defaultCartridgeConfig.layer1.thresholds.negativeMaxOD}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-sky-700 font-semibold">Low Pyuria</span>
                <span className="font-mono text-slate-700">OD {defaultCartridgeConfig.layer1.thresholds.negativeMaxOD} - {defaultCartridgeConfig.layer1.thresholds.lowMaxOD}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-amber-700 font-semibold">Moderate Pyuria</span>
                <span className="font-mono text-slate-700">OD {defaultCartridgeConfig.layer1.thresholds.lowMaxOD} - {defaultCartridgeConfig.layer1.thresholds.moderateMaxOD}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-rose-700 font-semibold">High / Acute Pyuria</span>
                <span className="font-mono text-slate-700">OD &gt; {defaultCartridgeConfig.layer1.thresholds.moderateMaxOD}</span>
              </div>
            </div>
          </div>

          {/* Layer 2 Pathogen Cutoffs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-2 border-t-[#D98E3F]">
            <h4 className="text-xs font-bold text-[#D98E3F] uppercase tracking-wider mb-2">
              Layer 2: 4-Plex Aptamer Cutoffs
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {defaultCartridgeConfig.layer2.targets.map((t) => (
                <div key={t.id} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <span className="text-[10px] text-slate-500 block">{t.gram}</span>
                  </div>
                  <span className="font-mono text-[#D98E3F] font-semibold text-[11px] mt-1">
                    Threshold: OD ≥ {t.thresholdOD}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Layer 3 AST Cutoffs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-t-2 border-t-[#D98E3F]">
            <h4 className="text-xs font-bold text-[#D98E3F] uppercase tracking-wider mb-2">
              Layer 3: AST Viability Thresholds (4× Replicates)
            </h4>
            <div className="space-y-1.5 text-xs">
              {defaultCartridgeConfig.layer3.antibiotics.map((ab) => (
                <div key={ab.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-900">{ab.name}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({ab.drugClass})</span>
                  </div>
                  <span className="font-mono text-slate-700 text-[11px]">
                    Sens: OD ≤ {ab.susceptibleMaxOD}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#5C8A6B] shrink-0" />
          <span>
            Thresholds can be updated via JSON without recompiling the application binary, enabling seamless multi-center clinical trials.
          </span>
        </div>
      </div>
    </div>
  );
};
