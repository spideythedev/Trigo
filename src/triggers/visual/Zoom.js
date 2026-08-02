import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

const zoomHandler = async (context) => {
  const action = context.params[0] || 'in';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  const elements = selectAll(target);

  switch (action) {
    case 'in':
      return await zoomIn(elements, config);
    case 'out':
      return await zoomOut(elements, config);
    case 'toggle':
      return await zoomToggle(elements, config);
    default:
      return await zoomIn(elements, config);
  }
};

const zoomIn = (elements, config = {}) => {
  return animateZoom(elements, {
    from: config.from || 0.5,
    to: config.to || 1,
    duration: config.duration || 400,
    delay: config.delay || 0,
    easing: config.easing || 'ease-out',
    origin: config.origin || 'center',
    onStart: config.onStart,
    onComplete: config.onComplete
  });
};

const zoomOut = (elements, config = {}) => {
  return animateZoom(elements, {
    from: config.from || 1,
    to: config.to || 0.5,
    duration: config.duration || 400,
    delay: config.delay || 0,
    easing: config.easing || 'ease-in',
    origin: config.origin || 'center',
    onStart: config.onStart,
    onComplete: config.onComplete,
    hideOnComplete: config.hideOnComplete !== false
  });
};

const zoomToggle = (elements, config = {}) => {
  const firstElement = elements[0];
  if (!firstElement) return Promise.resolve({ completed: false });

  const transform = getComputedStyle(firstElement).transform;
  const isZoomed = transform && transform !== 'none' && !transform.includes('matrix(1, 0, 0, 1, 0, 0)');

  if (isZoomed) {
    return zoomOut(elements, config);
  } else {
    return zoomIn(elements, config);
  }
};

const animateZoom = (elements, options) => {
  const { from, to, duration, delay, easing, origin, onStart, onComplete, hideOnComplete } = options;

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
      const originalTransform = element.style.transform || '';
      const originalTransition = element.style.transition || '';
      const originalOpacity = element.style.opacity || '';
      const originalOrigin = element.style.transformOrigin || '';

      element.style.transformOrigin = origin;
      element.style.transform = `scale(${from})`;
      element.style.opacity = from < 1 ? '0' : '1';
      element.style.display = '';
      element.style.transition = `transform ${duration}ms ${cssEasing} ${elementDelay}ms, opacity ${duration}ms ${cssEasing} ${elementDelay}ms`;

      if (onStart && index === 0) onStart(element);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.transform = `scale(${to})`;
          element.style.opacity = to > 0 ? '1' : '0';
        });
      });

      const transitionEnd = () => {
        element.removeEventListener('transitionend', transitionEnd);
        element.style.transition = originalTransition;
        element.style.transformOrigin = originalOrigin;

        if (to === 0 && hideOnComplete !== false) {
          element.style.display = 'none';
        }

        completed++;
        if (completed === total) {
          if (onComplete) onComplete(elements);
          resolve({ completed: true, elements, from, to, duration });
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
          resolve({ completed: true, elements, from, to, duration });
        }
      }, duration + elementDelay + 50);
    });
  });
};

engine.register('zoom', zoomHandler);

const zoom = {};

zoom.in = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.duration = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('zoom', 'in', config);
};

zoom.out = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.duration = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('zoom', 'out', config);
};

zoom.toggle = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('zoom', 'toggle', config);
};

export { zoom };
export default zoom;