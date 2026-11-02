import React, { useState, useRef, useEffect } from 'react';
import { CalibrationData, ScanStage } from '../../types/diagnostic';
import { BleConnectionStatus } from '../../types/bleProtocol';
import { PRESETS } from '../../data/clinicalPresets';
import { LensMarkLogo } from './LensMarkLogo';
import {
  Activity,
  UserCheck,
  Globe,
  Clock,
  Sliders,
  Settings2,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Info,
  MoreHorizontal,
  Bluetooth,
  Compass,
  FileText,
  X,
  Radio,
  Cpu,
  Download,
  Smartphone,
  HelpCircle,
} from 'lucide-react';

export type NavDestination = 'scan' | 'patients' | 'trends' | 'history' | 'report';

interface HeaderProps {
  currentStage: ScanStage | 'report' | 'patient_dashboard' | 'regional_trends';
  calibration: CalibrationData;
  bleStatus?: BleConnectionStatus;
  isBleDemo?: boolean;
  hasActiveReport?: boolean;
  onNavigate: (dest: NavDestination) => void;
  onOpenCalibration: () => void;
  onOpenHistory: () => void;
  onOpenConfig: () => void;
  onOpenSimulator: () => void;
  onOpenAbout?: () => void;
  onOpenWalkthrough?: () => void;
  onOpenHelp?: () => void;
  onFetchDummyData?: (presetId?: string) => void;
  onConnectBle?: () => void;
  onDisconnectBle?: () => void;
  onEnterDemoBle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStage,
  calibration,
  bleStatus = 'idle',
  isBleDemo = false,
  hasActiveReport = false,
  onNavigate,
  onOpenCalibration,
  onOpenHistory,
  onOpenConfig,
  onOpenSimulator,
  onOpenAbout,
  onOpenWalkthrough,
  onOpenHelp,
  onFetchDummyData,
  onConnectBle,
  onDisconnectBle,
  onEnterDemoBle,
}) => {
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isPresetSubmenuOpen, setIsPresetSubmenuOpen] = useState(false);

  const statusRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusPanelOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // PWA Install Prompt state & handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert("Install Genex to Home Screen:\n• iOS / Safari: Tap Share ➔ 'Add to Home Screen'\n• Android / Chrome: Tap 3 dots ➔ 'Install App' or 'Add to Home screen'\n• Windows / Mac: Look for the Install icon in the browser address bar.");
    }
  };

  // Determine current active primary nav tab
  const getActiveTab = (): NavDestination => {
    if (currentStage === 'patient_dashboard') return 'patients';
    if (currentStage === 'regional_trends') return 'trends';
    if (currentStage === 'report') return 'report';
    return 'scan';
  };
  const activeTab = getActiveTab();

  // Tier 2: Collapsed Single Status Chip Definition
  const getStatusSummary = () => {
    if (bleStatus === 'connected') {
      return {
        label: 'Reader Online',
        dotColor: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
        pulse: false,
      };
    }
    if (isBleDemo) {
      return {
        label: 'Demo Analyzer',
        dotColor: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-800 border-[#D98E3F]/40',
        pulse: false,
      };
    }
    if (bleStatus === 'scanning' || bleStatus === 'connecting') {
      return {
        label: 'Scanning BLE…',
        dotColor: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-800 border-[#D98E3F]/40',
        pulse: true,
      };
    }
    if (calibration.isCalibrated) {
      return {
        label: 'System Ready',
        dotColor: 'bg-[#5C8A6B]',
        badgeBg: 'bg-slate-50 text-slate-800 border-[#D9D4C8] hover:border-[#5C8A6B]',
        pulse: false,
      };
    }
    return {
      label: 'Calib Needed',
      dotColor: 'bg-[#D98E3F]',
      badgeBg: 'bg-amber-50 text-amber-800 border-[#D98E3F]/40',
      pulse: false,
    };
  };

  const status = getStatusSummary();

  const primaryNavItems: { id: NavDestination; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'scan', label: 'Analyzer', icon: Activity },
    ...(hasActiveReport ? [{ id: 'report' as NavDestination, label: 'Report', icon: FileText }] : []),
    { id: 'patients', label: 'Patients', icon: UserCheck },
    { id: 'trends', label: 'AMR Trends', icon: Globe },
    { id: 'history', label: 'Vault History', icon: Clock },
  ];

  return (
    <header className="w-full bg-white border-t-[3.5px] border-t-[#D98E3F] border-b-[3.5px] border-b-[#5C8A6B] border-x border-x-[#D9D4C8] sticky top-0 z-40 px-3 sm:px-6 py-2 sm:py-2.5 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* ── 1. Left: Brand & Identity (Always visible, compact on mobile) ── */}
        <button
          onClick={() => onNavigate('scan')}
          className="flex items-center gap-2 sm:gap-2.5 shrink-0 hover:opacity-90 transition text-left"
          title="Return to Analyzer"
        >
          <LensMarkLogo size={28} className="shrink-0 sm:w-8 sm:h-8" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                Genex
              </span>
              <span className="text-[10px] font-mono font-bold text-[#5C8A6B] bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full leading-normal">
                POC UTI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden md:block leading-none mt-0.5">
              Microfluidic Diagnostic Platform
            </p>
          </div>
        </button>

        {/* ── 2. Center: PRIMARY NAVIGATION (Desktop Only: max 4 items) ── */}
        <nav
          aria-label="Desktop Primary Navigation"
          className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-xl border border-[#D9D4C8]/80 space-x-1"
        >
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'history') {
                    onOpenHistory();
                  } else {
                    onNavigate(item.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-[#5C8A6B] shadow-2xs border border-[#D9D4C8]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#5C8A6B]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── 3. Right: Single Status Chip + Single Secondary Tools Menu ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* TIER 2: Collapsed Single Status Chip */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => setIsStatusPanelOpen(!isStatusPanelOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-semibold border transition shadow-2xs ${status.badgeBg}`}
              title="Click to inspect system hardware, optics & reader status"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${status.dotColor} ${
                  status.pulse ? 'animate-ping' : ''
                }`}
              />
              <span className="text-[11px] sm:text-xs tracking-tight">{status.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Status Details Popover Panel */}
            {isStatusPanelOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border-2 border-[#D9D4C8] p-4 z-50 animate-popup-scale space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Radio className="w-4 h-4 text-[#5C8A6B]" />
                    <span>System Diagnostic Status</span>
                  </div>
                  <button
                    onClick={() => setIsStatusPanelOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status Items */}
                <div className="space-y-2.5 text-xs">
                  {/* Item 1: Dual-Array Optics */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-slate-600" />
                        <span>FHD 530/620nm Dual-Array</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Chromogenic & fluorometric cartridge sensor matrix.
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300 shrink-0">
                      ACTIVE
                    </span>
                  </div>

                  {/* Item 2: Optical Calibration */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {calibration.isCalibrated ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5C8A6B]" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-[#D98E3F]" />
                        )}
                        <span>Sensor Calibration</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {calibration.isCalibrated
                          ? `Calibrated (${calibration.ambientLuminance} Lux)`
                          : 'Uncalibrated baseline'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsStatusPanelOpen(false);
                        onOpenCalibration();
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white border border-[#D9D4C8] hover:border-[#5C8A6B] text-slate-700 hover:text-emerald-800 transition shrink-0"
                    >
                      {calibration.isCalibrated ? 'Recalibrate' : 'Calibrate'}
                    </button>
                  </div>

                  {/* Item 3: BLE Hardware Reader */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hardware Reader (BLE)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {isBleDemo ? 'Demo simulation mode' : `Status: ${bleStatus}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {bleStatus === 'connected' ? (
                        <button
                          onClick={() => {
                            setIsStatusPanelOpen(false);
                            onDisconnectBle?.();
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <>
                          {onConnectBle && (
                            <button
                              onClick={() => {
                                setIsStatusPanelOpen(false);
                                onConnectBle();
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold genex-btn-primary"
                            >
                              Connect
                            </button>
                          )}
                          {!isBleDemo && onEnterDemoBle && (
                            <button
                              onClick={() => {
                                setIsStatusPanelOpen(false);
                                onEnterDemoBle();
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white border border-[#D9D4C8] text-slate-700 hover:bg-slate-100 transition"
                            >
                              Demo
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>ID: {calibration.deviceId || 'GENEX-S26-09'}</span>
                  <span>CV v2.4 + AI AST</span>
                </div>
              </div>
            )}
          </div>

          {/* PWA Install Button */}
          <button
            onClick={handleInstallApp}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-bold bg-[#D98E3F]/10 hover:bg-[#D98E3F]/20 text-[#B87024] border border-[#D98E3F]/30 transition shadow-2xs"
            title="Install Genex to Home Screen or Desktop"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>

          {/* Help & SOP Centre Trigger */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#D9D4C8] transition shadow-2xs"
              title="Help, Cartridge SOP & Clinical Guidance Centre"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#D98E3F]" />
              <span>Help &amp; SOP</span>
            </button>
          )}

          {/* TIER 3: Single Secondary Actions Menu ("⋯ Tools") */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.2 rounded-lg bg-white border border-[#D9D4C8] hover:border-[#5C8A6B] hover:bg-slate-50 text-slate-700 transition shadow-2xs font-semibold text-xs"
              title="Secondary actions, clinical presets & tools"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline text-xs">Tools</span>
            </button>

            {/* Secondary Actions Dropdown */}
            {isToolsMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border-2 border-[#D9D4C8] p-2 z-50 animate-popup-scale space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Diagnostic Actions &amp; Tools
                  </span>
                  <span className="text-[10px] font-mono text-[#5C8A6B]">Genex v2.4</span>
                </div>

                {/* Action 1: Fetch Real Clinical Data / Preset Expandable */}
                {onFetchDummyData && (
                  <div className="p-1 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                    <button
                      onClick={() => setIsPresetSubmenuOpen(!isPresetSubmenuOpen)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-950 hover:bg-emerald-100/60 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Load Clinical Preset</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-150 ${
                          isPresetSubmenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isPresetSubmenuOpen && (
                      <div className="mt-1 space-y-1 pt-1 border-t border-emerald-200/60 max-h-48 overflow-y-auto">
                        {PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              onFetchDummyData(preset.id);
                              setIsToolsMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-white rounded-lg transition flex items-center justify-between gap-1 group"
                          >
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 truncate">
                              {preset.name}
                            </span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                              {preset.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action 2: Test Bench Simulator */}
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenSimulator();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-amber-50 hover:text-amber-900 transition text-left"
                >
                  <PlayCircle className="w-4 h-4 text-[#D98E3F]" />
                  <div className="flex-1">
                    <span className="block font-bold">Virtual Test Bench</span>
                    <span className="text-[10px] text-slate-500 block">Simulate optical &amp; EIS reads</span>
                  </div>
                </button>

                {/* Action 3: Sensor Calibration */}
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenCalibration();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition text-left"
                >
                  <Sliders className="w-4 h-4 text-[#5C8A6B]" />
                  <div className="flex-1">
                    <span className="block font-bold">Optical Sensor Calibration</span>
                    <span className="text-[10px] text-slate-500 block">Balance white point &amp; ambient lux</span>
                  </div>
                </button>

                {/* Action 4: System Threshold Inspector */}
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenConfig();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition text-left"
                >
                  <Settings2 className="w-4 h-4 text-slate-500" />
                  <div className="flex-1">
                    <span className="block font-bold">System Config &amp; Thresholds</span>
                    <span className="text-[10px] text-slate-500 block">Inspect cutoffs and algorithmic parameters</span>
                  </div>
                </button>

                {/* Action 5: Guided Walkthrough */}
                {onOpenWalkthrough && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenWalkthrough();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition text-left"
                  >
                    <Compass className="w-4 h-4 text-[#D98E3F]" />
                    <span>Guided Product Walkthrough</span>
                  </button>
                )}

                {/* Action 6: Help & SOP Centre */}
                {onOpenHelp && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenHelp();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-amber-50 hover:text-amber-950 transition text-left border-t border-slate-100"
                  >
                    <HelpCircle className="w-4 h-4 text-[#D98E3F]" />
                    <div className="flex-1">
                      <span className="block font-bold">Help &amp; SOP Centre</span>
                      <span className="text-[10px] text-slate-500 block">Sampling SOP, troubleshooting &amp; AMR guide</span>
                    </div>
                  </button>
                )}

                {/* Action 7: PWA Install */}
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    handleInstallApp();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-amber-50 hover:text-amber-950 transition text-left border-t border-slate-100"
                >
                  <Smartphone className="w-4 h-4 text-[#D98E3F]" />
                  <div className="flex-1">
                    <span className="block font-bold">Install Offline App</span>
                    <span className="text-[10px] text-slate-500 block">Add to Home Screen / Desktop PWA</span>
                  </div>
                </button>

                {/* Action 8: About Modal */}
                {onOpenAbout && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      onOpenAbout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition text-left border-t border-slate-100"
                  >
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>About Genex POC Diagnostics</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
