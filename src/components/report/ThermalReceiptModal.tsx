import React, { useRef } from 'react';
import { ScanSession } from '../../types/diagnostic';
import { Printer, X, Check, QrCode } from 'lucide-react';

interface ThermalReceiptModalProps {
  session: ScanSession;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ session, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const patient = session.patientInfo || {
    patientName: 'Rajesh Sharma',
    age: 48,
    gender: 'Male',
    mrn: 'MRN-AIIMS-90481',
    specimenId: 'SP-ICMR-2026-041A',
    orderingPhysician: 'Dr. Rajesh Malhotra, MD',
    facility: 'AIIMS New Delhi',
    chiefComplaint: 'Acute pyuria evaluation',
    collectionMethod: 'Clean-Catch Midstream',
  };

  const detectedPathogens = session.layer2.pathogens.filter((p) => p.detected);
  const primaryPathogen = detectedPathogens.length > 0 ? detectedPathogens[0].name : 'None Detected';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wide">
              58mm / 80mm Thermal Slip
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100/60 font-mono text-[11px] leading-tight text-slate-900">
          <div
            id="thermal-receipt-printable"
            ref={receiptRef}
            className="bg-white p-4 shadow-sm border border-slate-200/80 rounded-lg mx-auto max-w-[280px] space-y-2.5 text-center"
          >
            {/* Header */}
            <div className="border-b border-dashed border-slate-400 pb-2 space-y-1">
              <h2 className="font-black text-sm tracking-wider uppercase">GENEX DIAGNOSTICS</h2>
              <p className="text-[9px] text-slate-600 font-sans uppercase">Point-of-Care Microfluidics</p>
              <p className="text-[9px] text-slate-500">{new Date(session.timestamp).toLocaleString()}</p>
            </div>

            {/* Patient & Specimen Info */}
            <div className="text-left border-b border-dashed border-slate-400 pb-2 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>PATIENT:</span>
                <span className="font-bold">{patient.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>AGE / GENDER:</span>
                <span>{patient.age}Y / {patient.gender ? patient.gender[0] : 'M'}</span>
              </div>
              <div className="flex justify-between">
                <span>MRN:</span>
                <span className="font-bold">{patient.mrn}</span>
              </div>
              <div className="flex justify-between">
                <span>SPECIMEN:</span>
                <span>{patient.specimenId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>CLINICIAN:</span>
                <span className="truncate max-w-[150px]">{patient.orderingPhysician.split(',')[0]}</span>
              </div>
            </div>

            {/* Diagnostic Result */}
            <div className="text-left border-b border-dashed border-slate-400 pb-2 space-y-1">
              <div className="font-bold text-center text-xs bg-slate-100 py-1 rounded">
                STATUS: {session.overallSummary.title}
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span>PYURIA (WBC):</span>
                <span className="font-bold">{session.layer1.infectionLevel.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-[10.5px]">
                <span>PATHOGEN:</span>
                <span className="font-bold">{primaryPathogen}</span>
              </div>
            </div>

            {/* AST Matrix (Layer 3) */}
            <div className="text-left border-b border-dashed border-slate-400 pb-2 space-y-1">
              <div className="font-bold text-[10px] text-slate-500 uppercase">
                ANTIBIOTIC SUSCEPTIBILITY (AST)
              </div>
              <div className="space-y-0.5 text-[10px]">
                {session.layer3.antibiotics.map((a) => (
                  <div key={a.id} className="flex justify-between items-center">
                    <span className="truncate max-w-[130px]">
                      {a.name} {a.isFirstLine ? '*' : ''}
                    </span>
                    <span
                      className={`font-bold px-1 rounded ${
                        a.status === 'Resistant'
                          ? 'bg-rose-100 text-rose-800'
                          : a.status === 'Intermediate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-slate-500 italic mt-1">* 1st-Line Empiric Regimen</p>
            </div>

            {/* Rx First Line Advice */}
            <div className="text-left border-b border-dashed border-slate-400 pb-2 space-y-1 text-[9.5px]">
              <span className="font-bold">RECOMMENDED REGIMEN:</span>
              <p className="text-slate-700">
                {session.overallSummary.suggestedFirstLine.length > 0
                  ? session.overallSummary.suggestedFirstLine.join(' or ')
                  : 'Physician culture-directed consultation'}
              </p>
              {session.overallSummary.resistantDrugs.length > 0 && (
                <p className="text-rose-700 font-bold">
                  AVOID: {session.overallSummary.resistantDrugs.join(', ')}
                </p>
              )}
            </div>

            {/* Barcode & Verification */}
            <div className="pt-1 flex flex-col items-center justify-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                <QrCode className="w-3.5 h-3.5" />
                <span>ID: {session.id.slice(-8).toUpperCase()}</span>
              </div>
              <p className="text-[8px] text-slate-400 max-w-[220px]">
                Investigational POC device. Treatment confirmed by registered practitioner.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 genex-btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible !important;
          }
          #thermal-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 72mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
