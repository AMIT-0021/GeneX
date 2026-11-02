import React, { useState, useRef } from 'react';
import { ScanStage, FrameQualityCheck, Layer2Result, Layer3Result } from '../../types/diagnostic';
import { defaultCartridgeConfig } from '../../config/cartridgeConfig';
import {
  X,
  Play,
  Sliders,
  CheckCircle2,
  Sparkles,
  FlaskConical,
  Activity,
  Microscope,
  Pill,
  ShieldCheck,
  Building2,
  User,
} from 'lucide-react';

interface VirtualCartridgeModalProps {
  stage: ScanStage;
  isOpen: boolean;
  onClose: () => void;
  onApplySimulatedFrame: (dataUrl: string, quality: FrameQualityCheck) => void;
  /** Optional: inject synthesized Layer 2 & 3 results into the BLE hook (demo mode) */
  onInjectBleData?: (l2: Layer2Result, l3: Layer3Result) => void;
}

import { CartridgePreset, PRESETS, buildSimulatedBleData } from '../../data/clinicalPresets';
export { type CartridgePreset, PRESETS, buildSimulatedBleData };

export const VirtualCartridgeModal: React.FC<VirtualCartridgeModalProps> = ({
  stage: _stage,
  isOpen,
  onClose,
  onApplySimulatedFrame,
  onInjectBleData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('icmr_aiims_esbl_ecoli');

  // Custom interactive tuner state
  const [customPyuria, setCustomPyuria] = useState<'Negative' | 'Low' | 'Moderate' | 'High'>('High');
  const [customPathogens, setCustomPathogens] = useState<string[]>(['ecoli']);
  const [customResistantDrugs, setCustomResistantDrugs] = useState<string[]>(['ciprofloxacin']);

  if (!isOpen) return null;

  const togglePathogen = (id: string) => {
    setCustomPathogens(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleResistantDrug = (id: string) => {
    setCustomResistantDrugs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  // Render synthetic photorealistic cartridge on canvas
  const renderCartridge = (
    pyuria: 'Negative' | 'Low' | 'Moderate' | 'High',
    pathogens: string[],
    resistant: string[]
  ): string => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Background (simulated medical examination surface)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle radial illumination vignette
    const radialGrad = ctx.createRadialGradient(480, 640, 120, 480, 640, 680);
    radialGrad.addColorStop(0, 'rgba(30, 41, 59, 0.6)');
    radialGrad.addColorStop(1, 'rgba(3, 7, 18, 0.9)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cartridge dimensions in frame
    const cartX = 160;
    const cartY = 160;
    const cartW = 640;
    const cartH = 960;

    // Cartridge outer drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 12;
    ctx.shadowOffsetY = 24;

    // Cartridge white/acrylic casing
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(cartX, cartY, cartW, cartH, 36);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Microfluidic embossed border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner bevel highlight
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.strokeRect(cartX + 8, cartY + 8, cartW - 16, cartH - 16);

    // Cartridge Brand & Printed Scale
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Genex Microfluidics', cartX + 40, cartY + 52);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px monospace';
    ctx.fillText('LOT #GENEX-B26-09 | EXP 2027-12 | POC-UTI', cartX + 40, cartY + 74);

    // Reference Blank Target (Top right)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cartX + cartW - 70, cartY + 60, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REF BLANK', cartX + cartW - 70, cartY + 64);

    // Capillary microfluidic channel lines
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // Main feeder line
    ctx.beginPath();
    ctx.moveTo(cartX + 40, cartY + 95);
    ctx.lineTo(cartX + cartW - 40, cartY + 95);
    ctx.stroke();

    // ----------------------------------------------------
    // LAYER 1: PUS-CELL ASSAY (Pyuria Well)
    // ----------------------------------------------------
    const pyuriaCenterX = cartX + cartW / 2;
    const pyuriaCenterY = cartY + cartH * 0.20;
    const pyuriaRadius = 52;

    // Well outer rim
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(pyuriaCenterX, pyuriaCenterY, pyuriaRadius + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Color gradient based on leukocyte esterase / azo dye reaction
    let pyuriaColor = '#fef3c7'; // Negative: OD ~ 0.02 (< 0.10)
    let pyuriaGlow = 'rgba(254, 243, 199, 0.4)';
    if (pyuria === 'Low') {
      pyuriaColor = '#d8b4fe'; // Light purple: OD ~ 0.14 (0.10 - 0.20)
      pyuriaGlow = 'rgba(216, 180, 254, 0.5)';
    } else if (pyuria === 'Moderate') {
      pyuriaColor = '#a855f7'; // Medium purple: OD ~ 0.32 (0.20 - 0.40)
      pyuriaGlow = 'rgba(168, 85, 247, 0.65)';
    } else if (pyuria === 'High') {
      pyuriaColor = '#6b21a8'; // Deep purple: OD ~ 0.55 (> 0.40)
      pyuriaGlow = 'rgba(107, 33, 168, 0.8)';
    }

    ctx.fillStyle = pyuriaColor;
    ctx.shadowColor = pyuriaGlow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(pyuriaCenterX, pyuriaCenterY, pyuriaRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = pyuria === 'High' ? '#ffffff' : '#334155';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('LAYER 1: PYURIA', pyuriaCenterX, pyuriaCenterY + 4);

    // ----------------------------------------------------
    // LAYER 2: 4-PLEX APTAMER PATHOGEN PANEL
    // ----------------------------------------------------
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LAYER 2: 4-PLEX PATHOGEN APTAMER PANEL', cartX + 40, cartY + cartH * 0.35);

    const aptamers = [
      { id: 'ecoli', label: 'A1: E. coli', relX: 0.36, relY: 0.42 },
      { id: 'klebsiella', label: 'A2: K. pneumo', relX: 0.64, relY: 0.42 },
      { id: 'proteus', label: 'A3: P. mirabilis', relX: 0.36, relY: 0.51 },
      { id: 'enterococcus', label: 'A4: E. faecalis', relX: 0.64, relY: 0.51 },
    ];

    aptamers.forEach(apt => {
      const wx = cartX + cartW * apt.relX;
      const wy = cartY + cartH * apt.relY;
      const wr = 34;
      const isDet = pathogens.includes(apt.id);

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(wx, wy, wr + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Reaction color: detected -> deep blue/indigo aptamer complex; non-detected -> clear
      const aptColor = isDet ? '#1e40af' : '#f8fafc';
      ctx.fillStyle = aptColor;
      if (isDet) {
        ctx.shadowColor = 'rgba(30, 64, 175, 0.6)';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(wx, wy, wr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isDet ? '#ffffff' : '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(apt.label, wx, wy + 3);
    });

    // ----------------------------------------------------
    // LAYER 3: AST 5 DRUGS × 4 REPLICATES GRID
    // ----------------------------------------------------
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LAYER 3: ANTIBIOTIC SUSCEPTIBILITY MATRIX (5×4)', cartX + 40, cartY + cartH * 0.61);

    const drugs = defaultCartridgeConfig.layer3.antibiotics;
    const gridStartY = cartY + cartH * 0.65;
    const rowH = (cartH * 0.30) / drugs.length;

    drugs.forEach((drug, rowIdx) => {
      const rowY = gridStartY + rowIdx * rowH + 16;
      const isResistant = resistant.includes(drug.id);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(drug.name, cartX + 40, rowY + 5);

      // 4 Replicate micro-wells per drug
      for (let rep = 1; rep <= 4; rep++) {
        const wellX = cartX + 220 + (rep - 1) * 90;
        const wellY = rowY;
        const wellRadius = 14;

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(wellX, wellY, wellRadius + 3, 0, Math.PI * 2);
        ctx.fill();

        // Sensitive -> resazurin blue (clear / inhibition); Resistant -> resorufin pink (metabolic growth)
        const wellColor = isResistant ? '#e11d48' : '#38bdf8';
        ctx.fillStyle = wellColor;
        ctx.beginPath();
        ctx.arc(wellX, wellY, wellRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`R${rep}`, wellX, wellY + 3);
      }
    });

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleApplyPreset = (preset: CartridgePreset) => {
    const dataUrl = renderCartridge(
      preset.pyuriaLevel,
      preset.detectedPathogens,
      preset.resistantDrugs
    );

    const quality: FrameQualityCheck = {
      passed: true,
      brightnessScore: 88,
      contrastScore: 84,
      sharpnessScore: 92,
      warnings: [],
    };

    // Inject BLE demo data into the hook BEFORE firing the frame so the
    // awaiting-BLE state can find the data immediately after Layer 1 resolves.
    if (onInjectBleData) {
      const { l2, l3 } = buildSimulatedBleData(
        preset.detectedPathogens,
        preset.resistantDrugs
      );
      onInjectBleData(l2, l3);
    }

    onApplySimulatedFrame(dataUrl, quality);
    onClose();
  };

  const handleApplyCustom = () => {
    const dataUrl = renderCartridge(
      customPyuria,
      customPathogens,
      customResistantDrugs
    );

    const quality: FrameQualityCheck = {
      passed: true,
      brightnessScore: 89,
      contrastScore: 82,
      sharpnessScore: 91,
      warnings: [],
    };

    // Inject BLE demo data into the hook for custom configuration
    if (onInjectBleData) {
      const { l2, l3 } = buildSimulatedBleData(customPathogens, customResistantDrugs);
      onInjectBleData(l2, l3);
    }

    onApplySimulatedFrame(dataUrl, quality);
    onClose();
  };


  const selectedPreset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      <div className="genex-card w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden shadow-lg">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-[#D98E3F]/40 flex items-center justify-center text-[#D98E3F]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Virtual Test Bench Simulator
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Generate synthetic lab-grade cartridges for instant evaluation without physical cartridges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-4 flex border-b border-slate-200 gap-2 bg-white/80 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-[#D98E3F] text-[#D98E3F] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Clinical Scenario Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-[#D98E3F] text-[#D98E3F] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Interactive Custom Tuner
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {activeTab === 'presets' ? (
            /* PRESETS LIST */
            <div className="space-y-3">
              {PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/90 border-[#D98E3F] shadow-md ring-1 ring-[#D98E3F]/40'
                        : 'bg-white border-slate-200 hover:border-[#D98E3F]/50 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#D98E3F] bg-[#D98E3F]'
                            : 'border-slate-400'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{preset.name}</h4>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono shrink-0 ${
                        preset.badgeType === 'urgent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : preset.badgeType === 'standard'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : preset.badgeType === 'complicated'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {preset.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 pl-7 leading-relaxed">
                      {preset.description}
                    </p>

                    {preset.citation && (
                      <p className="text-[10.5px] font-mono text-slate-500 pl-7 mt-1.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Source: <strong className="text-slate-700">{preset.citation}</strong></span>
                      </p>
                    )}

                    {/* Quick Specs Chips */}
                    <div className="mt-2.5 pl-7 flex flex-wrap gap-2 text-[11px] font-mono">
                      <span className="bg-slate-50 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200 shadow-xs">
                        Pyuria: <b className="text-[#D98E3F]">{preset.pyuriaLevel}</b>
                      </span>
                      <span className="bg-slate-50 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200 shadow-xs">
                        Pathogen: <b className="text-[#D98E3F]">{preset.detectedPathogens.join(', ') || 'None'}</b>
                      </span>
                      <span className="bg-slate-50 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200 shadow-xs">
                        Resistant: <b className="text-rose-600">{preset.resistantDrugs.join(', ') || 'None'}</b>
                      </span>
                      {preset.patientInfo && (
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 shadow-xs flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-700" />
                          <span><b>{preset.patientInfo.patientName}</b> ({preset.patientInfo.mrn})</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* INTERACTIVE CUSTOM TUNER */
            <div className="space-y-4">
              {/* Pyuria Severity */}
              <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200 border-t-2 border-t-[#D98E3F]">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-purple-600" />
                  Layer 1: Pyuria Level (Pus-Cells)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Negative', 'Low', 'Moderate', 'High'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCustomPyuria(lvl)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold border transition ${
                        customPyuria === lvl
                          ? 'bg-purple-100 text-purple-900 border-purple-400 shadow-xs font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-Plex Pathogen Selection */}
              <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200 border-t-2 border-t-[#D98E3F]">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Microscope className="w-3.5 h-3.5 text-[#D98E3F]" />
                  Layer 2: 4-Plex Aptamer Panel (Target Pathogens)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ecoli', name: 'A1: E. coli', gram: 'Gram (-)' },
                    { id: 'klebsiella', name: 'A2: K. pneumoniae', gram: 'Gram (-)' },
                    { id: 'proteus', name: 'A3: P. mirabilis', gram: 'Gram (-)' },
                    { id: 'enterococcus', name: 'A4: E. faecalis', gram: 'Gram (+)' },
                  ].map((p) => {
                    const isChecked = customPathogens.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePathogen(p.id)}
                        className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-amber-50 text-slate-900 border-[#D98E3F] shadow-xs font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.gram}</div>
                        </div>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-[#D98E3F] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AST Resistance Toggles */}
              <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200 border-t-2 border-t-[#D98E3F]">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Pill className="w-3.5 h-3.5 text-rose-600" />
                  Layer 3: AST Resistance Flags (Simulate Resistance)
                </label>
                <div className="space-y-1.5">
                  {defaultCartridgeConfig.layer3.antibiotics.map((ab) => {
                    const isRes = customResistantDrugs.includes(ab.id);
                    return (
                      <div
                        key={ab.id}
                        onClick={() => toggleResistantDrug(ab.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isRes
                            ? 'bg-rose-50 text-rose-900 border-rose-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-semibold">{ab.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">({ab.drugClass})</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isRes
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isRes ? 'Resistant' : 'Sensitive'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#5C8A6B]" />
            <span>High-Fidelity Synthetic Optical Simulation</span>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'presets') {
                handleApplyPreset(selectedPreset);
              } else {
                handleApplyCustom();
              }
            }}
            className="w-full sm:w-auto py-2.5 px-6 genex-btn-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            Load &amp; Process Selected Cartridge
          </button>
        </div>
      </div>
    </div>
  );
};
