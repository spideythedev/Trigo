import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let parallaxInstances = new Map();

const parallaxHandler = async (context) => {
  const action = context.params[0] || 'setup';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'setup':
      return setupParallax(target, config);
    case 'destroy':
      return destroyParallax(target);
    default:
      return setupParallax(target, config);
  }
};

const setupParallax = (target, config = {}) => {
  const elements = selectAll(target);
  const speed = config.speed || 0.5;
  const direction = config.direction || 'vertical';
  const reverse = config.reverse || false;

  const handleScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    const viewportHeight = window.innerHeight;

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const elementHeight = rect.height;
      const elementCenter = elementTop - scrollY;
      const viewportCenter = viewportHeight / 2;
      const offset = (elementCenter - viewportCenter) * speed * (reverse ? -1 : 1);

      if (config.onUpdate) config.onUpdate(element, { scrollY, offset });

      if (direction === 'vertical' || direction === 'both') {
        element.style.transform = `translateY(${offset}px)`;
      }

      if (direction === 'horizontal' || direction === 'both') {
        const horizontalOffset = (elementCenter - viewportCenter) * speed * 0.5 * (reverse ? -1 : 1);
        const currentTransform = element.style.transform || '';
        element.style.transform = currentTransform + ` translateX(${horizontalOffset}px)`;
      }
    });
  };

  handleScroll();

  const scrollHandler = handleScroll;
  window.addEventListener('scroll', scrollHandler, { passive: true });

  const instanceId = `parallax_${Date.now()}`;
  parallaxInstances.set(instanceId, {
    elements,
    scrollHandler,
    config: { speed, direction, reverse }
  });

  return {
    active: true,
    elements,
    speed,
    direction,
    destroy: () => destroyParallax(instanceId)
  };
};

const destroyParallax = (target) => {
  if (isString(target) && parallaxInstances.has(target)) {
    const { scrollHandler, elements } = parallaxInstances.get(target);
    window.removeEventListener('scroll', scrollHandler);
    elements.forEach((element) => {
      element.style.transform = '';
    });
    parallaxInstances.delete(target);
  } else {
    parallaxInstances.forEach(({ scrollHandler, elements }) => {
      window.removeEventListener('scroll', scrollHandler);
      elements.forEach((element) => {
        element.style.transform = '';
      });
    });
    parallaxInstances.clear();
  }

  return { destroyed: true };
};

engine.register('parallax', parallaxHandler);

const parallax = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.speed = options;
  if (isString(options)) config.direction = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('parallax', 'setup', config);
};

parallax.setup = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('parallax', 'setup', config);
};

parallax.destroy = (target) => {
  return engine.execute('parallax', 'destroy', { target });
};

parallax.destroyAll = () => {
  return destroyParallax(null);
};

export { parallax };
export default parallax;