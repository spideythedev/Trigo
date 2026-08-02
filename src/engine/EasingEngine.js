const linear = (t) => t;

const easeIn = (t) => t * t;
const easeOut = (t) => t * (2 - t);
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const easeInQuad = (t) => t * t;
const easeOutQuad = (t) => t * (2 - t);
const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const easeInCubic = (t) => t * t * t;
const easeOutCubic = (t) => (--t) * t * t + 1;
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

const easeInQuart = (t) => t * t * t * t;
const easeOutQuart = (t) => 1 - (--t) * t * t * t;
const easeInOutQuart = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;

const easeInQuint = (t) => t * t * t * t * t;
const easeOutQuint = (t) => 1 + (--t) * t * t * t * t;
const easeInOutQuint = (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;

const easeInSine = (t) => 1 - Math.cos(t * Math.PI / 2);
const easeOutSine = (t) => Math.sin(t * Math.PI / 2);
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

const easeInExpo = (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10);
const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInOutExpo = (t) => {
  if (t === 0 || t === 1) return t;
  return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

const easeInCirc = (t) => 1 - Math.sqrt(1 - t * t);
const easeOutCirc = (t) => Math.sqrt(1 - (--t) * t);
const easeInOutCirc = (t) => t < 0.5
  ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
  : (Math.sqrt(1 - (t * 2 - 2) * (t * 2 - 2)) + 1) / 2;

const easeInBack = (t) => {
  const c1 = 1.70158;
  return (c1 + 1) * t * t * t - c1 * t * t;
};
const easeOutBack = (t) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOutBack = (t) => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};

const easeInElastic = (t) => {
  if (t === 0 || t === 1) return t;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
};
const easeOutElastic = (t) => {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
};
const easeInOutElastic = (t) => {
  if (t === 0 || t === 1) return t;
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1;
};

const easeOutBounce = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};
const easeInBounce = (t) => 1 - easeOutBounce(1 - t);
const easeInOutBounce = (t) => t < 0.5
  ? (1 - easeOutBounce(1 - 2 * t)) / 2
  : (1 + easeOutBounce(2 * t - 1)) / 2;

const spring = (t, options = {}) => {
  const { stiffness = 100, damping = 10, mass = 1 } = options;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  const a = 1;
  const b = -zeta * w0;
  return 1 - Math.exp(b * t) * (a * Math.cos(wd * t) + (b / wd) * Math.sin(wd * t));
};

const steps = (t, count, direction = 'end') => {
  const step = 1 / count;
  if (direction === 'start') return Math.ceil(t / step) * step;
  return Math.floor(t / step) * step;
};

const cubicBezier = (t, p1, p2, p3, p4) => {
  const cx = 3 * p1;
  const bx = 3 * (p3 - p1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p2;
  const by = 3 * (p4 - p2) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t) => ((ay * t + by) * t + cy) * t;
  const sampleCurveDerivativeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

  const solveCurveX = (x, epsilon = 1e-7) => {
    let t0, t1, t2, x2, d2;
    for (let i = 0; i < 32; i++) {
      t2 = x;
      x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < epsilon) return t2;
      d2 = sampleCurveDerivativeX(t2);
      if (Math.abs(d2) < epsilon) break;
      x -= x2 / d2;
    }
    t0 = 0;
    t1 = 1;
    t2 = x;
    while (t0 < t1) {
      x2 = sampleCurveX(t2);
      if (Math.abs(x2 - x) < epsilon) return t2;
      if (x > x2) t0 = t2;
      else t1 = t2;
      t2 = (t1 - t0) / 2 + t0;
    }
    return t2;
  };

  return sampleCurveY(solveCurveX(t));
};

const getEasing = (type, options = {}) => {
  if (typeof type === 'function') return type;

  const easings = {
    'linear': linear,
    'ease': easeInOut,
    'ease-in': easeIn,
    'ease-out': easeOut,
    'ease-in-out': easeInOut,
    'ease-in-quad': easeInQuad,
    'ease-out-quad': easeOutQuad,
    'ease-in-out-quad': easeInOutQuad,
    'ease-in-cubic': easeInCubic,
    'ease-out-cubic': easeOutCubic,
    'ease-in-out-cubic': easeInOutCubic,
    'ease-in-quart': easeInQuart,
    'ease-out-quart': easeOutQuart,
    'ease-in-out-quart': easeInOutQuart,
    'ease-in-quint': easeInQuint,
    'ease-out-quint': easeOutQuint,
    'ease-in-out-quint': easeInOutQuint,
    'ease-in-sine': easeInSine,
    'ease-out-sine': easeOutSine,
    'ease-in-out-sine': easeInOutSine,
    'ease-in-expo': easeInExpo,
    'ease-out-expo': easeOutExpo,
    'ease-in-out-expo': easeInOutExpo,
    'ease-in-circ': easeInCirc,
    'ease-out-circ': easeOutCirc,
    'ease-in-out-circ': easeInOutCirc,
    'ease-in-back': easeInBack,
    'ease-out-back': easeOutBack,
    'ease-in-out-back': easeInOutBack,
    'ease-in-elastic': easeInElastic,
    'ease-out-elastic': easeOutElastic,
    'ease-in-out-elastic': easeInOutElastic,
    'ease-in-bounce': easeInBounce,
    'ease-out-bounce': easeOutBounce,
    'ease-in-out-bounce': easeInOutBounce,
    'spring': (t) => spring(t, options),
    'bounce': easeOutBounce,
    'elastic': easeOutElastic,
    'smooth': easeInOutSine,
    'sharp': easeInExpo,
    'steps': (t) => steps(t, options.count || 5, options.direction || 'end')
  };

  return easings[type] || easeInOut;
};

export {
  linear,
  easeIn, easeOut, easeInOut,
  easeInQuad, easeOutQuad, easeInOutQuad,
  easeInCubic, easeOutCubic, easeInOutCubic,
  easeInQuart, easeOutQuart, easeInOutQuart,
  easeInQuint, easeOutQuint, easeInOutQuint,
  easeInSine, easeOutSine, easeInOutSine,
  easeInExpo, easeOutExpo, easeInOutExpo,
  easeInCirc, easeOutCirc, easeInOutCirc,
  easeInBack, easeOutBack, easeInOutBack,
  easeInElastic, easeOutElastic, easeInOutElastic,
  easeInBounce, easeOutBounce, easeInOutBounce,
  spring, steps, cubicBezier,
  getEasing
};