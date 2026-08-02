import { isObject, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let audioContext = null;
let currentOscillator = null;
let currentGainNode = null;

const beepHandler = async (context) => {
  const action = context.params[0] || 'play';
  const config = context.config;

  switch (action) {
    case 'play':
      return play(config);
    case 'stop':
      return stop();
    default:
      return play(config);
  }
};

const getContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

const play = (config = {}) => {
  stop();

  const ctx = getContext();
  const frequency = config.frequency || 800;
  const duration = config.duration || 200;
  const count = config.count || 1;
  const type = config.type || 'sine';
  const volume = isNumber(config.volume) ? config.volume : 0.5;
  const interval = config.interval || 100;

  let beepsPlayed = 0;

  return new Promise((resolve) => {
    const playBeep = () => {
      if (beepsPlayed >= count) {
        if (config.onEnd) config.onEnd();
        resolve({ played: true, count: beepsPlayed });
        return;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      currentOscillator = oscillator;
      currentGainNode = gainNode;

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);

      beepsPlayed++;
      if (config.onBeep) config.onBeep(beepsPlayed, count);

      oscillator.onended = () => {
        if (beepsPlayed < count) {
          setTimeout(playBeep, interval);
        } else {
          if (config.onEnd) config.onEnd();
          resolve({ played: true, count: beepsPlayed });
        }
      };
    };

    playBeep();
  });
};

const stop = () => {
  if (currentOscillator) {
    try {
      currentOscillator.stop();
    } catch (e) {}
    currentOscillator = null;
  }
  if (currentGainNode) {
    currentGainNode.disconnect();
    currentGainNode = null;
  }
  return { stopped: true };
};

const closeContext = () => {
  stop();
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
};

engine.register('beep', beepHandler);

const beep = (options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.frequency = options;
  return engine.execute('beep', 'play', config);
};

beep.play = (options = {}) => {
  return engine.execute('beep', 'play', isObject(options) ? options : {});
};

beep.stop = () => {
  return engine.execute('beep', 'stop', {});
};

beep.frequency = (frequency, options = {}) => {
  const config = isObject(options) ? options : {};
  config.frequency = frequency;
  return engine.execute('beep', 'play', config);
};

beep.close = closeContext;

export { beep };
export default beep;