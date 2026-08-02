import { isFunction, isArray } from '../utils/type.js';
import { debug } from './Logger.js';

class Middleware {
  constructor() {
    this.middlewares = [];
    this.namedMiddlewares = {};
  }

  add(name, fn) {
    if (isFunction(name)) {
      fn = name;
      name = `middleware_${this.middlewares.length}`;
    }

    const middleware = { name, fn, enabled: true };
    this.middlewares.push(middleware);
    this.namedMiddlewares[name] = middleware;
    
    debug(`Middleware added: ${name}`);
    return () => this.remove(name);
  }

  remove(name) {
    this.middlewares = this.middlewares.filter(m => m.name !== name);
    delete this.namedMiddlewares[name];
    debug(`Middleware removed: ${name}`);
  }

  enable(name) {
    if (this.namedMiddlewares[name]) {
      this.namedMiddlewares[name].enabled = true;
    }
  }

  disable(name) {
    if (this.namedMiddlewares[name]) {
      this.namedMiddlewares[name].enabled = false;
    }
  }

  order(names) {
    const ordered = [];
    for (const name of names) {
      const middleware = this.namedMiddlewares[name];
      if (middleware) {
        ordered.push(middleware);
      }
    }
    this.middlewares = ordered;
  }

  async run(context) {
    const enabledMiddlewares = this.middlewares.filter(m => m.enabled);
    
    if (enabledMiddlewares.length === 0) {
      return;
    }

    let index = 0;

    const next = async () => {
      if (index >= enabledMiddlewares.length) return;
      
      const middleware = enabledMiddlewares[index];
      index++;
      
      try {
        await middleware.fn(context, next);
      } catch (error) {
        debug(`Middleware error: ${middleware.name}`, error);
        throw error;
      }
    };

    await next();
  }

  clear() {
    this.middlewares = [];
    this.namedMiddlewares = {};
  }

  rateLimit(maxCalls, windowMs) {
    let calls = 0;
    let windowStart = Date.now();

    return this.add('rateLimit', (context, next) => {
      const now = Date.now();
      
      if (now - windowStart > windowMs) {
        calls = 0;
        windowStart = now;
      }

      if (calls >= maxCalls) {
        debug(`Rate limit hit: ${context.trigger}`);
        return;
      }

      calls++;
      next();
    });
  }

  analytics(endpoint) {
    return this.add('analytics', (context, next) => {
      const start = performance.now();
      
      next();
      
      const duration = performance.now() - start;
      const data = {
        trigger: context.trigger,
        duration,
        timestamp: Date.now(),
        success: context.result?.success ?? true
      };

      if (endpoint) {
        fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(data),
          keepalive: true
        }).catch(() => {});
      }

      debug('Analytics:', data);
    });
  }

  debug() {
    return this.add('debug', (context, next) => {
      debug(`Trigger: ${context.trigger}`, context.config);
      const start = performance.now();
      next();
      debug(`Trigger complete: ${context.trigger} (${(performance.now() - start).toFixed(2)}ms)`);
    });
  }
}

const middleware = new Middleware();

export { Middleware, middleware };
export default middleware;