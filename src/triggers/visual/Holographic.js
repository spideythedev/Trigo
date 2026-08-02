import { isObject, isString, isElement } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let holographicInstances = new Map();

const holographicHandler = async (context) => {
  const action = context.params[0] || 'setup';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'setup':
      return setupHolographic(target, config);
    case 'destroy':
      return destroyHolographic(target);
    default:
      return setupHolographic(target, config);
  }
};

const setupHolographic = (target, config = {}) => {
  const elements = selectAll(target);
  const maxTilt = config.maxTilt || 15;
  const perspective = config.perspective || 800;
  const scale = config.scale || 1.05;
  const glare = config.glare !== false;
  const glareColor = config.glareColor || 'rgba(255, 255, 255, 0.4)';
  const colorShift = config.colorShift || false;
  const colorShiftColors = config.colorShiftColors || ['#ff0000', '#00ff00', '#0000ff'];

  if (!document.getElementById('trigo-holographic-style')) {
    const style = document.createElement('style');
    style.id = 'trigo-holographic-style';
    style.textContent = `
      .trigo-holographic {
        transition: transform 0.1s ease-out;
        transform-style: preserve-3d;
      }
      .trigo-holographic-glare {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.4) 0%,
          rgba(255, 255, 255, 0) 60%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  elements.forEach((element) => {
    const originalPosition = element.style.position;
    const originalTransform = element.style.transform || '';
    const originalTransition = element.style.transition || '';

    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
    element.style.transformStyle = 'preserve-3d';
    element.style.transition = 'transform 0.1s ease-out';

    if (glare) {
      const glareElement = document.createElement('div');
      glareElement.className = 'trigo-holographic-glare';
      element.appendChild(glareElement);
    }

    const handleMouseMove = (event) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = event.clientX - centerX;
      const mouseY = event.clientY - centerY;

      const rotateX = (mouseY / (rect.height / 2)) * -maxTilt;
      const rotateY = (mouseX / (rect.width / 2)) * maxTilt;

      const percentX = (mouseX / (rect.width / 2)) * 0.5 + 0.5;
      const percentY = (mouseY / (rect.height / 2)) * 0.5 + 0.5;

      element.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;

      if (glare) {
        const glareElement = element.querySelector('.trigo-holographic-glare');
        if (glareElement) {
          glareElement.style.opacity = '1';
          glareElement.style.background = `linear-gradient(
            ${135 + rotateY}deg,
            ${glareColor} 0%,
            rgba(255, 255, 255, 0) 60%
          )`;
        }
      }

      if (colorShift) {
        const colorIndex = Math.floor(percentX * (colorShiftColors.length - 1));
        const nextIndex = Math.min(colorIndex + 1, colorShiftColors.length - 1);
        const t = percentX * (colorShiftColors.length - 1) - colorIndex;
        const color1 = colorShiftColors[colorIndex];
        const color2 = colorShiftColors[nextIndex];

        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 0, g: 0, b: 0 };
        };

        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

        element.style.boxShadow = `0 5px 20px rgba(${r}, ${g}, ${b}, 0.3)`;
      }

      if (config.onUpdate) {
        config.onUpdate(element, { rotateX, rotateY, percentX, percentY });
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
      element.style.transition = originalTransition || 'transform 0.3s ease-out';
      element.style.boxShadow = '';

      if (glare) {
        const glareElement = element.querySelector('.trigo-holographic-glare');
        if (glareElement) glareElement.style.opacity = '0';
      }

      setTimeout(() => {
        element.style.transition = 'transform 0.1s ease-out';
      }, 300);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    const instanceId = `holographic_${Date.now()}_${Math.random()}`;
    holographicInstances.set(instanceId, {
      element,
      handleMouseMove,
      handleMouseLeave,
      originalPosition,
      originalTransform,
      originalTransition
    });
  });

  return {
    active: true,
    elements,
    maxTilt,
    scale,
    destroy: () => destroyHolographic(null)
  };
};

const destroyHolographic = (target) => {
  const instances = target
    ? Array.from(holographicInstances.entries()).filter(([id, data]) => data.element === target || id === target)
    : Array.from(holographicInstances.entries());

  instances.forEach(([id, data]) => {
    data.element.removeEventListener('mousemove', data.handleMouseMove);
    data.element.removeEventListener('mouseleave', data.handleMouseLeave);
    data.element.style.transform = data.originalTransform || '';
    data.element.style.transition = data.originalTransition || '';
    data.element.style.position = data.originalPosition || '';
    data.element.style.boxShadow = '';

    const glareElement = data.element.querySelector('.trigo-holographic-glare');
    if (glareElement) glareElement.remove();

    holographicInstances.delete(id);
  });

  return { destroyed: true };
};

engine.register('holographic', holographicHandler);

const holographic = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.maxTilt = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('holographic', 'setup', config);
};

holographic.setup = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('holographic', 'setup', config);
};

holographic.destroy = (target) => {
  return engine.execute('holographic', 'destroy', { target });
};

holographic.destroyAll = () => {
  return destroyHolographic(null);
};

export { holographic };
export default holographic;