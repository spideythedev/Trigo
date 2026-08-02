import { isFunction, isString, isArray } from '../utils/type.js';
import { fallback as logFallback } from '../core/Logger.js';

class FallbackEngine {
  constructor() {
    this.fallbackChains = {};
    this.globalFallbacks = {};
  }

  register(triggerName, fallback, priority = 0) {
    if (!this.fallbackChains[triggerName]) {
      this.fallbackChains[triggerName] = [];
    }

    this.fallbackChains[triggerName].push({ handler: fallback, priority });
    this.fallbackChains[triggerName].sort((a, b) => b.priority - a.priority);
  }

  setGlobal(fallbackMap) {
    for (const key in fallbackMap) {
      this.globalFallbacks[key] = fallbackMap[key];
    }
  }

  async resolve(triggerName, context, engine) {
    const chain = this.fallbackChains[triggerName] || [];
    const globalFallback = this.globalFallbacks[triggerName];
    const wildcardFallback = this.globalFallbacks['*'];

    const fallbackConfig = context.config.fallback;

    if (fallbackConfig === 'silent' || fallbackConfig === false) {
      return { success: false, skipped: true, reason: 'silent-fallback', context };
    }

    if (isFunction(fallbackConfig)) {
      logFallback(triggerName, fallbackConfig.name || 'custom');
      try {
        const result = await fallbackConfig(context);
        return { success: true, data: result, context };
      } catch (e) {
        return { success: false, error: e, context };
      }
    }

    if (isString(fallbackConfig) && fallbackConfig !== 'silent') {
      logFallback(triggerName, fallbackConfig);
      if (engine && engine.getTriggerHandler(fallbackConfig)) {
        return await engine.execute(fallbackConfig, ...context.params);
      }
    }

    for (const item of chain) {
      try {
        logFallback(triggerName, item.handler.name || 'chained');
        const result = isFunction(item.handler) 
          ? await item.handler(context) 
          : await engine.execute(item.handler, ...context.params);
        return { success: true, data: result, context };
      } catch (e) {
        continue;
      }
    }

    if (globalFallback) {
      try {
        logFallback(triggerName, 'global');
        const result = isFunction(globalFallback)
          ? await globalFallback(context)
          : await engine.execute(globalFallback, ...context.params);
        return { success: true, data: result, context };
      } catch (e) {}
    }

    if (wildcardFallback && wildcardFallback !== globalFallback) {
      try {
        logFallback(triggerName, 'wildcard');
        const result = isFunction(wildcardFallback)
          ? await wildcardFallback(context)
          : await engine.execute(wildcardFallback, ...context.params);
        return { success: true, data: result, context };
      } catch (e) {}
    }

    return { success: false, skipped: true, reason: 'all-fallbacks-exhausted', context };
  }

  chain(triggerName, fallbackChain) {
    this.fallbackChains[triggerName] = fallbackChain.map((handler, index) => ({
      handler,
      priority: fallbackChain.length - index
    }));
  }

  remove(triggerName) {
    delete this.fallbackChains[triggerName];
  }

  clear() {
    this.fallbackChains = {};
    this.globalFallbacks = {};
  }
}

const fallbackEngine = new FallbackEngine();

export { FallbackEngine, fallbackEngine };
export default fallbackEngine;