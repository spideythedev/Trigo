import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let gradientTimers = new Map();

const gradientHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'start':
      return startGradient(target, config);
    case 'stop':
      return stopGradient(target);
    default:
      return startGradient(target, config);
  }
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const lerpColor = (color1, color2, t) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

  return rgbToHex(r, g, b);
};

const startGradient = (target, config = {}) => {
  const elements = selectAll(target);
  const duration = config.duration || 3000;
  const colors = config.colors || ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00'];
  const type = config.type || 'linear';
  const angle = config.angle || 0;
  const angleAnimation = config.angleAnimation !== false;
  const interpolation = config.interpolation || 'rgb';

  if (colors.length < 2) {
    throw new Error('At least 2 colors required for gradient animation');
  }

  const angleSpeed = config.angleSpeed || 90;

  elements.forEach((element) => {
    const startTime = Date.now();

    if (config.onStart) config.onStart(element);

    const animate = () => {
      const timerMap = gradientTimers.get(element) || {};
      if (timerMap.cancelled) return;

      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;
      const currentAngle = angleAnimation ? angle + (elapsed / 1000) * angleSpeed : angle;

      const segmentCount = colors.length;
      const segmentProgress = progress * segmentCount;
      const currentIndex = Math.floor(segmentProgress) % segmentCount;
      const nextIndex = (currentIndex + 1) % segmentCount;
      const t = segmentProgress - Math.floor(segmentProgress);

      const currentColor = colors[currentIndex];
      const nextColor = colors[nextIndex];

      let gradientString;

      if (type === 'linear') {
        gradientString = `linear-gradient(${currentAngle}deg, `;
      } else if (type === 'radial') {
        gradientString = `radial-gradient(circle, `;
      } else if (type === 'conic') {
        gradientString = `conic-gradient(from ${currentAngle}deg, `;
      } else {
        gradientString = `linear-gradient(${currentAngle}deg, `;
      }

      for (let i = 0; i < colors.length; i++) {
        const colorPosition = i / (colors.length - 1) * 100;
        gradientString += `${colors[i]} ${colorPosition}%`;
        if (i < colors.length - 1) gradientString += ', ';
      }

      gradientString += ')';

      element.style.background = gradientString;
      element.style.backgroundSize = config.backgroundSize || '400% 400%';

      if (config.onUpdate) config.onUpdate(element, progress, gradientString);

      const timerId = requestAnimationFrame(animate);
      gradientTimers.set(element, { ...timerMap, timerId, cancelled: false });
    };

    animate();
  });

  return {
    animating: true,
    elements,
    colors,
    type,
    duration,
    stop: () => stopGradient(target)
  };
};

const stopGradient = (target) => {
  const elements = target ? selectAll(target) : Array.from(gradientTimers.keys());

  elements.forEach((element) => {
    if (gradientTimers.has(element)) {
      const { timerId } = gradientTimers.get(element);
      cancelAnimationFrame(timerId);
      gradientTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('gradient', gradientHandler);

const gradient = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (Array.isArray(options)) config.colors = options;
  if (isString(options)) config.type = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('gradient', 'start', config);
};

gradient.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('gradient', 'start', config);
};

gradient.stop = (target) => {
  return engine.execute('gradient', 'stop', { target });
};

gradient.stopAll = () => {
  return stopGradient(null);
};

export { gradient };
export default gradient;