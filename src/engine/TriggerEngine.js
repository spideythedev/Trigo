import { isFunction, isString, isObject, isNumber, isPromise } from '../utils/type.js';
import { deepMerge, deepClone } from '../utils/object.js';
import { delay } from '../utils/promise.js';
import config from '../core/Config.js';
import middleware from '../core/Middleware.js';
import { globalEvents } from '../core/Events.js';
import { getInfo } from '../detect/Device.js';
import { can as checkCapability } from '../detect/Capabilities.js';
import {
  triggerStart, triggerEnd, triggerError, unsupported,
  fallback as logFallback, retry as logRetry, condition as logCondition
} from '../core/Logger.js';

class TriggerEngine {
  constructor() {
    this.activeTriggers = new Map();
    this.queue = [];
    this.isProcessingQueue = false;
  }

  async execute(triggerName, ...args) {
    const callConfig = isObject(args[args.length - 1]) && !isFunction(args[args.length - 1])
      ? args.pop()
      : {};

    const params = args;
    const resolvedConfig = config.resolve(triggerName, callConfig);
    const deviceInfo = getInfo();

    const context = {
      trigger: triggerName,
      params,
      config: resolvedConfig,
      device: deviceInfo,
      result: null,
      error: null,
      startTime: performance.now(),
      endTime: null,
      attempts: 0,
      maxAttempts: resolvedConfig.retry?.max || 0,
      cancelled: false
    };

    try {
      await middleware.run(context);
    } catch (e) {
      return { success: false, error: e, context };
    }

    if (!this.checkConditions(triggerName, resolvedConfig, context)) {
      return { success: false, skipped: true, reason: 'conditions', context };
    }

    if (!this.checkSupport(triggerName, context)) {
      return await this.handleFallback(triggerName, context);
    }

    return await this.executeWithRetry(triggerName, context);
  }

  checkConditions(triggerName, config, context) {
    const conditions = config.conditions?.custom || [];
    const globalConditions = config.conditions?.globalConditions || [];

    const allConditions = [...globalConditions, ...conditions];

    if (allConditions.length === 0) return true;

    const shortCircuit = config.conditions?.shortCircuit !== false;

    for (const condition of allConditions) {
      if (!isFunction(condition)) continue;

      let passed = false;
      try {
        passed = condition(context);
        if (isPromise(passed)) {
          passed = true;
        }
      } catch (e) {
        passed = false;
      }

      logCondition(triggerName, condition.name || 'anonymous', passed);

      if (!passed && shortCircuit) return false;
      if (!passed && !shortCircuit) return false;
    }

    return true;
  }

  checkSupport(triggerName, context) {
    const featureMap = {
      vibrate: 'vibrate',
      haptic: 'haptic',
      flashlight: 'flashlight',
      camera: 'camera',
      microphone: 'microphone',
      location: 'geolocation',
      nfc: 'nfc',
      bluetooth: 'bluetooth',
      usb: 'usb',
      clipboard: 'clipboard',
      share: 'share',
      fullscreen: 'fullscreen',
      wakeLock: 'wakeLock',
      notify: 'notifications',
      speak: 'speechSynthesis',
      listen: 'speechRecognition',
      motion: 'deviceMotion',
      compass: 'deviceOrientation',
      proximity: 'proximity',
      ambientLight: 'ambientLight',
      battery: 'battery',
      gamepad: 'gamepad',
      keyboard: 'keyboard',
      call: 'call',
      sms: 'sms',
      email: 'email',
      install: 'install',
      pip: 'pip',
      print: 'print',
      toPDF: 'toPDF',
      cast: 'cast',
      beacon: 'beacon',
      uwb: 'uwb',
      faceDetect: 'faceDetect',
      poseDetect: 'poseDetect',
      objectDetect: 'objectDetect',
      sentiment: 'sentiment',
      imageClassify: 'imageClassify',
      audioClassify: 'audioClassify',
      heartRate: 'heartRate',
      temperature: 'temperature',
      barometer: 'barometer',
      altimeter: 'altimeter',
      uvSensor: 'uvSensor',
      magnetometer: 'magnetometer',
      screenBrightness: 'screenBrightness',
      keepAwake: 'keepAwake',
      nightMode: 'nightMode',
      orientation: 'orientation',
      eyeTracking: 'eyeTracking',
      blinkDetect: 'blinkDetect'
    };

    const feature = featureMap[triggerName];
    if (!feature) return true;

    const supported = checkCapability(feature);
    if (!supported) {
      unsupported(triggerName, context.device.deviceType);
      context.result = { supported: false, reason: `${triggerName} not supported on ${context.device.deviceType}` };
    }

    return supported;
  }

