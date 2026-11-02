import React, { useState } from 'react';
import { ScanStage } from '../../types/diagnostic';
import { Activity, Microscope, Pill, CheckCircle2, Info } from 'lucide-react';

interface MicrofluidicCartridgeDiagramProps {
  currentStage: ScanStage | 'report';
  onSelectStage?: (stage: ScanStage) => void;
  className?: string;
}

export const MicrofluidicCartridgeDiagram: React.FC<MicrofluidicCartridgeDiagramProps> = ({
  currentStage,
  onSelectStage,
  className = '',
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isStageActive = (stage: ScanStage) => currentStage === stage || currentStage === 'full';

  return (
    <div className={`w-full genex-card p-3 sm:p-4 bg-white shadow-xs relative select-none ${className}`}>
      {/* Header with Title & Live Stage Indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#5C8A6B] animate-pulse" />
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            3-Layer Microfluidic Cartridge Schematic
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-[#D9D4C8] text-slate-700 font-semibold">
          ISO-13485 Spec
        </span>
      </div>

      {/* SVG Isometric Cartridge Illustration */}
      <div className="relative w-full aspect-[2.1/1] min-h-[160px] max-h-[220px] flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50/80 to-slate-100/60 border border-slate-200/80">
        {/* Fluid capillary pulse styling */}
        <svg
          viewBox="0 0 600 280"
          className="w-full h-full object-contain filter drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Fluid gradient for sample inlet to chamber 1 */}
            <linearGradient id="fluidFlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D98E3F" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#5C8A6B" stopOpacity="0.95" />
            </linearGradient>

            {/* Glowing filter for aptamer fluorescence */}
            <filter id="fluoGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cartridge 3D bevel gradient */}
            <linearGradient id="cartridgeBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          {/* Isometric Cartridge Body */}
          {/* Bottom shadow / depth base */}
          <polygon
            points="140,240 500,160 480,50 120,130"
            fill="#CBD5E1"
            opacity="0.6"
          />

          {/* Cartridge Main Substrate Slab */}
          <polygon
            points="130,230 490,150 470,40 110,120"
            fill="url(#cartridgeBody)"
            stroke="#94A3B8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Acrylic top glass reflection line */}
          <polygon
            points="135,222 482,145 465,48 118,124"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* ── SAMPLE LOADING PORT (Inlet) ── */}
          <g
            className="cursor-pointer group"
            onMouseEnter={() => setActiveTooltip('Sample Loading Port: Micro-capillary inlet (100µL whole urine)')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Port Ring */}
            <ellipse cx="150" cy="140" rx="14" ry="9" fill="#F1F5F9" stroke="#D98E3F" strokeWidth="2.5" />
            <ellipse cx="150" cy="140" rx="8" ry="5" fill="#D98E3F" opacity="0.9" />
            <text x="150" y="165" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="700" fontFamily="sans-serif">
              Inlet (100µL)
            </text>
          </g>

          {/* Microfluidic Capillary Channel 1 (Inlet to Layer 1) */}
          <path
            d="M162,143 C180,148 190,155 205,160"
            stroke="#D98E3F"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="4 2"
          />

          {/* ── CHAMBER 1: PYURIA OPTICAL DENSITY (LE / NITRITE) ── */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSelectStage?.('layer1')}
            onMouseEnter={() => setActiveTooltip('Chamber 1: Pyuria Optical Density filter (Leukocyte Esterase & Nitrite)')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Chamber Well Cutout */}
            <ellipse
              cx="230"
              cy="165"
              rx="24"
              ry="16"
              fill={isStageActive('layer1') ? '#D98E3F' : '#F8FAFC'}
              stroke={isStageActive('layer1') ? '#B85A2C' : '#CBD5E1'}
              strokeWidth="2.5"
              filter={isStageActive('layer1') ? 'url(#fluoGlow)' : undefined}
            />
            {/* Inner fluid fill indicator */}
            <ellipse cx="230" cy="165" rx="14" ry="9" fill="#FFFBEB" opacity="0.6" />
            <circle cx="230" cy="165" r="3" fill="#D98E3F" />
            <text x="230" y="196" textAnchor="middle" fill="#1E293B" fontSize="9" fontWeight="800" fontFamily="sans-serif">
              1. Pyuria OD
            </text>
            <text x="230" y="206" textAnchor="middle" fill="#64748B" fontSize="7.5" fontWeight="600" fontFamily="sans-serif">
              WBC Density
            </text>
          </g>

          {/* Capillary Channel 2 (Chamber 1 to Chamber 2) */}
          <path
            d="M254,163 C275,155 295,145 315,135"
            stroke="url(#fluidFlow)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── CHAMBER 2: 4-PLEX FLUORESCENT APTAMER ARRAY ── */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSelectStage?.('layer2')}
            onMouseEnter={() => setActiveTooltip('Chamber 2: 4-Plex Aptamer Panel (E. coli, K. pneumo, Proteus, E. faecalis)')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Chamber Base Plate */}
            <polygon
              points="300,145 375,115 360,75 285,105"
              fill={isStageActive('layer2') ? '#ECFDF5' : '#F1F5F9'}
              stroke={isStageActive('layer2') ? '#5C8A6B' : '#CBD5E1'}
              strokeWidth="2"
              rx="6"
            />

            {/* Aptamer Micro-Wells Matrix (2x3 isometric grid) */}
            {/* Row 1 (Excited / Detected - E. coli glowing green) */}
            <circle cx="310" cy="120" r="5.5" fill="#22C55E" filter="url(#fluoGlow)" stroke="#15803D" strokeWidth="1.2" />
            <circle cx="325" cy="113" r="5.5" fill="#22C55E" filter="url(#fluoGlow)" stroke="#15803D" strokeWidth="1.2" />
            <circle cx="340" cy="106" r="5.5" fill="#22C55E" filter="url(#fluoGlow)" stroke="#15803D" strokeWidth="1.2" />

            {/* Row 2 (Unreactive Baseline Wells) */}
            <circle cx="325" cy="132" r="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="340" cy="125" r="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="355" cy="118" r="5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />

            <text x="330" y="65" textAnchor="middle" fill="#1E293B" fontSize="9" fontWeight="800" fontFamily="sans-serif">
              2. Aptamer Array
            </text>
            <text x="330" y="75" textAnchor="middle" fill="#15803D" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">
              [E. coli Positive]
            </text>
          </g>

          {/* Capillary Channel 3 (Chamber 2 to Chamber 3) */}
          <path
            d="M375,105 C400,95 410,90 425,85"
            stroke="#5C8A6B"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* ── CHAMBER 3: ELECTROCHEMICAL AST ARRAY (Gold microelectrodes) ── */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSelectStage?.('layer3')}
            onMouseEnter={() => setActiveTooltip('Chamber 3: Electrochemical AST array (Interdigitated microelectrodes)')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* AST Array Chamber Substrate */}
            <polygon
              points="415,95 465,75 455,45 405,65"
              fill={isStageActive('layer3') ? '#FFFBEB' : '#F8FAFC'}
              stroke={isStageActive('layer3') ? '#D98E3F' : '#CBD5E1'}
              strokeWidth="2"
            />

            {/* Gold Interdigitated Electrode Finger Traces */}
            <line x1="420" y1="88" x2="455" y2="73" stroke="#D97706" strokeWidth="1.2" />
            <line x1="418" y1="82" x2="453" y2="67" stroke="#D97706" strokeWidth="1.2" />
            <line x1="416" y1="76" x2="451" y2="61" stroke="#D97706" strokeWidth="1.2" />
            <line x1="414" y1="70" x2="449" y2="55" stroke="#D97706" strokeWidth="1.2" />

            <text x="435" y="40" textAnchor="middle" fill="#1E293B" fontSize="9" fontWeight="800" fontFamily="sans-serif">
              3. Electro AST
            </text>
            <text x="435" y="49" textAnchor="middle" fill="#64748B" fontSize="7.5" fontWeight="600" fontFamily="sans-serif">
              Antibiotic Panel
            </text>
          </g>

          {/* Cartridge Branding Mark */}
          <text x="310" y="215" textAnchor="middle" fill="#94A3B8" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1">
            GENEX
          </text>
        </svg>

        {/* Dynamic Tooltip on Hover/Tap */}
        {activeTooltip && (
          <div className="absolute bottom-2 inset-x-4 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[11px] font-mono text-center shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {activeTooltip}
          </div>
        )}
      </div>

      {/* Interactive Step Navigator Pills */}
      <div className="grid grid-cols-3 gap-2 mt-2.5">
        {/* Step 1 Pill */}
        <button
          onClick={() => onSelectStage?.('layer1')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold transition ${
            currentStage === 'layer1'
              ? 'bg-amber-50 text-[#D98E3F] border-[#D98E3F]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-[#D98E3F]" />
          <span className="truncate">1. Pyuria OD</span>
        </button>

        {/* Step 2 Pill */}
        <button
          onClick={() => onSelectStage?.('layer2')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold transition ${
            currentStage === 'layer2'
              ? 'bg-emerald-50 text-[#5C8A6B] border-[#5C8A6B]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Microscope className="w-3.5 h-3.5 text-[#5C8A6B]" />
          <span className="truncate">2. Aptamers</span>
        </button>

        {/* Step 3 Pill */}
        <button
          onClick={() => onSelectStage?.('layer3')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold transition ${
            currentStage === 'layer3'
              ? 'bg-amber-50 text-[#D98E3F] border-[#D98E3F]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Pill className="w-3.5 h-3.5 text-[#D98E3F]" />
          <span className="truncate">3. AST Array</span>
        </button>
      </div>
    </div>
  );
};
