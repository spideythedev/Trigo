const userAgent = () => {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
};

const platform = () => {
  if (typeof navigator === 'undefined') return '';
  return navigator.platform || '';
};

const isMobile = () => {
  const ua = userAgent();
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
};

const isDesktop = () => {
  return !isMobile();
};

const isIOS = () => {
  const ua = userAgent();
  return /iPhone|iPad|iPod/i.test(ua);
};

const isAndroid = () => {
  const ua = userAgent();
  return /Android/i.test(ua);
};

const isMac = () => {
  return /Mac/i.test(platform()) && !isIOS();
};

const isWindows = () => {
  return /Win/i.test(platform());
};

const isLinux = () => {
  return /Linux/i.test(platform()) && !isAndroid();
};

const isChrome = () => {
  const ua = userAgent();
  return /Chrome/i.test(ua) && !/Edge|Edg|OPR|Brave/i.test(ua);
};

const isFirefox = () => {
  return /Firefox/i.test(userAgent());
};

const isSafari = () => {
  const ua = userAgent();
  return /Safari/i.test(ua) && !isChrome() && !isAndroid();
};

const isEdge = () => {
  return /Edg|Edge/i.test(userAgent());
};

const isOpera = () => {
  return /OPR|Opera/i.test(userAgent());
};

const isSamsung = () => {
  return /SamsungBrowser/i.test(userAgent());
};

const isPWA = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches 
    || navigator.standalone 
    || document.referrer.includes('android-app://');
};

const isOnline = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

const isHTTPS = () => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
};

const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const screenWidth = () => {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth || document.documentElement.clientWidth;
};

const screenHeight = () => {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight || document.documentElement.clientHeight;
};

const devicePixelRatio = () => {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
};

const isRetina = () => {
  return devicePixelRatio() >= 2;
};

const deviceMemory = () => {
  return navigator.deviceMemory || null;
};

const cpuCores = () => {
  return navigator.hardwareConcurrency || null;
};

const getOS = () => {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  if (isWindows()) return 'windows';
  if (isMac()) return 'macos';
  if (isLinux()) return 'linux';
  return 'unknown';
};

const getBrowser = () => {
  if (isChrome()) return 'chrome';
  if (isFirefox()) return 'firefox';
  if (isSafari()) return 'safari';
  if (isEdge()) return 'edge';
  if (isOpera()) return 'opera';
  if (isSamsung()) return 'samsung';
  return 'unknown';
};

const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  return 'desktop';
};

const getInfo = () => {
  return {
    userAgent: userAgent(),
    platform: platform(),
    os: getOS(),
    browser: getBrowser(),
    deviceType: getDeviceType(),
    isMobile: isMobile(),
    isDesktop: isDesktop(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isMac: isMac(),
    isWindows: isWindows(),
    isLinux: isLinux(),
    isChrome: isChrome(),
    isFirefox: isFirefox(),
    isSafari: isSafari(),
    isEdge: isEdge(),
    isOpera: isOpera(),
    isSamsung: isSamsung(),
    isPWA: isPWA(),
    isOnline: isOnline(),
    isHTTPS: isHTTPS(),
    isTouchDevice: isTouchDevice(),
    screenWidth: screenWidth(),
    screenHeight: screenHeight(),
    devicePixelRatio: devicePixelRatio(),
    isRetina: isRetina(),
    deviceMemory: deviceMemory(),
    cpuCores: cpuCores()
  };
};

export {
  userAgent,
  platform,
  isMobile,
  isDesktop,
  isIOS,
  isAndroid,
  isMac,
  isWindows,
  isLinux,
  isChrome,
  isFirefox,
  isSafari,
  isEdge,
  isOpera,
  isSamsung,
  isPWA,
  isOnline,
  isHTTPS,
  isTouchDevice,
  screenWidth,
  screenHeight,
  devicePixelRatio,
  isRetina,
  deviceMemory,
  cpuCores,
  getOS,
  getBrowser,
  getDeviceType,
  getInfo
};