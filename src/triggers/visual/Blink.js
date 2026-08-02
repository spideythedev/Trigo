import { isObject, isString, isElement } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let blinkTimers = new Map();

const blinkHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'start':
      return startBlink(target, config);
    case 'stop':
      return stopBlink(target);
    default:
      return startBlink(target, config);
  }
};

const startBlink = (target, config = {}) => {
  const elements = selectAll(target);
  const interval = config.interval || 500;
  const count = config.count || null;
  const infinite = config.infinite || (count === null);
  const maxCount = count || Infinity;

  let blinkCount = 0;
  const blinkIds = [];

  elements.forEach((element) => {
    element.style.visibility = 'visible';
    const originalVisibility = element.style.visibility;

    if (config.onStart) config.onStart(element);

    const id = setInterval(() => {
      if (!infinite && blinkCount >= maxCount * 2) {
        clearInterval(id);
        element.style.visibility = originalVisibility || 'visible';
        blinkTimers.delete(element);
        if (config.onComplete) config.onComplete(element);
        return;
      }

      element.style.visibility = blinkCount % 2 === 0 ? 'hidden' : 'visible';
      blinkCount++;

      if (config.onBlink) config.onBlink(element, Math.floor(blinkCount / 2));
    }, interval);

    blinkIds.push(id);
    blinkTimers.set(element, { id, originalVisibility });
  });

  return {
    blinking: true,
    elements,
    interval,
    stop: () => stopBlink(target)
  };
};

const stopBlink = (target) => {
  const elements = target ? selectAll(target) : Array.from(blinkTimers.keys());

  elements.forEach((element) => {
    if (blinkTimers.has(element)) {
      const { id, originalVisibility } = blinkTimers.get(element);
      clearInterval(id);
      element.style.visibility = originalVisibility || 'visible';
      blinkTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('blink', blinkHandler);

const blink = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.interval = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('blink', 'start', config);
};

blink.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('blink', 'start', config);
};

blink.stop = (target) => {
  return engine.execute('blink', 'stop', { target });
};

blink.stopAll = () => {
  return stopBlink(null);
};

export { blink };
export default blink;