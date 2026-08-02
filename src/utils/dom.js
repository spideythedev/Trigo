import { isString, isElement, isNodeList } from './type.js';

const select = (selector, parent = document) => {
  if (isElement(selector)) return selector;
  if (isNodeList(selector)) return [...selector];
  if (isString(selector)) {
    const elements = parent.querySelectorAll(selector);
    if (elements.length === 1) return elements[0];
    return [...elements];
  }
  return null;
};

const selectOne = (selector, parent = document) => {
  if (isElement(selector)) return selector;
  if (isString(selector)) return parent.querySelector(selector);
  return null;
};

const selectAll = (selector, parent = document) => {
  if (isNodeList(selector)) return [...selector];
  if (isArray(selector)) return selector;
  if (isElement(selector)) return [selector];
  if (isString(selector)) return [...parent.querySelectorAll(selector)];
  return [];
};

const matches = (element, selector) => {
  if (!element || !element.matches) return false;
  return element.matches(selector);
};

const closest = (element, selector) => {
  if (!element || !element.closest) return null;
  return element.closest(selector);
};

const getStyle = (element, property) => {
  const styles = window.getComputedStyle(element);
  return styles.getPropertyValue(property);
};

const setStyle = (element, styles) => {
  for (const key in styles) {
    element.style[key] = styles[key];
  }
};

const hasClass = (element, className) => {
  return element.classList.contains(className);
};

const addClass = (element, ...classNames) => {
  element.classList.add(...classNames);
};

const removeClass = (element, ...classNames) => {
  element.classList.remove(...classNames);
};

const toggleClass = (element, className, force) => {
  element.classList.toggle(className, force);
};

const swapClass = (element, oldClass, newClass) => {
  element.classList.replace(oldClass, newClass);
};

const getAttr = (element, attribute) => {
  return element.getAttribute(attribute);
};

const setAttr = (element, attribute, value) => {
  element.setAttribute(attribute, value);
};

const removeAttr = (element, attribute) => {
  element.removeAttribute(attribute);
};

const getData = (element, key) => {
  return element.dataset[key];
};

const setData = (element, key, value) => {
  element.dataset[key] = value;
};

const createElement = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
};

const append = (parent, child) => {
  if (isString(child)) {
    parent.insertAdjacentHTML('beforeend', child);
  } else {
    parent.appendChild(child);
  }
};

const prepend = (parent, child) => {
  if (isString(child)) {
    parent.insertAdjacentHTML('afterbegin', child);
  } else {
    parent.prepend(child);
  }
};

const before = (element, sibling) => {
  if (isString(sibling)) {
    element.insertAdjacentHTML('beforebegin', sibling);
  } else {
    element.before(sibling);
  }
};

const after = (element, sibling) => {
  if (isString(sibling)) {
    element.insertAdjacentHTML('afterend', sibling);
  } else {
    element.after(sibling);
  }
};

const remove = (element) => {
  element.remove();
};

const empty = (element) => {
  element.innerHTML = '';
};

const on = (element, event, handler, options) => {
  const elements = selectAll(element);
  elements.forEach(el => el.addEventListener(event, handler, options));
  return () => elements.forEach(el => el.removeEventListener(event, handler, options));
};

const off = (element, event, handler) => {
  const elements = selectAll(element);
  elements.forEach(el => el.removeEventListener(event, handler));
};

const once = (element, event, handler) => {
  const elements = selectAll(element);
  elements.forEach(el => el.addEventListener(event, handler, { once: true }));
};

const delegate = (parent, event, selector, handler) => {
  const wrapper = (e) => {
    const target = e.target.closest(selector);
    if (target) handler.call(target, e);
  };
  parent.addEventListener(event, wrapper);
  return () => parent.removeEventListener(event, wrapper);
};

const trigger = (element, eventName, detail = {}) => {
  const event = new CustomEvent(eventName, { bubbles: true, detail });
  element.dispatchEvent(event);
};

export {
  select,
  selectOne,
  selectAll,
  matches,
  closest,
  getStyle,
  setStyle,
  hasClass,
  addClass,
  removeClass,
  toggleClass,
  swapClass,
  getAttr,
  setAttr,
  removeAttr,
  getData,
  setData,
  createElement,
  append,
  prepend,
  before,
  after,
  remove,
  empty,
  on,
  off,
  once,
  delegate,
  trigger
};