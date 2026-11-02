import React, { useState } from 'react';
import { CalibrationData } from '../../types/diagnostic';
import { StorageService } from '../../services/storageService';
import { Sliders, X, Check, RefreshCw, SunMedium, ShieldCheck } from 'lucide-react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCalibration: CalibrationData;
  onCalibrationUpdated: (newCalib: CalibrationData) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  currentCalibration,
  onCalibrationUpdated,
}) => {
  const [blankR, setBlankR] = useState<number>(currentCalibration.blankRgb.r);
  const [blankG, setBlankG] = useState<number>(currentCalibration.blankRgb.g);
  const [blankB, setBlankB] = useState<number>(currentCalibration.blankRgb.b);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: CalibrationData = {
      isCalibrated: true,
      calibratedAt: new Date().toISOString(),
      blankRgb: { r: blankR, g: blankG, b: blankB },
      ambientLuminance: Math.round(0.299 * blankR + 0.587 * blankG + 0.114 * blankB),
      deviceId: currentCalibration.deviceId || 'DEV-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
    };

    StorageService.saveCalibration(updated);
    onCalibrationUpdated(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleResetDefaults = () => {
    setBlankR(242);
    setBlankG(242);
    setBlankB(242);
  };

  const currentLuminance = Math.round(0.299 * blankR + 0.587 * blankG + 0.114 * blankB);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 border-t-[3px] border-t-[#D98E3F] border-b-[3px] border-b-[#5C8A6B] w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D98E3F]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Sensor Calibration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Normalize for phone lens characteristics and ambient room lighting
            </p>
          </div>
        </div>

        {/* Status Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl border border-slate-300 shadow-inner flex items-center justify-center"
              style={{ backgroundColor: `rgb(${blankR}, ${blankG}, ${blankB})` }}
            >
              <SunMedium className="w-5 h-5 text-slate-600 mix-blend-difference" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Baseline Reference Substrate
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                RGB({blankR}, {blankG}, {blankB}) • Lum: {currentLuminance}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            {currentCalibration.isCalibrated ? 'ACTIVE' : 'DEFAULT'}
          </span>
        </div>

        {/* Sliders for fine-tuning blank reference */}
        <div className="space-y-3 mb-6">
          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span>Red Channel (R)</span>
              <span className="font-mono text-rose-600">{blankR}</span>
            </div>
            <input
              type="range"
              min="180"
              max="255"
              value={blankR}
              onChange={(e) => setBlankR(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span>Green Channel (G)</span>
              <span className="font-mono text-emerald-600">{blankG}</span>
            </div>
            <input
              type="range"
              min="180"
              max="255"
              value={blankG}
              onChange={(e) => setBlankG(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-700 mb-1">
              <span>Blue Channel (B)</span>
              <span className="font-mono text-sky-600">{blankB}</span>
            </div>
            <input
              type="range"
              min="180"
              max="255"
              value={blankB}
              onChange={(e) => setBlankB(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-slate-300"
            title="Reset to factory baseline"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={isSaved}
            className="flex-1 py-3 px-4 genex-btn-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-98"
          >
            {isSaved ? (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                Saved to Device
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-white" />
                Store Device Calibration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
