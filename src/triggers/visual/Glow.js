import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let glowTimers = new Map();

const glowHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'start':
      return startGlow(target, config);
    case 'stop':
      return stopGlow(target);
    default:
      return startGlow(target, config);
  }
};

const startGlow = (target, config = {}) => {
  const elements = selectAll(target);
  const color = config.color || '#ffffff';
  const spread = config.spread || 20;
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

  let glowCount = 0;

  elements.forEach((element) => {
    const originalBoxShadow = element.style.boxShadow || '';
    const originalTransition = element.style.transition || '';

    element.style.transition = `box-shadow ${duration}ms ${cssEasing}`;

    if (config.onStart) config.onStart(element);

    const doGlow = () => {
      if (!infinite && glowCount >= (count * 2)) {
        element.style.boxShadow = originalBoxShadow || 'none';
        element.style.transition = originalTransition;
        glowTimers.delete(element);
        if (config.onComplete) config.onComplete(element);
        return;
      }

      const currentSpread = glowCount % 2 === 0 ? `${spread}px` : '0px';
      const currentColor = glowCount % 2 === 0 ? color : 'transparent';
      element.style.boxShadow = `0 0 ${currentSpread} ${currentColor}`;

      glowCount++;
      if (config.onGlow) config.onGlow(element, Math.floor(glowCount / 2));

      const timerId = setTimeout(doGlow, duration);
      glowTimers.set(element, { timerId, originalBoxShadow, originalTransition });
    };

    doGlow();
  });

  return {
    glowing: true,
    elements,
    color,
    spread,
    duration,
    stop: () => stopGlow(target)
  };
};

const stopGlow = (target) => {
  const elements = target ? selectAll(target) : Array.from(glowTimers.keys());

  elements.forEach((element) => {
    if (glowTimers.has(element)) {
      const { timerId, originalBoxShadow, originalTransition } = glowTimers.get(element);
      clearTimeout(timerId);
      element.style.boxShadow = originalBoxShadow || 'none';
      element.style.transition = originalTransition;
      glowTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('glow', glowHandler);

const glow = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) config.color = options;
  if (isNumber(options)) config.spread = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('glow', 'start', config);
};

glow.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('glow', 'start', config);
};

glow.stop = (target) => {
  return engine.execute('glow', 'stop', { target });
};

glow.stopAll = () => {
  return stopGlow(null);
};

export { glow };
export default glow;