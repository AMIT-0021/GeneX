/**
 * Genex BLE Reader Protocol Configuration
 * Named parameters for hardware transport & BLE GATT communication.
 */
export interface BleProtocolConfig {
  /** Transport protocol: BLE GATT vs Serial/USB bridge */
  transport: 'BLE_GATT' | 'USB_SERIAL';
  
  /** Service UUID for Genex reader device */
  serviceUuid: string;
  
  /** Characteristic UUID for Layer 2 Pathogen ID data stream */
  layer2CharacteristicUuid: string;
  
  /** Characteristic UUID for Layer 3 AST Viability data stream */
  layer3CharacteristicUuid: string;
  
  /** Data transmission mode: notify (push), indicate (ack push), or poll */
  transmissionMode: 'NOTIFY' | 'INDICATE' | 'POLL';
  
  /** Payload encoding: JSON (with MTU chunking) or Compact Binary */
  payloadEncoding: 'JSON_CHUNKED' | 'COMPACT_BINARY';
  
  /** Device discovery filter prefix for BLE scan filtering */
  deviceFilterPrefix: string;
  
  /** BLE reader response timeout in milliseconds before surfacing fallback options */
  readerTimeoutMs: number;
}

export const defaultBleConfig: BleProtocolConfig = {
  transport: 'BLE_GATT',
  serviceUuid: '0000ffe0-0000-1000-8000-00805f9b34fb',
  layer2CharacteristicUuid: '0000ffe1-0000-1000-8000-00805f9b34fb',
  layer3CharacteristicUuid: '0000ffe2-0000-1000-8000-00805f9b34fb',
  transmissionMode: 'NOTIFY',
  payloadEncoding: 'JSON_CHUNKED',
  deviceFilterPrefix: 'Genex',
  readerTimeoutMs: 18000, // 18-second timeout for Section 7.2 requirement (15-20s)
};
