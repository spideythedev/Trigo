import { isNumber, isArray, isObject } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isMobile } from '../../detect/Device.js';

const vibrate = (pattern, options = {}) => {
  const config = isObject(options) ? options : {};
  
  return engine.execute('vibrate', pattern, config);
};

vibrate.pulse = (count = 3, options = {}) => {
  const pattern = [];
  for (let i = 0; i < count; i++) {
    pattern.push(100, 100);
  }
  return vibrate(pattern, options);
};

vibrate.long = (duration = 1000, options = {}) => {
  return vibrate(duration, options);
};

vibrate.short = (options = {}) => {
  return vibrate(50, options);
};

vibrate.pattern = (pattern, options = {}) => {
  return vibrate(pattern, options);
};

vibrate.sos = (options = {}) => {
  const pattern = [
    100, 100, 100, 100, 100, 300,
    300, 100, 300, 100, 300, 300,
    100, 100, 100, 100, 100, 700
  ];
  return vibrate(pattern, options);
};

vibrate.heartbeat = (options = {}) => {
  const pattern = [100, 200, 100, 600];
  return vibrate(pattern, options);
};

vibrate.continuous = (interval = 500, options = {}) => {
  const pattern = Array(50).fill(interval).map((v, i) => i % 2 === 0 ? v : v);
  return vibrate(pattern, options);
};

vibrate.stop = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(0);
  }
};

const vibrateHandler = (context) => {
  const pattern = context.params[0] || 200;
  const config = context.config;

  if (!isMobile()) {
    throw new Error('Vibrate not supported on desktop');
  }

  if (!navigator.vibrate) {
    throw new Error('Vibration API not available');
  }

  let vibrationPattern;

  if (isNumber(pattern)) {
    vibrationPattern = pattern;
  } else if (isArray(pattern)) {
    vibrationPattern = pattern;
  } else {
    vibrationPattern = 200;
  }

  navigator.vibrate(vibrationPattern);

  const totalDuration = isArray(vibrationPattern)
    ? vibrationPattern.reduce((sum, val) => sum + val, 0)
    : vibrationPattern;

  if (config.duration && config.duration > totalDuration) {
    setTimeout(() => {
      navigator.vibrate(0);
    }, totalDuration);
  }

  return {
    pattern: vibrationPattern,
    totalDuration,
    stopped: false
  };
};

engine.register('vibrate', vibrateHandler);

vibrate.stopAll = vibrate.stop;

export { vibrate };
export default vibrate;