import React, { useState, useEffect, useCallback } from 'react';
import {
  ScanStage,
  ScanSession,
  CalibrationData,
  FrameQualityCheck,
  Layer1Result,
  Layer2Result,
  Layer3Result,
} from './types/diagnostic';
import { StorageService } from './services/storageService';
import { DiagnosticEngine } from './services/diagnosticEngine';
import { RecurrenceEngine } from './services/recurrenceEngine';
import { AmrAnonymizerService } from './services/amrAnonymizerService';
import { sampleStageRois } from './cv/zoneSampler';
import { useBleReader } from './hooks/useBleReader';
import { Header, NavDestination } from './components/common/Header';
import { MobileBottomNav, PrimaryNavTab } from './components/common/MobileBottomNav';
import { CameraViewfinder } from './components/camera/CameraViewfinder';
import { CaptureReviewModal } from './components/camera/CaptureReviewModal';
import { GalleryUploadFallback } from './components/camera/GalleryUploadFallback';
import { ReaderConnectionBanner } from './components/ble/ReaderConnectionBanner';
import { WaitingForReaderState } from './components/ble/WaitingForReaderState';
import { PRESETS, buildSimulatedBleData } from './data/clinicalPresets';

const VirtualCartridgeModal = React.lazy(() =>
  import('./components/simulator/VirtualCartridgeModal').then((m) => ({ default: m.VirtualCartridgeModal }))
);
const CalibrationModal = React.lazy(() =>
  import('./components/calibration/CalibrationModal').then((m) => ({ default: m.CalibrationModal }))
);
const ConfigInspectorModal = React.lazy(() =>
  import('./components/config/ConfigInspectorModal').then((m) => ({ default: m.ConfigInspectorModal }))
);
const ClinicalReportView = React.lazy(() =>
  import('./components/report/ClinicalReportView').then((m) => ({ default: m.ClinicalReportView }))
);
const PatientDashboardView = React.lazy(() =>
  import('./components/patient/PatientDashboardView').then((m) => ({ default: m.PatientDashboardView }))
);
const RegionalTrendsView = React.lazy(() =>
  import('./components/surveillance/RegionalTrendsView').then((m) => ({ default: m.RegionalTrendsView }))
);
const ScanHistoryDrawer = React.lazy(() =>
  import('./components/history/ScanHistoryDrawer').then((m) => ({ default: m.ScanHistoryDrawer }))
);
const AboutModal = React.lazy(() =>
  import('./components/common/AboutModal').then((m) => ({ default: m.AboutModal }))
);
const FirstRunWalkthroughModal = React.lazy(() =>
  import('./components/common/FirstRunWalkthroughModal').then((m) => ({ default: m.FirstRunWalkthroughModal }))
);
const HelpCenterModal = React.lazy(() =>
  import('./components/common/HelpCenterModal').then((m) => ({ default: m.HelpCenterModal }))
);
import {
  ArrowRight,
  Activity,
  Microscope,
  Pill,
  CheckCircle2,
  Maximize2,
  FlaskConical,
  Play,
  Sparkles,
} from 'lucide-react';

// ── App ───────────────────────────────────────────────────────────────────────

