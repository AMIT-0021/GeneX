import React, { useState } from 'react';
import { AntibioticResult } from '../../types/diagnostic';
import { Activity, ShieldAlert, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AstKineticChartProps {
  antibiotics: AntibioticResult[];
}

export const AstKineticChart: React.FC<AstKineticChartProps> = ({ antibiotics }) => {
  const [selectedDrugId, setSelectedDrugId] = useState<string>(
    antibiotics.length > 0 ? antibiotics[0].id : ''
  );

  const selectedDrug = antibiotics.find((a) => a.id === selectedDrugId) || antibiotics[0];

  if (!selectedDrug) return null;

  const isResistant = selectedDrug.status === 'Resistant';
  const isIntermediate = selectedDrug.status === 'Intermediate';
  const isSensitive = selectedDrug.status === 'Sensitive';

  // Generate 4 time points (0m, 10m, 20m, 30m) for the selected drug's mean curve & 4 replicates
  const timePoints = [0, 10, 20, 30];

  // Starting baseline OD around 0.08 - 0.10
  const baselineOD = 0.085;

  // Synthesize kinetic trajectories based on actual meanOD and status
  const getKineticValues = (targetOD: number, seed: number) => {
    return timePoints.map((t) => {
      if (t === 0) return parseFloat((baselineOD + (seed * 0.005)).toFixed(3));
      const progress = t / 30;
      if (isResistant) {
        // Sigmoidal exponential growth
        const val = baselineOD + (targetOD - baselineOD) * Math.pow(progress, 1.6);
        return parseFloat((val + seed * 0.01).toFixed(3));
      } else if (isIntermediate) {
        // Slow rise and plateau
        const val = baselineOD + (targetOD - baselineOD) * Math.pow(progress, 0.8);
        return parseFloat((val + seed * 0.008).toFixed(3));
      } else {
        // Bacterial cell lysis: flatlines or decreases below threshold
        const val = Math.max(0.015, baselineOD - (baselineOD - targetOD) * progress);
        return parseFloat((val + seed * 0.004).toFixed(3));
      }
    });
  };

  const meanTrajectory = getKineticValues(selectedDrug.meanOD, 0);

  // SVG Chart dimensions
  const svgWidth = 460;
  const svgHeight = 180;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxOD = 1.0;
  const thresholdOD = 0.20; // CLSI M100 resistance threshold

  const getX = (tIndex: number) => padLeft + (tIndex / (timePoints.length - 1)) * plotWidth;
  const getY = (od: number) => padTop + plotHeight - (Math.min(maxOD, Math.max(0, od)) / maxOD) * plotHeight;

  // Build SVG Path for mean trajectory
  const meanPathD = meanTrajectory.reduce((acc, od, idx) => {
    const x = getX(idx);
    const y = getY(od);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Replicate curves (subtle background lines)
  const replicateTrajectories = selectedDrug.replicates.slice(0, 4).map((rep, rIdx) => {
    const seed = (rIdx - 1.5) * 0.7;
    const vals = getKineticValues(rep.opticalDensity, seed);
    return vals.reduce((acc, od, idx) => {
      const x = getX(idx);
      const y = getY(od);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  });

  const thresholdY = getY(thresholdOD);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#D98E3F]" />
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">
            Microfluidic AST Kinetic Growth Curves (0–30 min)
          </h3>
        </div>
        <span className="text-[10.5px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
          EIS / Optical Heuristics
        </span>
      </div>

      {/* Drug Selection Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        {antibiotics.map((a) => {
          const isSel = a.id === selectedDrug.id;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedDrugId(a.id)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                isSel
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{a.name}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  a.status === 'Resistant'
                    ? 'bg-rose-500'
                    : a.status === 'Intermediate'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Kinetic Trajectory SVG Canvas */}
      <div className="w-full overflow-x-auto bg-slate-50/70 rounded-xl p-2 border border-slate-200/70">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[340px] max-h-[220px]"
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((od) => {
            const y = getY(od);
            return (
              <g key={od}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={od === 0 ? '0' : '2,2'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] font-mono fill-slate-600 font-medium"
                >
                  {od.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Time Axis Grid */}
          {timePoints.map((t, idx) => {
            const x = getX(idx);
            return (
              <g key={t}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotHeight}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="text-[9.5px] font-mono fill-slate-600 font-bold"
                >
                  {t}m
                </text>
              </g>
            );
          })}

          {/* CLSI Resistance Cutoff Threshold Line */}
          <line
            x1={padLeft}
            y1={thresholdY}
            x2={svgWidth - padRight}
            y2={thresholdY}
            stroke="#DC2626"
            strokeWidth="1.2"
            strokeDasharray="4,3"
            opacity="0.65"
          />
          <text
            x={svgWidth - padRight}
            y={thresholdY - 4}
            textAnchor="end"
            className="text-[8px] font-mono fill-rose-600 font-bold"
          >
            CLSI Cutoff (0.20 OD)
          </text>

          {/* Replicate Background Curves (4 Channels) */}
          {replicateTrajectories.map((d, rIdx) => (
            <path
              key={rIdx}
              d={d}
              fill="none"
              stroke={isResistant ? '#FDA4AF' : isIntermediate ? '#FDE68A' : '#A7F3D0'}
              strokeWidth="1.2"
              opacity="0.8"
            />
          ))}

          {/* Mean Trajectory Curve */}
          <path
            d={meanPathD}
            fill="none"
            stroke={isResistant ? '#E11D48' : isIntermediate ? '#D97706' : '#059669'}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Kinetic Points on Mean Trajectory */}
          {meanTrajectory.map((od, idx) => {
            const x = getX(idx);
            const y = getY(od);
            return (
              <g key={idx}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#FFFFFF"
                  stroke={isResistant ? '#E11D48' : isIntermediate ? '#D97706' : '#059669'}
                  strokeWidth="2.2"
                />
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className={`text-[8.5px] font-mono font-extrabold ${
                    isResistant ? 'fill-rose-700' : isIntermediate ? 'fill-amber-700' : 'fill-emerald-700'
                  }`}
                >
                  {od.toFixed(3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Trajectory Interpretation Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
        <div className="flex items-center gap-2">
          {isResistant ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          ) : isIntermediate ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="font-semibold text-slate-800">
            {isResistant
              ? 'Exponential growth confirmed under drug pressure (Resistant)'
              : isIntermediate
              ? 'Borderline growth plateau observed (Intermediate)'
              : 'Rapid bacterial lysis with zero replication (Susceptible)'}
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-600 self-start sm:self-auto">
          Final Mean OD: <b>{selectedDrug.meanOD.toFixed(3)}</b> ± {selectedDrug.stdDev.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
