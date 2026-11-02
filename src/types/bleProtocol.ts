/**
 * BLE Protocol Types & Named Configuration Constants for Genex Reader Device
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HARDWARE TEAM TODO — confirm ALL values below before production firmware:
 *
 *   BLE_SERVICE_UUID          — GATT primary service UUID of the reader
 *   BLE_LAYER2_CHAR_UUID      — Characteristic UUID for Layer 2 (pathogen EIS) payload
 *   BLE_LAYER3_CHAR_UUID      — Characteristic UUID for Layer 3 (AST) payload
 *   BLE_DEVICE_NAME_PREFIX    — BLE advertisement name prefix for scan filter
 *   BLE_PAYLOAD_ENCODING      — 'json' (needs MTU chunking) or 'binary' (TBD schema)
 *   BLE_NOTIFY_MODEL          — 'notify' (device pushes when stable) or 'poll' (app reads)
 *   IMPEDANCE_DELTA_UNIT      — Unit and expected range for impedanceDelta values
 *   GROWTH_INDEX_RANGE        — Expected range for growthIndex (currently 0.0–1.0)
 *
 * Each is declared as a named constant so the hardware team's values can be
 * dropped in here without touching any other file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── BLE GATT Configuration Constants (swap when hardware team confirms) ──────

/** Primary GATT service UUID of the Genex reader device */
export const BLE_SERVICE_UUID = '0000fee0-0000-1000-8000-00805f9b34fb';
// TODO(hardware): replace with confirmed service UUID

/** Characteristic UUID for the Layer 2 pathogen EIS payload */
export const BLE_LAYER2_CHAR_UUID = '0000fee1-0000-1000-8000-00805f9b34fb';
// TODO(hardware): replace with confirmed characteristic UUID

/** Characteristic UUID for the Layer 3 AST resistance payload */
export const BLE_LAYER3_CHAR_UUID = '0000fee2-0000-1000-8000-00805f9b34fb';
// TODO(hardware): replace with confirmed characteristic UUID

/** BLE advertisement name prefix used to filter scan results */
export const BLE_DEVICE_NAME_PREFIX = 'Genex';
// TODO(hardware): confirm exact device name prefix

/**
 * Payload encoding format
 * 'json'   → UTF-8 JSON, may be fragmented across multiple MTU packets (needs reassembly)
 * 'binary' → compact binary encoding (schema TBD with hardware team)
 */
export const BLE_PAYLOAD_ENCODING: 'json' | 'binary' = 'json';
// TODO(hardware): confirm with firmware team

/**
 * Notification model:
 * 'notify'  → device pushes characteristic notification when measurement is stable
 * 'poll'    → app must periodically read the characteristic and check a "ready" flag
 */
export const BLE_NOTIFY_MODEL: 'notify' | 'poll' = 'notify';
// TODO(hardware): confirm with firmware team

/**
 * Maximum BLE ATT MTU in bytes. JSON payloads larger than this will be chunked.
 * Standard BLE 4.2+ default is 512; safe fallback is 20 (classic BLE).
 */
export const BLE_MTU_BYTES = 512;
// TODO(hardware): confirm negotiated MTU with firmware team

// ── Connection Status ─────────────────────────────────────────────────────────

export type BleConnectionStatus =
  | 'idle'           // Not yet attempted
  | 'scanning'       // Actively scanning for the reader device
  | 'connecting'     // Device found; establishing GATT connection
  | 'connected'      // GATT connected; subscribed to characteristics
  | 'disconnected'   // Was connected; device lost or user disconnected
  | 'error'          // Unrecoverable error (permissions denied, adapter off)
  | 'unsupported';   // Web Bluetooth not available in this browser

// ── Raw BLE Payload Types (as received from reader firmware) ──────────────────

/**
 * Layer 2 — Pathogen EIS (Electrochemical Impedance Spectroscopy) payload
 *
 * Field names and impedanceDelta ranges are PLACEHOLDERS confirmed with this
 * brief only. Hardware team must confirm exact field names/units before
 * finalizing the parser in bleParser.ts.
 *
 * TODO(hardware): confirm exact JSON field names, impedanceDelta unit (Ω? %Δ?),
 * and expected detection-positive threshold ranges.
 */
export interface BleLayer2Payload {
  layer: 2;
  timestamp: string; // ISO 8601
  pathogens: {
    ecoli:       { detected: boolean; impedanceDelta: number };
    klebsiella:  { detected: boolean; impedanceDelta: number };
    proteus:     { detected: boolean; impedanceDelta: number };
    pseudomonas: { detected: boolean; impedanceDelta: number };
    // TODO(hardware): confirm exact key names match firmware output
  };
}

/**
 * Layer 3 — Antibiotic Susceptibility Testing (AST) payload
 *
 * growthIndex range is assumed 0.0 (complete inhibition) to 1.0 (uninhibited growth).
 * status field must be one of 'Sensitive' | 'Resistant' | 'Intermediate'.
 *
 * TODO(hardware): confirm growthIndex normalization range and status enum values.
 */
export interface BleLayer3Payload {
  layer: 3;
  timestamp: string; // ISO 8601
  resistance: {
    [antibioticName: string]: {
      status: 'Sensitive' | 'Resistant' | 'Intermediate';
      growthIndex: number; // 0.0 = fully inhibited (Sensitive), 1.0 = full growth (Resistant)
    };
  };
}

/** Union of both incoming BLE payloads */
export type BlePayload = BleLayer2Payload | BleLayer3Payload;
