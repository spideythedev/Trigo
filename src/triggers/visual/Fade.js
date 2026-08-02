import { isObject, isString, isNumber, isElement } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

const fadeHandler = async (context) => {
  const action = context.params[0] || 'in';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  const elements = selectAll(target);

  switch (action) {
    case 'in':
      return await fadeIn(elements, config);
    case 'out':
      return await fadeOut(elements, config);
    case 'toggle':
      return await fadeToggle(elements, config);
    case 'to':
      return await fadeTo(elements, config);
    default:
      return await fadeIn(elements, config);
  }
};

const fadeIn = (elements, config = {}) => {
  return animateFade(elements, {
    from: config.from || 0,
    to: config.to || 1,
    duration: config.duration || 400,
    delay: config.delay || 0,
    easing: config.easing || 'ease-out',
    onStart: config.onStart,
    onComplete: config.onComplete
  });
};

const fadeOut = (elements, config = {}) => {
  return animateFade(elements, {
    from: config.from || 1,
    to: config.to || 0,
    duration: config.duration || 400,
    delay: config.delay || 0,
    easing: config.easing || 'ease-in',
    onStart: config.onStart,
    onComplete: config.onComplete,
    hideOnComplete: config.hideOnComplete !== false
  });
};

const fadeToggle = (elements, config = {}) => {
  const firstElement = elements[0];
  if (!firstElement) return Promise.resolve({ completed: false });

  const currentOpacity = parseFloat(getComputedStyle(firstElement).opacity);
  const isVisible = currentOpacity > 0 && firstElement.offsetParent !== null;

  if (isVisible) {
    return fadeOut(elements, config);
  } else {
    return fadeIn(elements, config);
  }
};

const fadeTo = (elements, config = {}) => {
  const opacity = config.opacity || config.to || 0.5;
  const currentOpacity = parseFloat(getComputedStyle(elements[0]).opacity);

  return animateFade(elements, {
    from: currentOpacity,
    to: opacity,
    duration: config.duration || 400,
    delay: config.delay || 0,
    easing: config.easing || 'ease-out',
    onStart: config.onStart,
    onComplete: config.onComplete
  });
};

const animateFade = (elements, options) => {
  const {
    from,
    to,
    duration,
    delay,
    easing,
    onStart,
    onComplete,
    hideOnComplete
  } = options;

  const easingMap = {
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out'
  };

  const cssEasing = easingMap[easing] || easing;

  return new Promise((resolve) => {
    let completed = 0;
    const total = elements.length;

    elements.forEach((element, index) => {
      const elementDelay = delay + (options.stagger || 0) * index;

      element.style.opacity = from;
      element.style.transition = `opacity ${duration}ms ${cssEasing} ${elementDelay}ms`;
      element.style.display = '';

      if (onStart && index === 0) onStart(element);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.opacity = to;
        });
      });

      const transitionEnd = () => {
        element.removeEventListener('transitionend', transitionEnd);
        element.style.transition = '';

        if (to === 0 && hideOnComplete !== false) {
          element.style.display = 'none';
        }

        completed++;

        if (completed === total) {
          if (onComplete) onComplete(elements);
          resolve({
            completed: true,
            elements,
            from,
            to,
            duration
          });
        }
      };

      element.addEventListener('transitionend', transitionEnd);

      setTimeout(() => {
        element.removeEventListener('transitionend', transitionEnd);
        if (to === 0 && hideOnComplete !== false) {
          element.style.display = 'none';
        }
        completed++;
        if (completed === total) {
          if (onComplete) onComplete(elements);
          resolve({
            completed: true,
            elements,
            from,
            to,
            duration
          });
        }
      }, duration + elementDelay + 50);
    });
  });
};

engine.register('fade', fadeHandler);

const fade = {};

fade.in = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.duration = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('fade', 'in', config);
};

fade.out = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.duration = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('fade', 'out', config);
};

fade.toggle = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('fade', 'toggle', config);
};

fade.to = (target, opacity, options = {}) => {
  const config = isObject(options) ? options : {};
  config.target = target;
  config.opacity = opacity;
  return engine.execute('fade', 'to', config);
};

export { fade };
export default fade;