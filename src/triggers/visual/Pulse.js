import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let pulseTimers = new Map();

const pulseHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'start':
      return startPulse(target, config);
    case 'stop':
      return stopPulse(target);
    default:
      return startPulse(target, config);
  }
};

const startPulse = (target, config = {}) => {
  const elements = selectAll(target);
  const scale = config.scale || 1.05;
  const duration = config.duration || 600;
  const easing = config.easing || 'ease-in-out';
  const count = config.count || null;
  const infinite = config.infinite || (count === null);

  const cssEasing = {
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out'
  }[easing] || easing;

  let pulseCount = 0;

  elements.forEach((element) => {
    const originalTransform = element.style.transform || '';
    const originalTransition = element.style.transition || '';

    element.style.transition = `transform ${duration}ms ${cssEasing}`;

    if (config.onStart) config.onStart(element);

    const doPulse = () => {
      if (!infinite && pulseCount >= (count * 2)) {
        element.style.transform = originalTransform || 'scale(1)';
        element.style.transition = originalTransition;
        pulseTimers.delete(element);
        if (config.onComplete) config.onComplete(element);
        return;
      }

      const currentScale = pulseCount % 2 === 0 ? scale : 1;
      element.style.transform = `scale(${currentScale})`;

      pulseCount++;
      if (config.onPulse) config.onPulse(element, Math.floor(pulseCount / 2));

      const timerId = setTimeout(doPulse, duration);
      pulseTimers.set(element, { timerId, originalTransform, originalTransition });
    };

    doPulse();
  });

  return {
    pulsing: true,
    elements,
    scale,
    duration,
    stop: () => stopPulse(target)
  };
};

const stopPulse = (target) => {
  const elements = target ? selectAll(target) : Array.from(pulseTimers.keys());

  elements.forEach((element) => {
    if (pulseTimers.has(element)) {
      const { timerId, originalTransform, originalTransition } = pulseTimers.get(element);
      clearTimeout(timerId);
      element.style.transform = originalTransform || 'scale(1)';
      element.style.transition = originalTransition;
      pulseTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('pulse', pulseHandler);

const pulse = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.scale = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('pulse', 'start', config);
};

pulse.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('pulse', 'start', config);
};

pulse.stop = (target) => {
  return engine.execute('pulse', 'stop', { target });
};

pulse.stopAll = () => {
  return stopPulse(null);
};

export { pulse };
export default pulse;