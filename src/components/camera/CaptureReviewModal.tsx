import React from 'react';
import { ScanStage, FrameQualityCheck } from '../../types/diagnostic';
import { getRoisForStage } from '../../cv/zoneSampler';
import {
  Check,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Sun,
  Contrast,
  Focus,
  Maximize2
} from 'lucide-react';

interface CaptureReviewModalProps {
  stage: ScanStage;
  capturedImageUrl: string;
  quality: FrameQualityCheck;
  onAccept: () => void;
  onRetake: () => void;
  onEnterDemo?: () => void;
  retakeCount?: number;
}

export const CaptureReviewModal: React.FC<CaptureReviewModalProps> = ({
  stage,
  capturedImageUrl,
  quality,
  onAccept,
  onRetake,
  onEnterDemo,
  retakeCount = 0,
}) => {
  const rois = getRoisForStage(stage);
  const showDemoSuggestion = retakeCount >= 2 && !quality.passed;

  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto animate-fade-in select-none text-slate-900">
      {/* Top Header */}
      <div className="w-full max-w-lg flex items-center justify-between py-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D98E3F]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
              Review Captured Frame
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Validate cartridge zone alignment & optical illumination before AI inference
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-mono text-[#D98E3F] font-semibold">
          <Maximize2 className="w-3 h-3" />
          <span>FHD STILL</span>
        </div>
      </div>

      {/* Main Image Review with Sampling Zone Overlays */}
      <div className="relative w-full max-w-lg my-3 rounded-2xl overflow-hidden shadow-xl border border-slate-300 bg-slate-900 flex items-center justify-center group">
        <img
          src={capturedImageUrl}
          alt="Captured Cartridge Still"
          className="w-full h-auto max-h-[46vh] object-contain"
        />

        {/* Highlighted ROIs Overlay on Still Image */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {rois.map((roi) => (
              <g key={roi.id}>
                {/* Outer focus halo */}
                <circle
                  cx={roi.relX * 100}
                  cy={roi.relY * 100}
                  r={roi.relRadius * 100 + 1}
                  stroke="#D98E3F"
                  strokeWidth="0.5"
                  strokeDasharray="1.5 1.5"
                  fill="none"
                  opacity="0.7"
                />
                {/* Inner sampling circle */}
                <circle
                  cx={roi.relX * 100}
                  cy={roi.relY * 100}
                  r={roi.relRadius * 100}
                  stroke="#5C8A6B"
                  strokeWidth="0.8"
                  fill="rgba(92, 138, 107, 0.25)"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Overlay Sampling Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-semibold text-slate-800 border border-slate-300 shadow-md flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D98E3F]"></span>
          <span>{rois.length} OPTICAL ZONES SAMPLED</span>
        </div>
      </div>

      {/* Quality Check Telemetry & Metrics Card */}
      <div className="w-full max-w-lg space-y-2.5 mb-3">
        <div className="bg-white border border-slate-200 border-t-2 border-t-[#D98E3F] border-b-2 border-b-[#5C8A6B] rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              {quality.passed ? (
                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <span className="font-bold text-slate-900">
                {quality.passed ? "Optical Quality Verified" : "Optical Advisory Notice"}
              </span>
            </div>

            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              quality.passed
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {quality.passed ? "READY FOR INFERENCE" : "SUB-OPTIMAL FRAME"}
            </span>
          </div>

          {/* 3 Telemetry Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 mt-2.5">
            {/* Brightness */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-mono text-slate-500 mb-1">
                <Sun className="w-3 h-3 text-amber-600" />
                <span>BRIGHTNESS</span>
              </div>
              <div className="text-sm font-mono font-black text-slate-900">
                {quality.brightnessScore}%
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, quality.brightnessScore)}%` }}
                ></div>
              </div>
            </div>

            {/* Contrast */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-mono text-slate-500 mb-1">
                <Contrast className="w-3 h-3 text-[#D98E3F]" />
                <span>CONTRAST</span>
              </div>
              <div className="text-sm font-mono font-black text-slate-900">
                {quality.contrastScore}%
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#D98E3F] h-full rounded-full"
                  style={{ width: `${Math.min(100, quality.contrastScore)}%` }}
                ></div>
              </div>
            </div>

            {/* Sharpness */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-mono text-slate-500 mb-1">
                <Focus className="w-3 h-3 text-[#5C8A6B]" />
                <span>SHARPNESS</span>
              </div>
              <div className="text-sm font-mono font-black text-slate-900">
                {quality.sharpnessScore}%
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#5C8A6B] h-full rounded-full"
                  style={{ width: `${Math.min(100, quality.sharpnessScore)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings list (if any) */}
        {!quality.passed && quality.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1.5 shadow-sm">
            {quality.warnings.map((w, idx) => (
              <p key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}

        {/* Proactive Demo Mode Recommendation after 2+ retakes */}
        {showDemoSuggestion && onEnterDemo && (
          <div className="bg-emerald-50 border border-[#5C8A6B] rounded-xl p-3.5 text-xs text-emerald-900 space-y-2 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="w-4 h-4 text-[#5C8A6B]" />
              <span>Having trouble getting a clear photo?</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Lighting or lens glare can affect camera optical scoring. You can switch to <b>Demo Mode</b> to run fully calibrated diagnostic scenarios instantly.
            </p>
            <button
              onClick={onEnterDemo}
              className="px-3 py-1.5 bg-[#5C8A6B] hover:bg-[#4d755a] text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <span>Launch Demo Mode Simulator</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons: Retake vs Accept */}
      <div className="w-full max-w-lg flex items-center gap-3 pt-2 border-t border-slate-200">
        <button
          onClick={onRetake}
          className="flex-1 py-3 px-4 genex-btn-secondary font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
        >
          <RotateCcw className="w-4 h-4 text-slate-600" />
          Retake Photo {retakeCount > 0 ? `(${retakeCount})` : ''}
        </button>

        <button
          onClick={onAccept}
          className="flex-1 py-3 px-4 genex-btn-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 text-white"
        >
          <Check className="w-4 h-4 text-white" />
          Accept & Run AI Engine
        </button>
      </div>
    </div>
  );
};
