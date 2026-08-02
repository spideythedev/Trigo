import { isFunction, isObject, isArray } from '../utils/type.js';
import { deepClone, getNested, setNested } from '../utils/object.js';
import { globalEvents } from './Events.js';

class State {
  constructor(initialState = {}) {
    this.state = deepClone(initialState);
    this.watchers = {};
    this.computedCache = {};
    this.computedDependencies = {};
  }

  get(key, defaultValue) {
    if (!key) return deepClone(this.state);
    return getNested(this.state, key, defaultValue);
  }

  set(key, value) {
    const oldValue = this.get(key);
    
    if (isObject(key)) {
      for (const k in key) {
        const oldVal = this.get(k);
        setNested(this.state, k, key[k]);
        this.notifyWatchers(k, key[k], oldVal);
      }
    } else {
      setNested(this.state, key, value);
      this.notifyWatchers(key, value, oldValue);
    }

    this.invalidateComputed(key);
    globalEvents.emit('state:change', { key, value, oldValue });
    
    return this;
  }

  watch(key, handler) {
    if (!this.watchers[key]) {
      this.watchers[key] = [];
    }
    this.watchers[key].push(handler);
    
    return () => {
      this.watchers[key] = this.watchers[key].filter(h => h !== handler);
    };
  }

  notifyWatchers(key, newValue, oldValue) {
    if (this.watchers[key]) {
      this.watchers[key].forEach(handler => handler(newValue, oldValue));
    }

    const wildcardWatchers = this.watchers['*'] || [];
    wildcardWatchers.forEach(handler => handler(key, newValue, oldValue));
  }

  computed(key, fn, dependencies = []) {
    this.computedDependencies[key] = dependencies;
    
    const compute = () => {
      const deps = dependencies.map(dep => this.get(dep));
      const result = fn(...deps);
      this.computedCache[key] = result;
      return result;
    };

    dependencies.forEach(dep => {
      this.watch(dep, () => {
        const oldValue = this.computedCache[key];
        const newValue = compute();
        this.notifyWatchers(key, newValue, oldValue);
      });
    });

    compute();
    return this;
  }

  getComputed(key) {
    return this.computedCache[key];
  }

  invalidateComputed(changedKey) {
    for (const key in this.computedDependencies) {
      const deps = this.computedDependencies[key];
      if (deps.some(dep => dep === changedKey || changedKey.startsWith(dep + '.'))) {
        const oldValue = this.computedCache[key];
        const deps = this.computedDependencies[key].map(dep => this.get(dep));
        const fn = this.computedCache[key];
        if (isFunction(this.computedCache[key])) {
          delete this.computedCache[key];
        }
      }
    }
  }

  push(key, value) {
    const arr = this.get(key, []);
    if (!isArray(arr)) return this;
    arr.push(value);
    return this.set(key, arr);
  }

  remove(key, index) {
    const arr = this.get(key, []);
    if (!isArray(arr)) return this;
    arr.splice(index, 1);
    return this.set(key, arr);
  }

  toggle(key) {
    const value = this.get(key, false);
    return this.set(key, !value);
  }

  increment(key, amount = 1) {
    const value = this.get(key, 0);
    return this.set(key, value + amount);
  }

  decrement(key, amount = 1) {
    const value = this.get(key, 0);
    return this.set(key, value - amount);
  }

  reset(newState = {}) {
    this.state = deepClone(newState);
    this.computedCache = {};
    globalEvents.emit('state:reset', this.state);
    return this;
  }

  persist(storageKey) {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        this.state = JSON.parse(saved);
      }
      
      this.watch('*', () => {
        localStorage.setItem(storageKey, JSON.stringify(this.state));
      });
    } catch (e) {
      console.warn('State persistence failed:', e);
    }
    return this;
  }

  toJSON() {
    return deepClone(this.state);
  }

  fromJSON(json) {
    this.state = deepClone(json);
    return this;
  }
}

const globalState = new State({
  ready: false,
  triggers: {
    total: 0,
    active: 0,
    history: []
  },
  device: {
    online: true,
    battery: null,
    network: null
  }
});

export { State, globalState };
export default globalState;