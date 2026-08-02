import { isObject, isNumber, isFunction } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { isMobile } from '../../detect/Device.js';

let stream = null;
let track = null;
let isOn = false;
let blinkInterval = null;
let currentIntensity = 1;

const getStream = async () => {
  if (stream && track) return { stream, track };
  
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
  track = stream.getVideoTracks()[0];
  return { stream, track };
};

const setIntensity = async (intensity) => {
  if (!track) return;
  try {
    await track.applyConstraints({
      advanced: [{ torch: true, intensity: Math.max(0, Math.min(1, intensity)) }]
    });
    currentIntensity = intensity;
  } catch (e) {}
};

const releaseStream = () => {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
  if (track) {
    track.stop();
    track = null;
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  isOn = false;
};

const flashlightHandler = async (context) => {
  const action = context.params[0] || 'on';
  const config = context.config;

  if (!isMobile()) {
    throw new Error('Flashlight not supported on desktop');
  }

  switch (action) {
    case 'on':
      return await turnOn(config);
    case 'off':
      return turnOff();
    case 'toggle':
      return isOn ? turnOff() : await turnOn(config);
    case 'blink':
      return await blink(config);
    case 'strobe':
      return await strobe(config);
    case 'pulse':
      return await pulse(config);
    case 'heartbeat':
      return await heartbeat(config);
    case 'pattern':
      return await pattern(config);
    case 'morse':
      return await morse(config);
    case 'sos':
      return await sos();
    case 'breathe':
      return await breathe(config);
    case 'rampUp':
      return await rampUp(config);
    case 'rampDown':
      return await rampDown(config);
    case 'countdown':
      return await countdown(config);
    case 'stop':
      return stopAll();
    default:
      return await turnOn(config);
  }
};

const turnOn = async (config = {}) => {
  const intensity = config.intensity || 1;
  const duration = config.duration || 0;

  await getStream();
  await setIntensity(intensity);
  isOn = true;

  if (duration > 0) {
    setTimeout(() => turnOff(), duration);
  }

  return { on: true, intensity };
};

const turnOff = () => {
  releaseStream();
  return { on: false };
};

const blink = async (config = {}) => {
  const interval = config.interval || 300;
  const count = config.count || 10;
  let blinks = 0;

  return new Promise((resolve) => {
    blinkInterval = setInterval(async () => {
      if (blinks >= count * 2) {
        clearInterval(blinkInterval);
        blinkInterval = null;
        await turnOff();
        resolve({ blinks: count, completed: true });
        return;
      }

      if (blinks % 2 === 0) {
        await turnOn(config);
      } else {
        turnOff();
      }
      blinks++;
    }, interval);
  });
};

const strobe = async (config = {}) => {
  const interval = config.interval || 30;
  const duration = config.duration || 2000;

  return new Promise(async (resolve) => {
    let elapsed = 0;
    blinkInterval = setInterval(async () => {
      if (elapsed >= duration) {
        clearInterval(blinkInterval);
        blinkInterval = null;
        await turnOff();
        resolve({ completed: true });
        return;
      }

      if (isOn) {
        turnOff();
      } else {
        await turnOn(config);
      }
      elapsed += interval;
    }, interval);
  });
};

const pulse = async (config = {}) => {
  const interval = config.interval || 500;
  const count = config.count || 5;
  let pulses = 0;

  return new Promise((resolve) => {
    blinkInterval = setInterval(async () => {
      if (pulses >= count * 2) {
        clearInterval(blinkInterval);
        blinkInterval = null;
        await turnOn();
        resolve({ pulses: count, completed: true });
        return;
      }

      if (pulses % 2 === 0) {
        await turnOn({ intensity: 1 });
      } else {
        await turnOn({ intensity: 0.3 });
      }
      pulses++;
    }, interval);
  });
};

const heartbeat = async (config = {}) => {
  const pattern = [100, 200, 100, 600];
  let index = 0;

  return new Promise((resolve) => {
    blinkInterval = setInterval(async () => {
      if (index >= pattern.length) {
        index = 0;
      }

      if (index % 2 === 0) {
        await turnOn(config);
      } else {
        turnOff();
      }

      const currentDelay = pattern[index];
      index++;

      clearInterval(blinkInterval);
      blinkInterval = setTimeout(() => {
        heartbeat(config).then(resolve);
      }, currentDelay);
    }, pattern[index] || 100);
  });
};

const customPattern = async (config = {}) => {
  const pattern = config.pattern || [];
  if (pattern.length === 0) return { completed: false };

  for (const step of pattern) {
    if (step.on > 0) await turnOn({ intensity: step.intensity || 1 });
    await new Promise(r => setTimeout(r, step.on || 0));
    if (step.off > 0) turnOff();
    await new Promise(r => setTimeout(r, step.off || 0));
  }

  await turnOff();
  return { completed: true };
};

const morse = async (config = {}) => {
  const text = config.text || config.message || 'SOS';
  const dotDuration = config.dotDuration || 100;
  const dashDuration = config.dashDuration || 300;

  const morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', ' ': ' '
  };

  const encoded = text.toUpperCase().split('').map(char => morseCode[char] || '').join(' ');

  for (const symbol of encoded) {
    if (symbol === '.') {
      await turnOn(config);
      await new Promise(r => setTimeout(r, dotDuration));
      turnOff();
    } else if (symbol === '-') {
      await turnOn(config);
      await new Promise(r => setTimeout(r, dashDuration));
      turnOff();
    }
    await new Promise(r => setTimeout(r, dotDuration));
  }

  await turnOff();
  return { message: text, morse: encoded, completed: true };
};

