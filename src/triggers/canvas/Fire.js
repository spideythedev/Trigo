import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';

let fireInstances = new Map();

const fireHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  switch (action) {
    case 'start':
      return startFire(target, config);
    case 'stop':
      return stopFire(target);
    case 'stopAll':
      return stopAllFire();
    default:
      return startFire(target, config);
  }
};

const startFire = (target, config = {}) => {
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
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9997;
  `;

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width || window.innerWidth;
  canvas.height = rect.height || window.innerHeight;

  container.style.position = container.style.position || 'relative';
  container.style.overflow = 'hidden';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const particleCount = config.count || config.particleCount || 50;
  const intensity = config.intensity || 0.8;
  const colors = config.colors || ['#ff0000', '#ff6600', '#ff9900', '#ffcc00', '#ffff00'];
  const life = config.particleLife || 1000;
  const size = config.size || 5;

  const particles = [];

  const createParticle = () => {
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * intensity,
      y: canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: -(Math.random() * 3 + 2) * intensity,
      size: Math.random() * size + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.8 + 0.2,
      life: life * (0.5 + Math.random() * 0.5),
      born: Date.now()
    };
  };

  for (let i = 0; i < particleCount; i++) {
    const particle = createParticle();
    particle.born -= Math.random() * life;
    particles.push(particle);
  }

  if (config.onStart) config.onStart({ particles });

  let animationId;

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = Date.now() - p.born;

      if (age > p.life) {
        particles.splice(i, 1);
        particles.push(createParticle());
        continue;
      }

      const progress = age / p.life;
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.01;
      p.size *= 0.995;
      p.opacity = 1 - progress;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    animationId = requestAnimationFrame(animate);
  };

  animate();

  const instanceId = `fire_${Date.now()}`;
  fireInstances.set(instanceId, { canvas, container, animationId, particles });

  return {
    active: true,
    particles,
    stop: () => stopFire(instanceId)
  };
};

const stopFire = (target) => {
  if (isString(target) && fireInstances.has(target)) {
    const { canvas, animationId } = fireInstances.get(target);
    cancelAnimationFrame(animationId);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    fireInstances.delete(target);
  }
  return { stopped: true };
};

const stopAllFire = () => {
  fireInstances.forEach(({ canvas, animationId }) => {
    cancelAnimationFrame(animationId);
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });
  fireInstances.clear();
  return { stopped: true };
};

engine.register('fire', fireHandler);

const fire = (options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.count = options;
  return engine.execute('fire', 'start', config);
};

fire.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) {
    config.target = target;
  } else if (isObject(target) && !isElement(target)) {
    Object.assign(config, target);
  }
  return engine.execute('fire', 'start', config);
};

fire.stop = (target) => {
  return engine.execute('fire', 'stop', { target });
};

fire.stopAll = () => {
  return engine.execute('fire', 'stopAll', {});
};

export { fire };
export default fire;