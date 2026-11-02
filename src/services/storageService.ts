import { ScanSession, CalibrationData, PatientProfile } from '../types/diagnostic';

const STORAGE_KEY_SESSIONS = 'genex_scan_history_v1';
const STORAGE_KEY_CALIBRATION = 'genex_device_calibration_v1';
const ENCRYPTION_SALT = 'genex_poc_salt_2026';

// In-memory fallback if localStorage is blocked (e.g. Safari private mode or mobile storage restrictions)
const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (e) {
    console.warn('[StorageService] LocalStorage read blocked, using memoryStore:', e);
  }
  return memoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  memoryStore[key] = value;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('[StorageService] LocalStorage write blocked, saved in memoryStore:', e);
  }
}

function safeRemoveItem(key: string): void {
  delete memoryStore[key];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('[StorageService] LocalStorage removeItem blocked:', e);
  }
}

// Device encryption key generation for local at-rest protection (FR16, FR39)
async function getOrCreateCryptoKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) return null;
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(ENCRYPTION_SALT),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('health_data_storage_salt'),
        iterations: 10000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}

export class StorageService {
  /**
   * Saves calibration data to local device storage (FR26)
   */
  public static saveCalibration(calibration: CalibrationData): void {
    try {
      safeSetItem(STORAGE_KEY_CALIBRATION, JSON.stringify(calibration));
    } catch (e) {
      console.error("Failed to persist calibration data:", e);
    }
  }

  /**
   * Retrieves saved calibration data
   */
  public static loadCalibration(): CalibrationData | null {
    try {
      const data = safeGetItem(STORAGE_KEY_CALIBRATION);
      if (!data) return null;
      return JSON.parse(data) as CalibrationData;
    } catch {
      return null;
    }
  }

