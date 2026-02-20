// src/lib/clientInfo.ts

export interface ClientData {
  latitude: number | null;
  longitude: number | null;
  device_type: string;
  screen_res: string;
  timezone: string;
}

export const getClientData = async (): Promise<ClientData> => {
  // 1. Basic Browser Data
  const device_type = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  const screen_res = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 2. Geolocation (Promisified)
  let latitude = null;
  let longitude = null;

  try {
    if ('geolocation' in navigator) {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    console.warn("Location access denied or unavailable");
  }

  return { latitude, longitude, device_type, screen_res, timezone };
};