const sos = async (config = {}) => {
  return await morse({ ...config, text: 'SOS' });
};

const breathe = async (config = {}) => {
  const min = config.min || 0.1;
  const max = config.max || 1;
  const duration = config.duration || 2000;
  const loop = config.loop !== false;

  const breatheCycle = async () => {
    const steps = 20;
    const stepDuration = duration / steps / 2;

    for (let i = 0; i <= steps; i++) {
      const intensity = min + (max - min) * (i / steps);
      await turnOn({ intensity });
      await new Promise(r => setTimeout(r, stepDuration));
    }

    for (let i = steps; i >= 0; i--) {
      const intensity = min + (max - min) * (i / steps);
      await turnOn({ intensity });
      await new Promise(r => setTimeout(r, stepDuration));
    }
  };

  if (loop) {
    while (true) {
      await breatheCycle();
    }
  } else {
    await breatheCycle();
    return { completed: true };
  }
};

const rampUp = async (config = {}) => {
  const from = config.from || 0;
  const to = config.to || 1;
  const duration = config.duration || 3000;
  const steps = 30;
  const stepDuration = duration / steps;

  for (let i = 0; i <= steps; i++) {
    const intensity = from + (to - from) * (i / steps);
    await turnOn({ intensity });
    await new Promise(r => setTimeout(r, stepDuration));
  }

  return { completed: true, intensity: to };
};

const rampDown = async (config = {}) => {
  const from = config.from || 1;
  const to = config.to || 0;
  const duration = config.duration || 3000;
  const steps = 30;
  const stepDuration = duration / steps;

  for (let i = 0; i <= steps; i++) {
    const intensity = from + (to - from) * (i / steps);
    await turnOn({ intensity });
    await new Promise(r => setTimeout(r, stepDuration));
  }

  turnOff();
  return { completed: true };
};

const countdown = async (config = {}) => {
  const from = config.from || 5;
  const interval = config.interval || 1000;

  for (let i = from; i >= 0; i--) {
    if (i > 0) {
      await blink({ interval: 200, count: i });
    } else {
      await turnOn({ intensity: 1 });
      await new Promise(r => setTimeout(r, 2000));
      turnOff();
    }
    if (i > 0) await new Promise(r => setTimeout(r, interval - (i * 400)));
  }

  return { completed: true };
};

const stopAll = () => {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
  turnOff();
  return { stopped: true };
};

engine.register('flashlight', flashlightHandler);

const flashlight = {
  on: (options = {}) => engine.execute('flashlight', 'on', isObject(options) ? options : {}),
  off: () => engine.execute('flashlight', 'off', {}),
  toggle: (options = {}) => engine.execute('flashlight', 'toggle', isObject(options) ? options : {}),
  blink: (options = {}) => engine.execute('flashlight', 'blink', isObject(options) ? options : {}),
  strobe: (options = {}) => engine.execute('flashlight', 'strobe', isObject(options) ? options : {}),
  pulse: (options = {}) => engine.execute('flashlight', 'pulse', isObject(options) ? options : {}),
  heartbeat: (options = {}) => engine.execute('flashlight', 'heartbeat', isObject(options) ? options : {}),
  pattern: (pattern, options = {}) => engine.execute('flashlight', 'pattern', { ...options, pattern }),
  morse: (message, options = {}) => engine.execute('flashlight', 'morse', { ...options, text: message }),
  sos: (options = {}) => engine.execute('flashlight', 'sos', isObject(options) ? options : {}),
  breathe: (options = {}) => engine.execute('flashlight', 'breathe', isObject(options) ? options : {}),
  rampUp: (options = {}) => engine.execute('flashlight', 'rampUp', isObject(options) ? options : {}),
  rampDown: (options = {}) => engine.execute('flashlight', 'rampDown', isObject(options) ? options : {}),
  countdown: (from, options = {}) => engine.execute('flashlight', 'countdown', { ...options, from }),
  schedule: {
    on: (time, options = {}) => {
      const now = new Date();
      const target = new Date();
      const [hours, minutes] = time.split(':');
      target.setHours(hours, minutes, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const delay = target - now;
      setTimeout(() => flashlight.on(options), delay);
      return { scheduled: true, time, delay };
    },
    off: (time) => {
      const now = new Date();
      const target = new Date();
      const [hours, minutes] = time.split(':');
      target.setHours(hours, minutes, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const delay = target - now;
      setTimeout(() => flashlight.off(), delay);
      return { scheduled: true, time, delay };
    },
    blink: (time, options = {}) => {
      const now = new Date();
      const target = new Date();
      const [hours, minutes] = time.split(':');
      target.setHours(hours, minutes, 0, 0);
      if (target < now) target.setDate(target.getDate() + 1);
      const delay = target - now;
      setTimeout(() => flashlight.blink(options), delay);
      return { scheduled: true, time, delay };
    }
  },
  stop: stopAll
};

export { flashlight };
export default flashlight;