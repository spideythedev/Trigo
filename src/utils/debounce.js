const debounce = (fn, delay) => {
  let timeout = null;

  const debounced = (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };

  debounced.flush = (...args) => {
    debounced.cancel();
    return fn(...args);
  };

  return debounced;
};

export { debounce };