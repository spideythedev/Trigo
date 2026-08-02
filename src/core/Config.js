import { deepMerge, deepClone, getNested, setNested } from '../utils/object.js';
import { isObject, isFunction, isString, isNumber, isBoolean, isArray } from '../utils/type.js';
import { log, config as logConfig } from './Logger.js';
import { globalEvents } from './Events.js';

const DEFAULTS = {
  log: 'warn',
  strict: false,
  
  retry: {
    max: 0,
    delay: 1000,
    backoff: 'linear'
  },

  timeout: 0,

  permissions: {
    strategy: 'auto',
    remember: false,
    expiry: 86400000
  },

  fallback: 'silent',

  queue: {
    enabled: false,
    mode: 'sequential',
    maxConcurrent: 2
  },

  conditions: {
    enabled: true,
    shortCircuit: true,
    globalConditions: []
  },

  middleware: [],

  lifecycle: {
    onBefore: null,
    onStart: null,
    onTick: null,
    onComplete: null,
    onError: null,
    onAfter: null
  }
};

const TRIGGER_DEFAULTS = {
  vibrate: {
    pattern: [200],
    fallback: 'silent'
  },
  notify: {
    timeout: 5000,
    fallback: 'alert'
  },
  flashlight: {
    intensity: 1,
    duration: 0,
    fallback: 'vibrate'
  },
  camera: {
    facing: 'environment',
    duration: 0,
    fallback: 'silent'
  },
  location: {
    highAccuracy: false,
    timeout: 10000,
    maximumAge: 0,
    fallback: 'ip'
  },
  fadeIn: {
    duration: 400,
    easing: 'ease-out',
    from: 0,
    to: 1
  },
  fadeOut: {
    duration: 400,
    easing: 'ease-in',
    from: 1,
    to: 0
  },
  blink: {
    interval: 500,
    count: 10,
    infinite: false
  },
  flash: {
    interval: 50,
    count: 3
  },
  slideIn: {
    duration: 400,
    easing: 'ease-out',
    from: 'bottom',
    distance: 50
  },
  slideOut: {
    duration: 400,
    easing: 'ease-in',
    to: 'bottom',
    distance: 50
  },
  zoomIn: {
    duration: 400,
    easing: 'ease-out',
    from: 0.5,
    to: 1
  },
  zoomOut: {
    duration: 400,
    easing: 'ease-in',
    from: 1,
    to: 0.5
  },
  shake: {
    intensity: 5,
    duration: 400,
    direction: 'horizontal'
  },
  pulse: {
    scale: 1.05,
    duration: 600,
    easing: 'ease-in-out'
  },
  glow: {
    color: '#ffffff',
    spread: 20,
    duration: 600
  },
  bounce: {
    height: 20,
    duration: 600,
    count: 3
  },
  spin: {
    speed: 1000,
    infinite: true,
    direction: 'clockwise'
  },
  scrollTo: {
    speed: 'smooth',
    offset: 0
  },
  reveal: {
    threshold: 0.2,
    once: true,
    animation: 'fadeUp'
  },
  parallax: {
    speed: 0.5,
    direction: 'vertical'
  },
  holographic: {
    tilt: true,
    maxTilt: 15,
    perspective: 800,
    glare: true
  },
  threeD: {
    perspective: 1000,
    depth: 200
  },
  canvas: {
    particles: { count: 100, color: '#ffffff', size: 5, spread: 50, life: 2000 },
    confetti: { count: 50, colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'], spread: 100 },
    fire: { intensity: 0.8, particleLife: 1000 },
    snow: { count: 100, speed: 1, wind: 0 },
    rain: { count: 100, speed: 5, wind: 0 },
    stars: { count: 200, speed: 0.5, twinkle: true }
  },
  scramble: {
    duration: 500,
    characters: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
  },
  typewriter: {
    speed: 50,
    cursor: true,
    cursorChar: '|',
    cursorBlink: true
  },
  gradient: {
    duration: 3000,
    interpolation: 'hsl'
  }
};

class Config {
  constructor() {
    this.globalConfig = deepClone(DEFAULTS);
    this.triggerConfigs = deepClone(TRIGGER_DEFAULTS);
    this.presets = {};
  }

  set(key, value) {
    if (isObject(key)) {
      deepMerge(this.globalConfig, key);
      for (const k in key) {
        logConfig(k, key[k]);
        globalEvents.emit('config:change', k, key[k]);
      }
    } else {
      setNested(this.globalConfig, key, value);
      logConfig(key, value);
      globalEvents.emit('config:change', key, value);
    }
    return this;
  }

  get(key, defaultValue) {
    if (!key) return deepClone(this.globalConfig);
    return getNested(this.globalConfig, key, defaultValue);
  }

  setTrigger(triggerName, config) {
    if (!this.triggerConfigs[triggerName]) {
      this.triggerConfigs[triggerName] = {};
    }
    deepMerge(this.triggerConfigs[triggerName], config);
    return this;
  }

  getTrigger(triggerName) {
    return deepClone(this.triggerConfigs[triggerName] || {});
  }

  preset(name, presetConfig) {
    if (isObject(name)) {
      for (const key in name) {
        this.presets[key] = deepClone(name[key]);
      }
    } else if (presetConfig) {
      this.presets[name] = deepClone(presetConfig);
    }
    return this;
  }

  getPreset(name) {
    return this.presets[name] ? deepClone(this.presets[name]) : null;
  }

  applyPreset(name) {
    const preset = this.getPreset(name);
    if (preset) {
      deepMerge(this.globalConfig, preset);
      globalEvents.emit('preset:applied', name);
    }
    return this;
  }

  resolve(triggerName, callConfig = {}) {
    const global = deepClone(this.globalConfig);
    const triggerDefaults = deepClone(this.triggerConfigs[triggerName] || {});
    const resolved = {};

    deepMerge(resolved, global);
    deepMerge(resolved, triggerDefaults);
    deepMerge(resolved, callConfig);

    return resolved;
  }

  reset(triggerName) {
    if (triggerName) {
      this.triggerConfigs[triggerName] = deepClone(TRIGGER_DEFAULTS[triggerName] || {});
    } else {
      this.globalConfig = deepClone(DEFAULTS);
      this.triggerConfigs = deepClone(TRIGGER_DEFAULTS);
    }
    return this;
  }

  export() {
    return {
      global: deepClone(this.globalConfig),
      triggers: deepClone(this.triggerConfigs),
      presets: deepClone(this.presets)
    };
  }

  import(data) {
    if (data.global) this.globalConfig = deepClone(data.global);
    if (data.triggers) this.triggerConfigs = deepClone(data.triggers);
    if (data.presets) this.presets = deepClone(data.presets);
    return this;
  }
}

const config = new Config();

export { Config, config, DEFAULTS, TRIGGER_DEFAULTS };
export default config;