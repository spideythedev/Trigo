import { isObject, isString, isElement, isNumber } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let confettiInstances = new Map();

const confettiHandler = async (context) => {
  const action = context.params[0] || 'launch';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  switch (action) {
    case 'launch':
      return launchConfetti(target, config);
    case 'stop':
      return stopConfetti(target);
    case 'stopAll':
      return stopAllConfetti();
    default:
      return launchConfetti(target, config);
  }
};

const createCanvas = (target) => {
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
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (container === document.body) {
    container.appendChild(canvas);
  } else {
    const rect = container.getBoundingClientRect();
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.width = rect.width;
    canvas.height = rect.height;
    container.style.position = container.style.position || 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(canvas);
  }

  return { canvas, container };
};

const launchConfetti = (target, config = {}) => {
  const { canvas, container } = createCanvas(target);
  const ctx = canvas.getContext('2d');

  const particleCount = config.count || config.particleCount || 50;
  const colors = config.colors || ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
  const spread = config.spread || 100;
  const startVelocity = config.startVelocity || 30;
  const decay = config.decay || 0.9;
  const gravity = config.gravity || 1;
  const drift = config.drift || 0;
  const ticks = config.ticks || 200;
  const shapes = config.shapes || ['circle', 'square', 'triangle'];
  const scalar = config.scalar || 1;

  const particles = [];

  const origin = {
    x: config.origin?.x ?? (config.x ?? canvas.width / 2),
    y: config.origin?.y ?? (config.y ?? canvas.height / 2)
  };

  const angle = config.angle || 90;
  const radian = (angle * Math.PI) / 180;

  for (let i = 0; i < particleCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const velocity = startVelocity * (0.7 + Math.random() * 0.3);
    const particleAngle = radian + ((Math.random() - 0.5) * spread * Math.PI) / 180;

    particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(particleAngle) * velocity,
      vy: Math.sin(particleAngle) * velocity,
      color,
      shape,
      size: (3 + Math.random() * 5) * scalar,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      tick: 0,
      maxTicks: ticks * (0.7 + Math.random() * 0.3)
    });
  }

  if (config.onStart) config.onStart({ particles, origin });

  const drawParticle = (particle) => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotation * Math.PI) / 180);
    ctx.globalAlpha = particle.opacity;
    ctx.fillStyle = particle.color;

    if (particle.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.shape === 'square') {
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    } else if (particle.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -particle.size / 2);
      ctx.lineTo(-particle.size / 2, particle.size / 2);
      ctx.lineTo(particle.size / 2, particle.size / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    }

    ctx.restore();
  };

  let animationId;
  let completed = false;

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allDone = true;

    for (const particle of particles) {
      if (particle.tick >= particle.maxTicks) continue;

      particle.tick++;
      allDone = false;

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += gravity * 0.5;
      particle.vx += drift;
      particle.rotation += particle.rotationSpeed;

      const progress = particle.tick / particle.maxTicks;
      particle.opacity = 1 - progress;

      if (particle.opacity > 0) {
        drawParticle(particle);
      }
    }

    if (allDone && !completed) {
      completed = true;
      if (config.onComplete) config.onComplete({ particles });
      stopConfettiCanvas(canvas);
      return;
    }

    animationId = requestAnimationFrame(animate);
  };

  animate();

  const instanceId = `confetti_${Date.now()}`;
  confettiInstances.set(instanceId, {
    canvas,
    container,
    animationId,
    particles,
    config
  });

  return {
    active: true,
    particles,
    origin,
    stop: () => stopConfetti(instanceId)
  };
};

const stopConfetti = (target) => {
  if (isString(target) && confettiInstances.has(target)) {
    const { canvas, container, animationId } = confettiInstances.get(target);
    cancelAnimationFrame(animationId);
    stopConfettiCanvas(canvas);
    confettiInstances.delete(target);
  }
  return { stopped: true };
};

const stopAllConfetti = () => {
  confettiInstances.forEach(({ canvas, animationId }) => {
    cancelAnimationFrame(animationId);
    stopConfettiCanvas(canvas);
  });
  confettiInstances.clear();
  return { stopped: true };
};

const stopConfettiCanvas = (canvas) => {
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
};

engine.register('confetti', confettiHandler);

const confetti = (options = {}) => {
  const config = isObject(options) ? options : {};
  if (isNumber(options)) config.count = options;
  return engine.execute('confetti', 'launch', config);
};

confetti.launch = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) {
    config.target = target;
  } else if (isObject(target) && !isElement(target)) {
    Object.assign(config, target);
  }
  return engine.execute('confetti', 'launch', config);
};

confetti.stop = (target) => {
  return engine.execute('confetti', 'stop', { target });
};

confetti.stopAll = () => {
  return engine.execute('confetti', 'stopAll', {});
};

export { confetti };
export default confetti;