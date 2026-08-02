import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let particlesInstances = new Map();

const particlesHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  switch (action) {
    case 'start':
      return startParticles(target, config);
    case 'stop':
      return stopParticles(target);
    case 'stopAll':
      return stopAllParticles();
    default:
      return startParticles(target, config);
  }
};

const createParticleCanvas = (target) => {
  let container;

  if (isString(target)) {
    container = document.querySelector(target);
  } else if (isElement(target)) {
    container = target;
  } else {
    container = document.body;
  }

  if (!container) {
    container = document.body;
  }

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9998;
  `;

  const rect = container.getBoundingClientRect();
  canvas.width = rect.width || window.innerWidth;
  canvas.height = rect.height || window.innerHeight;

  if (container !== document.body) {
    const computedPosition = getComputedStyle(container).position;
    if (computedPosition === 'static') {
      container.style.position = 'relative';
    }
    container.style.overflow = 'hidden';
  }

  container.appendChild(canvas);

  return { canvas, container };
};

const startParticles = (target, config = {}) => {
  const { canvas, container } = createParticleCanvas(target);
  const ctx = canvas.getContext('2d');

  const particleCount = config.count || config.particleCount || 100;
  const color = config.color || '#ffffff';
  const size = config.size || config.particleSize || 3;
  const spread = config.spread || 50;
  const speed = config.speed || 1;
  const life = config.life || config.particleLife || 2000;
  const connectDistance = config.connectDistance || 150;
  const connectColor = config.connectColor || color;
  const connectOpacity = config.connectOpacity || 0.2;
  const interactive = config.interactive !== false;

  const particles = [];
  const mousePosition = { x: null, y: null };

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: typeof size === 'number' ? size * (0.5 + Math.random()) : size,
      opacity: 0.3 + Math.random() * 0.7
    });
  }

  if (interactive) {
    canvas.style.pointerEvents = 'auto';

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePosition.x = e.clientX - rect.left;
      mousePosition.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mousePosition.x = null;
      mousePosition.y = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
  }

  if (config.onStart) config.onStart({ particles });

  let animationId;
  let startTime = Date.now();

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      if (mousePosition.x !== null && mousePosition.y !== null) {
        const dx = mousePosition.x - p.x;
        const dy = mousePosition.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < spread * 3) {
          const force = (spread * 3 - dist) / (spread * 3);
          p.vx -= (dx / dist) * force * 0.5;
          p.vy -= (dy / dist) * force * 0.5;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = typeof color === 'function' ? color(p) : color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectDistance) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = connectColor;
          ctx.globalAlpha = connectOpacity * (1 - dist / connectDistance);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    if (life > 0 && Date.now() - startTime > life) {
      stopParticlesCanvas(canvas);
      if (config.onComplete) config.onComplete({ particles });
      return;
    }

    animationId = requestAnimationFrame(animate);
  };

  animate();

  const instanceId = `particles_${Date.now()}`;
  particlesInstances.set(instanceId, {
    canvas,
    container,
    animationId,
    particles,
    config
  });

  return {
    active: true,
    particles,
    stop: () => stopParticles(instanceId)
  };
};

const stopParticles = (target) => {
  if (isString(target) && particlesInstances.has(target)) {
    const { canvas, animationId } = particlesInstances.get(target);
    cancelAnimationFrame(animationId);
    stopParticlesCanvas(canvas);
    particlesInstances.delete(target);
  }
  return { stopped: true };
};

const stopAllParticles = () => {
  particlesInstances.forEach(({ canvas, animationId }) => {
    cancelAnimationFrame(animationId);
    stopParticlesCanvas(canvas);
  });
  particlesInstances.clear();
  return { stopped: true };
};

const stopParticlesCanvas = (canvas) => {
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
};

engine.register('particles', particlesHandler);

const particles = (options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.count = options;
  return engine.execute('particles', 'start', config);
};

particles.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) {
    config.target = target;
  } else if (isObject(target) && !isElement(target)) {
    Object.assign(config, target);
  }
  return engine.execute('particles', 'start', config);
};

particles.stop = (target) => {
  return engine.execute('particles', 'stop', { target });
};

particles.stopAll = () => {
  return engine.execute('particles', 'stopAll', {});
};

export { particles };
export default particles;