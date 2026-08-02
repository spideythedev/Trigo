import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

const flashHandler = async (context) => {
  const action = context.params[0] || 'once';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'once':
      return flashOnce(target, config);
    case 'strobe':
      return flashStrobe(target, config);
    case 'stop':
      return stopFlash(target);
    default:
      return flashOnce(target, config);
  }
};

const flashOnce = (target, config = {}) => {
  const elements = selectAll(target);
  const count = config.count || 3;
  const interval = config.interval || 50;
  const bgColor = config.color || config.backgroundColor || '#ffffff';
  const textColor = config.textColor || '#000000';

  return new Promise((resolve) => {
    let flashes = 0;

    elements.forEach((element) => {
      const originalBg = element.style.backgroundColor;
      const originalColor = element.style.color;
      const originalTransition = element.style.transition;

      element.style.transition = `background-color ${interval / 2}ms, color ${interval / 2}ms`;

      if (config.onStart) config.onStart(element);

      const flashInterval = setInterval(() => {
        if (flashes >= count * 2) {
          clearInterval(flashInterval);
          element.style.backgroundColor = originalBg;
          element.style.color = originalColor;
          element.style.transition = originalTransition;

          if (config.onComplete) config.onComplete(element);
          resolve({ completed: true, elements, count });
          return;
        }

        if (flashes % 2 === 0) {
          element.style.backgroundColor = bgColor;
          element.style.color = textColor;
        } else {
          element.style.backgroundColor = originalBg;
          element.style.color = originalColor;
        }

        flashes++;
        if (config.onFlash) config.onFlash(element, Math.floor(flashes / 2));
      }, interval);
    });
  });
};

const flashStrobe = (target, config = {}) => {
  return flashOnce(target, {
    ...config,
    count: config.count || 20,
    interval: config.interval || 30
  });
};

const stopFlash = (target) => {
  const elements = selectAll(target);
  elements.forEach((element) => {
    element.style.transition = '';
  });
  return { stopped: true, elements };
};

engine.register('flash', flashHandler);

const flash = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.count = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('flash', 'once', config);
};

flash.once = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('flash', 'once', config);
};

flash.strobe = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('flash', 'strobe', config);
};

flash.stop = (target) => {
  return engine.execute('flash', 'stop', { target });
};

export { flash };
export default flash;