  /**
   * Encrypts and saves a scan session (FR15, FR16)
   */
  public static async saveScan(session: ScanSession): Promise<boolean> {
    try {
      const existing = await this.getAllScans();
      const updated = [session, ...existing.filter(s => s.id !== session.id)];
      const jsonString = JSON.stringify(updated);
      const key = await getOrCreateCryptoKey();

      if (key && window.crypto?.subtle) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encryptedBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          enc.encode(jsonString)
        );

        const payload = {
          iv: Array.from(iv),
          data: Array.from(new Uint8Array(encryptedBuffer)),
          isEncrypted: true,
        };

        safeSetItem(STORAGE_KEY_SESSIONS, JSON.stringify(payload));
      } else {
        safeSetItem(STORAGE_KEY_SESSIONS, jsonString);
      }
      return true;
    } catch (e) {
      console.error("Failed to save scan session:", e);
      return false;
    }
  }

  /**
   * Retrieves and decrypts all past scan sessions (FR30)
   */
  public static async getAllScans(): Promise<ScanSession[]> {
    try {
      const raw = safeGetItem(STORAGE_KEY_SESSIONS);
      if (!raw) return [];

      const key = await getOrCreateCryptoKey();

      if (key && window.crypto?.subtle) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.isEncrypted && parsed.iv && parsed.data) {
            const iv = new Uint8Array(parsed.iv);
            const dataBuffer = new Uint8Array(parsed.data);
            const decryptedBuffer = await window.crypto.subtle.decrypt(
              { name: 'AES-GCM', iv },
              key,
              dataBuffer
            );

            const dec = new TextDecoder();
            const jsonString = dec.decode(decryptedBuffer);
            return JSON.parse(jsonString) as ScanSession[];
          }
        } catch {
          // Fall through to plain JSON
        }
      }

      try {
        return JSON.parse(raw) as ScanSession[];
      } catch {
        return [];
      }
    } catch (e) {
      console.warn("Unable to load stored scans:", e);
      return [];
    }
  }

  /**
   * Deletes a specific scan permanently (FR18)
   */
  public static async deleteScan(scanId: string): Promise<boolean> {
    try {
      const existing = await this.getAllScans();
      const filtered = existing.filter(s => s.id !== scanId);
      const jsonString = JSON.stringify(filtered);
      const key = await getOrCreateCryptoKey();

      if (key && window.crypto?.subtle) {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encryptedBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          enc.encode(jsonString)
        );

        safeSetItem(
          STORAGE_KEY_SESSIONS,
          JSON.stringify({
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encryptedBuffer)),
            isEncrypted: true,
          })
        );
      } else {
        safeSetItem(STORAGE_KEY_SESSIONS, jsonString);
      }
      return true;
    } catch (e) {
      console.error("Failed to delete scan:", e);
      return false;
    }
  }

  /**
   * Clears all local scans
   */
  public static clearAllScans(): void {
    safeRemoveItem(STORAGE_KEY_SESSIONS);
  }

  // --- PATIENT DASHBOARD PROFILES STORAGE ---
  private static STORAGE_KEY_PROFILES = 'genex_patient_profiles_v1';
  private static STORAGE_KEY_ACTIVE_PROFILE = 'genex_active_profile_id_v1';

  public static DEFAULT_PROFILES: PatientProfile[] = [
    {
      id: 'prof_rajesh',
      patientName: 'Rajesh Sharma',
      age: 48,
      gender: 'Male',
      dob: '1978-04-12',
      phone: '+91 98765 43210',
      email: 'rajesh.sharma@example.com',
      mrn: 'MRN-AIIMS-90481',
      allergies: ['Ciprofloxacin', 'Ampicillin'],
      medicalRecords: [
        {
          id: 'rec_1',
          dateAdded: '2026-01-15',
          description: 'Recurrent UTI — 3 episodes in past 12 months',
          isHighRiskCondition: true,
          notes: 'Flagged by infectious disease specialist for close monitoring.',
        },
        {
          id: 'rec_2',
          dateAdded: '2024-08-10',
          description: 'Type 2 Diabetes Mellitus — HbA1c 7.2%',
          isHighRiskCondition: true,
          notes: 'Metformin 500mg BID.',
        },
        {
          id: 'rec_3',
          dateAdded: '2025-05-20',
          description: 'Renal Stone Disease — Left kidney nephrolithiasis',
          isHighRiskCondition: false,
          notes: 'Alkaline urinary pH history.',
        },
      ],
    },
    {
      id: 'prof_sunita',
      patientName: 'Sunita Devi',
      age: 52,
      gender: 'Female',
      dob: '1974-09-25',
      phone: '+91 91234 56789',
      email: 'sunita.devi@example.com',
      mrn: 'MRN-PGI-77492',
      allergies: ['Penicillin'],
      medicalRecords: [
        {
          id: 'rec_4',
          dateAdded: '2026-02-01',
          description: 'Post-catheterization urinary retention',
          isHighRiskCondition: true,
          notes: 'Foley catheter insertion history.',
        },
      ],
    },
    {
      id: 'prof_ananya',
      patientName: 'Ananya Krishnan',
      age: 29,
      gender: 'Female',
      dob: '1997-11-03',
      phone: '+91 99887 76655',
      email: 'ananya.k@example.com',
      mrn: 'MRN-JIP-50291',
      allergies: [],
      medicalRecords: [
        {
          id: 'rec_5',
          dateAdded: '2026-03-05',
          description: 'Active Pregnancy — 2nd Trimester (22 weeks)',
          isHighRiskCondition: true,
          notes: 'Requires antimicrobial treatment for asymptomatic bacteriuria.',
        },
      ],
    },
  ];

  public static getPatientProfiles(): PatientProfile[] {
    try {
      const raw = safeGetItem(this.STORAGE_KEY_PROFILES);
      if (!raw) {
        this.saveAllProfiles(this.DEFAULT_PROFILES);
        return this.DEFAULT_PROFILES;
      }
      return JSON.parse(raw) as PatientProfile[];
    } catch {
      return this.DEFAULT_PROFILES;
    }
  }

  public static saveAllProfiles(profiles: PatientProfile[]): void {
    try {
      safeSetItem(this.STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.error("Failed to save profiles:", e);
    }
  }

  public static saveProfile(profile: PatientProfile): void {
    try {
      const existing = this.getPatientProfiles();
      const idx = existing.findIndex(p => p.id === profile.id);
      if (idx >= 0) {
        existing[idx] = profile;
      } else {
        existing.push(profile);
      }
      this.saveAllProfiles(existing);
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  }

  public static getActiveProfile(): PatientProfile {
    try {
      const profiles = this.getPatientProfiles();
      const activeId = safeGetItem(this.STORAGE_KEY_ACTIVE_PROFILE);
      if (activeId) {
        const found = profiles.find(p => p.id === activeId);
        if (found) return found;
      }
      return profiles[0] || this.DEFAULT_PROFILES[0];
    } catch {
      return this.DEFAULT_PROFILES[0];
    }
  }

  public static setActiveProfileId(id: string): void {
    try {
      safeSetItem(this.STORAGE_KEY_ACTIVE_PROFILE, id);
    } catch (e) {
      console.error("Failed to set active profile id:", e);
    }
  }
}
