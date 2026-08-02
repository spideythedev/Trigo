import { isObject, isString, isElement } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll, on } from '../../utils/dom.js';

let rippleListeners = new Map();

const rippleHandler = async (context) => {
  const action = context.params[0] || 'setup';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'setup':
      return setupRipple(target, config);
    case 'destroy':
      return destroyRipple(target);
    default:
      return setupRipple(target, config);
  }
};

const createRipple = (element, event, config = {}) => {
  const color = config.color || 'rgba(255, 255, 255, 0.4)';
  const duration = config.duration || 600;
  const maxSize = config.maxSize || Math.max(element.offsetWidth, element.offsetHeight) * 2;

  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const ripple = document.createElement('span');
  ripple.className = 'trigo-ripple';
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: ${color};
    width: 0;
    height: 0;
    left: ${x}px;
    top: ${y}px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: trigo-ripple ${duration}ms ease-out;
    z-index: ${config.zIndex || 0};
  `;

  if (!document.getElementById('trigo-ripple-style')) {
    const style = document.createElement('style');
    style.id = 'trigo-ripple-style';
    style.textContent = `
      @keyframes trigo-ripple {
        to {
          width: ${maxSize}px;
          height: ${maxSize}px;
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const existingRipples = element.querySelectorAll('.trigo-ripple');
  existingRipples.forEach(r => r.remove());

  element.appendChild(ripple);

  if (config.onStart) config.onStart(element, { x, y });

  setTimeout(() => {
    ripple.remove();
    if (config.onComplete) config.onComplete(element);
  }, duration);

  return ripple;
};

const setupRipple = (target, config = {}) => {
  const elements = selectAll(target);
  const elementMap = new Map();

  elements.forEach((element) => {
    const originalOverflow = element.style.overflow;
    const originalPosition = element.style.position;

    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';

    const handler = (event) => createRipple(element, event, config);
    const cleanup = on(element, 'click', handler);

    elementMap.set(element, {
      cleanup,
      handler,
      originalOverflow,
      originalPosition
    });
  });

  const listenerId = `ripple_${Date.now()}`;
  rippleListeners.set(listenerId, elementMap);

  return {
    active: true,
    elements,
    destroy: () => destroyRipple(listenerId)
  };
};

const destroyRipple = (target) => {
  if (isString(target) && rippleListeners.has(target)) {
    const elementMap = rippleListeners.get(target);
    elementMap.forEach(({ cleanup, originalOverflow, originalPosition }, element) => {
      cleanup();
      element.style.overflow = originalOverflow;
      element.style.position = originalPosition;
      const ripples = element.querySelectorAll('.trigo-ripple');
      ripples.forEach(r => r.remove());
    });
    rippleListeners.delete(target);
  } else {
    rippleListeners.forEach((elementMap) => {
      elementMap.forEach(({ cleanup, originalOverflow, originalPosition }, element) => {
        cleanup();
        element.style.overflow = originalOverflow;
        element.style.position = originalPosition;
        const ripples = element.querySelectorAll('.trigo-ripple');
        ripples.forEach(r => r.remove());
      });
    });
    rippleListeners.clear();
  }
  return { destroyed: true };
};

engine.register('ripple', rippleHandler);

const ripple = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) config.color = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('ripple', 'setup', config);
};

ripple.setup = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('ripple', 'setup', config);
};

ripple.destroy = (target) => {
  return engine.execute('ripple', 'destroy', { target });
};

ripple.destroyAll = () => {
  return destroyRipple(null);
};

export { ripple };
export default ripple;