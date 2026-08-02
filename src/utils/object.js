import { isObject, isArray, isPlainObject, isFunction } from './type.js';

const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else if (isArray(source[key])) {
        target[key] = [...(target[key] || []), ...source[key]];
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

const deepClone = (value) => {
  if (!isObject(value) && !isArray(value)) return value;
  if (isArray(value)) return value.map(deepClone);
  
  const clone = {};
  for (const key in value) {
    clone[key] = deepClone(value[key]);
  }
  return clone;
};

const pick = (obj, keys) => {
  const result = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
};

const omit = (obj, keys) => {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

const getNested = (obj, path, defaultValue) => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result ?? defaultValue;
};

const setNested = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  for (const key of keys) {
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  current[lastKey] = value;
  return obj;
};

const flatten = (obj, prefix = '', result = {}) => {
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(obj[key])) {
      flatten(obj[key], path, result);
    } else {
      result[path] = obj[key];
    }
  }
  return result;
};

const unflatten = (obj) => {
  const result = {};
  for (const key in obj) {
    setNested(result, key, obj[key]);
  }
  return result;
};

export {
  deepMerge,
  deepClone,
  pick,
  omit,
  getNested,
  setNested,
  flatten,
  unflatten
};