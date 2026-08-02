const toString = Object.prototype.toString;

const getType = (value) => toString.call(value).slice(8, -1).toLowerCase();

const isUndefined = (value) => value === undefined;
const isNull = (value) => value === null;
const isNil = (value) => isUndefined(value) || isNull(value);
const isBoolean = (value) => typeof value === 'boolean' || getType(value) === 'boolean';
const isNumber = (value) => typeof value === 'number' && !Number.isNaN(value);
const isInteger = (value) => Number.isInteger(value);
const isString = (value) => typeof value === 'string';
const isFunction = (value) => typeof value === 'function';
const isAsyncFunction = (value) => getType(value) === 'asyncfunction';
const isGeneratorFunction = (value) => getType(value) === 'generatorfunction';
const isArray = (value) => Array.isArray(value);
const isObject = (value) => value !== null && typeof value === 'object' && !isArray(value);
const isPlainObject = (value) => getType(value) === 'object';
const isDate = (value) => getType(value) === 'date';
const isRegExp = (value) => getType(value) === 'regexp';
const isPromise = (value) => value && isFunction(value.then);
const isIterable = (value) => value && isFunction(value[Symbol.iterator]);
const isElement = (value) => value instanceof Element || value instanceof HTMLElement;
const isNodeList = (value) => getType(value) === 'nodelist';
const isEmpty = (value) => {
  if (isNil(value)) return true;
  if (isArray(value) || isString(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  if (isNumber(value)) return false;
  return false;
};

export {
  getType,
  isUndefined,
  isNull,
  isNil,
  isBoolean,
  isNumber,
  isInteger,
  isString,
  isFunction,
  isAsyncFunction,
  isGeneratorFunction,
  isArray,
  isObject,
  isPlainObject,
  isDate,
  isRegExp,
  isPromise,
  isIterable,
  isElement,
  isNodeList,
  isEmpty
};