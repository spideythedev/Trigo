import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let bounceTimers = new Map();

const bounceHandler = async (context) => {
  const action = context.params[0] || 'once';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'once':
      return bounceOnce(target, config);
    case 'stop':
      return stopBounce(target);
    default:
      return bounceOnce(target, config);
  }
};

const bounceOnce = (target, config = {}) => {
  const elements = selectAll(target);
  const height = config.height || 20;
  const duration = config.duration || 600;
  const count = config.count || 3;
  const easing = 'cubic-bezier(0.28, 1.5, 0.5, 1)';

  return new Promise((resolve) => {
    elements.forEach((element) => {
      const originalTransform = element.style.transform || '';
      const originalTransition = element.style.transition || '';

      element.style.transition = `transform ${duration / (count * 2)}ms ${easing}`;

      if (config.onStart) config.onStart(element);

      let bounceCount = 0;
      const maxBounces = count * 2;

      const doBounce = () => {
        if (bounceCount >= maxBounces) {
          element.style.transform = originalTransform || 'translateY(0)';
          element.style.transition = originalTransition;
          bounceTimers.delete(element);
          if (config.onComplete) config.onComplete(element);
          resolve({ completed: true, elements, height, count });
          return;
        }

        const currentHeight = bounceCount % 2 === 0 ? -height : 0;
        const bounceIndex = Math.floor(bounceCount / 2) + 1;
        const decay = 1 - (bounceIndex / count) * 0.7;
        const adjustedHeight = bounceCount % 2 === 0 ? -height * decay : 0;

        element.style.transform = `translateY(${adjustedHeight}px)`;
        bounceCount++;

        if (config.onBounce) config.onBounce(element, Math.floor(bounceCount / 2));

        const timerId = setTimeout(doBounce, duration / (count * 2));
        bounceTimers.set(element, { timerId, originalTransform, originalTransition });
      };

      doBounce();
    });
  });
};

const stopBounce = (target) => {
  const elements = target ? selectAll(target) : Array.from(bounceTimers.keys());

  elements.forEach((element) => {
    if (bounceTimers.has(element)) {
      const { timerId, originalTransform, originalTransition } = bounceTimers.get(element);
      clearTimeout(timerId);
      element.style.transform = originalTransform || 'translateY(0)';
      element.style.transition = originalTransition;
      bounceTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('bounce', bounceHandler);

const bounce = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.height = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('bounce', 'once', config);
};

bounce.once = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('bounce', 'once', config);
};

bounce.stop = (target) => {
  return engine.execute('bounce', 'stop', { target });
};

bounce.stopAll = () => {
  return stopBounce(null);
};

export { bounce };
export default bounce;