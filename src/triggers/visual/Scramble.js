import { isObject, isString, isElement } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let scrambleTimers = new Map();

const scrambleHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'start':
      return startScramble(target, config);
    case 'stop':
      return stopScramble(target);
    default:
      return startScramble(target, config);
  }
};

const startScramble = (target, config = {}) => {
  const elements = selectAll(target);
  const duration = config.duration || 500;
  const characters = config.characters || '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const interval = config.interval || 30;
  const delay = config.delay || 0;

  const results = [];

  elements.forEach((element) => {
    const originalText = element.textContent || element.innerText || '';
    const finalText = config.text || config.finalText || originalText;

    if (config.onStart) config.onStart(element);

    const startTime = Date.now();
    let lastUpdate = 0;

    const scramble = () => {
      const timerMap = scrambleTimers.get(element) || {};
      if (timerMap.cancelled) return;

      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (now - lastUpdate >= interval || progress >= 1) {
        lastUpdate = now;

        const revealLength = Math.floor(progress * finalText.length);
        let scrambledText = '';

        for (let i = 0; i < finalText.length; i++) {
          if (i < revealLength) {
            scrambledText += finalText[i];
          } else {
            scrambledText += characters[Math.floor(Math.random() * characters.length)];
          }
        }

        element.textContent = scrambledText;

        if (config.onScramble) config.onScramble(element, progress, scrambledText);

        if (progress >= 1) {
          element.textContent = finalText;
          scrambleTimers.delete(element);
          if (config.onComplete) config.onComplete(element, finalText);
          results.push({ completed: true, element, finalText });
          return;
        }
      }

      const timerId = requestAnimationFrame(scramble);
      scrambleTimers.set(element, { ...timerMap, timerId, cancelled: false, originalText, finalText });
    };

    const startTimerId = setTimeout(() => {
      scramble();
    }, delay);

    scrambleTimers.set(element, { timerId: startTimerId, cancelled: false, originalText, finalText });
  });

  return {
    scrambling: true,
    elements,
    duration,
    stop: () => stopScramble(target)
  };
};

const stopScramble = (target) => {
  const elements = target ? selectAll(target) : Array.from(scrambleTimers.keys());

  elements.forEach((element) => {
    if (scrambleTimers.has(element)) {
      const { timerId, originalText, finalText } = scrambleTimers.get(element);
      clearTimeout(timerId);
      cancelAnimationFrame(timerId);
      element.textContent = finalText || originalText || '';
      scrambleTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('scramble', scrambleHandler);

const scramble = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) config.text = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('scramble', 'start', config);
};

scramble.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('scramble', 'start', config);
};

scramble.stop = (target) => {
  return engine.execute('scramble', 'stop', { target });
};

scramble.stopAll = () => {
  return stopScramble(null);
};

export { scramble };
export default scramble;