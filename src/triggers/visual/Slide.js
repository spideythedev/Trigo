import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

const slideHandler = async (context) => {
  const action = context.params[0] || 'in';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  const elements = selectAll(target);

  switch (action) {
    case 'in':
      return await slideIn(elements, config);
    case 'out':
      return await slideOut(elements, config);
    case 'toggle':
      return await slideToggle(elements, config);
    case 'to':
      return await slideTo(elements, config);
    default:
      return await slideIn(elements, config);
  }
};

const getDirectionTransform = (direction, distance) => {
  const dirMap = {
    'top': { x: 0, y: -distance },
    'bottom': { x: 0, y: distance },
    'left': { x: -distance, y: 0 },
    'right': { x: distance, y: 0 },
    'topLeft': { x: -distance, y: -distance },
    'topRight': { x: distance, y: -distance },
    'bottomLeft': { x: -distance, y: distance },
    'bottomRight': { x: distance, y: distance }
  };
  return dirMap[direction] || dirMap['bottom'];
};

const slideIn = (elements, config = {}) => {
  const from = config.from || 'bottom';
  const distance = config.distance || 50;
  const duration = config.duration || 400;
  const delay = config.delay || 0;
  const easing = config.easing || 'ease-out';
  const { x, y } = getDirectionTransform(from, distance);

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
      const elementDelay = delay + (config.stagger || 0) * index;
      const originalTransform = element.style.transform || '';
      const originalTransition = element.style.transition || '';
      const originalOpacity = element.style.opacity || '';

      element.style.opacity = '0';
      element.style.transform = `translate(${x}px, ${y}px)`;
      element.style.display = '';
      element.style.transition = `transform ${duration}ms ${cssEasing} ${elementDelay}ms, opacity ${duration}ms ${cssEasing} ${elementDelay}ms`;

      if (config.onStart && index === 0) config.onStart(element);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.opacity = '1';
          element.style.transform = 'translate(0, 0)';
        });
      });

      const transitionEnd = () => {
        element.removeEventListener('transitionend', transitionEnd);
        element.style.transition = originalTransition;
        element.style.transform = originalTransform || 'translate(0, 0)';
        element.style.opacity = originalOpacity || '1';

        completed++;
        if (completed === total) {
          if (config.onComplete) config.onComplete(elements);
          resolve({ completed: true, elements, from, distance, duration });
        }
      };

      element.addEventListener('transitionend', transitionEnd);

      setTimeout(() => {
        element.removeEventListener('transitionend', transitionEnd);
        element.style.transition = originalTransition;
        element.style.transform = originalTransform || 'translate(0, 0)';
        element.style.opacity = originalOpacity || '1';
        completed++;
        if (completed === total) {
          if (config.onComplete) config.onComplete(elements);
          resolve({ completed: true, elements, from, distance, duration });
        }
      }, duration + elementDelay + 50);
    });
  });
};

const slideOut = (elements, config = {}) => {
  const to = config.to || 'bottom';
  const distance = config.distance || 50;
  const duration = config.duration || 400;
  const delay = config.delay || 0;
  const easing = config.easing || 'ease-in';
  const { x, y } = getDirectionTransform(to, distance);

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
      const elementDelay = delay + (config.stagger || 0) * index;
      const originalTransform = element.style.transform || '';
      const originalTransition = element.style.transition || '';

      element.style.transition = `transform ${duration}ms ${cssEasing} ${elementDelay}ms, opacity ${duration}ms ${cssEasing} ${elementDelay}ms`;

      if (config.onStart && index === 0) config.onStart(element);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.opacity = '0';
          element.style.transform = `translate(${x}px, ${y}px)`;
        });
      });

      const transitionEnd = () => {
        element.removeEventListener('transitionend', transitionEnd);
        element.style.transition = originalTransition;
        element.style.transform = originalTransform || 'translate(0, 0)';
        element.style.display = 'none';

        completed++;
        if (completed === total) {
          if (config.onComplete) config.onComplete(elements);
          resolve({ completed: true, elements, to, distance, duration });
        }
      };

      element.addEventListener('transitionend', transitionEnd);

      setTimeout(() => {
        element.removeEventListener('transitionend', transitionEnd);
        element.style.display = 'none';
        completed++;
        if (completed === total) {
          if (config.onComplete) config.onComplete(elements);
          resolve({ completed: true, elements, to, distance, duration });
        }
      }, duration + elementDelay + 50);
    });
  });
};

const slideToggle = (elements, config = {}) => {
  const firstElement = elements[0];
  if (!firstElement) return Promise.resolve({ completed: false });

  const isVisible = firstElement.offsetParent !== null;

  if (isVisible) {
    return slideOut(elements, config);
  } else {
    return slideIn(elements, config);
  }
};

const slideTo = (elements, config = {}) => {
  const x = config.x || 0;
  const y = config.y || 0;
  const duration = config.duration || 400;
  const delay = config.delay || 0;
  const easing = config.easing || 'ease-out';

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
      const elementDelay = delay + (config.stagger || 0) * index;
      const originalTransition = element.style.transition || '';

      element.style.transition = `transform ${duration}ms ${cssEasing} ${elementDelay}ms`;

      if (config.onStart && index === 0) config.onStart(element);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.style.transform = `translate(${x}px, ${y}px)`;
        });
      });

      const transitionEnd = () => {
        element.removeEventListener('transitionend', transitionEnd);
        element.style.transition = originalTransition;

        completed++;
        if (completed === total) {
          if (config.onComplete) config.onComplete(elements);
          resolve({ completed: true, elements, x, y, duration });
        }
      };

      element.addEventListener('transitionend', transitionEnd);

      setTimeout(() => {
        element.removeEventListener('transitionend', transitionEnd);
        completed++;
        if (completed === total) {
          if (config.onComplete) config.onComplete(elements);
          resolve({ completed: true, elements, x, y, duration });
        }
      }, duration + elementDelay + 50);
    });
  });
};

engine.register('slide', slideHandler);

const slide = {};

slide.in = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) config.from = options;
  if (isNumber(options)) config.duration = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('slide', 'in', config);
};

slide.out = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) config.to = options;
  if (isNumber(options)) config.duration = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('slide', 'out', config);
};

slide.toggle = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('slide', 'toggle', config);
};

slide.to = (target, x, y, options = {}) => {
  const config = isObject(options) ? options : {};
  config.target = target;
  config.x = x;
  config.y = y;
  return engine.execute('slide', 'to', config);
};

export { slide };
export default slide;