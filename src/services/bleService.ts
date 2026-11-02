/**
 * bleService.ts — Web Bluetooth GATT client for the Genex external reader
 *
 * Responsibilities:
 *   • Detect Web Bluetooth API support
 *   • Scan & filter for the reader device (by name prefix or service UUID)
 *   • Establish GATT connection and subscribe to Layer 2 & Layer 3 characteristics
 *   • Reassemble MTU-fragmented JSON payloads
 *   • Emit parsed payloads to registered callbacks
 *   • Manage disconnect / reconnect gracefully
 *
 * All UUIDs and protocol constants are imported from bleProtocol.ts.
 * This file has ZERO hardcoded UUID strings.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO(hardware): When firmware team provides:
 *   - Real service/characteristic UUIDs  → update bleProtocol.ts constants only
 *   - Binary payload schema              → update payload parsing in onCharValue()
 *   - Poll vs notify model               → update subscribeToCharacteristic()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  BLE_SERVICE_UUID,
  BLE_LAYER2_CHAR_UUID,
  BLE_LAYER3_CHAR_UUID,
  BLE_PAYLOAD_ENCODING,
  BLE_NOTIFY_MODEL,
  BlePayload,
} from '../types/bleProtocol';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlePayloadCallback = (payload: BlePayload) => void;
export type BleErrorCallback = (error: Error) => void;
export type BleDisconnectCallback = () => void;

// ── JSON MTU Reassembly Buffer ────────────────────────────────────────────────

/**
 * Accumulates fragmented BLE packet chunks and attempts JSON.parse() on each
 * appended chunk. Returns the parsed object when a complete JSON payload is
 * assembled, or null if still waiting for more chunks.
 *
 * TODO(hardware): If payload encoding is 'binary', replace this class with
 * a binary frame parser matching the firmware's schema.
 */
class JsonReassembler {
  private buffer = '';

  append(chunk: string): BlePayload | null {
    this.buffer += chunk;
    try {
      const parsed = JSON.parse(this.buffer) as BlePayload;
      this.buffer = '';
      return parsed;
    } catch {
      // Still waiting for more chunks — not complete JSON yet
      return null;
    }
  }

  reset(): void {
    this.buffer = '';
  }
}

// ── BleService ────────────────────────────────────────────────────────────────

export class BleService {
  private static device: BluetoothDevice | null = null;
  private static server: BluetoothRemoteGATTServer | null = null;
  private static layer2Reassembler = new JsonReassembler();
  private static layer3Reassembler = new JsonReassembler();

  private static onPayload: BlePayloadCallback | null = null;
  private static onError: BleErrorCallback | null = null;
  private static onDisconnect: BleDisconnectCallback | null = null;

  /**
   * Returns true if the Web Bluetooth API is available in the current browser.
   * False in Safari, Firefox, iOS Chrome, and non-HTTPS contexts.
   */
  public static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Registers callbacks for payload, error, and disconnect events.
   * Must be called before connect().
   */
  public static setCallbacks(
    onPayload: BlePayloadCallback,
    onError: BleErrorCallback,
    onDisconnect: BleDisconnectCallback
  ): void {
    BleService.onPayload = onPayload;
    BleService.onError = onError;
    BleService.onDisconnect = onDisconnect;
  }

  /**
   * Initiates BLE device scan and GATT connection.
   * Shows the browser's native BLE device picker to the user.
   *
   * TODO(hardware): Confirm whether to filter by `namePrefix` or `services` —
   * filtering by both is most reliable but requires firmware to advertise the
   * service UUID in its advertisement packet.
   */
  public static async connect(): Promise<void> {
    if (!BleService.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
    }

    try {
      // Show native BLE picker filtered to our reader device
      // TODO(hardware): uncomment `namePrefix` filter once device name prefix is confirmed
      BleService.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLE_SERVICE_UUID] },
          // { namePrefix: BLE_DEVICE_NAME_PREFIX },  // TODO(hardware): enable after confirming name prefix
        ],
        optionalServices: [BLE_SERVICE_UUID],
      });

      BleService.device.addEventListener(
        'gattserverdisconnected',
        BleService.handleDisconnect
      );

      BleService.server = await BleService.device.gatt!.connect();

      const service = await BleService.server.getPrimaryService(BLE_SERVICE_UUID);

      await BleService.subscribeToCharacteristic(
        service,
        BLE_LAYER2_CHAR_UUID,
        BleService.layer2Reassembler
      );

      await BleService.subscribeToCharacteristic(
        service,
        BLE_LAYER3_CHAR_UUID,
        BleService.layer3Reassembler
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      BleService.onError?.(error);
      throw error;
    }
  }

  /**
   * Disconnects from the reader device gracefully.
   */
  public static disconnect(): void {
    if (BleService.server?.connected) {
      BleService.server.disconnect();
    }
    BleService.device = null;
    BleService.server = null;
    BleService.layer2Reassembler.reset();
    BleService.layer3Reassembler.reset();
  }

  /**
   * Returns true if currently connected to the reader.
   */
  public static isConnected(): boolean {
    return BleService.server?.connected ?? false;
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private static async subscribeToCharacteristic(
    service: BluetoothRemoteGATTService,
    uuid: string,
    reassembler: JsonReassembler
  ): Promise<void> {
    const characteristic = await service.getCharacteristic(uuid);

    if (BLE_NOTIFY_MODEL === 'notify') {
      // TODO(hardware): if firmware uses 'indicate' instead of 'notify',
      // change startNotifications() to startIndications() when API is available.
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        BleService.onCharValue(event, reassembler);
      });
      await characteristic.startNotifications();
    } else {
      // Poll model — TODO(hardware): implement polling interval & ready-flag check
      // For now, do a single read as a placeholder
      const value = await characteristic.readValue();
      BleService.processDataView(value, reassembler);
    }
  }

  private static onCharValue(event: Event, reassembler: JsonReassembler): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    BleService.processDataView(target.value, reassembler);
  }

  private static processDataView(value: DataView, reassembler: JsonReassembler): void {
    try {
      if (BLE_PAYLOAD_ENCODING === 'json') {
        // Decode UTF-8 bytes to string (may be a partial JSON chunk)
        const decoder = new TextDecoder('utf-8');
        const chunk = decoder.decode(value);
        const payload = reassembler.append(chunk);
        if (payload) {
          BleService.onPayload?.(payload);
        }
      } else {
        // TODO(hardware): implement binary frame parsing when schema is confirmed
        console.warn('[BleService] Binary payload encoding not yet implemented.');
      }
    } catch (err) {
      BleService.onError?.(new Error(`BLE parse error: ${err}`));
    }
  }

  private static handleDisconnect = (): void => {
    BleService.device = null;
    BleService.server = null;
    BleService.layer2Reassembler.reset();
    BleService.layer3Reassembler.reset();
    BleService.onDisconnect?.();
  };
}
