import { isObject, isString, isElement } from '../../utils/type.js';
import engine from '../../engine/TriggerEngine.js';
import { selectAll } from '../../utils/dom.js';

let typewriterTimers = new Map();

const typewriterHandler = async (context) => {
  const action = context.params[0] || 'start';
  const config = context.config;
  const target = config.target || config.element || context.params[1];

  if (!target) {
    throw new Error('No target element specified');
  }

  switch (action) {
    case 'start':
      return startTypewriter(target, config);
    case 'stop':
      return stopTypewriter(target);
    default:
      return startTypewriter(target, config);
  }
};

const startTypewriter = (target, config = {}) => {
  const elements = selectAll(target);
  const speed = config.speed || 50;
  const cursor = config.cursor !== false;
  const cursorChar = config.cursorChar || '|';
  const cursorBlink = config.cursorBlink !== false;
  const cursorBlinkSpeed = config.cursorBlinkSpeed || 500;
  const delay = config.delay || 0;
  const loop = config.loop || false;
  const loopDelay = config.loopDelay || 2000;
  const deleteSpeed = config.deleteSpeed || speed / 2;

  const results = [];

  if (!document.getElementById('trigo-typewriter-style')) {
    const style = document.createElement('style');
    style.id = 'trigo-typewriter-style';
    style.textContent = `
      @keyframes trigo-cursor-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      .trigo-typewriter-cursor {
        animation: trigo-cursor-blink ${cursorBlinkSpeed}ms infinite;
      }
    `;
    document.head.appendChild(style);
  }

  elements.forEach((element) => {
    const originalText = config.text || element.textContent || element.innerText || '';
    const finalText = config.finalText || originalText;
    element.textContent = '';

    if (config.onStart) config.onStart(element);

    const typeText = (text, currentIndex = 0, isDeleting = false) => {
      const timerMap = typewriterTimers.get(element) || {};

      if (timerMap.cancelled) return;

      if (!isDeleting && currentIndex <= text.length) {
        element.textContent = text.substring(0, currentIndex);

        if (cursor) {
          const cursorSpan = element.querySelector('.trigo-typewriter-cursor');
          if (!cursorSpan) {
            const span = document.createElement('span');
            span.className = 'trigo-typewriter-cursor';
            span.textContent = cursorChar;
            element.appendChild(span);
          }
        }

        if (config.onType) config.onType(element, text[currentIndex - 1], currentIndex);

        if (currentIndex < text.length) {
          const timerId = setTimeout(() => typeText(text, currentIndex + 1, false), speed);
          typewriterTimers.set(element, { ...timerMap, timerId, cancelled: false });
        } else {
          if (loop) {
            const timerId = setTimeout(() => typeText(text, currentIndex, true), loopDelay);
            typewriterTimers.set(element, { ...timerMap, timerId, cancelled: false });
          } else {
            if (config.onComplete) config.onComplete(element, text);
            results.push({ completed: true, element, text });
          }
        }
      } else if (isDeleting && currentIndex >= 0) {
        element.textContent = text.substring(0, currentIndex);

        if (cursor && currentIndex >= 0) {
          const cursorSpan = element.querySelector('.trigo-typewriter-cursor');
          if (!cursorSpan) {
            const span = document.createElement('span');
            span.className = 'trigo-typewriter-cursor';
            span.textContent = cursorChar;
            element.appendChild(span);
          }
        }

        if (config.onDelete) config.onDelete(element, text[currentIndex], currentIndex);

        if (currentIndex > 0) {
          const timerId = setTimeout(() => typeText(text, currentIndex - 1, true), deleteSpeed);
          typewriterTimers.set(element, { ...timerMap, timerId, cancelled: false });
        } else {
          const timerId = setTimeout(() => typeText(text, 0, false), speed);
          typewriterTimers.set(element, { ...timerMap, timerId, cancelled: false });
        }
      }
    };

    const startTimerId = setTimeout(() => typeText(finalText), delay);
    typewriterTimers.set(element, { timerId: startTimerId, cancelled: false, originalText, finalText });
  });

  return {
    typing: true,
    elements,
    speed,
    stop: () => stopTypewriter(target)
  };
};

const stopTypewriter = (target) => {
  const elements = target ? selectAll(target) : Array.from(typewriterTimers.keys());

  elements.forEach((element) => {
    if (typewriterTimers.has(element)) {
      const { timerId, originalText, finalText } = typewriterTimers.get(element);
      clearTimeout(timerId);
      element.textContent = finalText || originalText || '';
      const cursor = element.querySelector('.trigo-typewriter-cursor');
      if (cursor) cursor.remove();
      typewriterTimers.delete(element);
    }
  });

  return { stopped: true, elements };
};

engine.register('typewriter', typewriterHandler);

const typewriter = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(options)) config.text = options;
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('typewriter', 'start', config);
};

typewriter.start = (target, options = {}) => {
  const config = isObject(options) ? options : {};
  if (isString(target) || isElement(target)) config.target = target;
  return engine.execute('typewriter', 'start', config);
};

typewriter.stop = (target) => {
  return engine.execute('typewriter', 'stop', { target });
};

typewriter.stopAll = () => {
  return stopTypewriter(null);
};

export { typewriter };
export default typewriter;