  async executeWithRetry(triggerName, context) {
    const maxAttempts = context.maxAttempts || 0;
    let lastError;

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      if (context.cancelled) break;

      context.attempts = attempt + 1;

      if (attempt > 0) {
        logRetry(triggerName, attempt, maxAttempts);
        const delayMs = context.config.retry?.delay || 1000;
        const backoff = context.config.retry?.backoff || 'linear';
        let waitTime = delayMs;
        if (backoff === 'exponential') {
          waitTime = delayMs * Math.pow(2, attempt - 1);
        }
        await delay(waitTime);
      }

      try {
        triggerStart(triggerName, context.config);
        const result = await this.dispatchTrigger(triggerName, context);
        context.endTime = performance.now();
        context.result = { success: true, data: result };
        triggerEnd(triggerName, context.result);
        globalEvents.emit(`trigger:${triggerName}:complete`, context);
        globalEvents.emit('trigger:complete', context);
        return context.result;
      } catch (error) {
        lastError = error;
        context.error = error;
        triggerError(triggerName, error);

        if (attempt >= maxAttempts) {
          context.endTime = performance.now();
          context.result = { success: false, error };
          globalEvents.emit(`trigger:${triggerName}:error`, context);
          globalEvents.emit('trigger:error', context);
          return await this.handleFallback(triggerName, context);
        }
      }
    }

    return context.result;
  }

  async dispatchTrigger(triggerName, context) {
    const handler = this.getTriggerHandler(triggerName);
    if (!handler) {
      throw new Error(`Trigger "${triggerName}" not found`);
    }
    return await handler(context);
  }

  getTriggerHandler(triggerName) {
    if (this.activeTriggers.has(triggerName)) {
      return this.activeTriggers.get(triggerName);
    }
    return null;
  }

  register(triggerName, handler) {
    if (!isFunction(handler)) {
      throw new Error(`Handler for "${triggerName}" must be a function`);
    }
    this.activeTriggers.set(triggerName, handler);
  }

  unregister(triggerName) {
    this.activeTriggers.delete(triggerName);
  }

  async handleFallback(triggerName, context) {
    const fallbackConfig = context.config.fallback;

    if (!fallbackConfig || fallbackConfig === 'silent') {
      return { success: false, skipped: true, reason: 'no-fallback', context };
    }

    if (isString(fallbackConfig) && fallbackConfig !== 'silent') {
      logFallback(triggerName, fallbackConfig);
      const handler = this.getTriggerHandler(fallbackConfig);
      if (handler) {
        return await handler(context);
      }
    }

    if (isFunction(fallbackConfig)) {
      logFallback(triggerName, fallbackConfig.name || 'custom');
      return await fallbackConfig(context);
    }

    return { success: false, skipped: true, reason: 'fallback-failed', context };
  }

  cancel(triggerName) {
    if (this.activeTriggers.has(triggerName)) {
      const context = this.activeTriggers.get(triggerName);
      if (context) {
        context.cancelled = true;
      }
    }
  }

  cancelAll() {
    for (const [name, context] of this.activeTriggers) {
      if (context) context.cancelled = true;
    }
    this.activeTriggers.clear();
    this.queue = [];
  }

  async queueTrigger(triggerName, context, priority = 0) {
    this.queue.push({ triggerName, context, priority });
    this.queue.sort((a, b) => b.priority - a.priority);

    if (!this.isProcessingQueue) {
      await this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      await this.executeWithRetry(item.triggerName, item.context);
    }

    this.isProcessingQueue = false;
  }

  createContext(triggerName, params, config) {
    const deviceInfo = getInfo();
    return {
      trigger: triggerName,
      params,
      config: deepClone(config),
      device: deviceInfo,
      result: null,
      error: null,
      startTime: performance.now(),
      endTime: null,
      attempts: 0,
      maxAttempts: config.retry?.max || 0,
      cancelled: false
    };
  }
}

const engine = new TriggerEngine();

export { TriggerEngine, engine };
export default engine;