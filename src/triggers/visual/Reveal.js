import { isObject, isString, isElement } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let revealObservers = new Map();

const revealHandler = async (context) => {
  const action = context.params[0] || 'setup';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'setup':
      return setupReveal(target, config);
    case 'destroy':
      return destroyReveal(target);
    default:
      return setupReveal(target, config);
  }
};

const setupReveal = (target, config = {}) => {
  const elements = selectAll(target);
  const threshold = config.threshold || 0.2;
  const once = config.once !== false;
  const animation = config.animation || 'fadeUp';
  const distance = config.distance || 30;
  const duration = config.duration || 600;
  const delay = config.delay || 0;
  const stagger = config.stagger || 0;

  const animations = {
    'fadeUp': { opacity: [0, 1], transform: [`translateY(${distance}px)`, 'translateY(0)'] },
    'fadeDown': { opacity: [0, 1], transform: [`translateY(-${distance}px)`, 'translateY(0)'] },
    'fadeLeft': { opacity: [0, 1], transform: [`translateX(${distance}px)`, 'translateX(0)'] },
    'fadeRight': { opacity: [0, 1], transform: [`translateX(-${distance}px)`, 'translateX(0)'] },
    'zoomIn': { opacity: [0, 1], transform: ['scale(0.8)', 'scale(1)'] },
    'zoomOut': { opacity: [0, 1], transform: ['scale(1.2)', 'scale(1)'] },
    'flipUp': { opacity: [0, 1], transform: ['rotateX(90deg)', 'rotateX(0)'] },
    'flipDown': { opacity: [0, 1], transform: ['rotateX(-90deg)', 'rotateX(0)'] }
  };

  const animConfig = animations[animation] || animations['fadeUp'];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const elementDelay = delay + stagger * index;

        element.style.opacity = animConfig.opacity[0];
        element.style.transform = animConfig.transform[0];
        element.style.transition = `opacity ${duration}ms ease-out ${elementDelay}ms, transform ${duration}ms ease-out ${elementDelay}ms`;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            element.style.opacity = animConfig.opacity[1];
            element.style.transform = animConfig.transform[1];
          });
        });

        if (config.onReveal) config.onReveal(element, index);

        const transitionEnd = () => {
          element.removeEventListener('transitionend', transitionEnd);
          element.style.transition = '';
        };
        element.addEventListener('transitionend', transitionEnd);

        if (once) {
          observer.unobserve(element);
        }
      } else if (!once) {
        entry.target.style.opacity = animConfig.opacity[0];
        entry.target.style.transform = animConfig.transform[0];
      }
    });
  }, {
    threshold,
    rootMargin: config.rootMargin || '0px'
  });

  elements.forEach((element) => {
    element.style.willChange = 'opacity, transform';
    observer.observe(element);
  });

  const observerId = `reveal_${Date.now()}`;
  revealObservers.set(observerId, { observer, elements });

  return {
    observing: true,
    elements,
    animation,
    destroy: () => destroyReveal(observerId)
  };
};

const destroyReveal = (target) => {
  if (isString(target) && revealObservers.has(target)) {
    const { observer } = revealObservers.get(target);
    observer.disconnect();
    revealObservers.delete(target);
  } else {
    revealObservers.forEach(({ observer }) => observer.disconnect());
    revealObservers.clear();
  }
  return { destroyed: true };
};

engine.register('reveal', revealHandler);

const reveal = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) config.animation = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('reveal', 'setup', config);
};

reveal.setup = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('reveal', 'setup', config);
};

reveal.destroy = (target) => {
  return engine.execute('reveal', 'destroy', { target });
};

reveal.destroyAll = () => {
  return destroyReveal(null);
};

export { reveal };
export default reveal;