export const App: React.FC = () => {
  // Workflow states
  const [currentStage, setCurrentStage] = useState<ScanStage | 'report'>('layer1');
  const [workflowMode, setWorkflowMode] = useState<'sequential' | 'single_shot'>('sequential');
  const [persona] = useState<'patient' | 'clinician'>('patient');

  // Calibration
  const [calibration, setCalibration] = useState<CalibrationData>({
    isCalibrated: false,
    calibratedAt: '',
    blankRgb: { r: 242, g: 242, b: 242 },
    ambientLuminance: 242,
    deviceId: 'GENEX-S26-09',
  });

  // Intermediate captured data for sequential mode
  const [capturedThumbnails, setCapturedThumbnails] = useState<{
    layer1?: string;
    layer2?: string;
    layer3?: string;
    full?: string;
  }>({});

  const [layer1Result, setLayer1Result] = useState<Layer1Result | null>(null);
  const [_layer2Result, setLayer2Result] = useState<Layer2Result | null>(null);
  const [_layer3Result, setLayer3Result] = useState<Layer3Result | null>(null);
  const [_lastQualityCheck, setLastQualityCheck] = useState<FrameQualityCheck>({
    passed: true,
    brightnessScore: 85,
    contrastScore: 80,
    sharpnessScore: 90,
    warnings: [],
  });

  const [awaitingBle, setAwaitingBle] = useState<boolean>(false);
  const [pendingQuality, setPendingQuality] = useState<FrameQualityCheck | null>(null);

  // Active compiled session
  const [activeSession, setActiveSession] = useState<ScanSession | null>(null);

  // Post-capture review modal state
  const [reviewData, setReviewData] = useState<{
    stage: ScanStage;
    imageUrl: string;
    quality: FrameQualityCheck;
  } | null>(null);
  const [retakeCount, setRetakeCount] = useState<number>(0);

  // Modals
  const [isCalibModalOpen, setIsCalibModalOpen] = useState<boolean>(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // ── BLE Hook ────────────────────────────────────────────────────────────────
  const ble = useBleReader();

  // Load saved calibration on startup (FR26)
  useEffect(() => {
    const saved = StorageService.loadCalibration();
    if (saved) {
      setCalibration(saved);
    }
  }, []);

  // ── Compile Report ──────────────────────────────────────────────────────────

  // ── Compile Report ──────────────────────────────────────────────────────────

  const compileBleSession = useCallback(
    async (l2: Layer2Result, l3: Layer3Result) => {
      if (!layer1Result) return;
      const quality = pendingQuality ?? {
        passed: true,
        brightnessScore: 85,
        contrastScore: 80,
        sharpnessScore: 90,
        warnings: [],
      };

      const pastScans = await StorageService.getAllScans();
      const recFlags = RecurrenceEngine.analyzePatientRecurrence(pastScans);

      const session = DiagnosticEngine.compileSession(
        'GENEX-B26-09',
        persona,
        calibration,
        layer1Result,
        l2,
        l3,
        quality,
        capturedThumbnails,
        recFlags
      );
      setActiveSession(session);
      StorageService.saveScan(session);
      AmrAnonymizerService.submitAnonymizedRecord(session);
      setCurrentStage('report');
      setAwaitingBle(false);
      setPendingQuality(null);
    },
    [layer1Result, pendingQuality, persona, calibration, capturedThumbnails]
  );

  // Auto-compile when BLE data arrives (both layers received)
  useEffect(() => {
    if (awaitingBle && ble.layer2Data && ble.layer3Data) {
      compileBleSession(ble.layer2Data, ble.layer3Data);
    }
  }, [awaitingBle, ble.layer2Data, ble.layer3Data, compileBleSession]);

  // ── Photo Acceptance (Layer 1 only in BLE mode) ─────────────────────────────

  const handleAcceptCapturedPhoto = async () => {
    if (!reviewData) return;

    const { stage, imageUrl, quality } = reviewData;
    setReviewData(null);
    setLastQualityCheck(quality);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const boxW = Math.min(canvas.width * 0.85, 480);
      const boxH =
        stage === 'layer3' || stage === 'full'
          ? Math.min(canvas.height * 0.75, 600)
          : Math.min(canvas.height * 0.65, 480);
      const frameRect = {
        x: (canvas.width - boxW) / 2,
        y: (canvas.height - boxH) / 2,
        width: boxW,
        height: boxH,
      };

      if (stage === 'full') {
        const allColors = sampleStageRois(canvas, frameRect, 'full');
        const l1 = DiagnosticEngine.analyzeLayer1(
          allColors['layer1_pus'] || { r: 200, g: 150, b: 230 },
          calibration.blankRgb
        );
        const l2 = DiagnosticEngine.analyzeLayer2(allColors, calibration.blankRgb);
        const l3 = DiagnosticEngine.analyzeLayer3(allColors, calibration.blankRgb);

        const pastScans = await StorageService.getAllScans();
        const recFlags = RecurrenceEngine.analyzePatientRecurrence(pastScans);

        const session = DiagnosticEngine.compileSession(
          'GENEX-B26-09',
          persona,
          calibration,
          l1,
          l2,
          l3,
          quality,
          { full: imageUrl },
          recFlags
        );
        setActiveSession(session);
        StorageService.saveScan(session);
        AmrAnonymizerService.submitAnonymizedRecord(session);
        setCurrentStage('report');
        return;
      }

      if (stage === 'layer1') {
        const colors = sampleStageRois(canvas, frameRect, 'layer1');
        const l1 = DiagnosticEngine.analyzeLayer1(
          colors['layer1_pus'] || { r: 180, g: 120, b: 220 },
          calibration.blankRgb
        );
        setLayer1Result(l1);
        const thumbs = { ...capturedThumbnails, layer1: imageUrl };
        setCapturedThumbnails(thumbs);

        setPendingQuality(quality);

        if (ble.isDemoMode && ble.layer2Data && ble.layer3Data) {
          const pastScans = await StorageService.getAllScans();
          const recFlags = RecurrenceEngine.analyzePatientRecurrence(pastScans);

          const session = DiagnosticEngine.compileSession(
            'GENEX-B26-09',
            persona,
            calibration,
            l1,
            ble.layer2Data,
            ble.layer3Data,
            quality,
            thumbs,
            recFlags
          );
          setActiveSession(session);
          StorageService.saveScan(session);
          AmrAnonymizerService.submitAnonymizedRecord(session);
          setCurrentStage('report');
        } else {
          setAwaitingBle(true);
        }
      }
    };
    img.src = imageUrl;
  };

  const handleFrameCaptured = (dataUrl: string, quality: FrameQualityCheck) => {
    const stageToReview = currentStage === 'report' ? 'layer1' : currentStage;
    setReviewData({
      stage: stageToReview as ScanStage,
      imageUrl: dataUrl,
      quality,
    });
  };

  const handleOpenGallery = () => {
    document.getElementById('hidden-gallery-input-trigger')?.click();
  };

  const handleStartNewScan = () => {
    setActiveSession(null);
    setLayer1Result(null);
    setLayer2Result(null);
    setLayer3Result(null);
    setCapturedThumbnails({});
    setAwaitingBle(false);
    setPendingQuality(null);
    ble.clearData();
    setCurrentStage(workflowMode === 'single_shot' ? 'full' : 'layer1');
  };

  const handleSimulatorBleInject = (l2: Layer2Result, l3: Layer3Result) => {
    ble.injectDemoData(l2, l3);
    if (!ble.isDemoMode) {
      ble.enterDemoMode();
    }
  };

  const handleFetchDummyData = async (presetId: string = 'acute_ecoli_cipro_r') => {
    const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];

    const l1: Layer1Result = {
      infectionLevel: preset.pyuriaLevel,
      opticalDensity:
        preset.pyuriaLevel === 'High'
          ? 0.58
          : preset.pyuriaLevel === 'Moderate'
          ? 0.32
          : preset.pyuriaLevel === 'Low'
          ? 0.15
          : 0.04,
      deltaE:
        preset.pyuriaLevel === 'High'
          ? 18.5
          : preset.pyuriaLevel === 'Moderate'
          ? 12.2
          : preset.pyuriaLevel === 'Low'
          ? 6.1
          : 0.8,
      pyuriaWbcEstimate:
        preset.pyuriaLevel === 'High'
          ? '>250 WBC/µL (Acute Pyuria)'
          : preset.pyuriaLevel === 'Moderate'
          ? '50-250 WBC/µL (Moderate Pyuria)'
          : preset.pyuriaLevel === 'Low'
          ? '10-50 WBC/µL (Mild Pyuria)'
          : '<10 WBC/µL (Normal Baseline)',
      sampleRgb: { r: 180, g: 120, b: 220 },
      confidence: 96,
      clinicalNote:
        preset.pyuriaLevel !== 'Negative'
          ? `Acute Pyuria detected (${preset.pyuriaLevel}) - Leukocyte esterase & Nitrite positive`
          : 'Normal leukocyte esterase baseline - no significant inflammation.',
    };

    const { l2, l3 } = buildSimulatedBleData(
      preset.detectedPathogens,
      preset.resistantDrugs,
      preset.intermediateDrugs || []
    );

    const dummyQuality: FrameQualityCheck = {
      passed: true,
      brightnessScore: 92,
      contrastScore: 88,
      sharpnessScore: 94,
      warnings: [],
    };

    const pastScans = await StorageService.getAllScans();
    const recFlags = RecurrenceEngine.analyzePatientRecurrence(pastScans);

    const session = DiagnosticEngine.compileSession(
      'GENEX-S26-DUMMY',
      persona,
      calibration,
      l1,
      l2,
      l3,
      dummyQuality,
      {
        layer1: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
        layer2: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
        layer3: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
      },
      recFlags
    );

    if (preset.patientInfo) {
      session.patientInfo = preset.patientInfo;
    }

    setActiveSession(session);
    StorageService.saveScan(session);
    AmrAnonymizerService.submitAnonymizedRecord(session);
    setAwaitingBle(false);
    setCurrentStage('report');
  };

  const handleNavigate = (dest: NavDestination | PrimaryNavTab) => {
    if (dest === 'scan') {
      setCurrentStage(workflowMode === 'single_shot' ? 'full' : 'layer1');
    } else if (dest === 'patients') {
      setCurrentStage('patient_dashboard');
    } else if (dest === 'trends') {
      setCurrentStage('regional_trends');
    } else if (dest === 'report') {
      if (activeSession) {
        setCurrentStage('report');
      } else {
        handleFetchDummyData(PRESETS[0].id);
      }
    } else if (dest === 'history') {
      setIsHistoryOpen(true);
    }
  };

  const activeNavTab: PrimaryNavTab =
    currentStage === 'patient_dashboard'
      ? 'patients'
      : currentStage === 'regional_trends'
      ? 'trends'
      : currentStage === 'report'
      ? 'report'
      : 'scan';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden text-slate-900 pb-16 lg:pb-0">
      {/* Global Restructured 3-Tier Header */}
      <Header
        currentStage={currentStage}
        calibration={calibration}
        bleStatus={ble.status}
        isBleDemo={ble.isDemoMode}
        hasActiveReport={!!activeSession}
        onNavigate={handleNavigate}
        onOpenCalibration={() => setIsCalibModalOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenSimulator={() => setIsSimModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onFetchDummyData={handleFetchDummyData}
        onConnectBle={ble.connect}
        onDisconnectBle={ble.disconnect}
        onEnterDemoBle={ble.enterDemoMode}
      />

      {/* Hidden Gallery Input */}
      <GalleryUploadFallback onImageLoaded={handleFrameCaptured} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 pb-24 lg:pb-8 flex flex-col">
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400 font-medium">Loading view...</div>}>
          {currentStage === 'regional_trends' ? (
            <RegionalTrendsView />
          ) : currentStage === 'patient_dashboard' ? (
            <PatientDashboardView
              onBack={() => setCurrentStage(activeSession ? 'report' : 'layer1')}
              onSelectSession={(session) => {
                setActiveSession(session);
                setCurrentStage('report');
              }}
            />
          ) : currentStage === 'report' && activeSession ? (
            /* RESULT SCREEN */
            <ClinicalReportView
              session={activeSession}
              onNewScan={handleStartNewScan}
            />
          ) : (
          /* SCANNING WIZARD WORKFLOW */
          <div className="flex-1 flex flex-col items-center justify-start max-w-xl mx-auto w-full space-y-5">
            {/* Mode & Stage Progress Stepper Card (Genex Orange/Green Borders) */}
            <div className="w-full genex-card p-3.5 flex items-center justify-between shadow-xs">
              {/* Stage Pills */}
              {workflowMode === 'sequential' ? (
                <div className="flex items-center gap-2 text-xs font-medium">
                  {/* Stage 1 */}
                  <div
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      currentStage === 'layer1' && !awaitingBle
                        ? 'bg-amber-50 text-[#D98E3F] font-bold border border-[#D98E3F]/40'
                        : layer1Result
                        ? 'bg-emerald-50 text-[#5C8A6B] font-semibold border border-[#5C8A6B]/40'
                        : 'text-slate-400'
                    }`}
                  >
                    {layer1Result ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5C8A6B]" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-[#D98E3F]" />
                    )}
                    <span>1: Pyuria</span>
                  </div>

                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />

                  {/* Stage 2 — BLE */}
                  <div
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      awaitingBle && !ble.layer2Data
                        ? 'bg-amber-50 text-[#D98E3F] font-bold border border-[#D98E3F]/40'
                        : ble.layer2Data
                        ? 'bg-emerald-50 text-[#5C8A6B] font-semibold border border-[#5C8A6B]/40'
                        : 'text-slate-400'
                    }`}
                  >
                    {ble.layer2Data ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5C8A6B]" />
                    ) : (
                      <Microscope className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>2: Pathogen</span>
                  </div>

                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />

                  {/* Stage 3 — BLE */}
                  <div
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                      awaitingBle && ble.layer2Data && !ble.layer3Data
                        ? 'bg-amber-50 text-[#D98E3F] font-bold border border-[#D98E3F]/40'
                        : ble.layer3Data
                        ? 'bg-emerald-50 text-[#5C8A6B] font-semibold border border-[#5C8A6B]/40'
                        : 'text-slate-400'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>3: AST</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Maximize2 className="w-4 h-4 text-[#D98E3F]" />
                  <span>Single-Shot Full Cartridge Multiplex</span>
                </div>
              )}

              {/* Mode Toggle Button */}
              <button
                onClick={() => {
                  if (workflowMode === 'sequential') {
                    setWorkflowMode('single_shot');
                    setCurrentStage('full');
                  } else {
                    setWorkflowMode('sequential');
                    setCurrentStage('layer1');
                  }
                  setAwaitingBle(false);
                  ble.clearData();
                }}
                className="text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-50 border border-[#D9D4C8] hover:bg-slate-100 transition"
              >
                {workflowMode === 'sequential' ? '1-Shot Mode' : '3-Stage Mode'}
              </button>
            </div>

            {/* BLE Connection Banner */}
            {workflowMode === 'sequential' && (
              <ReaderConnectionBanner
                status={ble.status}
                isDemoMode={ble.isDemoMode}
                errorMessage={ble.errorMessage}
                onConnect={ble.connect}
                onDisconnect={ble.disconnect}
                onEnterDemo={ble.enterDemoMode}
                onExitDemo={ble.exitDemoMode}
              />
            )}

            {/* Main Content: Camera OR Waiting for BLE data */}
            {awaitingBle ? (
              <WaitingForReaderState
                bleStatus={ble.status}
                layer2Data={ble.layer2Data}
                layer3Data={ble.layer3Data}
                onRetryConnection={ble.connect}
                onEnterDemo={() => {
                  ble.enterDemoMode();
                  if (!ble.layer2Data || !ble.layer3Data) {
                    setIsSimModalOpen(true);
                  }
                }}
                onProceedToReport={() => {
                  if (ble.layer2Data && ble.layer3Data) {
                    compileBleSession(ble.layer2Data, ble.layer3Data);
                  }
                }}
              />
            ) : (
              <CameraViewfinder
                stage={currentStage as ScanStage}
                onFrameCaptured={handleFrameCaptured}
                onOpenGallery={handleOpenGallery}
                onOpenSimulator={() => setIsSimModalOpen(true)}
                onSelectStage={(stg) => setCurrentStage(stg)}
              />
            )}

            {/* Quick Demo Helper Card & Dummy Data Quick Actions */}
            {!awaitingBle && (
              <div className="w-full space-y-3">
                {/* Fetch Real Clinical Data Banner */}
                <div className="w-full genex-card p-4 bg-emerald-50/40 border-[#5C8A6B]/40 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Real Clinical Datasets (CDC / ECDC / WHO / NIH Surveillance)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      INSTANT LOAD
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESETS.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleFetchDummyData(p.id)}
                        className="p-2.5 rounded-xl bg-white border border-[#D9D4C8] hover:border-[#5C8A6B] text-left transition group shadow-2xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-800">
                            {p.name}
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {p.badge}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-slate-500 truncate max-w-[170px]">{p.description}</span>
                          <span className="text-slate-400 italic font-mono">
                            {p.citation ? p.citation.split(' ')[0] : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test Bench Simulator Link */}
                <div className="w-full genex-card p-3.5 flex items-center justify-between text-xs shadow-xs">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-[#D98E3F]/40 flex items-center justify-center text-[#D98E3F] shrink-0">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Virtual Cartridge Test Bench</span>
                      <span className="text-slate-500 text-[11px]">
                        Tune raw optical parameters & simulate physical hardware reads
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSimModalOpen(true)}
                    className="px-3.5 py-2 genex-btn-primary text-xs shrink-0 ml-3 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Launch Bench</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </React.Suspense>
      </main>

      {/* MODALS */}
      {/* 1. Post-Capture Review Modal */}
      {reviewData && (
        <CaptureReviewModal
          stage={reviewData.stage}
          capturedImageUrl={reviewData.imageUrl}
          quality={reviewData.quality}
          onAccept={handleAcceptCapturedPhoto}
          onRetake={() => {
            setRetakeCount((prev) => prev + 1);
            setReviewData(null);
          }}
          onEnterDemo={() => {
            setReviewData(null);
            setIsSimModalOpen(true);
          }}
          retakeCount={retakeCount}
        />
      )}

      {/* Lazy Modals in Suspense */}
      <React.Suspense fallback={null}>
        {/* 2. Virtual Cartridge Simulator Bench */}
        {isSimModalOpen && (
          <VirtualCartridgeModal
            stage={currentStage === 'report' ? 'layer1' : (currentStage as ScanStage)}
            isOpen={isSimModalOpen}
            onClose={() => setIsSimModalOpen(false)}
            onApplySimulatedFrame={handleFrameCaptured}
            onInjectBleData={handleSimulatorBleInject}
          />
        )}

        {/* 3. Sensor & Lighting Calibration Modal */}
        {isCalibModalOpen && (
          <CalibrationModal
            isOpen={isCalibModalOpen}
            onClose={() => setIsCalibModalOpen(false)}
            currentCalibration={calibration}
            onCalibrationUpdated={(newCalib) => setCalibration(newCalib)}
          />
        )}

        {/* 4. Config-Driven Threshold Inspector */}
        {isConfigModalOpen && (
          <ConfigInspectorModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
          />
        )}

        {/* 5. Scan History Drawer */}
        {isHistoryOpen && (
          <ScanHistoryDrawer
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSelectScan={(session) => {
              setActiveSession(session);
              setCurrentStage('report');
            }}
          />
        )}

        {/* 6. About & Troubleshooting Diagnostics Modal */}
        {isAboutModalOpen && (
          <AboutModal
            isOpen={isAboutModalOpen}
            onClose={() => setIsAboutModalOpen(false)}
            onLaunchWalkthrough={() => setIsWalkthroughOpen(true)}
          />
        )}

        {/* 7. First-Run Guided Walkthrough Modal */}
        {isWalkthroughOpen && (
          <FirstRunWalkthroughModal
            isOpen={isWalkthroughOpen}
            onClose={() => setIsWalkthroughOpen(false)}
          />
        )}

        {/* 8. Help & SOP Centre Modal */}
        {isHelpModalOpen && (
          <HelpCenterModal
            isOpen={isHelpModalOpen}
            onClose={() => setIsHelpModalOpen(false)}
            onLaunchWalkthrough={() => {
              setIsHelpModalOpen(false);
              setIsWalkthroughOpen(true);
            }}
          />
        )}
      </React.Suspense>

      {/* TIER 1: Mobile Bottom Tab Bar (Permanent solution for mobile thumb navigation) */}
      <MobileBottomNav
        activeTab={activeNavTab}
        onSelectTab={handleNavigate}
        hasActiveReport={!!activeSession}
      />
    </div>
  );
};

export default App;
