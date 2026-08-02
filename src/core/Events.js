class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, handler, options = {}) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    const listener = {
      handler,
      once: options.once || false,
      priority: options.priority || 0
    };

    this.events[event].push(listener);
    this.events[event].sort((a, b) => b.priority - a.priority);

    return () => this.off(event, handler);
  }

  once(event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true });
  }

  off(event, handler) {
    if (!this.events[event]) return;

    if (!handler) {
      delete this.events[event];
      return;
    }

    this.events[event] = this.events[event].filter(
      listener => listener.handler !== handler
    );

    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  emit(event, ...args) {
    if (!this.events[event]) return;

    const listeners = [...this.events[event]];

    for (const listener of listeners) {
      listener.handler(...args);
      if (listener.once) {
        this.off(event, listener.handler);
      }
    }
  }

  emitWildcard(pattern, ...args) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*') + '$'
    );

    for (const event in this.events) {
      if (regex.test(event)) {
        this.emit(event, ...args);
      }
    }
  }

  removeAll() {
    this.events = {};
  }

  listenerCount(event) {
    if (!this.events[event]) return 0;
    return this.events[event].length;
  }

  eventNames() {
    return Object.keys(this.events);
  }

  hasListeners(event) {
    return this.listenerCount(event) > 0;
  }
}

const globalEvents = new EventEmitter();

export { EventEmitter, globalEvents };