/**
 * WaitingForReaderState.tsx — Shown after Layer 1 capture while awaiting BLE data
 *
 * Displayed in the main content area after the user completes Layer 1 (pyuria scan)
 * when the app is waiting for the external reader to transmit Layer 2 & 3 results.
 */

import React, { useState, useEffect } from 'react';
import { Layer2Result, Layer3Result } from '../../types/diagnostic';
import { BleConnectionStatus } from '../../types/bleProtocol';
import { defaultBleConfig } from '../../config/bleConfig';
import {
  Bluetooth,
  CheckCircle2,
  Loader2,
  FlaskConical,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface WaitingForReaderStateProps {
  bleStatus: BleConnectionStatus;
  layer2Data: Layer2Result | null;
  layer3Data: Layer3Result | null;
  onEnterDemo: () => void;
  onProceedToReport: () => void;
  onRetryConnection?: () => void;
}

export const WaitingForReaderState: React.FC<WaitingForReaderStateProps> = ({
  bleStatus,
  layer2Data,
  layer3Data,
  onEnterDemo,
  onProceedToReport,
  onRetryConnection,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    Math.round(defaultBleConfig.readerTimeoutMs / 1000)
  );
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  const bothReceived = layer2Data !== null && layer3Data !== null;
  const isPartialDataReceived = (layer2Data !== null && layer3Data === null) || (layer2Data === null && layer3Data !== null);
  const isDisconnectedMidTransfer = bleStatus === 'disconnected' && isPartialDataReceived;
  const isError = bleStatus === 'error' || bleStatus === 'unsupported' || isDisconnectedMidTransfer;

  // Countdown timer for BLE reader response
  useEffect(() => {
    if (bothReceived || isError) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bothReceived, isError]);

  const handleResetTimer = () => {
    setSecondsRemaining(Math.round(defaultBleConfig.readerTimeoutMs / 1000));
    setIsTimedOut(false);
    if (onRetryConnection) onRetryConnection();
  };

  return (
    <div className="w-full genex-card p-6 flex flex-col items-center gap-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-1 ${
            isError || isTimedOut
              ? 'bg-rose-50 border-rose-300 text-rose-600'
              : bothReceived
              ? 'bg-emerald-50 border-[#5C8A6B]/40 text-[#5C8A6B]'
              : 'bg-amber-50 border-[#D98E3F]/40 text-[#D98E3F] animate-pulse'
          }`}
        >
          {isError || isTimedOut ? (
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          ) : bothReceived ? (
            <CheckCircle2 className="w-6 h-6 text-[#5C8A6B]" />
          ) : (
            <Bluetooth className="w-6 h-6 text-[#D98E3F]" />
          )}
        </div>
        <h2 className="text-base font-bold text-slate-900">
          {isDisconnectedMidTransfer
            ? 'Connection Lost Mid-Transfer'
            : isTimedOut
            ? 'Reader Response Timed Out'
            : isError
            ? 'Reader Connection Error'
            : bothReceived
            ? 'Reader Data Received'
            : 'Awaiting Reader Transmission…'}
        </h2>
        <p className="text-xs text-slate-500 max-w-xs">
          {isDisconnectedMidTransfer
            ? 'BLE transmission disconnected before completing Layer 2/3. Already-captured Layer 1 data is preserved.'
            : isTimedOut
            ? 'No transmission received within 18 seconds. You can retry connection or switch to Demo Mode.'
            : isError
            ? 'The external reader disconnected or encountered an error.'
            : bothReceived
            ? 'Layer 2 & 3 EIS results received. Ready to compile report.'
            : `Layer 1 capture complete. Listening for BLE transmission (Timeout in ${secondsRemaining}s)…`}
        </p>
      </div>

      {/* Layer Progress Cards */}
      <div className="w-full grid grid-cols-2 gap-3">
        {/* Layer 2 */}
        <div
          className={`rounded-xl border p-3.5 flex flex-col gap-2 transition ${
            layer2Data
              ? 'bg-emerald-50/60 border-[#5C8A6B]/40'
              : 'bg-slate-50 border-[#D9D4C8]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Layer 2</span>
            {layer2Data ? (
              <CheckCircle2 className="w-4 h-4 text-[#5C8A6B]" />
            ) : isTimedOut || isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <Loader2 className="w-4 h-4 text-[#D98E3F] animate-spin" />
            )}
          </div>
          <span className="text-xs text-slate-500">4-Plex Pathogen EIS</span>
          {layer2Data && (
            <span className="text-xs text-[#5C8A6B] font-bold">
              {layer2Data.primaryPathogen
                ? `+ ${layer2Data.primaryPathogen}`
                : 'No pathogens detected'}
            </span>
          )}
        </div>

        {/* Layer 3 */}
        <div
          className={`rounded-xl border p-3.5 flex flex-col gap-2 transition ${
            layer3Data
              ? 'bg-emerald-50/60 border-[#5C8A6B]/40'
              : 'bg-slate-50 border-[#D9D4C8]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Layer 3</span>
            {layer3Data ? (
              <CheckCircle2 className="w-4 h-4 text-[#5C8A6B]" />
            ) : isTimedOut || isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <Loader2 className="w-4 h-4 text-[#D98E3F] animate-spin" />
            )}
          </div>
          <span className="text-xs text-slate-500">AST Resistance Panel</span>
          {layer3Data && (
            <span className="text-xs text-[#5C8A6B] font-bold">
              {layer3Data.sensitiveCount}S / {layer3Data.resistantCount}R
            </span>
          )}
        </div>
      </div>

      {/* BLE Status Line & Countdown Bar */}
      {!bothReceived && !isError && !isTimedOut && (
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#D98E3F] font-medium">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Listening for BLE transmission…</span>
            </div>
            <span className="font-mono text-xs text-slate-500">{secondsRemaining}s</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#D98E3F] h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(secondsRemaining / 18) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {bothReceived && (
          <button
            onClick={onProceedToReport}
            className="w-full py-3 genex-btn-primary text-sm flex items-center justify-center gap-2"
          >
            <span>Compile Diagnostic Report</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {(isTimedOut || isError) && (
          <button
            onClick={handleResetTimer}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-[#D9D4C8] text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4 text-[#D98E3F]" />
            <span>Retry BLE Connection</span>
          </button>
        )}

        <button
          onClick={onEnterDemo}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg border border-[#D9D4C8] hover:bg-slate-100 transition"
        >
          <FlaskConical className="w-3.5 h-3.5 text-[#D98E3F]" />
          <span>Skip &amp; Use Demo Mode Instead</span>
        </button>
      </div>
    </div>
  );
};
