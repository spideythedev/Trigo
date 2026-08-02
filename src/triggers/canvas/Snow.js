import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let snowInstances = new Map();

const snowHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  switch (action) {
    case 'start':
      return startSnow(target, config);
    case 'stop':
      return stopSnow(target);
    case 'stopAll':
      return stopAllSnow();
    default:
      return startSnow(target, config);
  }
};

const startSnow = (target, config = {}) => {
  let container;

  if (isString(target)) {
    container = document.querySelector(target);
  } else if (isElement(target)) {
    container = target;
  } else {
    container = document.body;
  }

  if (!container) container = document.body;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9997;
  `;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const particleCount = config.count || config.particleCount || 100;
  const speed = config.speed || 1;
  const wind = config.wind || 0;
  const size = config.size || config.particleSize || 4;
  const color = config.color || '#ffffff';
  const twinkle = config.twinkle !== false;

  const flakes = [];

  for (let i = 0; i < particleCount; i++) {
    flakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: (Math.random() * size) + 1,
      speed: (Math.random() * speed) + 0.5,
      wind: wind + (Math.random() - 0.5) * 0.5,
      opacity: 0.5 + Math.random() * 0.5,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }

  if (config.onStart) config.onStart({ flakes });

  let animationId;

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const flake of flakes) {
      flake.y += flake.speed;
      flake.x += flake.wind;

      if (twinkle) {
        flake.twinklePhase += flake.twinkleSpeed;
        flake.opacity = 0.5 + Math.sin(flake.twinklePhase) * 0.5;
      }

      if (flake.y > canvas.height + flake.radius) {
        flake.y = -flake.radius;
        flake.x = Math.random() * canvas.width;
      }

      if (flake.x > canvas.width + flake.radius) {
        flake.x = -flake.radius;
      }

      if (flake.x < -flake.radius) {
        flake.x = canvas.width + flake.radius;
      }

      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = flake.opacity;
      ctx.fill();
    }

    animationId = requestAnimationFrame(animate);
  };

  animate();

  const instanceId = `snow_${Date.now()}`;
  snowInstances.set(instanceId, { canvas, container, animationId, flakes });

  return {
    active: true,
    flakes,
    stop: () => stopSnow(instanceId)
  };
};

const stopSnow = (target) => {
  if (isString(target) && snowInstances.has(target)) {
    const { canvas, animationId } = snowInstances.get(target);
    cancelAnimationFrame(animationId);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    snowInstances.delete(target);
  }
  return { stopped: true };
};

const stopAllSnow = () => {
  snowInstances.forEach(({ canvas, animationId }) => {
    cancelAnimationFrame(animationId);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });
  snowInstances.clear();
  return { stopped: true };
};

engine.register('snow', snowHandler);

const snow = (options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.count = options;
  return engine.execute('snow', 'start', config);
};

snow.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) {
    config.target = target;
  } else if (isObject(target) && !isElement(target)) {
    Object.assign(config, target);
  }
  return engine.execute('snow', 'start', config);
};

snow.stop = (target) => {
  return engine.execute('snow', 'stop', { target });
};

snow.stopAll = () => {
  return engine.execute('snow', 'stopAll', {});
};

export { snow };
export default snow;