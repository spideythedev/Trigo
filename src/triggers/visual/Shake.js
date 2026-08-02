import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

const shakeHandler = async (context) => {
  const action = context.params[0] || 'once';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'once':
      return shakeOnce(target, config);
    case 'stop':
      return stopShake(target);
    default:
      return shakeOnce(target, config);
  }
};

const shakeOnce = (target, config = {}) => {
  const elements = selectAll(target);
  const intensity = config.intensity || 5;
  const duration = config.duration || 400;
  const direction = config.direction || 'horizontal';
  const easing = config.easing || 'ease-out';

  return new Promise((resolve) => {
    elements.forEach((element) => {
      const originalTransform = element.style.transform || '';
      const originalTransition = element.style.transition || '';

      element.style.transition = `transform ${duration}ms ${easing}`;

      if (config.onStart) config.onStart(element);

      const shakes = [
        { x: direction !== 'vertical' ? intensity : 0, y: direction !== 'horizontal' ? intensity : 0 },
        { x: direction !== 'vertical' ? -intensity : 0, y: direction !== 'horizontal' ? -intensity : 0 },
        { x: direction !== 'vertical' ? intensity * 0.66 : 0, y: direction !== 'horizontal' ? intensity * 0.66 : 0 },
        { x: direction !== 'vertical' ? -intensity * 0.66 : 0, y: direction !== 'horizontal' ? -intensity * 0.66 : 0 },
        { x: direction !== 'vertical' ? intensity * 0.33 : 0, y: direction !== 'horizontal' ? intensity * 0.33 : 0 },
        { x: direction !== 'vertical' ? -intensity * 0.33 : 0, y: direction !== 'horizontal' ? -intensity * 0.33 : 0 },
        { x: 0, y: 0 }
      ];

      let step = 0;
      const stepDuration = duration / shakes.length;

      const shakeInterval = setInterval(() => {
        if (step >= shakes.length) {
          clearInterval(shakeInterval);
          element.style.transform = originalTransform || 'translate(0, 0)';
          element.style.transition = originalTransition;

          if (config.onComplete) config.onComplete(element);
          resolve({ completed: true, elements, intensity, duration });
          return;
        }

        const { x, y } = shakes[step];
        element.style.transform = `translate(${x}px, ${y}px)`;
        step++;

        if (config.onShake) config.onShake(element, step);
      }, stepDuration);
    });
  });
};

const stopShake = (target) => {
  const elements = selectAll(target);
  elements.forEach((element) => {
    element.style.transform = '';
    element.style.transition = '';
  });
  return { stopped: true, elements };
};

engine.register('shake', shakeHandler);

const shake = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.intensity = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('shake', 'once', config);
};

shake.once = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('shake', 'once', config);
};

shake.stop = (target) => {
  return engine.execute('shake', 'stop', { target });
};

export { shake };
export default shake;