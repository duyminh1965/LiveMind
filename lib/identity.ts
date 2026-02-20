// src/lib/identity.ts

export interface DeviceIdentity {
  clientId: string;    // The Persistent ID (UUID)
  fingerprint: string; // Hardware profile hash
}

// Simple hash function for fingerprinting
const generateHash = (str: string) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const getDeviceIdentity = (): DeviceIdentity => {
  if (typeof window === 'undefined') {
    return { clientId: 'server-side', fingerprint: 'unknown' };
  }

  // 1. Hardware Fingerprint (Screen + Hardware Concurrency + Timezone + Language)
  // This creates a "signature" of the machine.
  const rawFingerprint = [
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    navigator.hardwareConcurrency,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language
  ].join('|');
  
  const fingerprint = generateHash(rawFingerprint);

  // 2. Persistent Client UUID (The "Cookie" equivalent)
  const STORAGE_KEY = 'livemind_device_id';
  let clientId = localStorage.getItem(STORAGE_KEY);

  if (!clientId) {
    // Generate new UUID if this is the very first visit
    clientId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, clientId);
  }

  return { clientId, fingerprint };
};