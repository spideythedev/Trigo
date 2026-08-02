const checkVibrate = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

const checkHaptic = () => {
  return typeof navigator !== 'undefined' && 'userActivation' in navigator;
};

const checkFlashlight = () => {
  return typeof navigator !== 'undefined' && 'mediaDevices' in navigator;
};

const checkCamera = () => {
  return typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
};

const checkMicrophone = () => {
  return typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
};

const checkGeolocation = () => {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
};

const checkNFC = () => {
  return typeof navigator !== 'undefined' && 'nfc' in navigator;
};

const checkBluetooth = () => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

const checkUSB = () => {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
};

const checkClipboard = () => {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator;
};

const checkShare = () => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

const checkFullscreen = () => {
  return typeof document !== 'undefined' && (
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );
};

const checkWakeLock = () => {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
};

const checkNotifications = () => {
  return typeof Notification !== 'undefined';
};

const checkSpeechSynthesis = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

const checkSpeechRecognition = () => {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
};

const checkDeviceMotion = () => {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
};

const checkDeviceOrientation = () => {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
};

const checkProximity = () => {
  return typeof window !== 'undefined' && 'DeviceProximityEvent' in window;
};

const checkAmbientLight = () => {
  return typeof window !== 'undefined' && 'DeviceLightEvent' in window;
};

const checkBattery = () => {
  return typeof navigator !== 'undefined' && 'getBattery' in navigator;
};

const checkNetworkInfo = () => {
  return typeof navigator !== 'undefined' && 'connection' in navigator;
};

const checkGamepad = () => {
  return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
};

const checkLocalStorage = () => {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const checkSessionStorage = () => {
  try {
    return typeof sessionStorage !== 'undefined';
  } catch {
    return false;
  }
};

const checkIndexedDB = () => {
  return typeof window !== 'undefined' && 'indexedDB' in window;
};

const checkWebWorker = () => {
  return typeof Worker !== 'undefined';
};

const checkServiceWorker = () => {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
};

const checkWebSocket = () => {
  return typeof WebSocket !== 'undefined';
};

const checkWebRTC = () => {
  return typeof window !== 'undefined' && (
    'RTCPeerConnection' in window ||
    'webkitRTCPeerConnection' in window
  );
};

const checkCanvas = () => {
  try {
    return typeof document !== 'undefined' && !!document.createElement('canvas').getContext;
  } catch {
    return false;
  }
};

const checkWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl');
  } catch {
    return false;
  }
};

const checkTouch = () => {
  return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
};

const checkForceTouch = () => {
  return typeof window !== 'undefined' && 'ontouchforcechange' in window;
};

const checkPayment = () => {
  return typeof window !== 'undefined' && 'PaymentRequest' in window;
};

const checkCredential = () => {
  return typeof window !== 'undefined' && 'PasswordCredential' in window;
};

const checkWebAuthn = () => {
  return typeof window !== 'undefined' && 'PublicKeyCredential' in window;
};

const checkMIDI = () => {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
};

const checkSerial = () => {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
};

const checkHID = () => {
  return typeof navigator !== 'undefined' && 'hid' in navigator;
};

const supportMatrix = () => {
  return {
    vibrate: checkVibrate(),
    haptic: checkHaptic(),
    flashlight: checkFlashlight(),
    camera: checkCamera(),
    microphone: checkMicrophone(),
    geolocation: checkGeolocation(),
    nfc: checkNFC(),
    bluetooth: checkBluetooth(),
    usb: checkUSB(),
    clipboard: checkClipboard(),
    share: checkShare(),
    fullscreen: checkFullscreen(),
    wakeLock: checkWakeLock(),
    notifications: checkNotifications(),
    speechSynthesis: checkSpeechSynthesis(),
    speechRecognition: checkSpeechRecognition(),
    deviceMotion: checkDeviceMotion(),
    deviceOrientation: checkDeviceOrientation(),
    proximity: checkProximity(),
    ambientLight: checkAmbientLight(),
    battery: checkBattery(),
    networkInfo: checkNetworkInfo(),
    gamepad: checkGamepad(),
    localStorage: checkLocalStorage(),
    sessionStorage: checkSessionStorage(),
    indexedDB: checkIndexedDB(),
    webWorker: checkWebWorker(),
    serviceWorker: checkServiceWorker(),
    webSocket: checkWebSocket(),
    webRTC: checkWebRTC(),
    canvas: checkCanvas(),
    webGL: checkWebGL(),
    touch: checkTouch(),
    forceTouch: checkForceTouch(),
    payment: checkPayment(),
    credential: checkCredential(),
    webAuthn: checkWebAuthn(),
    midi: checkMIDI(),
    serial: checkSerial(),
    hid: checkHID()
  };
};

export {
  checkVibrate,
  checkHaptic,
  checkFlashlight,
  checkCamera,
  checkMicrophone,
  checkGeolocation,
  checkNFC,
  checkBluetooth,
  checkUSB,
  checkClipboard,
  checkShare,
  checkFullscreen,
  checkWakeLock,
  checkNotifications,
  checkSpeechSynthesis,
  checkSpeechRecognition,
  checkDeviceMotion,
  checkDeviceOrientation,
  checkProximity,
  checkAmbientLight,
  checkBattery,
  checkNetworkInfo,
  checkGamepad,
  checkLocalStorage,
  checkSessionStorage,
  checkIndexedDB,
  checkWebWorker,
  checkServiceWorker,
  checkWebSocket,
  checkWebRTC,
  checkCanvas,
  checkWebGL,
  checkTouch,
  checkForceTouch,
  checkPayment,
  checkCredential,
  checkWebAuthn,
  checkMIDI,
  checkSerial,
  checkHID,
  supportMatrix
};