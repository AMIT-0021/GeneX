/**
 * ReaderConnectionBanner.tsx — Persistent BLE connection status indicator
 *
 * Always visible in the workflow area. Color and message change based on status.
 * Styled to comply with the Genex spec: orange top border (#D98E3F), green bottom border (#5C8A6B),
 * neutral side borders (#D9D4C8), and orange-to-green gradient primary buttons.
 */

import React from 'react';
import {
  Bluetooth,
  BluetoothSearching,
  BluetoothOff,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  X,
  Wifi,
} from 'lucide-react';
import { BleConnectionStatus } from '../../types/bleProtocol';

interface ReaderConnectionBannerProps {
  status: BleConnectionStatus;
  isDemoMode: boolean;
  errorMessage: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onEnterDemo: () => void;
  onExitDemo: () => void;
}

export const ReaderConnectionBanner: React.FC<ReaderConnectionBannerProps> = ({
  status,
  isDemoMode,
  errorMessage,
  onConnect,
  onDisconnect,
  onEnterDemo,
  onExitDemo,
}) => {
  // ── Demo Mode Banner ────────────────────────────────────────────────────────
  if (isDemoMode) {
    return (
      <div className="w-full flex items-center justify-between genex-card px-4 py-3 text-xs shadow-xs">
        <div className="flex items-center gap-3 text-amber-900">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-[#D98E3F]/50 flex items-center justify-center shrink-0 text-[#D98E3F]">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-950 block">DEMO MODE — No Reader Connected</span>
            <span className="text-amber-800/90 text-[11px]">
              Layer 2 &amp; 3 data is synthesized. Results are for demonstration only.
            </span>
          </div>
        </div>
        <button
          onClick={onExitDemo}
          className="ml-3 px-3 py-1.5 genex-btn-secondary text-[11px] font-semibold shrink-0 flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Exit
        </button>
      </div>
    );
  }

  // ── Status-specific config ──────────────────────────────────────────────────
  const config = {
    idle: {
      icon: <Bluetooth className="w-4 h-4 text-slate-500" />,
      label: 'External Reader — Not Connected',
      sub: 'Connect a Genex reader for hardware Layer 2 & 3 results.',
      iconBg: 'bg-slate-100 border-slate-300',
      textColor: 'text-slate-900',
      subColor: 'text-slate-500',
      pulse: false,
    },
    scanning: {
      icon: <BluetoothSearching className="w-4 h-4 text-[#D98E3F]" />,
      label: 'Scanning for Reader…',
      sub: 'Looking for Genex reader device via BLE.',
      iconBg: 'bg-amber-50 border-[#D98E3F]/40',
      textColor: 'text-[#D98E3F]',
      subColor: 'text-amber-700/80',
      pulse: true,
    },
    connecting: {
      icon: <Wifi className="w-4 h-4 text-[#D98E3F]" />,
      label: 'Connecting to Reader…',
      sub: 'Establishing GATT connection.',
      iconBg: 'bg-amber-50 border-[#D98E3F]/40',
      textColor: 'text-[#D98E3F]',
      subColor: 'text-amber-700/80',
      pulse: true,
    },
    connected: {
      icon: <CheckCircle2 className="w-4 h-4 text-[#5C8A6B]" />,
      label: 'Reader Connected',
      sub: 'Hardware EIS results will stream after Layer 1 capture.',
      iconBg: 'bg-emerald-50 border-[#5C8A6B]/40',
      textColor: 'text-[#5C8A6B]',
      subColor: 'text-emerald-800/80',
      pulse: false,
    },
    disconnected: {
      icon: <BluetoothOff className="w-4 h-4 text-rose-600" />,
      label: 'Reader Disconnected',
      sub: errorMessage || 'The reader device went offline.',
      iconBg: 'bg-rose-50 border-rose-300',
      textColor: 'text-rose-900',
      subColor: 'text-rose-700',
      pulse: false,
    },
    error: {
      icon: <AlertTriangle className="w-4 h-4 text-[#D98E3F]" />,
      label: 'Reader Error',
      sub: errorMessage || 'Connection failed.',
      iconBg: 'bg-amber-50 border-[#D98E3F]/40',
      textColor: 'text-[#D98E3F]',
      subColor: 'text-amber-800',
      pulse: false,
    },
    unsupported: {
      icon: <BluetoothOff className="w-4 h-4 text-slate-400" />,
      label: 'BLE Not Supported — Use Chrome or Edge',
      sub: 'Web Bluetooth requires Chrome / Edge on Android or Desktop.',
      iconBg: 'bg-slate-100 border-slate-300',
      textColor: 'text-slate-700',
      subColor: 'text-slate-500',
      pulse: false,
    },
  } as const;

  const c = config[status];

  const showConnect =
    status === 'idle' ||
    status === 'disconnected' ||
    status === 'error' ||
    status === 'unsupported';
  const showDisconnect =
    status === 'connected' || status === 'scanning' || status === 'connecting';
  const canConnect = status !== 'unsupported';

  return (
    <div className="w-full flex items-center justify-between genex-card px-4 py-3 text-xs shadow-xs transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg ${c.iconBg} border flex items-center justify-center shrink-0 ${
            c.pulse ? 'animate-pulse' : ''
          }`}
        >
          {c.icon}
        </div>
        <div className="min-w-0">
          <span className={`font-bold block truncate ${c.textColor}`}>{c.label}</span>
          <span className={`text-[11px] block truncate ${c.subColor}`}>{c.sub}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3 shrink-0">
        {showConnect && (
          <>
            <button
              onClick={onConnect}
              disabled={!canConnect}
              className="px-3.5 py-1.5 genex-btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Connect
            </button>
            {canConnect && (
              <button
                onClick={onEnterDemo}
                className="px-3 py-1.5 genex-btn-secondary text-xs"
              >
                Demo Mode
              </button>
            )}
          </>
        )}
        {showDisconnect && (
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 genex-btn-secondary text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};
