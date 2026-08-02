const throttle = (fn, delay) => {
  let lastCall = 0;
  let timeout = null;

  const throttled = (...args) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn(...args);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
    lastCall = 0;
  };

  return throttled;
};

export { throttle };