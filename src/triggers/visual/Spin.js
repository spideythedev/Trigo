import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let spinTimers = new Map();

const spinHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'start':
      return startSpin(target, config);
    case 'stop':
      return stopSpin(target);
    default:
      return startSpin(target, config);
  }
};

const startSpin = (target, config = {}) => {
  const elements = selectAll(target);
  const speed = config.speed || 1000;
  const direction = config.direction === 'counterclockwise' ? 'reverse' : 'normal';
  const infinite = config.infinite !== false;

  const animationName = `trigo-spin-${direction}`;

  if (!document.getElementById('trigo-spin-style')) {
    const style = document.createElement('style');
    style.id = 'trigo-spin-style';
    style.textContent = `
      @keyframes trigo-spin-normal {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes trigo-spin-reverse {
        from { transform: rotate(0deg); }
        to { transform: rotate(-360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  elements.forEach((element) => {
    const originalAnimation = element.style.animation || '';

    element.style.animation = `${animationName} ${speed}ms linear ${infinite ? 'infinite' : '1'}`;

    if (config.onStart) config.onStart(element);

    if (!infinite) {
      const timerId = setTimeout(() => {
        element.style.animation = originalAnimation;
        spinTimers.delete(element);
        if (config.onComplete) config.onComplete(element);
      }, speed);

      spinTimers.set(element, { timerId, originalAnimation });
    } else {
      spinTimers.set(element, { timerId: null, originalAnimation });
    }
  });

  return {
    spinning: true,
    elements,
    speed,
    direction,
    infinite,
    stop: () => stopSpin(target)
  };
};

const stopSpin = (target) => {
  const elements = target ? selectAll(target) : Array.from(spinTimers.keys());

  elements.forEach((element) => {
    if (spinTimers.has(element)) {
      const { timerId, originalAnimation } = spinTimers.get(element);
      if (timerId) clearTimeout(timerId);
      element.style.animation = originalAnimation || '';
      spinTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('spin', spinHandler);

const spin = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.speed = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('spin', 'start', config);
};

spin.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('spin', 'start', config);
};

spin.stop = (target) => {
  return engine.execute('spin', 'stop', { target });
};

spin.stopAll = () => {
  return stopSpin(null);
};

export { spin };
export default spin;