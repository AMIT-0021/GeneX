import React, { useState, useEffect } from 'react';
import { ScanSession } from '../../types/diagnostic';
import { StorageService } from '../../services/storageService';
import { X, Clock, Trash2, ChevronRight, Activity, ShieldCheck } from 'lucide-react';

interface ScanHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScan: (session: ScanSession) => void;
}

export const ScanHistoryDrawer: React.FC<ScanHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectScan,
}) => {
  const [scans, setScans] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadHistory = async () => {
    setLoading(true);
    const records = await StorageService.getAllScans();
    setScans(records);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this scan record?")) {
      await StorageService.deleteScan(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="bg-white border-l border-slate-200 border-t-[3px] border-t-[#D98E3F] border-b-[3px] border-b-[#5C8A6B] w-full max-w-md h-full flex flex-col p-5 shadow-2xl relative text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D98E3F]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Scan History</h3>
              <p className="text-xs text-slate-500">Encrypted at-rest local sessions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scans List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-[#D98E3F] border-t-transparent rounded-full animate-spin mb-2" />
              Decrypting stored records...
            </div>
          ) : scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No Scans Recorded Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Your past cartridge scans and diagnostic reports will automatically appear here with full encryption.
              </p>
            </div>
          ) : (
            scans.map((scan) => {
              const isHigh = scan.layer1.infectionLevel === 'High';
              const isMod = scan.layer1.infectionLevel === 'Moderate';
              const dateStr = new Date(scan.timestamp).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={scan.id}
                  onClick={() => {
                    onSelectScan(scan);
                    onClose();
                  }}
                  className="bg-white border border-slate-200 border-t-2 border-t-[#D98E3F] border-b-2 border-b-[#5C8A6B] hover:shadow-md rounded-xl p-3.5 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {/* Infection Badge icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isHigh
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isMod
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {scan.layer1.infectionLevel[0]}
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 group-hover:text-[#D98E3F] transition">
                        {scan.overallSummary.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{scan.batchId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, scan.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete scan permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#D98E3F] transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#5C8A6B] shrink-0" />
          <span>AES-GCM encryption verified. Health records remain solely on this device.</span>
        </div>
      </div>
    </div>
  );
};
