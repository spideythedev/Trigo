const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const timeout = (promise, ms, errorMessage = 'Timeout') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))
  ]);
};

const retry = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 'linear',
    onRetry = null,
    shouldRetry = () => true,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) throw error;
      if (!shouldRetry(error, attempt)) throw error;

      if (onRetry) onRetry(error, attempt);

      let waitTime = delayMs;
      if (backoff === 'exponential') {
        waitTime = delayMs * Math.pow(2, attempt - 1);
      }

      await delay(waitTime);
    }
  }

  throw lastError;
};

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const allSettled = (promises) => {
  return Promise.all(
    promises.map(p =>
      Promise.resolve(p).then(
        value => ({ status: 'fulfilled', value }),
        reason => ({ status: 'rejected', reason })
      )
    )
  );
};

const sequence = async (fns) => {
  const results = [];
  for (const fn of fns) {
    results.push(await fn());
  }
  return results;
};

const parallel = async (fns, concurrency = Infinity) => {
  if (concurrency === Infinity) return Promise.all(fns.map(fn => fn()));

  const results = [];
  const executing = [];

  for (const fn of fns) {
    const promise = fn().then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    
    results.push(promise);
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
};

const memoize = (fn, ttl = Infinity) => {
  const cache = new Map();
  
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && (ttl === Infinity || Date.now() - cached.timestamp < ttl)) {
      return cached.value;
    }
    
    const value = await fn(...args);
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  };
};

export {
  delay,
  timeout,
  retry,
  deferred,
  allSettled,
  sequence,
  parallel,
  memoize
};