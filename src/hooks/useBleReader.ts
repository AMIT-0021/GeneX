/**
 * useBleReader.ts — React hook encapsulating the BLE reader connection lifecycle
 *
 * Exposes:
 *   status        — current BleConnectionStatus (never ambiguous)
 *   layer2Data    — parsed Layer2Result when received, or null
 *   layer3Data    — parsed Layer3Result when received, or null
 *   isDemoMode    — true when running in clearly-labeled Demo Mode
 *   connect()     — initiates BLE pairing & connection
 *   disconnect()  — disconnects gracefully
 *   enterDemoMode()   — switches to Demo Mode (hackathon fallback)
 *   exitDemoMode()    — clears demo mode flag
 *   clearData()   — clears layer2/3 data for a fresh scan
 *   injectDemoData()  — injects synthetic Layer2/3 data for Demo Mode
 */

import { useState, useCallback, useRef } from 'react';
import { BleConnectionStatus, BlePayload } from '../types/bleProtocol';
import { Layer2Result, Layer3Result } from '../types/diagnostic';
import { BleService } from '../services/bleService';
import { parseLayer2, parseLayer3 } from '../services/bleParser';

export interface BleReaderState {
  status: BleConnectionStatus;
  layer2Data: Layer2Result | null;
  layer3Data: Layer3Result | null;
  isDemoMode: boolean;
  errorMessage: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  clearData: () => void;
  injectDemoData: (l2: Layer2Result, l3: Layer3Result) => void;
}

export function useBleReader(): BleReaderState {
  const [status, setStatus] = useState<BleConnectionStatus>(
    BleService.isSupported() ? 'idle' : 'unsupported'
  );
  const [layer2Data, setLayer2Data] = useState<Layer2Result | null>(null);
  const [layer3Data, setLayer3Data] = useState<Layer3Result | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track active connection to prevent stale closures
  const isConnecting = useRef(false);

  // ── Payload Handler ──────────────────────────────────────────────────────────

  const handlePayload = useCallback((payload: BlePayload) => {
    if (payload.layer === 2) {
      try {
        const result = parseLayer2(payload);
        setLayer2Data(result);
      } catch (err) {
        console.error('[useBleReader] Layer 2 parse error:', err);
      }
    } else if (payload.layer === 3) {
      try {
        const result = parseLayer3(payload);
        setLayer3Data(result);
      } catch (err) {
        console.error('[useBleReader] Layer 3 parse error:', err);
      }
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('[useBleReader] BLE error:', error);
    setStatus('error');
    setErrorMessage(error.message);
    isConnecting.current = false;
  }, []);

  const handleDisconnect = useCallback(() => {
    setStatus('disconnected');
    setErrorMessage('Reader device disconnected. Check device and retry.');
    isConnecting.current = false;
  }, []);

  // ── Public Actions ───────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    if (!BleService.isSupported()) {
      setStatus('unsupported');
      setErrorMessage('Web Bluetooth is not supported. Use Chrome or Edge on Android/Desktop.');
      return;
    }

    if (isConnecting.current) return;
    isConnecting.current = true;

    setStatus('scanning');
    setErrorMessage(null);
    setIsDemoMode(false);

    BleService.setCallbacks(handlePayload, handleError, handleDisconnect);

    try {
      setStatus('connecting');
      await BleService.connect();
      setStatus('connected');
      isConnecting.current = false;
    } catch (err) {
      // handleError callback already called by BleService
      if (status !== 'error') {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Connection failed');
      }
      isConnecting.current = false;
    }
  }, [handlePayload, handleError, handleDisconnect, status]);

  const disconnect = useCallback(() => {
    BleService.disconnect();
    setStatus('disconnected');
    isConnecting.current = false;
  }, []);

  const enterDemoMode = useCallback(() => {
    BleService.disconnect();
    setIsDemoMode(true);
    setStatus('idle');
    setErrorMessage(null);
    isConnecting.current = false;
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setLayer2Data(null);
    setLayer3Data(null);
    setStatus(BleService.isSupported() ? 'idle' : 'unsupported');
  }, []);

  const clearData = useCallback(() => {
    setLayer2Data(null);
    setLayer3Data(null);
  }, []);

  /**
   * Inject synthetic Layer 2/3 data into the hook (used by Demo Mode and
   * Test Bench Simulator to pre-populate results without a real BLE device).
   */
  const injectDemoData = useCallback((l2: Layer2Result, l3: Layer3Result) => {
    setLayer2Data(l2);
    setLayer3Data(l3);
  }, []);

  return {
    status,
    layer2Data,
    layer3Data,
    isDemoMode,
    errorMessage,
    connect,
    disconnect,
    enterDemoMode,
    exitDemoMode,
    clearData,
    injectDemoData,
  };
}
