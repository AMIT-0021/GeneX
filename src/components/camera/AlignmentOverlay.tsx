import React from 'react';
import { ScanStage } from '../../types/diagnostic';
import { getRoisForStage } from '../../cv/zoneSampler';
import { Crosshair, Sun } from 'lucide-react';

interface AlignmentOverlayProps {
  stage: ScanStage;
  frameWidth: number;
  frameHeight: number;
  ambientLux?: number;
  isAligned?: boolean;
}

export const AlignmentOverlay: React.FC<AlignmentOverlayProps> = ({
  stage,
  frameWidth,
  frameHeight,
  ambientLux = 242,
  isAligned = true,
}) => {
  const rois = getRoisForStage(stage);

  const safeWidth = Math.max(frameWidth || 360, 240);
  const safeHeight = Math.max(frameHeight || 480, 320);

  // Cartridge bounding frame dimensions in center of viewfinder
  const boxWidth = Math.min(safeWidth * 0.86, 360);
  const boxHeight = stage === 'layer3' || stage === 'full'
    ? Math.min(safeHeight * 0.74, 460)
    : Math.min(safeHeight * 0.65, 360);

  const startX = (safeWidth - boxWidth) / 2;
  const startY = (safeHeight - boxHeight) / 2;

  const stageTitles: Record<ScanStage, { title: string; subtitle: string; code: string }> = {
    calibration: {
      code: "STAGE 0: CALIBRATION",
      title: "Sensor & Substrate Calibration",
      subtitle: "Align unreacted reference zone within the central reticle",
    },
    layer1: {
      code: "STAGE 1: PUS-CELL ASSAY",
      title: "Pyuria Severity Zone (WBCs)",
      subtitle: "Center circular leukocyte esterase chromogenic chamber",
    },
    layer2: {
      code: "STAGE 2: PATHOGEN PANEL",
      title: "4-Plex Aptamer Identification",
      subtitle: "Align A1 (E. coli), A2 (K. pneumo), A3 (Proteus), A4 (E. faecalis)",
    },
    layer3: {
      code: "STAGE 3: AST VIABILITY",
      title: "Antibiotic Susceptibility Matrix",
      subtitle: "Align 5 drugs × 4 replicates micro-well incubation array",
    },
    full: {
      code: "SINGLE-SHOT MULTIPLEX",
      title: "Complete Microfluidic Cartridge",
      subtitle: "Align full cartridge outer boundary inside optical frame",
    },
    patient_dashboard: {
      code: "PATIENT DASHBOARD",
      title: "Patient Health Vault",
      subtitle: "Personal health records and visit history",
    },
    regional_trends: {
      code: "REGIONAL SURVEILLANCE",
      title: "AMR Intelligence & Antibiograms",
      subtitle: "Crowdsourced population resistance analytics",
    },
  };

  const { title, subtitle, code } = stageTitles[stage];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-3 sm:p-4 select-none">
      {/* Top Banner Guide - High Tech Pill */}
      <div className="w-full flex items-start justify-between z-10">
        <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-left shadow-lg">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`w-2 h-2 rounded-full ${isAligned ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <p className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">
              {code}
            </p>
          </div>
          <h3 className="text-xs font-bold text-white tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">{subtitle}</p>
        </div>

        {/* HUD Live Lux Sensor Meter Widget (From Design 1 Mockup) */}
        <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-emerald-500/40 text-right shadow-lg flex flex-col items-end">
          {/* Signal bars */}
          <div className="flex items-center gap-0.5 mb-0.5">
            <div className="w-1.5 h-2 rounded-xs bg-emerald-500"></div>
            <div className="w-1.5 h-2.5 rounded-xs bg-emerald-500"></div>
            <div className="w-1.5 h-3 rounded-xs bg-emerald-500"></div>
            <div className="w-1.5 h-3.5 rounded-xs bg-emerald-500"></div>
            <div className="w-1.5 h-3 rounded-xs bg-emerald-400"></div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-white">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>{ambientLux} Lux</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-400 leading-none">
            [Optimal]
          </span>
        </div>
      </div>

      {/* SVG Alignment Guides & Futuristic HUD Overlay */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Outer mask for spotlight cutout */}
          <mask id="overlay-mask">
            <rect width={safeWidth} height={safeHeight} fill="white" />
            <rect
              x={startX}
              y={startY}
              width={boxWidth}
              height={boxHeight}
              rx={18}
              fill="black"
            />
          </mask>

          {/* Glowing Green HUD gradient */}
          <linearGradient id="hudGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Ambient Laser Gradient */}
          <linearGradient id="bracket-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D98E3F" />
            <stop offset="100%" stopColor="#5C8A6B" />
          </linearGradient>
        </defs>

        {/* Semi-transparent Dimmed Vignette Mask */}
        <rect
          width={safeWidth}
          height={safeHeight}
          fill="rgba(0, 0, 0, 0.45)"
          mask="url(#overlay-mask)"
        />

        {/* Subtle Bounding Box Border */}
        <rect
          x={startX}
          y={startY}
          width={boxWidth}
          height={boxHeight}
          rx={18}
          stroke="#10B981"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          className="opacity-70 animate-pulse"
        />

        {/* Futuristic Laser Corner Reticles (Top-Left) */}
        <g stroke="url(#hudGlow)" strokeWidth={3.5} strokeLinecap="round">
          <path d={`M${startX - 4} ${startY + 28} V${startY + 6} Q${startX} ${startY} ${startX + 6} ${startY} H${startX + 28}`} />
          {/* Crosshair target mark */}
          <line x1={startX - 12} y1={startY + 12} x2={startX} y2={startY + 12} stroke="#10B981" strokeWidth="1.5" />
          <line x1={startX + 12} y1={startY - 12} x2={startX + 12} y2={startY} stroke="#10B981" strokeWidth="1.5" />
        </g>

        {/* Top-Right Corner Reticle */}
        <g stroke="url(#hudGlow)" strokeWidth={3.5} strokeLinecap="round">
          <path d={`M${startX + boxWidth - 28} ${startY} H${startX + boxWidth - 6} Q${startX + boxWidth} ${startY} ${startX + boxWidth} ${startY + 6} V${startY + 28}`} />
          <line x1={startX + boxWidth} y1={startY + 12} x2={startX + boxWidth + 12} y2={startY + 12} stroke="#10B981" strokeWidth="1.5" />
        </g>

        {/* Bottom-Left Corner Reticle */}
        <g stroke="url(#hudGlow)" strokeWidth={3.5} strokeLinecap="round">
          <path d={`M${startX - 4} ${startY + boxHeight - 28} V${startY + boxHeight - 6} Q${startX} ${startY + boxHeight} ${startX + 6} ${startY + boxHeight} H${startX + 28}`} />
          <line x1={startX - 12} y1={startY + boxHeight - 12} x2={startX} y2={startY + boxHeight - 12} stroke="#10B981" strokeWidth="1.5" />
        </g>

        {/* Bottom-Right Corner Reticle */}
        <g stroke="url(#hudGlow)" strokeWidth={3.5} strokeLinecap="round">
          <path d={`M${startX + boxWidth - 28} ${startY + boxHeight} H${startX + boxWidth - 6} Q${startX + boxWidth} ${startY + boxHeight} ${startX + boxWidth} ${startY + boxHeight - 6} V${startY + boxHeight - 28}`} />
          <line x1={startX + boxWidth} y1={startY + boxHeight - 12} x2={startX + boxWidth + 12} y2={startY + boxHeight - 12} stroke="#10B981" strokeWidth="1.5" />
        </g>

        {/* Precision Center Crosshair */}
        <g opacity="0.95">
          <circle cx={startX + boxWidth / 2} cy={startY + boxHeight / 2} r="14" stroke="#10B981" strokeWidth="1.2" strokeDasharray="3 3" />
          <line
            x1={startX + boxWidth / 2 - 20}
            y1={startY + boxHeight / 2}
            x2={startX + boxWidth / 2 + 20}
            y2={startY + boxHeight / 2}
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1={startX + boxWidth / 2}
            y1={startY + boxHeight / 2 - 20}
            x2={startX + boxWidth / 2}
            y2={startY + boxHeight / 2 + 20}
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Target ROIs */}
        {rois.map((roi) => {
          const cx = startX + roi.relX * boxWidth;
          const cy = startY + roi.relY * boxHeight;
          const r = roi.relRadius * boxWidth;

          return (
            <g key={roi.id}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                stroke="#10B981"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                fill="rgba(16, 185, 129, 0.15)"
              />
              {roi.label && (
                <text
                  x={cx}
                  y={cy + r + 11}
                  fill="#A7F3D0"
                  fontSize={Math.max(8, Math.min(10, r * 0.75))}
                  fontFamily="monospace"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {roi.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Animated Laser Sweep */}
      <div
        className="animate-scan-sweep"
        style={{
          top: startY + 12,
          bottom: startY + boxHeight - 12,
          left: startX + 10,
          right: startX + 10,
        }}
      />

      {/* Bottom Telemetry HUD */}
      <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-center mb-16 z-10 shadow-lg flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
          <span>CV OPTICAL ENGINE: TARGET LOCKED</span>
        </div>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-[10px] text-slate-300 hidden sm:inline font-mono">
          Ready to capture
        </span>
      </div>
    </div>
  );
};
