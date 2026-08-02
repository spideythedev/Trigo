import { isMobile, isDesktop, isIOS, isAndroid, isOnline, isHTTPS, isPWA, isTouchDevice, isRetina } from './Device.js';
import { supportMatrix } from './Support.js';

let cachedSupport = null;

const getSupport = () => {
  if (!cachedSupport) {
    cachedSupport = supportMatrix();
  }
  return cachedSupport;
};

const can = (feature) => {
  const support = getSupport();
  if (feature in support) return support[feature];
  
  const features = {
    call: () => isMobile() && /tel:/.test('a'),
    sms: () => isMobile() && /sms:/.test('a'),
    email: () => /mailto:/.test('a'),
    install: () => isPWA() || (typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window),
    pip: () => typeof document !== 'undefined' && 'pictureInPictureEnabled' in document,
    screenBrightness: () => isMobile(),
    keepAwake: () => 'wakeLock' in navigator,
    nightMode: () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined,
    orientation: () => typeof screen !== 'undefined' && 'orientation' in screen,
    keyboard: () => isMobile(),
    compass: () => isMobile(),
    magnetometer: () => isMobile(),
    barometer: () => isMobile(),
    altimeter: () => isMobile(),
    temperature: () => isMobile(),
    uvSensor: () => isMobile(),
    heartRate: () => isMobile(),
    eyeTracking: () => true,
    faceDetect: () => true,
    poseDetect: () => true,
    objectDetect: () => true,
    sentiment: () => true,
    cast: () => typeof window !== 'undefined' && 'CastableVideoElement' in window,
    beacon: () => isMobile(),
    uwb: () => isMobile(),
    print: () => isDesktop(),
    toPDF: () => isDesktop(),
  };

  if (feature in features) return features[feature]();
  return null;
};

const has = (feature) => {
  return can(feature) === true;
};

const is = {
  mobile: () => isMobile(),
  desktop: () => isDesktop(),
  ios: () => isIOS(),
  android: () => isAndroid(),
  online: () => isOnline(),
  offline: () => !isOnline(),
  https: () => isHTTPS(),
  pwa: () => isPWA(),
  touch: () => isTouchDevice(),
  retina: () => isRetina(),
  dark: () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  light: () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches,
  landscape: () => typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches,
  portrait: () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches,
  reducedMotion: () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  highContrast: () => typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: high)').matches,
  night: () => {
    const hour = new Date().getHours();
    return hour < 6 || hour >= 20;
  },
  day: () => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 20;
  },
  still: () => {
    return new Promise((resolve) => {
      if (!can('deviceMotion')) return resolve(true);
      let lastX, lastY, lastZ;
      let still = true;
      const handler = (event) => {
        const { x, y, z } = event.accelerationIncludingGravity;
        if (lastX !== undefined) {
          const diff = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
          if (diff > 1) still = false;
        }
        lastX = x; lastY = y; lastZ = z;
      };
      window.addEventListener('devicemotion', handler);
      setTimeout(() => {
        window.removeEventListener('devicemotion', handler);
        resolve(still);
      }, 1000);
    });
  }
};

const capabilities = {
  device: is,
  can,
  has,
  getSupport,
  refresh: () => {
    cachedSupport = null;
    return getSupport();
  }
};

export { can, has, is, getSupport, capabilities };
export default capabilities;