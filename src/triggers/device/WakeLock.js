import { isObject } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let wakeLock = null;

const wakeLockHandler = async (context) => {
  const action = context.params[0] || 'request';
  const config = context.config;

  if (!('wakeLock' in navigator)) {
    throw new Error('Wake Lock API not supported');
  }

  switch (action) {
    case 'request':
      return await requestWakeLock(config);
    case 'release':
      return await releaseWakeLock(config);
    default:
      return await requestWakeLock(config);
  }
};

const requestWakeLock = async (config = {}) => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');

    if (config.onAcquire) config.onAcquire(wakeLock);

    wakeLock.addEventListener('release', () => {
      wakeLock = null;
      if (config.onRelease) config.onRelease();
    });

    return { locked: true, type: 'screen' };
  } catch (error) {
    throw new Error(`WakeLock request failed: ${error.message}`);
  }
};

const releaseWakeLock = async (config = {}) => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
    if (config.onRelease) config.onRelease();
  }
  return { locked: false };
};

const isLocked = () => {
  return wakeLock !== null;
};

engine.register('wakeLock', wakeLockHandler);

const wakelock = {
  request: (options = {}) => engine.execute('wakeLock', 'request', isObject(options) ? options : {}),
  release: (options = {}) => engine.execute('wakeLock', 'release', isObject(options) ? options : {}),
  isLocked
};

export { wakelock };
export default wakelock;